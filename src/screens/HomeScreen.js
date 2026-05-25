import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  catalogStoryById,
  loadStoryCatalog,
  personalizeStoryForChild,
} from "../data/storyCatalog";
import { resolveStoryPageIllustrationAsset } from "../data/localIllustrations";

const STORY_LIBRARY_STORAGE_KEY = "storyLibrary:v1";
const READER_PROGRESS_PREFIX = "readerProgress:";

const resolveChildId = (selectedChild) => {
  if (selectedChild && typeof selectedChild === "object") {
    if (selectedChild.id != null && String(selectedChild.id).trim()) {
      return String(selectedChild.id).trim();
    }
    if (typeof selectedChild.name === "string" && selectedChild.name.trim()) {
      return selectedChild.name.trim();
    }
  }

  if (typeof selectedChild === "string" && selectedChild.trim()) {
    return selectedChild.trim();
  }

  return "unknown";
};

const normalizeStory = (story, index, catalogById) => {
  if (!story || typeof story !== "object") return null;

  const rawId = story.id != null ? String(story.id).trim() : "";
  const rawTitle = typeof story.title === "string" ? story.title.trim() : "";
  if (!rawId || !rawTitle) return null;

  const catalogStory = catalogById.get(rawId);
  if (!catalogStory) return null;
  const numericCreatedAt = Number(story.createdAt);
  const createdAt = Number.isFinite(numericCreatedAt)
    ? numericCreatedAt
    : 1704067200000 + index * 86400000;

  return {
    ...story,
    ...(catalogStory || {}),
    id: rawId,
    title: rawTitle,
    createdAt,
  };
};

const extractActiveStories = (storedValue, catalogById) => {
  if (Array.isArray(storedValue)) {
    return storedValue
      .map((story, index) => normalizeStory(story, index, catalogById))
      .filter(Boolean);
  }

  if (storedValue && typeof storedValue === "object" && Array.isArray(storedValue.activeStories)) {
    return storedValue.activeStories
      .map((story, index) => normalizeStory(story, index, catalogById))
      .filter(Boolean);
  }

  return [];
};

export default function HomeScreen({ selectedProfile }) {
  const navigation = useNavigation();
  const selectedChild = selectedProfile || null;
  const childId = React.useMemo(() => resolveChildId(selectedChild), [selectedChild]);
  const catalogById = React.useMemo(() => catalogStoryById(), []);
  const [continueEntry, setContinueEntry] = React.useState(null);
  const shelfStories = React.useMemo(
    () => loadStoryCatalog().filter((story) => !story.isComingSoon).slice(0, 3),
    []
  );

  const loadContinueStory = React.useCallback(async () => {
    if (!selectedChild || childId === "unknown") {
      setContinueEntry(null);
      return;
    }

    try {
      const [libraryRaw, allKeys] = await Promise.all([
        AsyncStorage.getItem(STORY_LIBRARY_STORAGE_KEY),
        AsyncStorage.getAllKeys(),
      ]);

      const defaultStories = loadStoryCatalog();
      const storyById = new Map(defaultStories.map((story) => [String(story.id), story]));

      if (libraryRaw) {
        try {
          const parsedLibrary = JSON.parse(libraryRaw);
          extractActiveStories(parsedLibrary, catalogById).forEach((story) => {
            storyById.set(String(story.id), story);
          });
        } catch {
          // Ignore malformed library payloads and continue with catalog defaults.
        }
      }

      const progressKeyPrefix = `${READER_PROGRESS_PREFIX}${childId}:`;
      const progressKeys = allKeys.filter(
        (key) => key.startsWith(progressKeyPrefix)
      );
      if (progressKeys.length === 0) {
        setContinueEntry(null);
        return;
      }

      const progressEntries = await Promise.all(
        progressKeys.map(async (key) => ({ key, raw: await AsyncStorage.getItem(key) }))
      );

      let bestEntry = null;
      progressEntries.forEach(({ key, raw }) => {
        if (!raw) return;

        try {
          const parsed = JSON.parse(raw);
          const savedPageIndex = Number(parsed?.pageIndex);
          if (!Number.isFinite(savedPageIndex) || savedPageIndex < 0) return;

          const storyId = key.slice(progressKeyPrefix.length);
          const story = storyById.get(storyId);
          if (!story || story.isComingSoon) return;

          const progressTotalPages = Number(parsed?.totalPages);
          const storyPagesCount = Array.isArray(story.pages) ? story.pages.length : 0;
          const totalPages = Number.isFinite(progressTotalPages) && progressTotalPages > 0
            ? Math.floor(progressTotalPages)
            : storyPagesCount;
          const normalizedPageIndex = Math.floor(savedPageIndex);
          const isInProgress = normalizedPageIndex > 0 && (
            totalPages > 0 ? normalizedPageIndex < totalPages - 1 : true
          );
          if (!isInProgress) return;

          const savedLastOpenedAt = Number(parsed?.lastOpenedAt ?? parsed?.lastReadAt);
          const lastOpenedAt = Number.isFinite(savedLastOpenedAt) ? savedLastOpenedAt : 0;

          const candidate = {
            story,
            storyId,
            pageIndex: normalizedPageIndex,
            totalPages,
            lastOpenedAt,
          };
          if (!bestEntry || candidate.lastOpenedAt > bestEntry.lastOpenedAt) {
            bestEntry = candidate;
          }
        } catch {
          // Ignore malformed per-story progress entries.
        }
      });

      setContinueEntry(bestEntry);
    } catch {
      setContinueEntry(null);
    }
  }, [catalogById, childId, selectedChild]);

  useFocusEffect(
    React.useCallback(() => {
      loadContinueStory();
      return undefined;
    }, [loadContinueStory])
  );

  const openContinueReading = React.useCallback(() => {
    if (!continueEntry || !continueEntry.story) return;

    navigation.navigate("StoryReader", {
      storyId: continueEntry.storyId,
      story: personalizeStoryForChild(continueEntry.story, selectedChild),
      selectedChild,
      artStyle:
        typeof continueEntry.story.artStyle === "string" && continueEntry.story.artStyle.trim()
          ? continueEntry.story.artStyle
          : "magical",
      startPageIndex: continueEntry.pageIndex,
      forceStart: false,
    });
  }, [continueEntry, navigation, selectedChild]);
  const openStoryCatalog = React.useCallback(() => {
    if (!selectedChild) return;
    navigation.navigate("StoryPicker", { selectedChild });
  }, [navigation, selectedChild]);
  const personalizedContinueStory = React.useMemo(
    () => (continueEntry?.story ? personalizeStoryForChild(continueEntry.story, selectedChild) : null),
    [continueEntry?.story, selectedChild]
  );
  const continueTitle =
    typeof personalizedContinueStory?.title === "string" && personalizedContinueStory.title.trim()
      ? personalizedContinueStory.title.trim()
      : "your story";
  const selectedCharacterStyle = selectedChild?.gender === "girl" ? "girl" : "boy";
  const continueThumbnail = continueEntry?.storyId
    ? resolveStoryPageIllustrationAsset({
        storyId: continueEntry.storyId,
        pageNumber: 1,
        gender: selectedCharacterStyle,
      })
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainContent}>
          <View style={styles.topBar}>
            <View style={styles.titleBlock}>
              <Text style={styles.appName}>MY STORYBOOK</Text>
              <Text style={styles.title}>Tonight's Storytime</Text>
            </View>
            <Text style={styles.moonAccent}>{"\u{263E}"}</Text>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.subtitle}>
                {selectedChild?.name
                  ? `Pick a story for ${selectedChild.name}`
                  : "Choose who we're reading with, then choose a story."}
              </Text>
              {selectedChild?.name ? (
                <View style={styles.activeChildPill}>
                  <View style={styles.avatarBadge}>
                    <Text style={styles.avatarText}>
                      {selectedChild.name.trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={styles.activeChildText}>
                    {selectedChild.name}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.heroBooks}>
              <View style={[styles.bookSpine, styles.bookSpineTall]} />
              <View style={[styles.bookSpine, styles.bookSpineGold]} />
              <View style={[styles.bookSpine, styles.bookSpineBlue]} />
            </View>
          </View>

          {continueEntry ? (
            <TouchableOpacity style={styles.continueButton} onPress={openContinueReading}>
              <View style={styles.continueCopy}>
                <Text style={styles.sectionLabel}>Continue Reading</Text>
                <Text numberOfLines={2} style={styles.continueTitle}>
                  {continueTitle}
                </Text>
                <Text style={styles.continueMeta}>
                  Page {continueEntry.pageIndex + 1}
                  {continueEntry.totalPages ? ` of ${continueEntry.totalPages}` : ""}
                </Text>
              </View>
              <View style={styles.continueCover}>
                {continueThumbnail ? (
                  <Image source={continueThumbnail} style={styles.continueImage} />
                ) : (
                  <Text style={styles.coverFallback}>Story</Text>
                )}
              </View>
            </TouchableOpacity>
          ) : null}

          <View style={styles.shelfSection}>
            <View style={styles.shelfHeader}>
              <Text style={styles.sectionLabel}>Tonight's Picks</Text>
            </View>
            <View style={styles.bookShelf}>
              {shelfStories.map((story, index) => {
                const imageSource = resolveStoryPageIllustrationAsset({
                  storyId: story.id,
                  pageNumber: 1,
                  gender: selectedCharacterStyle,
                });
                return (
                  <View
                    key={story.id}
                    style={[styles.storyPreview, index === 1 && styles.storyPreviewLifted]}
                  >
                    <View style={styles.storyCover}>
                      {imageSource ? (
                        <Image source={imageSource} style={styles.storyImage} />
                      ) : (
                        <View style={styles.staticCover} />
                      )}
                    </View>
                    <Text numberOfLines={2} style={styles.storyPreviewTitle}>
                      {story.title}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.shelfRail} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.chooseStoryButton,
                !selectedChild ? styles.chooseStoryButtonDisabled : null,
              ]}
              onPress={openStoryCatalog}
              disabled={!selectedChild}
            >
              <Text style={styles.chooseStoryText}>Choose a Story</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manageProfilesButton}
              onPress={() => navigation.navigate("Profiles")}
            >
              <Text style={styles.manageProfilesText}>Manage Kids</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7EFE2",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 42,
  },
  mainContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 44,
    justifyContent: "flex-start",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 12,
  },
  appName: {
    color: "#8B6F3E",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#25283A",
    letterSpacing: 0,
    lineHeight: 34,
  },
  moonAccent: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8DFF3",
    color: "#493B63",
    fontSize: 23,
    lineHeight: 42,
    overflow: "hidden",
    textAlign: "center",
  },
  heroCard: {
    minHeight: 132,
    borderRadius: 28,
    backgroundColor: "#FFF9EE",
    borderWidth: 1,
    borderColor: "#E4D2B8",
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#7A6041",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 5,
  },
  heroTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  subtitle: {
    fontSize: 18,
    color: "#303344",
    fontWeight: "800",
    lineHeight: 24,
    marginBottom: 14,
  },
  activeChildPill: {
    alignSelf: "flex-start",
    maxWidth: "92%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#F0DDAF",
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    gap: 8,
  },
  avatarBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6E5A8A",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  activeChildText: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#493B63",
    letterSpacing: 0,
  },
  heroBooks: {
    width: 68,
    height: 88,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 6,
  },
  bookSpine: {
    width: 16,
    height: 68,
    borderRadius: 6,
    backgroundColor: "#B7A2D8",
  },
  bookSpineTall: {
    height: 84,
    backgroundColor: "#6E5A8A",
  },
  bookSpineGold: {
    height: 74,
    backgroundColor: "#C6A45D",
  },
  bookSpineBlue: {
    height: 60,
    backgroundColor: "#8DAFC3",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#8B6F3E",
    letterSpacing: 0,
  },
  continueButton: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D4B989",
    backgroundColor: "#FFFFFF",
    padding: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#7A6041",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  continueCopy: {
    flex: 1,
    paddingRight: 12,
  },
  continueTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#25283A",
    letterSpacing: 0,
    lineHeight: 24,
    marginTop: 4,
    marginBottom: 6,
  },
  continueMeta: {
    fontSize: 13,
    color: "#5F6477",
    letterSpacing: 0,
    fontWeight: "800",
  },
  continueCover: {
    width: 82,
    height: 96,
    borderRadius: 16,
    backgroundColor: "#E8DFF3",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4D2B8",
  },
  continueImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  coverFallback: {
    flex: 1,
    color: "#493B63",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
    textAlignVertical: "center",
  },
  shelfSection: {
    marginBottom: 16,
  },
  shelfHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 10,
  },
  bookShelf: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  storyPreview: {
    width: "31%",
  },
  storyPreviewLifted: {
    marginBottom: 8,
  },
  storyCover: {
    aspectRatio: 0.76,
    borderRadius: 16,
    backgroundColor: "#E8DFF3",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4D2B8",
    shadowColor: "#7A6041",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  storyImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  staticCover: {
    flex: 1,
    backgroundColor: "#B7A2D8",
  },
  storyPreviewTitle: {
    color: "#303344",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 15,
    marginTop: 7,
  },
  shelfRail: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#D4B989",
    marginTop: 7,
    marginHorizontal: 6,
  },
  actions: {
    marginTop: 2,
    paddingBottom: 18,
  },
  chooseStoryButton: {
    backgroundColor: "#493B63",
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#4C3C62",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 6,
  },
  chooseStoryButtonDisabled: {
    backgroundColor: "#CFC4B5",
    borderWidth: 1,
    borderColor: "#C2B39F",
    shadowOpacity: 0,
    elevation: 0,
  },
  manageProfilesButton: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DED0BD",
    backgroundColor: "#FFFCF4",
  },
  manageProfilesText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#493B63",
    letterSpacing: 0,
  },
  chooseStoryText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0,
  },
});
