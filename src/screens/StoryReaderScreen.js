import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
  Platform,
  Image,
  Animated,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateImageFromAI, buildIllustrationPrompt } from "../utils/imageGeneration";

// Create AnimatedFlatList OUTSIDE component to maintain stable identity
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const BG_TWILIGHT = "#241A3A";
const PAPER = "#F3F0E6";
const INK = "#1E1B2E";

const DEMO_PAGES = [
  "Once upon a quiet afternoon, a small turtle decided it was time to explore beyond the familiar pond.",
  "With slow but steady steps, the turtle wandered through tall grass that whispered secrets in the breeze.",
  "Along the way, the turtle met a curious rabbit who asked, \"Why move so slowly?\"",
  "The turtle smiled and replied, \"Because I like to notice things others rush past.\"",
  "By nightfall, the turtle felt brave. Not because it was fast, but because it kept taking the next small step.",
];

export default function StoryReaderScreen({ navigation, route }) {
  // All hooks must be at the top level, in the same order every render
  const { story, selectedChild, artStyle } = route?.params || {};

  // Story context for prompt continuity
  const storyContext = {
    storyId: story?.id,
    title: story?.title,
    mainCharacter: story?.mainCharacter ?? null,
    settingHint: story?.setting ?? null,
  };

  const { width: SCREEN_W, height } = useWindowDimensions();
  const isLandscape = SCREEN_W > height;
  const PAGE_W = SCREEN_W;

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
  const totalPages = pages.length;

  const [pageImages, setPageImages] = useState({});
  const [loadingImages, setLoadingImages] = useState({});
  const [failedImages, setFailedImages] = useState({});
  const [imageOpacity] = useState({});
  const listRef = useRef(null);
  const saveDebounceRef = useRef(null);
  const hasRestoredProgressRef = useRef(false);
  const latestProgressRef = useRef({ pageIndex: 0, artStyle });

  const progressStorageKey = React.useMemo(() => {
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

    return `readerProgress:${storyId}:${childId}`;
  }, [story?.id, story?.title, selectedChild]);

  // Composite cache key: page index + art style
  const keyFor = (index, style) => `${index}|${style}`;

  useEffect(() => {
    latestProgressRef.current = { pageIndex, artStyle };
  }, [pageIndex, artStyle]);

  // Load saved reading progress and restore page position.
  useEffect(() => {
    let cancelled = false;
    hasRestoredProgressRef.current = false;

    const loadProgress = async () => {
      try {
        const raw = await AsyncStorage.getItem(progressStorageKey);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        const savedIndex = Number(parsed?.pageIndex);
        if (!Number.isFinite(savedIndex)) return;

        const clampedIndex = totalPages > 0
          ? Math.min(Math.max(Math.floor(savedIndex), 0), totalPages - 1)
          : 0;

        if (cancelled) return;
        setPageIndex(clampedIndex);

        requestAnimationFrame(() => {
          if (cancelled) return;
          listRef.current?.scrollToOffset({
            offset: clampedIndex * PAGE_W,
            animated: false,
          });
        });

        console.log(`[readerProgress] loaded page ${clampedIndex} for ${progressStorageKey}`);
      } catch (error) {
        console.warn("Failed to load reader progress", error);
      } finally {
        if (!cancelled) {
          hasRestoredProgressRef.current = true;
        }
      }
    };

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [progressStorageKey]);

  // Debounced save whenever page index changes.
  useEffect(() => {
    if (!hasRestoredProgressRef.current) return;

    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }

    saveDebounceRef.current = setTimeout(async () => {
      const { pageIndex: latestPageIndex, artStyle: latestArtStyle } = latestProgressRef.current;
      try {
        await AsyncStorage.setItem(
          progressStorageKey,
          JSON.stringify({ pageIndex: latestPageIndex, artStyle: latestArtStyle })
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
  }, [pageIndex, artStyle, progressStorageKey]);

  // Save latest progress on unmount.
  useEffect(() => {
    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = null;
      }

      if (!hasRestoredProgressRef.current) return;

      const { pageIndex: latestPageIndex, artStyle: latestArtStyle } = latestProgressRef.current;
      AsyncStorage.setItem(
        progressStorageKey,
        JSON.stringify({ pageIndex: latestPageIndex, artStyle: latestArtStyle })
      )
        .then(() => {
          console.log(`[readerProgress] saved page ${latestPageIndex} for ${progressStorageKey}`);
        })
        .catch((error) => {
          console.warn("Failed to save reader progress on unmount", error);
        });
    };
  }, [progressStorageKey]);

  // Generate illustration for page
  // Uses generateImageFromAI utility (swap internals for real API)
  const generateImageForPage = async (index, text) => {
    const k = keyFor(index, artStyle);
    // Guard: avoid double-generation if already in-flight
    if (loadingImages[k]) return;

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
      const imageUrl = await generateImageFromAI(prompt, story?.title, artStyle);

      setPageImages((prev) => ({ ...prev, [k]: imageUrl }));
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
    const k = keyFor(pageIndex, artStyle);
    const page = pages[pageIndex];
    const promptText = page?.prompt || page?.text;
    if (promptText && !pageImages[k] && !failedImages[k]) {
      generateImageForPage(pageIndex, promptText);
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
        // Fire it but don't await (background fetch)
        if (nextPromptText) {
          generateImageForPage(nextIndex, nextPromptText);
        }
      }
    }
  }, [pageIndex, artStyle]);

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
    return (
      <View style={{
        width: PAGE_W,
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: BG_TWILIGHT,
      }}>
        <View
          style={{
            minHeight: isLandscape ? 320 : 420,
            backgroundColor: PAPER,
            borderRadius: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.10,
            shadowRadius: 24,
            elevation: 8,
            alignSelf: "center",
            marginVertical: 18,
            padding: isLandscape ? 24 : 20,
            flexDirection: isLandscape ? "row" : "column",
            gap: 24,
            width: "92%",
            overflow: "hidden",
          }}
        >
          {isLandscape ? (
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={{ fontSize: 17, lineHeight: 32, color: INK }}>{item?.text}</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 17, lineHeight: 32, color: INK }}>{item?.text}</Text>
          )}
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <View style={styles.illustrationBox}>
              {(() => {
                const k = keyFor(index, artStyle);
                const img = pageImages[k];
                const loading = loadingImages[k];
                const opacity = imageOpacity[k];
                return (
                  <>
                    {loading && (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#999" />
                        <Text style={styles.loadingText}>Illustrating…</Text>
                      </View>
                    )}
                    {img && (
                      <Animated.Image
                        source={{ uri: img }}
                        style={[{ width: "100%", height: "100%", borderRadius: 12 }, { opacity: opacity || 1 }]}
                        resizeMode="cover"
                      />
                    )}
                    {!img && !loading && <Text style={styles.illustrationHint}>Illustration</Text>}
                  </>
                );
              })()}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG_TWILIGHT }}>
      <StatusBar hidden />

      {/* Title and page indicator (subtle overlay, top-left) */}
      <View style={styles.headerOverlay}>
        <Text style={[styles.title, { fontSize: 20, letterSpacing: 0.5 }]}> 
          {story?.title || "Story"}
        </Text>
        <Text style={styles.progress}>
          {pageIndex + 1} of {totalPages}
        </Text>
      </View>

      {/* Close button overlay (top-right) */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      {/* Swipeable pages */}
      <AnimatedFlatList
        ref={listRef}
        data={pages}
        horizontal
        snapToInterval={PAGE_W}
        snapToAlignment="start"
        decelerationRate="fast"
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderPage}
        style={styles.pageScroller}
        getItemLayout={(_, index) => ({ length: PAGE_W, offset: PAGE_W * index, index })}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const w = e.nativeEvent.layoutMeasurement.width;
          const i = Math.round(e.nativeEvent.contentOffset.x / w);
          setPageIndex(i);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#1F1633" },

  headerOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 5,
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B4266",
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  progress: { fontSize: 11, opacity: 0.6, color: "#A78BFA" },

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
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.15)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  closeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#A78BFA",
  },

  pageScroller: { flex: 1 },
  page: { flex: 1 },

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

  illustrationBox: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "rgba(0,0,0,0.04)",
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
    borderRadius: 12,
    zIndex: 2,
  },
  loadingText: {
    fontSize: 12,
    marginTop: 10,
    opacity: 0.6,
  },
  illustrationHint: {
    fontSize: 13,
    opacity: 0.5,
    textAlign: "center",
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
