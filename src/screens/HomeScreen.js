import React from "react";
import {
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
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to My Storybook {"\u{1F4D6}"}</Text>
            <Text style={styles.subtitle}>
              {selectedChild?.name
                ? `${selectedChild.name}, ready for a bedtime story?`
                : "Choose who we're reading with, then choose a story."}
            </Text>
            {selectedChild?.name ? (
              <Text style={styles.activeChildText}>Active child: {selectedChild.name}</Text>
            ) : null}
          </View>

          {continueEntry ? (
            <TouchableOpacity style={styles.continueButton} onPress={openContinueReading}>
              <Text numberOfLines={1} style={styles.continueTitle}>
                Continue {continueTitle}
              </Text>
              <Text style={styles.continueMeta}>Page {continueEntry.pageIndex + 1}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.manageProfilesButton}
            onPress={() => navigation.navigate("Profiles")}
          >
            <Text style={styles.manageProfilesText}>Manage Kids</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chooseStoryButton,
              continueEntry ? styles.chooseStoryButtonSecondary : null,
            ]}
            onPress={openStoryCatalog}
            disabled={!selectedChild}
          >
            <Text
              style={[
                styles.chooseStoryText,
                continueEntry ? styles.chooseStoryTextSecondary : null,
              ]}
            >
              Choose a Story
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F1633",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  mainContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: "flex-start",
  },
  header: {
    marginBottom: 48,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F5F3FF",
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: "rgba(167,139,250,0.4)",
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(245,243,255,0.7)",
    fontWeight: "500",
  },
  activeChildText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#DCD2F3",
    letterSpacing: 0.2,
  },
  continueButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.24)",
    backgroundColor: "rgba(74,59,114,0.84)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F4F1FF",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  continueMeta: {
    fontSize: 12,
    color: "#D8CEE9",
    opacity: 0.86,
    letterSpacing: 0.15,
    fontWeight: "600",
  },
  chooseStoryButton: {
    backgroundColor: "#A78BFA",
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  chooseStoryButtonSecondary: {
    backgroundColor: "rgba(80,65,120,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.2)",
    shadowOpacity: 0.2,
    elevation: 4,
  },
  manageProfilesButton: {
    alignSelf: "center",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.22)",
    backgroundColor: "rgba(47,35,79,0.55)",
  },
  manageProfilesText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E5DCF7",
    letterSpacing: 0.2,
  },
  chooseStoryText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F1633",
  },
  chooseStoryTextSecondary: {
    color: "#F1ECFC",
  },
});
