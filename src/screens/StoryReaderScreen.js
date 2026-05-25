import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  FlatList,
  Platform,
  BackHandler,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Haptics from "expo-haptics";
import { useFonts } from "expo-font";
import { Nunito_400Regular } from "@expo-google-fonts/nunito";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { catalogStoryById } from "../data/storyCatalog";
import { characterStyleFromLegacyData } from "../data/characterStyles";
import { generateImageFromAI, buildIllustrationPrompt } from "../utils/imageGeneration";
import {
  resolveLocalIllustrationAsset,
  resolveStoryPageIllustrationAsset,
} from "../data/localIllustrations";

// Create AnimatedFlatList OUTSIDE component to maintain stable identity
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const BG_TWILIGHT = "#241A3A";
const OUTER_BG = "#2F2B45";
const READER_BACKDROP = "#F1EEE6";
const PAGE_COLOR = "#F7F4ED";
const INK = "#1E1B2E";
const COMPLETION_DELAY_MS = 30000;
const PAGE_INITIAL_RENDER_COUNT = 2;
const PAGE_BATCH_RENDER_COUNT = 3;
const PAGE_WINDOW_SIZE = 5;
const CHILD_NAME_TOKEN_PATTERN = /{{\s*(childName|child['’]s name)\s*}}/gi;
const DEMO_ILLUSTRATION_PREFIX = "zoo";

const DEMO_PAGES = [
  "The morning sun peeked in, and {{childName}} woke with a smile.",
  "\"Today's the day,\" {{childName}} whispered. \"We're going to the zoo.\"",
  "In the kitchen, {{childName}} found a warm breakfast waiting.",
  "{{childName}} packed a small backpack with a juice box, an apple, and a favorite toy.",
  "The car hummed along, and {{childName}} watched trees pass by like a friendly parade.",
  "At last, {{childName}} saw a big sign: \"Welcome to the Big City Zoo!\"",
  "Inside the gates, {{childName}} heard chirps, rustles, and faraway calls.",
  "First came the monkeys, and {{childName}} watched them swing and chatter.",
  "{{childName}} giggled and held Mom's hand. \"They're so silly,\" {{childName}} said.",
  "Next were the elephants, and {{childName}} watched gentle giants move slowly.",
  "One elephant sprayed cool water, and {{childName}} watched in awe.",
  "Down the path, {{childName}} saw giraffes reach for leaves with careful bites.",
  "\"So tall,\" {{childName}} murmured, feeling small in a good way.",
  "Bright birds fluttered nearby, and {{childName}} saw feathers like tiny paintings.",
  "A zookeeper spoke softly, and {{childName}} listened with quiet curiosity.",
  "In a shady spot, {{childName}} found a lion resting and breathing deep.",
  "\"He looks sleepy,\" {{childName}} whispered, keeping the moment calm.",
  "At snack time, {{childName}} sat beside Mom and took slow bites of apple.",
  "The day felt warm and steady, and {{childName}} moved at an easy pace.",
  "At a calm pond, {{childName}} watched animals move softly and quietly.",
  "{{childName}} took a deep breath. The zoo smelled like sunshine and leaves.",
  "\"What's your favorite so far?\" Mom asked {{childName}} with a smile.",
  "{{childName}} thought carefully. \"The elephants, the monkeys, and the lion.\"",
  "As afternoon turned golden, {{childName}} noticed the zoo sounds grow softer.",
  "At the last stop, {{childName}} looked back and remembered each animal like a picture.",
  "\"Goodnight, zoo,\" {{childName}} said quietly, even before bedtime.",
  "On the ride home, {{childName}} watched the sky and blinked slowly.",
  "At home, pajamas felt cozy, and {{childName}} settled in with a happy sigh.",
  "Mom sat close, and {{childName}} leaned in, safe and warm.",
  "Back at the zoo, {{childName}} imagined lions curled together with their family.",
  "{{childName}} imagined elephants standing close, peaceful and strong.",
  "And {{childName}} snuggled in with Mom, as the day drifted into sleep.",
];
const PLACEHOLDER_TOKEN_PREFIX = "__placeholder__:";

const inferVisualAnchor = (story) => {
  const titleText = typeof story?.title === "string" ? story.title : "";
  const mainCharacterText =
    typeof story?.mainCharacter === "string" && story.mainCharacter.trim()
      ? story.mainCharacter.trim()
      : null;
  const firstPageText = Array.isArray(story?.pages)
    ? story.pages
        .slice(0, 2)
        .map((page) => {
          if (typeof page === "string") return page;
          if (page && typeof page === "object" && typeof page.text === "string") {
            return page.text;
          }
          return "";
        })
        .join(" ")
    : "";
  const corpus = `${titleText} ${firstPageText}`.toLowerCase();

  const keywordProfiles = [
    {
      keyword: "turtle",
      character: "brave little turtle",
      secondary: "curious rabbit",
      setting: "gentle outdoor nature scenes",
    },
    {
      keyword: "rabbit",
      character: "curious rabbit",
      secondary: "kind forest friend",
      setting: "soft woodland clearings",
    },
    {
      keyword: "fox",
      character: "friendly young fox",
      secondary: "playful woodland friend",
      setting: "warm forest paths at golden hour",
    },
    {
      keyword: "dragon",
      character: "small gentle dragon",
      secondary: "brave child companion",
      setting: "cozy fantasy hills and skies",
    },
    {
      keyword: "bear",
      character: "gentle bear cub",
      secondary: "supportive woodland friend",
      setting: "calm forest meadows",
    },
  ];

  const matchedProfile = keywordProfiles.find(({ keyword }) => corpus.includes(keyword));
  const mainCharacter = mainCharacterText || matchedProfile?.character || "kind young adventurer";
  const secondaryCharacter = matchedProfile?.secondary || "supportive friend";
  const setting = matchedProfile?.setting || "calm storybook scenes with soft natural light";

  return `Main character: ${mainCharacter}. Secondary character: ${secondaryCharacter}. Setting: ${setting}. Character continuity: keep appearances consistent across pages.`;
};

const parsePlaceholderPayload = (uri) => {
  if (typeof uri !== "string" || !uri.startsWith(PLACEHOLDER_TOKEN_PREFIX)) {
    return null;
  }

  const rawPayload = uri.slice(PLACEHOLDER_TOKEN_PREFIX.length).split("?")[0];
  try {
    const parsed = JSON.parse(decodeURIComponent(rawPayload));
    return {
      heroName: typeof parsed?.heroName === "string" ? parsed.heroName : "young storybook hero",
      heroEmoji: typeof parsed?.heroEmoji === "string" ? parsed.heroEmoji : "🧒",
      sceneEmoji: typeof parsed?.sceneEmoji === "string" ? parsed.sceneEmoji : "⭐",
      seed: typeof parsed?.seed === "string" ? parsed.seed : "unknown",
    };
  } catch {
    return {
      heroName: "young storybook hero",
      heroEmoji: "🧒",
      sceneEmoji: "⭐",
      seed: "unknown",
    };
  }
};

const seedPalette = (seed) => {
  const palettes = [
    { background: "#EEE6D2", blobA: "rgba(189, 170, 120, 0.28)", blobB: "rgba(117, 151, 139, 0.20)" },
    { background: "#E5ECF2", blobA: "rgba(120, 153, 189, 0.24)", blobB: "rgba(160, 145, 194, 0.20)" },
    { background: "#EDE7D8", blobA: "rgba(174, 144, 111, 0.24)", blobB: "rgba(121, 158, 132, 0.20)" },
    { background: "#E8E6EF", blobA: "rgba(138, 132, 188, 0.24)", blobB: "rgba(115, 162, 160, 0.20)" },
  ];

  const safeSeed = String(seed || "");
  let hash = 0;
  for (let i = 0; i < safeSeed.length; i += 1) {
    hash = (hash * 31 + safeSeed.charCodeAt(i)) >>> 0;
  }
  return palettes[hash % palettes.length];
};

function PlaceholderIllustration({ payload }) {
  const palette = seedPalette(payload?.seed);

  return (
    <View pointerEvents="none" style={[styles.placeholderCard, { backgroundColor: palette.background }]}>
      <View style={[styles.placeholderBlob, styles.placeholderBlobTop, { backgroundColor: palette.blobA }]} />
      <View style={[styles.placeholderBlob, styles.placeholderBlobBottom, { backgroundColor: palette.blobB }]} />
      <Text style={styles.placeholderHeroEmoji}>{payload?.heroEmoji || "🧒"}</Text>
      <View style={styles.placeholderSceneBadge}>
        <Text style={styles.placeholderSceneEmoji}>{payload?.sceneEmoji || "⭐"}</Text>
      </View>
      <Text numberOfLines={1} style={styles.placeholderHeroLabel}>
        {payload?.heroName || "young storybook hero"}
      </Text>
    </View>
  );
}

const resolveChildName = (selectedChild) => {
  if (selectedChild && typeof selectedChild === "object") {
    if (typeof selectedChild.name === "string" && selectedChild.name.trim()) {
      return selectedChild.name.trim();
    }
    if (selectedChild.id != null && String(selectedChild.id).trim()) {
      return String(selectedChild.id).trim();
    }
  }

  if (typeof selectedChild === "string" && selectedChild.trim()) {
    return selectedChild.trim();
  }

  return "friend";
};

const replaceChildNameToken = (input, childName) => {
  if (typeof input !== "string") return input;
  return input.replace(CHILD_NAME_TOKEN_PATTERN, childName);
};

const buildSequentialIllustrationName = (prefix, index) =>
  `${prefix}_${String(index + 1).padStart(2, "0")}.png`;

const toImageSource = (val) => {
  // local require(...) returns a NUMBER
  if (typeof val === "number") return val;
  // remote/local file path string should be treated as uri
  if (typeof val === "string" && val.length) return { uri: val };
  return null;
};

const resolveBundledIllustrationUri = (assetSource) => {
  if (typeof assetSource !== "number") return null;
  const resolvedSource =
    typeof Image.resolveAssetSource === "function"
      ? Image.resolveAssetSource(assetSource)
      : null;
  return typeof resolvedSource?.uri === "string" && resolvedSource.uri
    ? resolvedSource.uri
    : null;
};

export default function StoryReaderScreen({ navigation, route }) {
  // All hooks must be at the top level, in the same order every render
  const {
    story: routeStory,
    storyId: routeStoryId,
    selectedChild,
    artStyle,
    startPageIndex,
    forceStart,
  } = route?.params || {};
  const storyCatalogById = React.useMemo(() => catalogStoryById(), []);
  const story = React.useMemo(() => {
    const normalizedRouteStoryId =
      routeStoryId != null && String(routeStoryId).trim() ? String(routeStoryId).trim() : null;
    const normalizedStoryId =
      routeStory?.id != null && String(routeStory.id).trim() ? String(routeStory.id).trim() : null;
    const lookupId = normalizedRouteStoryId || normalizedStoryId;
    const catalogStory = lookupId ? storyCatalogById.get(lookupId) || null : null;

    if (routeStory && typeof routeStory === "object") {
      return {
        ...(catalogStory || {}),
        ...routeStory,
        ...(lookupId ? { id: lookupId } : {}),
      };
    }

    return catalogStory;
  }, [routeStory, routeStoryId, storyCatalogById]);
  const hasValidPages = Array.isArray(story?.pages) && story.pages.length > 0;
  const [fontsLoaded] = useFonts({
    Nunito: Nunito_400Regular,
  });

  // Story context for prompt continuity
  const storyContext = {
    storyId: story?.id,
    title: story?.title,
    mainCharacter: story?.mainCharacter ?? null,
    settingHint: story?.setting ?? null,
  };

  const { width: pageWidth, height } = useWindowDimensions();
  const isLandscape = pageWidth > height;
  const [orientationReady, setOrientationReady] = useState(
    Platform.OS !== "ios" || pageWidth > height
  );

  // Page-turn illusion: track scroll position
  const scrollX = useRef(new Animated.Value(0)).current;
  const readerFocusedRef = useRef(false);
  const ENABLE_PAGE_TURN_ILLUSION = true;

  // Hide navigation header
  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Lock to landscape whenever the reader is focused, then restore app default on exit.
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      let fallbackTimer = null;
      readerFocusedRef.current = true;
      if (Platform.OS === "ios") {
        setOrientationReady(false);
      }

      const lockLandscape = async () => {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } catch {
          // Keep the reader usable even if Expo Go or the OS refuses the lock.
        }
      };

      if (isActive) {
        lockLandscape();
      }

      if (Platform.OS === "ios") {
        fallbackTimer = setTimeout(() => {
          if (isActive) {
            setOrientationReady(true);
          }
        }, 3000);
      }

      return () => {
        isActive = false;
        readerFocusedRef.current = false;
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
        }
        ScreenOrientation.unlockAsync().catch(() => {});
      };
    }, [])
  );

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    if (!readerFocusedRef.current) return;
    if (!isLandscape) return;

    setOrientationReady(true);
  }, [isLandscape]);

  // Hide bottom nav bar on Android (immersive reading)
  useEffect(() => {
    if (Platform.OS !== "android") return;

    (async () => {
      await NavigationBar.setVisibilityAsync("hidden");
      await NavigationBar.setBehaviorAsync("overlay-swipe");
    })();

    return () => {
      (async () => {
        await NavigationBar.setVisibilityAsync("visible");
        await NavigationBar.setBehaviorAsync("inset-swipe");
      })();
    };
  }, []);

  // Normalize story pages into a consistent shape for rendering + prompting.
  // Supports:
  // - string[]
  // - { text: string, prompt?: string }[]
  // Falls back to demo pages if story.pages is missing/empty/invalid.
  const childNameForStory = React.useMemo(
    () => resolveChildName(selectedChild),
    [selectedChild]
  );
  const selectedGender = React.useMemo(
    () =>
      selectedChild && typeof selectedChild === "object"
        ? characterStyleFromLegacyData(selectedChild)
        : "boy",
    [selectedChild]
  );
  const displayStoryTitle = React.useMemo(
    () => replaceChildNameToken(story?.title || "Story", childNameForStory),
    [childNameForStory, story?.title]
  );
  const pages = React.useMemo(
    () => {
      const sourcePages = story?.pages;
      if (Array.isArray(sourcePages) && sourcePages.length > 0) {
        const normalized = sourcePages
          .map((page, index) => {
            if (typeof page === "string") {
              const personalizedText = replaceChildNameToken(page, childNameForStory);
              const illustrationAssetName = buildSequentialIllustrationName(
                DEMO_ILLUSTRATION_PREFIX,
                index
              );
              return {
                text: personalizedText,
                prompt: personalizedText,
                illustrationAssetName,
                illustrationAssetSource: resolveLocalIllustrationAsset(illustrationAssetName),
              };
            }
            if (page && typeof page === "object" && typeof page.text === "string") {
              const basePrompt = typeof page.prompt === "string" && page.prompt.trim()
                ? page.prompt
                : page.text;
              const hasStoryIllustrationReference =
                typeof page.illustrationStoryId === "string" &&
                page.illustrationStoryId.trim() &&
                Number.isFinite(Number(page.illustrationPageNumber));
              const illustrationAssetName =
                typeof page.illustrationAssetName === "string" && page.illustrationAssetName.trim()
                  ? page.illustrationAssetName.trim()
                  : hasStoryIllustrationReference
                  ? null
                  : buildSequentialIllustrationName(DEMO_ILLUSTRATION_PREFIX, index);
              const storyIllustrationSource = resolveStoryPageIllustrationAsset({
                storyId: page.illustrationStoryId,
                pageNumber: page.illustrationPageNumber,
                gender: selectedGender,
              });
              return {
                text: replaceChildNameToken(page.text, childNameForStory),
                prompt: replaceChildNameToken(basePrompt, childNameForStory),
                illustrationAssetName,
                illustrationStoryId: page.illustrationStoryId,
                illustrationPageNumber: page.illustrationPageNumber,
                illustrationAssetSource:
                  storyIllustrationSource ||
                  (illustrationAssetName
                    ? resolveLocalIllustrationAsset(illustrationAssetName)
                    : null),
              };
            }
            return null;
          })
          .filter(Boolean);

        if (normalized.length > 0) {
          return normalized;
        }
      }

      return DEMO_PAGES.map((text, index) => {
        const personalizedText = replaceChildNameToken(text, childNameForStory);
        const illustrationAssetName = buildSequentialIllustrationName(
          DEMO_ILLUSTRATION_PREFIX,
          index
        );
        return {
          text: personalizedText,
          prompt: personalizedText,
          illustrationAssetName,
          illustrationAssetSource: resolveLocalIllustrationAsset(illustrationAssetName),
        };
      });
    },
    [childNameForStory, selectedGender, story?.pages]
  );

  const [pageIndex, setPageIndex] = useState(0);
  const [initialIndex, setInitialIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [completionCelebrated, setCompletionCelebrated] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [exitPromptState, setExitPromptState] = useState(null);
  const [isClosingReader, setIsClosingReader] = useState(false);
  const totalPages = pages.length;
  const progressRatio = totalPages > 0 ? (pageIndex + 1) / totalPages : 0;

  const [pageImages, setPageImages] = useState({});
  const [loadingImages, setLoadingImages] = useState({});
  const [failedImages, setFailedImages] = useState({});
  const [visualAnchor, setVisualAnchor] = useState("");
  const [imageOpacity] = useState({});
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const progressAnim = useRef(new Animated.Value(progressRatio)).current;
  const uiOpacity = useRef(new Animated.Value(0)).current;
  const pageSettleAnim = useRef(new Animated.Value(1)).current;
  const ambientDriftOpacity = useRef(new Animated.Value(1)).current;
  const listRef = useRef(null);
  const listHasLayoutRef = useRef(false);
  const pendingRestoreIndexRef = useRef(null);
  const hasSnappedAfterLayoutRef = useRef(false);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchMovedRef = useRef(false);
  const suppressNextToggleRef = useRef(false);
  const saveDebounceRef = useRef(null);
  const uiHideTimerRef = useRef(null);
  const completionTimerRef = useRef(null);
  const isUiVisibleRef = useRef(false);
  const hasRestoredProgressRef = useRef(false);
  const pageIndexRef = useRef(0);
  const lastSettleFeedbackIndexRef = useRef(0);
  const programmaticTargetIndexRef = useRef(null);
  const allowExitRef = useRef(false);
  const exitPromptOpenRef = useRef(false);
  const isClosingReaderRef = useRef(false);
  const latestProgressRef = useRef({
    pageIndex: 0,
    artStyle,
    controlsVisible: false,
    completionCelebrated: false,
  });
  const inferredVisualAnchor = React.useMemo(() => inferVisualAnchor(story), [story]);
  const childDisplayName = React.useMemo(() => {
    if (selectedChild && typeof selectedChild === "object") {
      if (typeof selectedChild.name === "string" && selectedChild.name.trim()) {
        return selectedChild.name.trim();
      }
      if (selectedChild.id != null && String(selectedChild.id).trim()) {
        return String(selectedChild.id).trim();
      }
    }

    if (typeof selectedChild === "string" && selectedChild.trim()) {
      return selectedChild.trim();
    }

    return null;
  }, [selectedChild]);

  const readerIdentity = React.useMemo(() => {
    const storyId =
      story?.id != null && String(story.id).trim()
        ? String(story.id).trim()
        : typeof story?.title === "string" && story.title.trim()
        ? story.title.trim()
        : "unknown";

    let childId = "unknown";
    if (selectedChild && typeof selectedChild === "object") {
      if (selectedChild.id != null && String(selectedChild.id).trim()) {
        childId = String(selectedChild.id).trim();
      } else if (typeof selectedChild.name === "string" && selectedChild.name.trim()) {
        childId = selectedChild.name.trim();
      }
    } else if (typeof selectedChild === "string" && selectedChild.trim()) {
      childId = selectedChild.trim();
    }

    return { storyId, childId };
  }, [story?.id, story?.title, selectedChild]);
  const progressStorageKey = React.useMemo(
    () => `readerProgress:${readerIdentity.childId}:${readerIdentity.storyId}`,
    [readerIdentity]
  );
  const visualStorageKey = React.useMemo(
    () => `visualAnchor:${readerIdentity.storyId}:${readerIdentity.childId}:${artStyle}`,
    [readerIdentity, artStyle]
  );
  // Composite cache key: page index + art style
  const keyFor = (index, style) => `${index}|${style}`;
  const isStoryComplete = totalPages > 0 && pageIndex >= totalPages - 1;
  const exitPromptVisible = exitPromptState != null;

  useEffect(() => {
    exitPromptOpenRef.current = exitPromptVisible;
  }, [exitPromptVisible]);

  useEffect(() => {
    isClosingReaderRef.current = isClosingReader;
  }, [isClosingReader]);

  useEffect(() => {
    const bundledIllustrationUris = [
      ...new Set(
        pages
          .map((page) => resolveBundledIllustrationUri(page?.illustrationAssetSource))
          .filter(Boolean)
      ),
    ];

    if (bundledIllustrationUris.length === 0) return;

    let cancelled = false;

    const preloadBundledIllustrations = async () => {
      try {
        const results = await Promise.allSettled(
          bundledIllustrationUris.map((uri) => Image.prefetch(uri))
        );
        if (cancelled) return;

        const failedCount = results.filter(
          (result) => result.status === "rejected" || result.value === false
        ).length;
        if (failedCount > 0) {
          console.warn("Some bundled story illustrations failed to preload", {
            failedCount,
            totalCount: bundledIllustrationUris.length,
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to preload bundled story illustrations", error);
        }
      }
    };

    preloadBundledIllustrations();

    return () => {
      cancelled = true;
    };
  }, [pages]);

  const closeExitPrompt = React.useCallback(() => {
    if (isClosingReaderRef.current) return;
    setExitPromptState(null);
  }, []);

  const finishExitReader = React.useCallback(
    async (pendingAction = null) => {
      if (isClosingReaderRef.current) return;

      isClosingReaderRef.current = true;
      allowExitRef.current = true;
      setExitPromptState(null);
      setIsClosingReader(true);

      if (Platform.OS === "ios") {
        try {
          await ScreenOrientation.unlockAsync();
        } catch {
          // Continue navigation even if iOS declines the orientation restore.
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      if (pendingAction) {
        navigation.dispatch(pendingAction);
        return;
      }

      navigation.goBack();
    },
    [navigation]
  );

  const requestExitReader = React.useCallback(
    (pendingAction = null) => {
      if (isClosingReaderRef.current) return;
      if (Platform.OS === "ios" && !orientationReady) return;

      if (isStoryComplete) {
        finishExitReader(pendingAction);
        return;
      }

      if (exitPromptOpenRef.current) return;
      setExitPromptState({ pendingAction });
    },
    [finishExitReader, isStoryComplete, orientationReady]
  );

  const clearCompletionTimer = React.useCallback(() => {
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const backSub = BackHandler.addEventListener("hardwareBackPress", () => {
      requestExitReader();
      return true;
    });

    return () => backSub.remove();
  }, [requestExitReader]);

  useEffect(() => {
    const unsubscribeBeforeRemove = navigation.addListener("beforeRemove", (event) => {
      if (allowExitRef.current) {
        allowExitRef.current = false;
        return;
      }

      if (isClosingReaderRef.current) {
        event.preventDefault();
        return;
      }

      if (Platform.OS === "ios" && !orientationReady) {
        event.preventDefault();
        return;
      }

      if (isStoryComplete) {
        return;
      }

      event.preventDefault();
      requestExitReader(event.data.action);
    });

    return unsubscribeBeforeRemove;
  }, [isStoryComplete, navigation, orientationReady, requestExitReader]);

  const retryImageForPage = (index, promptText) => {
    const k = keyFor(index, artStyle);
    setFailedImages((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
    setPageImages((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, k)) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
    // Immediate feedback while retry request starts.
    setLoadingImages((prev) => ({ ...prev, [k]: true }));

    if (promptText) {
      const anchorText = visualAnchor || inferredVisualAnchor;
      const anchoredPrompt = anchorText ? `${anchorText}\nScene: ${promptText}` : promptText;
      generateImageForPage(index, anchoredPrompt, {
        force: true,
        retryNonce: Date.now(),
      });
    } else {
      setLoadingImages((prev) => ({ ...prev, [k]: false }));
    }
  };

  const canGoPrevious = pageIndex > 0;
  const canGoNext = pageIndex < totalPages - 1;

  const triggerPageSettleFeedback = React.useCallback(
    (nextIndex) => {
      if (!isHydrated || !Number.isFinite(nextIndex)) return;

      const normalizedIndex = Math.floor(nextIndex);
      if (lastSettleFeedbackIndexRef.current === normalizedIndex) return;
      lastSettleFeedbackIndexRef.current = normalizedIndex;

      pageSettleAnim.stopAnimation();
      pageSettleAnim.setValue(0);
      Animated.timing(pageSettleAnim, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
    [isHydrated, pageSettleAnim]
  );

  const commitPageIndexChange = React.useCallback(
    (nextIndex, options = {}) => {
      const { scroll = false, animated = true, programmatic = false } = options;
      if (totalPages <= 0 || !Number.isFinite(nextIndex)) return;

      const clampedIndex = Math.min(Math.max(Math.floor(nextIndex), 0), totalPages - 1);
      if (clampedIndex === pageIndexRef.current) return;

      if (programmatic) {
        programmaticTargetIndexRef.current = clampedIndex;
      }

      triggerPageSettleFeedback(clampedIndex);
      pageIndexRef.current = clampedIndex;
      setPageIndex(clampedIndex);

      if (scroll) {
        listRef.current?.scrollToOffset({
          offset: clampedIndex * pageWidth,
          animated,
        });
      }
    },
    [pageWidth, totalPages, triggerPageSettleFeedback]
  );

  const scrollToPage = (targetIndex) => {
    commitPageIndexChange(targetIndex, { scroll: true, animated: true, programmatic: true });
  };

  const applyPendingRestoreScroll = React.useCallback(() => {
    const restoreIndex = pendingRestoreIndexRef.current;
    if (restoreIndex == null || !listHasLayoutRef.current) return;

    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: restoreIndex * pageWidth,
        animated: false,
      });
      pendingRestoreIndexRef.current = null;
    });
  }, [pageWidth]);

  const handleListLayout = React.useCallback(() => {
    listHasLayoutRef.current = true;

    if (!hasSnappedAfterLayoutRef.current) {
      const maxIndex = Math.max(totalPages - 1, 0);
      const targetIndex = Math.min(Math.max(pageIndex, 0), maxIndex);
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({
          offset: targetIndex * pageWidth,
          animated: false,
        });
      });
      hasSnappedAfterLayoutRef.current = true;
    }

    applyPendingRestoreScroll();
  }, [applyPendingRestoreScroll, pageIndex, pageWidth, totalPages]);

  useEffect(() => {
    hasSnappedAfterLayoutRef.current = false;
  }, [pageWidth]);

  useEffect(() => {
    const clampedIndex = totalPages > 0
      ? Math.min(Math.max(pageIndex, 0), totalPages - 1)
      : 0;
    setInitialIndex((prev) => (prev === clampedIndex ? prev : clampedIndex));
  }, [pageIndex, totalPages]);

  useEffect(() => {
    pageIndexRef.current = pageIndex;
  }, [pageIndex]);

  const fadeUiTo = React.useCallback(
    (toValue, duration) => {
      Animated.timing(uiOpacity, {
        toValue,
        duration,
        useNativeDriver: true,
      }).start();
    },
    [uiOpacity]
  );

  const scheduleUiAutoHide = React.useCallback(() => {
    if (uiHideTimerRef.current) {
      clearTimeout(uiHideTimerRef.current);
    }

    uiHideTimerRef.current = setTimeout(() => {
      isUiVisibleRef.current = false;
      setControlsVisible(false);
      fadeUiTo(0, 420);
      uiHideTimerRef.current = null;
    }, 3000);
  }, [fadeUiTo]);

  const revealUiControls = React.useCallback(() => {
    isUiVisibleRef.current = true;
    setControlsVisible(true);
    fadeUiTo(1, 240);
    scheduleUiAutoHide();
  }, [fadeUiTo, scheduleUiAutoHide]);

  const registerUiInteraction = React.useCallback(() => {
    revealUiControls();
  }, [revealUiControls]);

  useEffect(() => {
    if (!isHydrated) return;
    if (isUiVisibleRef.current) {
      scheduleUiAutoHide();
    }
    return () => {
      if (uiHideTimerRef.current) {
        clearTimeout(uiHideTimerRef.current);
        uiHideTimerRef.current = null;
      }
    };
  }, [isHydrated, scheduleUiAutoHide]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isUiVisibleRef.current) return;
    scheduleUiAutoHide();
  }, [isHydrated, pageIndex, scheduleUiAutoHide]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressRatio,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [progressAnim, progressRatio]);

  useEffect(() => {
    if (!isHydrated) {
      ambientDriftOpacity.setValue(1);
      return;
    }

    const ambientDriftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientDriftOpacity, {
          toValue: 0.995,
          duration: 7500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ambientDriftOpacity, {
          toValue: 1,
          duration: 7500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    ambientDriftLoop.start();

    return () => {
      ambientDriftLoop.stop();
      ambientDriftOpacity.setValue(1);
    };
  }, [isHydrated, ambientDriftOpacity]);

  useEffect(() => {
    latestProgressRef.current = { pageIndex, artStyle, controlsVisible, completionCelebrated };
  }, [pageIndex, artStyle, controlsVisible, completionCelebrated]);

  // Hydrate saved reading progress + controls before rendering reader content.
  useEffect(() => {
    let cancelled = false;
    hasRestoredProgressRef.current = false;
    listHasLayoutRef.current = false;
    pendingRestoreIndexRef.current = null;
    hasSnappedAfterLayoutRef.current = false;
    clearCompletionTimer();
    setIsHydrated(false);

    const loadProgress = async () => {
      let restoredIndex = 0;
      let restoredControlsVisible = false;
      let restoredCompletionCelebrated = false;
      const numericStartPageIndex = Number(startPageIndex);
      const hasRequestedStart = Number.isFinite(numericStartPageIndex);
      const requestedStartIndex = hasRequestedStart
        ? totalPages > 0
          ? Math.min(Math.max(Math.floor(numericStartPageIndex), 0), totalPages - 1)
          : 0
        : null;
      const shouldForceStart = forceStart === true;

      try {
        if (shouldForceStart) {
          restoredIndex = requestedStartIndex != null ? requestedStartIndex : 0;
          restoredControlsVisible = false;
          restoredCompletionCelebrated = false;

          const normalizedTotalPages = totalPages > 0 ? totalPages : 0;
          const progressPercent = normalizedTotalPages > 0
            ? Math.min(1, (restoredIndex + 1) / normalizedTotalPages)
            : 0;
          const lastOpenedAt = Date.now();

          await AsyncStorage.setItem(
            progressStorageKey,
            JSON.stringify({
              pageIndex: restoredIndex,
              artStyle,
              controlsVisible: restoredControlsVisible,
              completionCelebrated: restoredCompletionCelebrated,
              totalPages: normalizedTotalPages,
              progressPercent,
              lastOpenedAt,
            })
          );
        } else {
          const raw = await AsyncStorage.getItem(progressStorageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            const savedIndex = Number(parsed?.pageIndex);
            if (Number.isFinite(savedIndex)) {
              restoredIndex = totalPages > 0
                ? Math.min(Math.max(Math.floor(savedIndex), 0), totalPages - 1)
                : 0;
            }

            if (typeof parsed?.completionCelebrated === "boolean") {
              restoredCompletionCelebrated = parsed.completionCelebrated;
            }
          }

          if (requestedStartIndex != null) {
            restoredIndex = requestedStartIndex;
          }
        }
      } catch (error) {
        console.warn("Failed to load reader progress", error);
      } finally {
        if (cancelled) return;

        setPageIndex(restoredIndex);
        setInitialIndex(restoredIndex);
        setControlsVisible(restoredControlsVisible);
        setCompletionCelebrated(restoredCompletionCelebrated);
        setShowCompletionOverlay(false);
        pageIndexRef.current = restoredIndex;
        lastSettleFeedbackIndexRef.current = restoredIndex;
        programmaticTargetIndexRef.current = null;
        pageSettleAnim.setValue(1);
        isUiVisibleRef.current = restoredControlsVisible;
        uiOpacity.setValue(restoredControlsVisible ? 1 : 0);
        latestProgressRef.current = {
          pageIndex: restoredIndex,
          artStyle,
          controlsVisible: restoredControlsVisible,
          completionCelebrated: restoredCompletionCelebrated,
        };
        hasRestoredProgressRef.current = true;
        setIsHydrated(true);
      }
    };

    loadProgress();

    return () => {
      clearCompletionTimer();
      cancelled = true;
    };
  }, [
    clearCompletionTimer,
    progressStorageKey,
    artStyle,
    totalPages,
    uiOpacity,
    pageSettleAnim,
    startPageIndex,
    forceStart,
  ]);

  useEffect(() => {
    let cancelled = false;

    const loadOrCreateVisualAnchor = async () => {
      try {
        const savedAnchor = await AsyncStorage.getItem(visualStorageKey);
        if (cancelled) return;

        if (typeof savedAnchor === "string" && savedAnchor.trim()) {
          setVisualAnchor(savedAnchor.trim());
          return;
        }

        const generatedAnchor = inferredVisualAnchor;
        await AsyncStorage.setItem(visualStorageKey, generatedAnchor);
        if (!cancelled) {
          setVisualAnchor(generatedAnchor);
        }
      } catch (error) {
        console.warn("Failed to load visual anchor", error);
        if (!cancelled) {
          setVisualAnchor(inferredVisualAnchor);
        }
      }
    };

    loadOrCreateVisualAnchor();

    return () => {
      cancelled = true;
    };
  }, [visualStorageKey, inferredVisualAnchor]);

  useEffect(() => {
    if (!isHydrated || !hasRestoredProgressRef.current) return;
    if (totalPages <= 0) return;

    const isAtFinalPage = pageIndex >= totalPages - 1;
    if (!isAtFinalPage || completionCelebrated || showCompletionOverlay) {
      clearCompletionTimer();
      return;
    }

    clearCompletionTimer();
    completionTimerRef.current = setTimeout(() => {
      completionTimerRef.current = null;
      setCompletionCelebrated(true);
      setShowCompletionOverlay(true);
    }, COMPLETION_DELAY_MS);

    return () => {
      clearCompletionTimer();
    };
  }, [
    clearCompletionTimer,
    completionCelebrated,
    isHydrated,
    pageIndex,
    showCompletionOverlay,
    totalPages,
  ]);

  // Debounced save whenever page index or controls visibility changes.
  useEffect(() => {
    if (!isHydrated || !hasRestoredProgressRef.current) return;

    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }

    saveDebounceRef.current = setTimeout(async () => {
      const {
        pageIndex: latestPageIndex,
        artStyle: latestArtStyle,
        controlsVisible: latestControlsVisible,
        completionCelebrated: latestCompletionCelebrated,
      } = latestProgressRef.current;
      const normalizedTotalPages = totalPages > 0 ? totalPages : 0;
      const progressPercent = normalizedTotalPages > 0
        ? Math.min(1, (latestPageIndex + 1) / normalizedTotalPages)
        : 0;
      const lastOpenedAt = Date.now();
      try {
        await AsyncStorage.setItem(
          progressStorageKey,
          JSON.stringify({
            pageIndex: latestPageIndex,
            artStyle: latestArtStyle,
            controlsVisible: latestControlsVisible,
            completionCelebrated: latestCompletionCelebrated,
            totalPages: normalizedTotalPages,
            progressPercent,
            lastOpenedAt,
          })
        );
      } catch (error) {
        console.warn("Failed to save reader progress", error);
      } finally {
        saveDebounceRef.current = null;
      }
    }, 300);

    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = null;
      }
    };
  }, [
    pageIndex,
    artStyle,
    controlsVisible,
    completionCelebrated,
    isHydrated,
    progressStorageKey,
    totalPages,
  ]);

  // Save latest progress on unmount.
  useEffect(() => {
    return () => {
      clearCompletionTimer();
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = null;
      }

      if (!hasRestoredProgressRef.current) return;

      const {
        pageIndex: latestPageIndex,
        artStyle: latestArtStyle,
        controlsVisible: latestControlsVisible,
        completionCelebrated: latestCompletionCelebrated,
      } = latestProgressRef.current;
      const normalizedTotalPages = totalPages > 0 ? totalPages : 0;
      const progressPercent = normalizedTotalPages > 0
        ? Math.min(1, (latestPageIndex + 1) / normalizedTotalPages)
        : 0;
      const lastOpenedAt = Date.now();
      AsyncStorage.setItem(
        progressStorageKey,
        JSON.stringify({
          pageIndex: latestPageIndex,
          artStyle: latestArtStyle,
          controlsVisible: latestControlsVisible,
          completionCelebrated: latestCompletionCelebrated,
          totalPages: normalizedTotalPages,
          progressPercent,
          lastOpenedAt,
        })
      )
        .catch((error) => {
          console.warn("Failed to save reader progress on unmount", error);
        });
    };
  }, [clearCompletionTimer, progressStorageKey, totalPages]);

  // Generate illustration for page
  // Uses generateImageFromAI utility (swap internals for real API)
  const generateImageForPage = async (index, text, options = {}) => {
    const { force = false, retryNonce = null } = options;
    const k = keyFor(index, artStyle);
    // Guard: avoid double-generation if already in-flight
    if (loadingImages[k] && !force) return;

    try {
      setLoadingImages((prev) => ({ ...prev, [k]: true }));
      // clear any previous failure mark when we start a new attempt
      if (failedImages[k]) {
        setFailedImages((prev) => {
          const next = { ...prev };
          delete next[k];
          return next;
        });
      }

      // Initialize opacity animation for this page/style
      if (!imageOpacity[k]) {
        imageOpacity[k] = new Animated.Value(0);
      }

      // Build structured prompt using the utility
      const prompt = buildIllustrationPrompt({
        storyTitle: story?.title || "Story",
        pageText: text,
        pageIndex: index,
        artStyle: artStyle,
        storyContext,
        // Optional: childName, characterHints, toneHint can be passed if available
      });

      // Call image generation (structured for easy real API swap)
      const imageUrl = await generateImageFromAI(prompt, story?.title, artStyle, {
        storyId: readerIdentity.storyId,
        childId: readerIdentity.childId,
        pageIndex: index,
        gender: selectedGender,
      });
      const isPlaceholderToken =
        typeof imageUrl === "string" && imageUrl.startsWith(PLACEHOLDER_TOKEN_PREFIX);
      const resolvedUrl =
        retryNonce != null && !isPlaceholderToken
          ? `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}retry=${retryNonce}`
          : imageUrl;

      setPageImages((prev) => ({ ...prev, [k]: resolvedUrl }));
      // clear failed flag on success
      setFailedImages((prev) => {
        if (!prev[k]) return prev;
        const next = { ...prev };
        delete next[k];
        return next;
      });

      // Trigger fade-in animation
      if (imageOpacity[k]) {
        Animated.timing(imageOpacity[k], {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    } catch (e) {
      console.warn("Image generation failed", e);
      // mark failure so we don't endlessly retry automatically
      setFailedImages((prev) => ({ ...prev, [k]: true }));
    } finally {
      setLoadingImages((prev) => ({ ...prev, [k]: false }));
    }
  };

  // Auto-generate image when page changes
  useEffect(() => {
    if (!isHydrated) return;

    const k = keyFor(pageIndex, artStyle);
    const page = pages[pageIndex];
    const hasStaticIllustration = Boolean(page?.illustrationAssetSource || page?.illustrationAssetName);
    const promptText = page?.prompt || page?.text;
    const anchorText = visualAnchor || inferredVisualAnchor;
    const anchoredPrompt = anchorText && promptText
      ? `${anchorText}\nScene: ${promptText}`
      : promptText;
    if (!hasStaticIllustration && promptText && !pageImages[k] && !failedImages[k]) {
      generateImageForPage(pageIndex, anchoredPrompt);
    }

    // Pre-generate next page for instant feel (style-aware)
    const nextIndex = pageIndex + 1;
    if (nextIndex < totalPages) {
      const kNext = keyFor(nextIndex, artStyle);
      // Skip prefetch if we already have a cached entry (even a placeholder)
      // or if a generation is already in-flight for that key.
      const hasNextKey = Object.prototype.hasOwnProperty.call(pageImages, kNext);
      if (hasNextKey) {
        // already have an entry (could be a placeholder/failure); skip
      } else if (loadingImages[kNext]) {
        // already generating; skip
      } else if (failedImages[kNext]) {
        // previously failed; skip automatic prefetch until user retries
      } else {
        const nextPage = pages[nextIndex];
        const nextHasStaticIllustration = Boolean(
          nextPage?.illustrationAssetSource || nextPage?.illustrationAssetName
        );
        const nextPromptText = nextPage?.prompt || nextPage?.text;
        const anchoredNextPrompt = anchorText && nextPromptText
          ? `${anchorText}\nScene: ${nextPromptText}`
          : nextPromptText;
        // Fire it but don't await (background fetch)
        if (!nextHasStaticIllustration && nextPromptText) {
          generateImageForPage(nextIndex, anchoredNextPrompt);
        }
      }
    }
  }, [isHydrated, pageIndex, artStyle, visualAnchor, inferredVisualAnchor]);

  // Keep page index in-range when page source changes.
  useEffect(() => {
    if (totalPages === 0) {
      if (pageIndex !== 0) setPageIndex(0);
      return;
    }

    if (pageIndex > totalPages - 1) {
      setPageIndex(totalPages - 1);
    }
  }, [pageIndex, totalPages]);

  const renderPage = ({ item, index }) => {
    const pageOffset = index * pageWidth;
    const leftEdgeOpacity = scrollX.interpolate({
      inputRange: [(index - 1) * pageWidth, pageOffset, (index + 1) * pageWidth],
      outputRange: [0, 0, 0.35],
      extrapolate: "clamp",
    });
    const rightEdgeOpacity = scrollX.interpolate({
      inputRange: [(index - 1) * pageWidth, pageOffset, (index + 1) * pageWidth],
      outputRange: [0.35, 0, 0],
      extrapolate: "clamp",
    });

    return (
      <View style={{
        width: pageWidth,
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
      }}>
        <Animated.View
          style={[
            {
              minHeight: isLandscape ? 320 : 420,
              backgroundColor: READER_BACKDROP,
              borderRadius: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.10,
              shadowRadius: 24,
              elevation: 8,
              alignSelf: "center",
              marginVertical: 18,
              padding: 0,
              flexDirection: isLandscape ? "row" : "column",
              gap: 0,
              width: "92%",
              overflow: "hidden",
            },
            { opacity: ambientDriftOpacity },
          ]}
        >
          {isLandscape ? (
            <View style={[styles.leftPageTextContainer, { backgroundColor: PAGE_COLOR }]}>
              <ScrollView
                style={styles.leftPageScroll}
                contentContainerStyle={styles.leftPageScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <Text style={[styles.storyText, fontsLoaded && styles.storyTextNunito]}>{item?.text}</Text>
              </ScrollView>
            </View>
          ) : (
            <View style={[styles.leftPageTextContainer, styles.leftPageTextContainerPortrait, { backgroundColor: PAGE_COLOR }]}>
              <ScrollView
                style={styles.leftPageScroll}
                contentContainerStyle={styles.leftPageScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <Text style={[styles.storyText, fontsLoaded && styles.storyTextNunito]}>{item?.text}</Text>
              </ScrollView>
            </View>
          )}
          <View style={[styles.rightPageSurface, { backgroundColor: PAGE_COLOR }]}>
            <View style={styles.rightPageContent}>
              <View style={styles.illustrationBox}>
              {(() => {
                const k = keyFor(index, artStyle);
                const staticIllustrationSource = item?.illustrationAssetSource;
                const illustrationValue = staticIllustrationSource;
                const imgSource = toImageSource(illustrationValue);
                const hasStaticIllustration = Boolean(
                  item?.illustrationAssetSource || item?.illustrationAssetName
                );
                const img = pageImages[k];
                const loading = loadingImages[k];
                const failed = failedImages[k];
                const opacity = imageOpacity[k];
                const promptText = item?.prompt || item?.text;
                const placeholderPayload = parsePlaceholderPayload(img);
                return (
                  <>
                    {imgSource ? (
                      <View style={styles.staticIllustrationContainer}>
                        <Image
                          source={imgSource}
                          style={styles.staticIllustrationImage}
                          resizeMode="contain"
                        />
                      </View>
                    ) : null}
                    {!hasStaticIllustration && loading && (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#999" />
                        <Text style={styles.loadingText}>Illustrating…</Text>
                      </View>
                    )}
                    {!hasStaticIllustration && img && placeholderPayload && (
                      <PlaceholderIllustration payload={placeholderPayload} />
                    )}
                    {!hasStaticIllustration && img && !placeholderPayload && (
                      <Animated.Image
                        source={{ uri: img }}
                        style={[{ width: "100%", height: "100%", borderRadius: 0 }, { opacity: opacity || 1 }]}
                        resizeMode="contain"
                        onLoad={() => {
                          setFailedImages((prev) => {
                            if (!prev[k]) return prev;
                            const next = { ...prev };
                            delete next[k];
                            return next;
                          });
                        }}
                        onError={() => {
                          setFailedImages((prev) => ({ ...prev, [k]: true }));
                          setLoadingImages((prev) => ({ ...prev, [k]: false }));
                        }}
                      />
                    )}
                    {!hasStaticIllustration && failed && !loading && (
                      <TouchableOpacity
                        style={styles.retryOverlay}
                        activeOpacity={0.85}
                        onPress={() => {
                          suppressNextToggleRef.current = true;
                          registerUiInteraction();
                          retryImageForPage(index, promptText);
                        }}
                      >
                        <Text style={styles.retryText}>Illustration failed to load. Tap to retry.</Text>
                      </TouchableOpacity>
                    )}
                    {!staticIllustrationSource && !img && !loading && (
                      <Text style={styles.illustrationHint}>Illustration</Text>
                    )}
                  </>
                );
              })()}
              </View>
            </View>
          </View>
          <Animated.View
            pointerEvents="none"
            style={[styles.pageDepthEdge, styles.pageDepthLeft, { opacity: leftEdgeOpacity }]}
          />
          <View pointerEvents="none" style={styles.pageSpineBand} />
          <View pointerEvents="none" style={styles.pageSpineCrease} />
          <Animated.View
            pointerEvents="none"
            style={[styles.pageDepthEdge, styles.pageDepthRight, { opacity: rightEdgeOpacity }]}
          />
        </Animated.View>
        <View style={styles.tapZonesContainer} pointerEvents="box-none">
          <Pressable
            style={styles.tapZoneLeft}
            onPress={() => {
              suppressNextToggleRef.current = true;
              scrollToPage(pageIndex - 1);
            }}
            disabled={!canGoPrevious}
          />
          <Pressable
            style={styles.tapZoneRight}
            onPress={() => {
              suppressNextToggleRef.current = true;
              scrollToPage(pageIndex + 1);
            }}
            disabled={!canGoNext}
          />
        </View>
      </View>
    );
  };

  if (!story || !hasValidPages) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 8 }}>
          We couldn't find this story.
        </Text>
        <Text style={{ fontSize: 14, opacity: 0.8, textAlign: "center", marginBottom: 20 }}>
          It may have been removed or your reading data is out of date.
        </Text>

        <Pressable
          onPress={() => navigation.navigate("Home")}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            width: "100%",
            alignItems: "center",
            marginBottom: 12,
            borderWidth: 1,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600" }}>Go Home</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("StoryPicker")}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            width: "100%",
            alignItems: "center",
            borderWidth: 1,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600" }}>Choose a Story</Text>
        </Pressable>
      </View>
    );
  }

  if (isClosingReader) {
    return (
      <View style={styles.closingPlaceholder}>
        <StatusBar hidden />
        <ActivityIndicator size="small" color="#C8B04A" />
        <Text style={styles.closingPlaceholderText}>Closing your story...</Text>
      </View>
    );
  }

  if (Platform.OS === "ios" && !orientationReady) {
    return (
      <View style={styles.orientationPlaceholder}>
        <StatusBar hidden />
        <ActivityIndicator size="small" color="#C8B04A" />
        <Text style={styles.orientationPlaceholderIcon}>{"\u21BB"}</Text>
        <Text style={styles.orientationPlaceholderTitle}>Rotate your phone</Text>
        <Text style={styles.orientationPlaceholderText}>Opening your story...</Text>
        <Text style={styles.orientationPlaceholderHelper}>
          The book opens best in landscape.
        </Text>
      </View>
    );
  }

  if (!isHydrated) {
    return (
      <View style={styles.hydrationPlaceholder}>
        <StatusBar hidden />
        <ActivityIndicator size="small" color="#C8B04A" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: OUTER_BG }}>
      <StatusBar hidden />
      <View pointerEvents="none" style={styles.readingVignette} />

      <Animated.View
        pointerEvents={controlsVisible ? "auto" : "none"}
        style={[styles.headerRow, { opacity: uiOpacity }]}
      >
        <View style={styles.headerLeft}>
          <Text numberOfLines={1} style={[styles.title, { fontSize: 20, letterSpacing: 0.5 }]}>
            {displayStoryTitle}
          </Text>
          {childDisplayName ? (
            <Text numberOfLines={1} style={styles.readingAsHeaderText}>
              Reading as {childDisplayName}
            </Text>
          ) : null}
          <Text style={styles.progress}>
            Page {pageIndex + 1} of {totalPages}
          </Text>
        </View>

        <View style={styles.headerProgressWrap}>
          <View
            style={styles.headerProgressTrack}
            onLayout={(e) => setProgressTrackWidth(e.nativeEvent.layout.width)}
          >
            <Animated.View
              style={[
                styles.headerProgressFill,
                { width: Animated.multiply(progressAnim, progressTrackWidth || 0) },
              ]}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => {
            registerUiInteraction();
            requestExitReader();
          }}
        >
          <Text style={styles.closeText}>X</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        pointerEvents={controlsVisible ? "auto" : "none"}
        style={[styles.pageControls, { opacity: uiOpacity }]}
      >
        <TouchableOpacity
          style={[styles.pageControlButton, !canGoPrevious && styles.pageControlButtonDisabled]}
          disabled={!canGoPrevious}
          onPress={() => {
            registerUiInteraction();
            scrollToPage(pageIndex - 1);
          }}
        >
          <Text style={styles.pageControlText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pageControlButton, !canGoNext && styles.pageControlButtonDisabled]}
          disabled={!canGoNext}
          onPress={() => {
            registerUiInteraction();
            scrollToPage(pageIndex + 1);
          }}
        >
          <Text style={styles.pageControlText}>Next</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.pageSettleWrap,
          {
            opacity: pageSettleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.99, 1],
            }),
            transform: [
              {
                translateY: pageSettleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [2, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.pageTapSurface}>
        {/* Swipeable pages */}
        <AnimatedFlatList
          key={`reader-pages-${pageWidth}`}
          ref={listRef}
          onLayout={handleListLayout}
          initialScrollIndex={initialIndex}
          initialNumToRender={PAGE_INITIAL_RENDER_COUNT}
          maxToRenderPerBatch={PAGE_BATCH_RENDER_COUNT}
          windowSize={PAGE_WINDOW_SIZE}
          updateCellsBatchingPeriod={16}
          removeClippedSubviews={Platform.OS === "android"}
          data={pages}
          horizontal
          snapToInterval={pageWidth}
          snapToAlignment="start"
          decelerationRate="fast"
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderPage}
          style={styles.pageScroller}
          getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
          onScrollToIndexFailed={({ index }) => {
            requestAnimationFrame(() => {
              listRef.current?.scrollToOffset({
                offset: index * pageWidth,
                animated: false,
              });
            });
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: true,
              listener: (e) => {
                if (programmaticTargetIndexRef.current != null) return;
                const i = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
                if (i !== pageIndexRef.current) {
                  commitPageIndexChange(i);
                }
              },
            }
          )}
          scrollEventThrottle={16}
          onTouchStart={(e) => {
            touchStartRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
            touchMovedRef.current = false;
          }}
          onTouchMove={(e) => {
            const dx = Math.abs(e.nativeEvent.pageX - touchStartRef.current.x);
            const dy = Math.abs(e.nativeEvent.pageY - touchStartRef.current.y);
            if (dx > 10 || dy > 10) {
              touchMovedRef.current = true;
            }
          }}
          onTouchEnd={() => {
            if (suppressNextToggleRef.current) {
              suppressNextToggleRef.current = false;
              return;
            }
            if (touchMovedRef.current) return;
            revealUiControls();
          }}
          onScrollBeginDrag={() => {
            programmaticTargetIndexRef.current = null;
          }}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
            if (programmaticTargetIndexRef.current != null && i === programmaticTargetIndexRef.current) {
              programmaticTargetIndexRef.current = null;
              return;
            }
            programmaticTargetIndexRef.current = null;
            if (i !== pageIndexRef.current) {
              commitPageIndexChange(i);
            }
          }}
        />
      </View>
      </Animated.View>

      {exitPromptVisible && !isClosingReader ? (
        <View style={styles.readerExitOverlay}>
          <View style={styles.readerExitCard}>
            <Text style={styles.readerExitTitle}>Leave story?</Text>
            <Text style={styles.readerExitSubtitle}>Your progress is saved.</Text>
            <View style={styles.readerExitActions}>
              <TouchableOpacity
                style={styles.readerExitContinueButton}
                onPress={closeExitPrompt}
                disabled={isClosingReader}
              >
                <Text style={styles.readerExitContinueText}>Continue Reading</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.readerExitLeaveButton}
                onPress={() => finishExitReader(exitPromptState?.pendingAction || null)}
                disabled={isClosingReader}
              >
                <Text style={styles.readerExitLeaveText}>Leave Story</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      {showCompletionOverlay && (
        <View style={styles.completionOverlay}>
          <View style={styles.completionCard}>
            <Text style={styles.completionTitle}>You finished the story</Text>
            <Text style={styles.completionSubtitle}>Sweet dreams.</Text>
            <View style={styles.completionActions}>
              <TouchableOpacity
                style={styles.completionCloseButton}
                onPress={() => {
                  registerUiInteraction();
                  clearCompletionTimer();
                  setShowCompletionOverlay(false);
                  navigation.navigate("Home");
                }}
              >
                <Text style={styles.completionCloseText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.completionBackHomeButton}
                onPress={() => {
                  registerUiInteraction();
                  clearCompletionTimer();
                  setShowCompletionOverlay(false);
                  navigation.navigate("Home");
                }}
              >
                <Text style={styles.completionBackHomeText}>Back to Home</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.completionReadAgainButton}
                onPress={() => {
                  registerUiInteraction();
                  clearCompletionTimer();
                  setShowCompletionOverlay(false);
                  setCompletionCelebrated(false);
                  scrollToPage(0);
                }}
              >
                <Text style={styles.completionReadAgainText}>Read again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#1F1633" },
  hydrationPlaceholder: {
    flex: 1,
    backgroundColor: OUTER_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  closingPlaceholder: {
    flex: 1,
    backgroundColor: OUTER_BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  closingPlaceholderText: {
    marginTop: 12,
    color: PAGE_COLOR,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  orientationPlaceholder: {
    flex: 1,
    backgroundColor: OUTER_BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  orientationPlaceholderIcon: {
    marginTop: 14,
    marginBottom: 10,
    color: "#C8B04A",
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 48,
  },
  orientationPlaceholderTitle: {
    color: PAGE_COLOR,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0,
    marginBottom: 8,
  },
  orientationPlaceholderText: {
    color: PAGE_COLOR,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    opacity: 0.9,
  },
  orientationPlaceholderHelper: {
    marginTop: 8,
    color: PAGE_COLOR,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
    opacity: 0.7,
  },
  readerExitOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 35,
    backgroundColor: "rgba(22,17,33,0.48)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  readerExitCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 26,
    backgroundColor: PAGE_COLOR,
    borderWidth: 1,
    borderColor: "rgba(200,176,74,0.42)",
    paddingVertical: 24,
    paddingHorizontal: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  readerExitTitle: {
    color: INK,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  readerExitSubtitle: {
    color: INK,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
    opacity: 0.74,
    marginBottom: 20,
  },
  readerExitActions: {
    flexDirection: "row",
    gap: 12,
  },
  readerExitContinueButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#493B63",
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  readerExitContinueText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  readerExitLeaveButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#F7DDDA",
    borderWidth: 1,
    borderColor: "#E8B9B3",
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  readerExitLeaveText: {
    color: "#9F4D4D",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  readingVignette: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  completionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    backgroundColor: "rgba(22,17,33,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  completionCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.12)",
    backgroundColor: "rgba(39,31,57,0.96)",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  completionTitle: {
    fontSize: 21,
    fontWeight: "600",
    color: "#F4F1FF",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  completionSubtitle: {
    marginTop: 7,
    fontSize: 14,
    color: "#D7CFEA",
    opacity: 0.9,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  completionActions: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  completionCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.12)",
    backgroundColor: "rgba(47,35,79,0.24)",
  },
  completionCloseText: {
    fontSize: 13,
    color: "#C2B7DA",
    fontWeight: "600",
    opacity: 0.85,
    letterSpacing: 0.15,
  },
  completionBackHomeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.34)",
    backgroundColor: "#A78BFA",
  },
  completionBackHomeText: {
    fontSize: 13,
    color: "#241A3A",
    fontWeight: "700",
    letterSpacing: 0.15,
  },
  completionReadAgainButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.2)",
    backgroundColor: "rgba(67,55,96,0.54)",
  },
  completionReadAgainText: {
    fontSize: 13,
    color: "#E5DDF8",
    fontWeight: "600",
    letterSpacing: 0.15,
  },

  headerRow: {
    position: "absolute",
    top: 12,
    left: 14,
    right: 14,
    zIndex: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerLeft: {
    maxWidth: "42%",
    minWidth: 120,
    marginRight: 10,
  },
  headerProgressWrap: {
    flex: 1,
    marginHorizontal: 8,
    justifyContent: "center",
  },
  headerProgressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(167,139,250,0.22)",
    overflow: "hidden",
  },
  headerProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#A78BFA",
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5F523A",
    marginBottom: 2,
    letterSpacing: 0.3,
    textShadowColor: "rgba(255,255,255,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  readingAsHeaderText: {
    fontSize: 10,
    color: "#7A7388",
    opacity: 0.85,
    marginBottom: 2,
    letterSpacing: 0.2,
    fontWeight: "600",
  },
  progress: { fontSize: 11, opacity: 0.95, color: "#5F5A6D" },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(36,26,58,0.08)",
    borderWidth: 1,
    borderColor: "rgba(36,26,58,0.2)",
  },
  closeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#46366F",
  },
  pageControls: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageControlButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(36,26,58,0.08)",
    borderWidth: 1,
    borderColor: "rgba(36,26,58,0.2)",
  },
  pageControlButtonDisabled: {
    opacity: 0.35,
  },
  pageControlText: {
    color: "#2D243F",
    fontSize: 13,
    fontWeight: "600",
  },

  pageScroller: { flex: 1 },
  pageSettleWrap: { flex: 1 },
  pageTapSurface: { flex: 1 },
  page: { flex: 1 },
  tapZonesContainer: {
    ...StyleSheet.absoluteFillObject,
    top: 72,
    bottom: 0,
    zIndex: 1,
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  tapZoneLeft: {
    width: "23%",
    backgroundColor: "transparent",
  },
  tapZoneRight: {
    width: "23%",
    backgroundColor: "transparent",
  },

  spreadLandscape: {
    flex: 1,
    flexDirection: "row",
    padding: 20,
    gap: 20,
    alignItems: "center",
  },
  spreadPortrait: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  leftPage: { flex: 1, justifyContent: "center" },
  rightPage: { flex: 1, alignItems: "center", justifyContent: "center" },

  body: { fontSize: 17, lineHeight: 32, color: "#F5F3FF" },
  leftPageTextContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  leftPageTextContainerPortrait: {
    width: "100%",
  },
  leftPageScroll: {
    flex: 1,
  },
  leftPageScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: 22,
    paddingBottom: 18,
    paddingLeft: 24,
    paddingRight: 20,
  },
  rightPageSurface: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  rightPageContent: {
    flex: 1,
    paddingTop: 22,
    paddingBottom: 18,
    paddingLeft: 20,
    paddingRight: 24,
  },
  storyText: {
    fontSize: 22,
    lineHeight: 34,
    color: INK,
    flexShrink: 1,
    textAlign: "left",
  },
  storyTextNunito: {
    fontFamily: "Nunito",
  },

  illustrationBox: {
    flex: 1,
    width: "100%",
    height: "100%",
    minHeight: 0,
    maxHeight: "100%",
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "transparent",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  staticIllustrationContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  staticIllustrationImage: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 0,
    zIndex: 2,
  },
  loadingText: {
    fontSize: 12,
    marginTop: 10,
    opacity: 0.6,
  },
  retryOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 3,
    paddingHorizontal: 12,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  illustrationHint: {
    fontSize: 13,
    opacity: 0.5,
    textAlign: "center",
  },
  placeholderCard: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderBlob: {
    position: "absolute",
    borderRadius: 999,
  },
  placeholderBlobTop: {
    width: 130,
    height: 130,
    top: -34,
    left: -22,
  },
  placeholderBlobBottom: {
    width: 160,
    height: 160,
    right: -40,
    bottom: -62,
  },
  placeholderHeroEmoji: {
    fontSize: 74,
    lineHeight: 84,
  },
  placeholderSceneBadge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.48)",
  },
  placeholderSceneEmoji: {
    fontSize: 20,
  },
  placeholderHeroLabel: {
    position: "absolute",
    left: 12,
    right: 52,
    bottom: 14,
    fontSize: 11,
    color: "rgba(30,27,46,0.56)",
  },
  pageDepthEdge: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 14,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.10)",
  },
  pageDepthLeft: {
    left: 0,
  },
  pageDepthRight: {
    right: 0,
  },
  pageSpineBand: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 6,
    marginLeft: -3,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 3,
  },
  pageSpineCrease: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 2,
    marginLeft: -1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  // Page-turn illusion overlays
  pageOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  shadowOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 36,
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.22)",
    pointerEvents: "none",
  },
  highlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    pointerEvents: "none",
  },
});
