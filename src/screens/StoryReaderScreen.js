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
import { generateImageFromAI, buildIllustrationPrompt } from "../utils/imageGeneration";

export default function StoryReaderScreen({ navigation, route }) {
  // DEBUG: Set to true to test FlatList paging in isolation
  const DEBUG_DUMMY_PAGING = false;

  const { story, selectedChild } = route?.params || {};

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Explicit page width for paging calculations
  const PAGE_W = Dimensions.get("window").width;

  // Track renders to detect re-mounts during gestures
  if (__DEV__) {
    console.log("StoryReaderScreen render", Date.now());
  }

  // Remount detector: log if component unmounts/remounts during swipe
  useEffect(() => {
    console.log("[StoryReader] MOUNT");
    return () => console.log("[StoryReader] UNMOUNT");
  }, []);

  // Page-turn illusion: track scroll position
  const scrollX = useRef(new Animated.Value(0)).current;
  const ENABLE_PAGE_TURN_ILLUSION = true;

  // Hide navigation header
  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // DUMMY PAGING TEST: Bypass all reader logic, test bare FlatList
  if (DEBUG_DUMMY_PAGING) {
    const dummyWidth = Dimensions.get("window").width;
    const dummyData = Array.from({ length: 5 }, (_, i) => i);

    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <FlatList
          data={dummyData}
          horizontal
          pagingEnabled
          keyExtractor={(i) => String(i)}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={{
                width: dummyWidth,
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 48, fontWeight: "700" }}>
                {item + 1}
              </Text>
            </View>
          )}
        />
      </View>
    );
  }

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

  // Stable pages data to prevent FlatList reconciliation issues
  const pages = React.useMemo(
    () => [
      "Once upon a quiet afternoon, a small turtle decided it was time to explore beyond the familiar pond.",
      "With slow but steady steps, the turtle wandered through tall grass that whispered secrets in the breeze.",
      "Along the way, the turtle met a curious rabbit who asked, "Why move so slowly?"",
      "The turtle smiled and replied, "Because I like to notice things others rush past."",
      "By nightfall, the turtle felt brave. Not because it was fast, but because it kept taking the next small step.",
    ],
    []
  );

  const [pageIndex, setPageIndex] = useState(0);
  const totalPages = pages.length;

  const [pageImages, setPageImages] = useState({});
  const [loadingImages, setLoadingImages] = useState({});
  const [failedImages, setFailedImages] = useState({});
  const [imageOpacity] = useState({});
  const [artStyle, setArtStyle] = useState("magical");
  const [pendingStyle, setPendingStyle] = useState(artStyle);
  const [isInteracting, setIsInteracting] = useState(false);
  const styleDebounceRef = React.useRef(null);

  const ART_STYLES = [
    { key: "magical", label: "✨ Magical" },
    { key: "bold_adventure", label: "🐉 Bold" },
    { key: "cozy", label: "🏠 Cozy" },
    { key: "classic", label: "📖 Classic" },
  ];

  // Composite cache key: page index + art style
  const keyFor = (index, style) => `${index}|${style}`;

  // Animated FlatList for scroll-driven effects
  const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

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
    const text = pages[pageIndex];
    if (text && !pageImages[k] && !failedImages[k]) {
      generateImageForPage(pageIndex, text);
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
        const nextText = pages[nextIndex];
        // Fire it but don't await (background fetch)
        generateImageForPage(nextIndex, nextText);
      }
    }
  }, [pageIndex, artStyle]);

  // Debounced style change: only commit artStyle after delay
  const handleStylePress = (styleKey) => {
    // immediate visual feedback via pendingStyle
    setPendingStyle(styleKey);

    // clear existing timer
    if (styleDebounceRef.current) {
      clearTimeout(styleDebounceRef.current);
    }

    // debounce commit
    styleDebounceRef.current = setTimeout(() => {
      // avoid redundant set
      setArtStyle((prev) => (prev === styleKey ? prev : styleKey));
      styleDebounceRef.current = null;
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (styleDebounceRef.current) {
        clearTimeout(styleDebounceRef.current);
      }
    };
  }, []);

  const renderPage = ({ item, index }) => {
    // Interpolations for page-turn effect
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const dimOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.1, 0.0, 0.1],
      extrapolate: "clamp",
    });

    const shadowOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.22, 0.0, 0.22],
      extrapolate: "clamp",
    });

    const shadowTranslateX = scrollX.interpolate({
      inputRange,
      outputRange: [-36, 0, 36],
      extrapolate: "clamp",
    });

    const highlightOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.14, 0.0, 0.14],
      extrapolate: "clamp",
    });

    const pageContent = (
      <>
        {isLandscape ? (
          // Landscape: text left, illustration right, side-by-side
          <View style={styles.spreadLandscape}>
            <View style={styles.leftPage}>
              <Text style={styles.body}>{item}</Text>
            </View>
            <View style={styles.rightPage}>
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

                      {failedImages[k] && (
                        <TouchableOpacity
                          style={[styles.loadingOverlay, { backgroundColor: "rgba(255,255,255,0.95)" }]}
                          onPress={() => {
                            // clear failure mark and retry
                            setFailedImages((prev) => {
                              const next = { ...prev };
                              delete next[k];
                              return next;
                            });
                            generateImageForPage(index, pages[index]);
                          }}
                        >
                          <Text style={styles.loadingText}>Image failed — tap to retry</Text>
                        </TouchableOpacity>
                      )}

                      {img && (
                        <Animated.Image
                          source={{ uri: img }}
                          style={[{ width: "100%", height: "100%", borderRadius: 12 }, { opacity: opacity || 1 }]}
                          resizeMode="cover"
                        />
                      )}
                      {!img && !loading && !failedImages[k] && <Text style={styles.illustrationHint}>Illustration</Text>}
                    </>
                  );
                })()}
              </View>
            </View>
          </View>
        ) : (
          // Portrait: text top, illustration below, stacked
          <View style={styles.spreadPortrait}>
            <Text style={styles.body}>{item}</Text>
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
        )}
      </>
    );

    return (
      <View style={[styles.page, { width: PAGE_W }]}>
        {pageContent}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar hidden />

      {/* Title and page indicator (subtle overlay, top-left) */}
      <View style={styles.headerOverlay}>
        <Text style={styles.title}>{story?.title || "Story"}</Text>
        <Text style={styles.progress}>
          {pageIndex + 1} of {totalPages}
        </Text>
      </View>

      {/* Art style selector */}
      <View style={styles.styleSelector}>
        {ART_STYLES.map((style) => (
          <TouchableOpacity
            key={style.key}
            style={[
              styles.styleButton,
              pendingStyle === style.key && styles.styleButtonActive,
            ]}
            onPress={() => handleStylePress(style.key)}
          >
            <Text
              style={[
                styles.styleButtonText,
                pendingStyle === style.key && styles.styleButtonTextActive,
              ]}
            >
              {style.label}
            </Text>
          </TouchableOpacity>
        ))}
        {/* Small shimmer/feedback when style-specific image is loading */}
        {(() => {
          const kCurr = keyFor(pageIndex, artStyle);
          const isUpdating = !pageImages[kCurr] && loadingImages[kCurr];
          if (!isUpdating) return null;
          return (
            <View style={styles.styleUpdatingBadge}>
              <Text style={styles.styleUpdatingText}>Updating style…</Text>
            </View>
          );
        })()}
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
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderPage}
        style={styles.pageScroller}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => setIsInteracting(true)}
        onScrollEndDrag={() => setIsInteracting(false)}
        onMomentumScrollEnd={(e) => {
          setIsInteracting(false);
          const w = e.nativeEvent.layoutMeasurement.width;
          const i = Math.round(e.nativeEvent.contentOffset.x / w);
          console.log(`[scroll] momentum ended at offset=${e.nativeEvent.contentOffset.x}, width=${w}, calculated index=${i}`);
          setPageIndex(i);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },

  headerOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 5,
  },

  title: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  progress: { fontSize: 11, opacity: 0.5 },

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
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  styleButtonActive: {
    backgroundColor: "#E6F4FF",
    borderColor: "#1890FF",
  },
  styleButtonText: {
    fontSize: 11,
    opacity: 0.6,
  },
  styleButtonTextActive: {
    opacity: 1,
    fontWeight: "600",
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
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  closeText: {
    fontSize: 18,
    fontWeight: "700",
    opacity: 0.7,
  },

  pageScroller: { flex: 1 },
  page: { flex: 1 },

  spreadLandscape: {
    flex: 1,
    flexDirection: "row",
    padding: 16,
    gap: 20,
    alignItems: "center",
  },
  spreadPortrait: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },

  leftPage: { flex: 1, justifyContent: "center" },
  rightPage: { flex: 1, alignItems: "center", justifyContent: "center" },

  body: { fontSize: 17, lineHeight: 28 },

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
});
