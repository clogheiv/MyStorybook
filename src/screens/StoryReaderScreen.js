import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  FlatList,
  Platform,
  Alert,
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
import { generateImageFromAI, buildIllustrationPrompt } from "../utils/imageGeneration";

// Create AnimatedFlatList OUTSIDE component to maintain stable identity
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const BG_TWILIGHT = "#241A3A";
const OUTER_BG = "#2F2B45";
const READER_BACKDROP = "#F1EEE6";
const PAGE_COLOR = "#F7F4ED";
const INK = "#1E1B2E";
const STORY_PROGRESS_STORAGE_KEY = "storyProgress:v1";
const COMPLETION_DELAY_MS = 30000;

const DEMO_PAGES = [
  "Once upon a quiet afternoon, a small turtle decided it was time to explore beyond the familiar pond.",
  "With slow but steady steps, the turtle wandered through tall grass that whispered secrets in the breeze.",
  "Along the way, the turtle met a curious rabbit who asked, \"Why move so slowly?\"",
  "The turtle smiled and replied, \"Because I like to notice things others rush past.\"",
  "By nightfall, the turtle felt brave. Not because it was fast, but because it kept taking the next small step.",
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

export default function StoryReaderScreen({ navigation, route }) {
  // All hooks must be at the top level, in the same order every render
  const { story, selectedChild, artStyle } = route?.params || {};
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

  // Page-turn illusion: track scroll position
  const scrollX = useRef(new Animated.Value(0)).current;
  const ENABLE_PAGE_TURN_ILLUSION = true;

  // Hide navigation header
  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Lock to landscape while reading
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => ScreenOrientation.unlockAsync();
  }, []);

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
  const pages = React.useMemo(
    () => {
      const sourcePages = story?.pages;
      if (Array.isArray(sourcePages) && sourcePages.length > 0) {
        const normalized = sourcePages
          .map((page) => {
            if (typeof page === "string") {
              return { text: page, prompt: page };
            }
            if (page && typeof page === "object" && typeof page.text === "string") {
              const prompt = typeof page.prompt === "string" && page.prompt.trim()
                ? page.prompt
                : page.text;
              return { text: page.text, prompt };
            }
            return null;
          })
          .filter(Boolean);

        if (normalized.length > 0) {
          return normalized;
        }
      }

      return DEMO_PAGES.map((text) => ({ text, prompt: text }));
    },
    [story?.pages]
  );

  const [pageIndex, setPageIndex] = useState(0);
  const [initialIndex, setInitialIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [completionCelebrated, setCompletionCelebrated] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const totalPages = pages.length;
  const progressRatio = totalPages > 0 ? (pageIndex + 1) / totalPages : 0;

  const [pageImages, setPageImages] = useState({});
  const [loadingImages, setLoadingImages] = useState({});
  const [failedImages, setFailedImages] = useState({});
  const [visualAnchor, setVisualAnchor] = useState("");
  const [imageOpacity] = useState({});
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const progressAnim = useRef(new Animated.Value(progressRatio)).current;
  const uiOpacity = useRef(new Animated.Value(1)).current;
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
  const isUiVisibleRef = useRef(true);
  const hasRestoredProgressRef = useRef(false);
  const pageIndexRef = useRef(0);
  const lastSettleFeedbackIndexRef = useRef(0);
  const programmaticTargetIndexRef = useRef(null);
  const latestProgressRef = useRef({
    pageIndex: 0,
    artStyle,
    controlsVisible: true,
    completionCelebrated: false,
  });
  const inferredVisualAnchor = React.useMemo(() => inferVisualAnchor(story), [story]);

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
    () => `readerProgress:${readerIdentity.storyId}:${readerIdentity.childId}`,
    [readerIdentity]
  );
  const visualStorageKey = React.useMemo(
    () => `visualAnchor:${readerIdentity.storyId}:${readerIdentity.childId}:${artStyle}`,
    [readerIdentity, artStyle]
  );
  const persistStoryProgress = React.useCallback(
    async (currentPageIndex) => {
      const storyId = readerIdentity.storyId;
      if (!storyId || storyId === "unknown") return;

      const normalizedPageIndex = Number.isFinite(currentPageIndex)
        ? Math.max(0, Math.floor(currentPageIndex))
        : 0;

      try {
        const raw = await AsyncStorage.getItem(STORY_PROGRESS_STORAGE_KEY);
        let nextStoryProgress = {};

        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            nextStoryProgress = { ...parsed };
          }
        }

        nextStoryProgress[storyId] = normalizedPageIndex;
        await AsyncStorage.setItem(
          STORY_PROGRESS_STORAGE_KEY,
          JSON.stringify(nextStoryProgress)
        );
      } catch (error) {
        console.warn("Failed to save storyProgress map", error);
      }
    },
    [readerIdentity.storyId]
  );

  // Composite cache key: page index + art style
  const keyFor = (index, style) => `${index}|${style}`;

  const requestExitReader = React.useCallback(() => {
    if (pageIndex === 0) {
      navigation.goBack();
      return;
    }

    Alert.alert("Leave story?", "Your place is saved.", [
      { text: "Stay", style: "cancel" },
      { text: "Leave", onPress: () => navigation.goBack() },
    ]);
  }, [navigation, pageIndex]);

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
      fadeUiTo(0, 260);
      uiHideTimerRef.current = null;
    }, 3500);
  }, [fadeUiTo]);

  const registerUiInteraction = React.useCallback(() => {
    isUiVisibleRef.current = true;
    setControlsVisible(true);
    fadeUiTo(1, 280);
    scheduleUiAutoHide();
  }, [fadeUiTo, scheduleUiAutoHide]);

  const toggleControls = React.useCallback(() => {
    if (uiHideTimerRef.current) {
      clearTimeout(uiHideTimerRef.current);
      uiHideTimerRef.current = null;
    }

    if (isUiVisibleRef.current) {
      isUiVisibleRef.current = false;
      setControlsVisible(false);
      fadeUiTo(0, 280);
      return;
    }

    isUiVisibleRef.current = true;
    setControlsVisible(true);
    fadeUiTo(1, 280);
    scheduleUiAutoHide();
  }, [fadeUiTo, scheduleUiAutoHide]);

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
      let restoredControlsVisible = true;
      let restoredCompletionCelebrated = false;

      try {
        const raw = await AsyncStorage.getItem(progressStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          const savedIndex = Number(parsed?.pageIndex);
          if (Number.isFinite(savedIndex)) {
            restoredIndex = totalPages > 0
              ? Math.min(Math.max(Math.floor(savedIndex), 0), totalPages - 1)
              : 0;
          }

          if (typeof parsed?.controlsVisible === "boolean") {
            restoredControlsVisible = parsed.controlsVisible;
          }
          if (typeof parsed?.completionCelebrated === "boolean") {
            restoredCompletionCelebrated = parsed.completionCelebrated;
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
  }, [clearCompletionTimer, progressStorageKey, artStyle, totalPages, uiOpacity, pageSettleAnim]);

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
        await Promise.all([
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
          ),
          persistStoryProgress(latestPageIndex),
        ]);
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
    persistStoryProgress,
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
      Promise.all([
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
        ),
        persistStoryProgress(latestPageIndex),
      ])
        .then(() => {
          console.log(`[readerProgress] saved page ${latestPageIndex} for ${progressStorageKey}`);
        })
        .catch((error) => {
          console.warn("Failed to save reader progress on unmount", error);
        });
    };
  }, [clearCompletionTimer, persistStoryProgress, progressStorageKey, totalPages]);

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

      // Log prompt in dev for verification
      if (__DEV__) {
        console.log(`[${k}] prompt:`, prompt);
      }

      // Call image generation (structured for easy real API swap)
      const imageUrl = await generateImageFromAI(prompt, story?.title, artStyle, {
        storyId: readerIdentity.storyId,
        childId: readerIdentity.childId,
        pageIndex: index,
        gender:
          selectedChild && typeof selectedChild === "object"
            ? selectedChild.gender ?? "neutral"
            : "neutral",
      });
      const isPlaceholderToken =
        typeof imageUrl === "string" && imageUrl.startsWith(PLACEHOLDER_TOKEN_PREFIX);
      const resolvedUrl =
        retryNonce != null && !isPlaceholderToken
          ? `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}retry=${retryNonce}`
          : imageUrl;
      console.log("[IMG]", { index, artStyle, uri: resolvedUrl });

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
    const promptText = page?.prompt || page?.text;
    const anchorText = visualAnchor || inferredVisualAnchor;
    const anchoredPrompt = anchorText && promptText
      ? `${anchorText}\nScene: ${promptText}`
      : promptText;
    if (promptText && !pageImages[k] && !failedImages[k]) {
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
        const nextPromptText = nextPage?.prompt || nextPage?.text;
        const anchoredNextPrompt = anchorText && nextPromptText
          ? `${anchorText}\nScene: ${nextPromptText}`
          : nextPromptText;
        // Fire it but don't await (background fetch)
        if (nextPromptText) {
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
              <View style={styles.leftPageContent}>
                <Text style={[styles.storyText, fontsLoaded && styles.storyTextNunito]}>{item?.text}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.leftPageTextContainer, styles.leftPageTextContainerPortrait, { backgroundColor: PAGE_COLOR }]}>
              <View style={styles.leftPageContent}>
                <Text style={[styles.storyText, fontsLoaded && styles.storyTextNunito]}>{item?.text}</Text>
              </View>
            </View>
          )}
          <View style={[styles.rightPageSurface, { backgroundColor: PAGE_COLOR }]}>
            <View style={styles.rightPageContent}>
              <View style={styles.illustrationBox}>
              {(() => {
                const k = keyFor(index, artStyle);
                const img = pageImages[k];
                const loading = loadingImages[k];
                const failed = failedImages[k];
                const opacity = imageOpacity[k];
                const promptText = item?.prompt || item?.text;
                const placeholderPayload = parsePlaceholderPayload(img);
                return (
                  <>
                    {loading && (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#999" />
                        <Text style={styles.loadingText}>Illustrating…</Text>
                      </View>
                    )}
                    {img && placeholderPayload && (
                      <PlaceholderIllustration payload={placeholderPayload} />
                    )}
                    {img && !placeholderPayload && (
                      <Animated.Image
                        source={{ uri: img }}
                        style={[{ width: "100%", height: "100%", borderRadius: 0 }, { opacity: opacity || 1 }]}
                        resizeMode="cover"
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
                    {failed && !loading && (
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
                    {!img && !loading && <Text style={styles.illustrationHint}>Illustration</Text>}
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
              registerUiInteraction();
              scrollToPage(pageIndex - 1);
            }}
            disabled={!canGoPrevious}
          />
          <Pressable
            style={styles.tapZoneRight}
            onPress={() => {
              suppressNextToggleRef.current = true;
              registerUiInteraction();
              scrollToPage(pageIndex + 1);
            }}
            disabled={!canGoNext}
          />
        </View>
      </View>
    );
  };

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

      <Animated.View style={[styles.headerRow, { opacity: uiOpacity }]}>
        <View style={styles.headerLeft}>
          <Text numberOfLines={1} style={[styles.title, { fontSize: 20, letterSpacing: 0.5 }]}>
            {story?.title || "Story"}
          </Text>
          <Text style={styles.progress}>
            {pageIndex + 1} of {totalPages}
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

      <Animated.View style={[styles.pageControls, { opacity: uiOpacity }]}>
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
            toggleControls();
          }}
          onScrollBeginDrag={() => {
            programmaticTargetIndexRef.current = null;
            registerUiInteraction();
          }}
          onScrollEndDrag={registerUiInteraction}
          onMomentumScrollBegin={registerUiInteraction}
          onMomentumScrollEnd={(e) => {
            registerUiInteraction();
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

      {showCompletionOverlay && (
        <View style={styles.completionOverlay}>
          <View style={styles.completionCard}>
            <Text style={styles.completionTitle}>You finished the story</Text>
            <Text style={styles.completionSubtitle}>Sweet dreams.</Text>
            <View style={styles.completionActions}>
              <TouchableOpacity
                style={styles.completionSecondaryButton}
                onPress={() => {
                  registerUiInteraction();
                  clearCompletionTimer();
                  setShowCompletionOverlay(false);
                }}
              >
                <Text style={styles.completionSecondaryText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.completionPrimaryButton}
                onPress={() => {
                  registerUiInteraction();
                  clearCompletionTimer();
                  setShowCompletionOverlay(false);
                  setCompletionCelebrated(false);
                  scrollToPage(0);
                }}
              >
                <Text style={styles.completionPrimaryText}>Read again</Text>
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
  completionSecondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.14)",
    backgroundColor: "rgba(47,35,79,0.42)",
  },
  completionSecondaryText: {
    fontSize: 13,
    color: "#CFC5E5",
    fontWeight: "600",
    letterSpacing: 0.15,
  },
  completionPrimaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.24)",
    backgroundColor: "rgba(67,55,96,0.86)",
  },
  completionPrimaryText: {
    fontSize: 13,
    color: "#F4F1FF",
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
  progress: { fontSize: 11, opacity: 0.95, color: "#5F5A6D" },

  styleSelector: {
    position: "absolute",
    top: 50,
    left: 12,
    zIndex: 5,
    flexDirection: "row",
    gap: 8,
  },
  styleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(42,31,71,0.8)",
    borderWidth: 1,
    borderColor: "rgba(160,120,255,0.2)",
  },
  styleButtonActive: {
    backgroundColor: "rgba(167,139,250,0.2)",
    borderColor: "rgba(167,139,250,0.6)",
  },
  styleButtonText: {
    fontSize: 11,
    opacity: 0.6,
    color: "#F5F3FF",
  },
  styleButtonTextActive: {
    opacity: 1,
    fontWeight: "600",
    color: "#A78BFA",
  },

  styleUpdatingBadge: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.06)",
    justifyContent: "center",
  },
  styleUpdatingText: {
    fontSize: 11,
    opacity: 0.7,
  },

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
  leftPageContent: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 22,
    paddingBottom: 18,
    paddingLeft: 24,
    paddingRight: 20,
  },
  leftPageTextColumn: {
    flex: 1,
    justifyContent: "center",
    maxWidth: "100%",
    alignSelf: "flex-start",
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
