import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  TextInput,
  Modal,
  Pressable,
  Alert,
  FlatList,
  Animated,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadStoryCatalog, catalogStoryById, personalizeStoryForChild } from "../data/storyCatalog";
import { resolveStoryPageIllustrationAsset } from "../data/localIllustrations";

const STORY_LIBRARY_STORAGE_KEY = "storyLibrary:v1";
const CHILD_NAME_PLACEHOLDER = "{{childName}}";
const CHILD_NAME_PLACEHOLDER_PATTERN = /{{\s*(childName|child['’]s name)\s*}}/gi;
const DEFAULT_STORIES = loadStoryCatalog();
const CATALOG_BY_ID = catalogStoryById();
const COMING_SOON_TITLES = [
  "{{childName}} Goes to the Aquarium",
  "{{childName}} Visits the Fire Station",
  "{{childName}}'s Big Day at the Museum",
  "{{childName}} Goes to the State Fair",
];

const normalizeStories = (inputStories) => {
  if (!Array.isArray(inputStories)) return [];

  return inputStories
    .map((story, index) => {
      if (!story || typeof story !== "object") return null;

      const rawId = story.id != null ? String(story.id).trim() : "";
      const rawTitle = typeof story.title === "string" ? story.title.trim() : "";
      if (!rawId || !rawTitle) return null;
      if (!CATALOG_BY_ID.has(rawId)) return null;

      const numericCreatedAt = Number(story.createdAt);
      const createdAt = Number.isFinite(numericCreatedAt)
        ? numericCreatedAt
        : 1704067200000 + index * 86400000;
      const catalogStory = CATALOG_BY_ID.get(rawId);

      return {
        ...story,
        ...(catalogStory || {}),
        id: rawId,
        title: rawTitle,
        createdAt,
      };
    })
    .filter(Boolean);
};

const normalizeDeletedStories = (inputStories) => {
  if (!Array.isArray(inputStories)) return [];

  return inputStories
    .map((story, index) => {
      if (!story || typeof story !== "object") return null;

      const rawId = story.id != null ? String(story.id).trim() : "";
      const rawTitle = typeof story.title === "string" ? story.title.trim() : "";
      if (!rawId || !rawTitle) return null;
      if (!CATALOG_BY_ID.has(rawId)) return null;

      const numericCreatedAt = Number(story.createdAt);
      const createdAt = Number.isFinite(numericCreatedAt)
        ? numericCreatedAt
        : 1704067200000 + index * 86400000;
      const numericDeletedAt = Number(story.deletedAt);
      const deletedAt = Number.isFinite(numericDeletedAt) && numericDeletedAt > 0
        ? numericDeletedAt
        : Date.now() - index;

      return {
        ...story,
        id: rawId,
        title: rawTitle,
        createdAt,
        deletedAt,
      };
    })
    .filter(Boolean);
};

const mergeCatalogStories = (activeStories) => {
  const safeActiveStories = Array.isArray(activeStories) ? activeStories : [];
  const activeIds = new Set(safeActiveStories.map((story) => String(story.id)));

  const missingCatalogStories = DEFAULT_STORIES.filter(
    (catalogStory) => !activeIds.has(String(catalogStory.id))
  );

  return [...safeActiveStories, ...missingCatalogStories];
};

const normalizeLibraryState = (storedValue) => {
  if (Array.isArray(storedValue)) {
    const activeStories = normalizeStories(storedValue);
    return {
      activeStories: mergeCatalogStories(activeStories),
      deletedStories: [],
    };
  }

  if (storedValue && typeof storedValue === "object") {
    const activeStories = normalizeStories(storedValue.activeStories);
    const deletedStories = normalizeDeletedStories(storedValue.deletedStories);
    return {
      activeStories: mergeCatalogStories(activeStories),
      deletedStories,
    };
  }

  return {
    activeStories: [...DEFAULT_STORIES],
    deletedStories: [],
  };
};

const personalizeComingSoonTitle = (title, childName) => {
  if (typeof title !== "string") return "";
  if (!childName || typeof childName !== "string") return title;
  return title.replace(CHILD_NAME_PLACEHOLDER_PATTERN, childName);
};

export default function StoryPickerScreen({ navigation, route }) {
  const selectedChild = route?.params?.selectedChild;
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
  const [activeStories, setActiveStories] = React.useState(DEFAULT_STORIES);
  const [deletedStories, setDeletedStories] = React.useState([]);
  const [storiesHydrated, setStoriesHydrated] = React.useState(false);
  const [progressByStory, setProgressByStory] = React.useState({});
  const [progressTotalPagesByStory, setProgressTotalPagesByStory] = React.useState({});
  const [lastOpenedAtByStory, setLastOpenedAtByStory] = React.useState({});
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortMode, setSortMode] = React.useState("recent");
  const [actionsVisible, setActionsVisible] = React.useState(false);
  const [renameVisible, setRenameVisible] = React.useState(false);
  const [deletedVisible, setDeletedVisible] = React.useState(false);
  const [activeStoryId, setActiveStoryId] = React.useState(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [undoStoryId, setUndoStoryId] = React.useState(null);
  const undoFadeAnim = React.useRef(new Animated.Value(0)).current;
  const undoTimerRef = React.useRef(null);

  // Configure subtle header with back arrow
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerStyle: {
        backgroundColor: "#F7EFE2",
        borderBottomWidth: 0,
        elevation: 0,
      },
      headerTintColor: "#25283A",
      headerBackTitle: " ",
    });
  }, [navigation]);

  React.useEffect(() => {
    let cancelled = false;

    const hydrateStories = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORY_LIBRARY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const normalized = normalizeLibraryState(parsed);
          if (!cancelled) {
            setActiveStories(normalized.activeStories);
            setDeletedStories(normalized.deletedStories);
          }
        } else if (!cancelled) {
          setActiveStories(DEFAULT_STORIES);
          setDeletedStories([]);
        }
      } catch {
        if (!cancelled) {
          setActiveStories(DEFAULT_STORIES);
          setDeletedStories([]);
        }
      } finally {
        if (!cancelled) {
          setStoriesHydrated(true);
        }
      }
    };

    hydrateStories();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!storiesHydrated) return;
    AsyncStorage.setItem(
      STORY_LIBRARY_STORAGE_KEY,
      JSON.stringify({
        activeStories,
        deletedStories,
      })
    ).catch(() => {});
  }, [activeStories, deletedStories, storiesHydrated]);

  const childId = React.useMemo(() => {
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
  }, [selectedChild]);

  const loadProgress = React.useCallback(async () => {
    try {
      const entries = await Promise.all(
        activeStories.map(async (story) => {
          const key = `readerProgress:${childId}:${story.id}`;
          const raw = await AsyncStorage.getItem(key);
          return { storyId: story.id, raw };
        })
      );

      const nextProgress = {};
      const nextProgressTotalPages = {};
      const nextLastOpenedAt = {};
      entries.forEach(({ storyId, raw }) => {
        if (!raw) return;

        try {
          const parsed = JSON.parse(raw);
          const savedPageIndex = Number(parsed?.pageIndex);
          if (Number.isFinite(savedPageIndex) && savedPageIndex >= 0) {
            nextProgress[storyId] = Math.floor(savedPageIndex);
          }
          const savedTotalPages = Number(parsed?.totalPages);
          if (Number.isFinite(savedTotalPages) && savedTotalPages > 0) {
            nextProgressTotalPages[storyId] = Math.floor(savedTotalPages);
          }

          const savedLastOpenedAt = Number(parsed?.lastOpenedAt ?? parsed?.lastReadAt);
          if (Number.isFinite(savedLastOpenedAt) && savedLastOpenedAt > 0) {
            nextLastOpenedAt[storyId] = savedLastOpenedAt;
          }
        } catch {
          // Ignore malformed progress entries.
        }
      });

      setProgressByStory(nextProgress);
      setProgressTotalPagesByStory(nextProgressTotalPages);
      setLastOpenedAtByStory(nextLastOpenedAt);
    } catch {
      setProgressByStory({});
      setProgressTotalPagesByStory({});
      setLastOpenedAtByStory({});
    }
  }, [activeStories, childId]);

  useFocusEffect(
    React.useCallback(() => {
      loadProgress();
      return undefined;
    }, [loadProgress])
  );

  const activeStory = React.useMemo(
    () => activeStories.find((story) => story.id === activeStoryId) || null,
    [activeStories, activeStoryId]
  );

  const openStory = (story) => {
    navigation.navigate("StoryDetails", {
      story,
      selectedChild,
    });
  };

  const openStoryActions = (story) => {
    setActiveStoryId(story.id);
    setRenameValue(story.title);
    setActionsVisible(true);
  };

  const closeStoryActions = () => {
    setActionsVisible(false);
  };

  const clearUndoTimer = React.useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const hideUndoSnackbar = React.useCallback((clearStory = true) => {
    clearUndoTimer();
    Animated.timing(undoFadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      if (clearStory) {
        setUndoStoryId(null);
      }
    });
  }, [clearUndoTimer, undoFadeAnim]);

  const showUndoSnackbar = React.useCallback((storyId) => {
    clearUndoTimer();
    setUndoStoryId(storyId);
    Animated.timing(undoFadeAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    undoTimerRef.current = setTimeout(() => {
      hideUndoSnackbar(true);
    }, 5000);
  }, [clearUndoTimer, hideUndoSnackbar, undoFadeAnim]);

  const beginRenameStory = () => {
    if (!activeStory) return;
    setRenameValue(activeStory.title);
    setActionsVisible(false);
    setRenameVisible(true);
  };

  const saveRenameStory = () => {
    if (!activeStory) return;

    const nextTitle = renameValue.trim();
    if (!nextTitle) return;

    setActiveStories((prev) =>
      prev.map((story) =>
        story.id === activeStory.id
          ? { ...story, title: nextTitle }
          : story
      )
    );
    setRenameVisible(false);
  };

  const duplicateStory = () => {
    if (!activeStory) return;

    const now = Date.now();
    const duplicate = {
      ...activeStory,
      id: `${activeStory.id}-copy-${now}`,
      title: `${activeStory.title} (Copy)`,
      createdAt: now,
    };

    setActiveStories((prev) => [duplicate, ...prev]);
    setActionsVisible(false);
  };

  const deleteStory = () => {
    if (!activeStory) return;
    setActionsVisible(false);

    Alert.alert(
      "Delete story?",
      `Move "${activeStory.title}" to Recently Deleted?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const deletedAt = Date.now();
            setActiveStories((prev) => prev.filter((story) => story.id !== activeStory.id));
            setDeletedStories((prev) => [
              { ...activeStory, deletedAt },
              ...prev.filter((story) => story.id !== activeStory.id),
            ]);
            showUndoSnackbar(activeStory.id);
            setActiveStoryId(null);
          },
        },
      ]
    );
  };

  const restoreDeletedStory = React.useCallback((storyId) => {
    setDeletedStories((prevDeleted) => {
      const target = prevDeleted.find((story) => story.id === storyId);
      if (!target) return prevDeleted;

      const restoredStory = { ...target };
      delete restoredStory.deletedAt;
      setActiveStories((prevActive) => {
        const withoutDuplicate = prevActive.filter((story) => story.id !== storyId);
        return [restoredStory, ...withoutDuplicate];
      });
      return prevDeleted.filter((story) => story.id !== storyId);
    });
  }, []);

  const handleUndoDelete = React.useCallback(() => {
    if (!undoStoryId) return;
    restoreDeletedStory(undoStoryId);
    hideUndoSnackbar(true);
  }, [hideUndoSnackbar, restoreDeletedStory, undoStoryId]);

  React.useEffect(() => {
    return () => {
      clearUndoTimer();
    };
  }, [clearUndoTimer]);

  const deleteStoryForever = (story) => {
    Alert.alert(
      "Delete forever?",
      `Permanently delete "${story.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: () => {
            if (undoStoryId === story.id) {
              hideUndoSnackbar(true);
            }
            setDeletedStories((prev) => prev.filter((item) => item.id !== story.id));
            setProgressByStory((prev) => {
              const next = { ...prev };
              delete next[story.id];
              return next;
            });
            setLastOpenedAtByStory((prev) => {
              const next = { ...prev };
              delete next[story.id];
              return next;
            });
            AsyncStorage.removeItem(`readerProgress:${childId}:${story.id}`).catch(() => {});
          },
        },
      ]
    );
  };

  const sortedStories = React.useMemo(() => {
    return [...activeStories].sort((a, b) => {
      if (sortMode === "az") {
        return String(a.title || "").localeCompare(String(b.title || ""), undefined, {
          sensitivity: "base",
        });
      }

      const lastOpenedA = Number(lastOpenedAtByStory[a.id]);
      const lastOpenedB = Number(lastOpenedAtByStory[b.id]);
      const hasA = Number.isFinite(lastOpenedA);
      const hasB = Number.isFinite(lastOpenedB);

      if (hasA && hasB) return lastOpenedB - lastOpenedA;
      if (hasA) return -1;
      if (hasB) return 1;

      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });
  }, [activeStories, lastOpenedAtByStory, sortMode]);

  const sortedDeletedStories = React.useMemo(
    () => [...deletedStories].sort((a, b) => Number(b.deletedAt || 0) - Number(a.deletedAt || 0)),
    [deletedStories]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const displayQuery = searchQuery.trim();
  const filteredStories = React.useMemo(
    () =>
      sortedStories.filter((story) =>
        String(story.title || "").toLowerCase().includes(normalizedQuery)
      ),
    [sortedStories, normalizedQuery]
  );
  const isSearching = normalizedQuery.length > 0;

  const continueStories = React.useMemo(
    () => filteredStories.filter((story) => Number(progressByStory[story.id]) > 0),
    [filteredStories, progressByStory]
  );
  const comingSoonStories = React.useMemo(
    () =>
      COMING_SOON_TITLES.map((title, index) => ({
        key: `coming-soon:${index + 1}`,
        title: personalizeComingSoonTitle(title, childDisplayName),
        isComingSoon: true,
      })),
    [childDisplayName]
  );

  const sections = React.useMemo(() => {
    if (isSearching) {
      return [
        {
          key: "results",
          title: "Results",
          data: filteredStories.map((story) => ({ key: `results:${story.id}`, story })),
        },
      ];
    }

    const nextSections = [];
    if (continueStories.length > 0) {
      nextSections.push({
        key: "continue",
        title: "Continue Reading",
        data: continueStories.map((story) => ({ key: `continue:${story.id}`, story })),
      });
    }
    nextSections.push({
      key: "all",
      title: "All Stories",
      data: filteredStories.map((story) => ({ key: `all:${story.id}`, story })),
    });
    nextSections.push({
      key: "comingSoon",
      title: "Coming Soon",
      data: comingSoonStories,
    });
    return nextSections
      .map((section) => ({
        ...section,
        data: section.data.filter((item) => !item?.isComingSoon),
      }))
      .filter((section) => section.data.length > 0);
  }, [isSearching, continueStories, filteredStories, comingSoonStories]);

  const isLibraryEmpty = storiesHydrated && sortedStories.length === 0;
  const isSearchEmpty = isSearching && filteredStories.length === 0;
  const showRecentlyDeletedEntry = !isSearching && deletedStories.length > 0;
  const selectedCharacterStyle = selectedChild?.gender === "girl" ? "girl" : "boy";

  React.useEffect(() => {
    console.log("[StoryPicker] catalog length", DEFAULT_STORIES.length);
    console.log("[StoryPicker] filtered story count", filteredStories.length);
    console.log("[StoryPicker] selected child", selectedChild);
  }, [filteredStories.length, selectedChild]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainContent}>
          <View style={styles.headerCard}>
            <Text style={styles.eyebrow}>Story Library</Text>
            <Text style={styles.header}>Complete Story List</Text>
            <Text style={styles.subtitle}>
              Find the perfect story for {childDisplayName || "tonight"}
            </Text>
          </View>

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search stories"
            placeholderTextColor="#8B8292"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />

          <View style={styles.sortRow}>
            <Text style={styles.sortLabel}>Sort</Text>
            <View style={styles.sortToggleGroup}>
              <TouchableOpacity
                onPress={() => setSortMode("recent")}
                style={[styles.sortToggleButton, sortMode === "recent" && styles.sortToggleButtonActive]}
              >
                <Text style={[styles.sortToggleText, sortMode === "recent" && styles.sortToggleTextActive]}>
                  Recent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSortMode("az")}
                style={[styles.sortToggleButton, sortMode === "az" && styles.sortToggleButtonActive]}
              >
                <Text style={[styles.sortToggleText, sortMode === "az" && styles.sortToggleTextActive]}>
                  A-Z
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {isLibraryEmpty ? (
            <View style={styles.emptyStateWrap}>
              <Text style={styles.emptyTitle}>Choose a story to begin your bedtime adventure.</Text>
              <Text style={styles.emptySubtitle}>
                Pick a story and start reading.
              </Text>
              {deletedStories.length > 0 && (
                <TouchableOpacity
                  style={styles.emptyRecentlyDeletedButton}
                  onPress={() => setDeletedVisible(true)}
                >
                  <Text style={styles.emptyRecentlyDeletedText}>
                    Recently Deleted ({deletedStories.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : isSearchEmpty ? (
            <View style={styles.emptyStateWrap}>
              <Text style={styles.emptyTitle}>No matches</Text>
              <Text style={styles.emptySubtitle}>
                No stories found for "{displayQuery}"
              </Text>
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Text style={styles.clearSearchText}>Clear search</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <SectionList
                sections={sections}
                style={styles.list}
                scrollEnabled={false}
                keyExtractor={(item) => item.key}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={
                  showRecentlyDeletedEntry ? (
                    <TouchableOpacity
                      style={styles.recentlyDeletedRow}
                      onPress={() => setDeletedVisible(true)}
                    >
                      <Text style={styles.recentlyDeletedText}>
                        Recently Deleted ({deletedStories.length})
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.listFooterSpacer} />
                  )
                }
                renderSectionHeader={({ section }) => (
                  <Text
                    style={[
                      styles.sectionHeader,
                      section.key === "continue" ? styles.sectionHeaderFirst : styles.sectionHeaderDefault,
                    ]}
                  >
                    {section.title}
                  </Text>
                )}
                renderItem={({ item }) => {
                  if (item?.isComingSoon) {
                    return (
                      <View style={[styles.storyCard, styles.comingSoonCard]}>
                        <Text style={[styles.storyTitle, styles.comingSoonTitle]}>
                          {"\u{1F4D6} "}{item.title}
                        </Text>
                      </View>
                    );
                  }

                  const savedPageIndex = Number(progressByStory[item.story.id]);
                  const hasProgress = Number.isFinite(savedPageIndex) && savedPageIndex >= 0;
                  const savedTotalPages = Number(progressTotalPagesByStory[item.story.id]);
                  const fallbackTotalPages = Array.isArray(item.story?.pages)
                    ? item.story.pages.length
                    : 0;
                  const totalPagesForStory = Number.isFinite(savedTotalPages) && savedTotalPages > 0
                    ? savedTotalPages
                    : fallbackTotalPages;
                  const progressPercent = hasProgress && totalPagesForStory > 0
                    ? (Math.floor(savedPageIndex) + 1) / totalPagesForStory
                    : null;
                  const progressStatus = !hasProgress
                    ? null
                    : Number.isFinite(progressPercent) && progressPercent >= 1
                    ? "Finished"
                    : "In progress";
                  const displayStory = personalizeStoryForChild(item.story, selectedChild);
                  const imageSource = resolveStoryPageIllustrationAsset({
                    storyId: item.story.id,
                    pageNumber: 1,
                    gender: selectedCharacterStyle,
                  });

                  return (
                    <TouchableOpacity
                      onPress={() => openStory(item.story)}
                      onLongPress={() => openStoryActions(item.story)}
                      delayLongPress={280}
                      style={styles.storyCard}
                    >
                      <View style={styles.storyCover}>
                        {imageSource ? (
                          <Image source={imageSource} style={styles.storyImage} />
                        ) : (
                          <Text style={styles.storyCoverFallback}>Story</Text>
                        )}
                      </View>
                      <View style={styles.storyCopy}>
                        <Text style={styles.storyTitle}>{displayStory.title}</Text>
                        {progressStatus ? (
                          <Text style={styles.progressStatusText}>{progressStatus}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={deletedVisible}
        onRequestClose={() => setDeletedVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDeletedVisible(false)}>
          <Pressable style={styles.deletedSheet} onPress={() => {}}>
            <View style={styles.deletedSheetHeader}>
              <Text style={styles.deletedSheetTitle}>Recently Deleted</Text>
              <TouchableOpacity onPress={() => setDeletedVisible(false)}>
                <Text style={styles.deletedSheetClose}>Close</Text>
              </TouchableOpacity>
            </View>
            {sortedDeletedStories.length === 0 ? (
              <Text style={styles.deletedEmptyText}>No deleted stories.</Text>
            ) : (
              <FlatList
                data={sortedDeletedStories}
                keyExtractor={(item) => `deleted:${item.id}`}
                renderItem={({ item }) => (
                  <View style={styles.deletedItemRow}>
                    <Text numberOfLines={1} style={styles.deletedItemTitle}>
                      {item.title}
                    </Text>
                    <View style={styles.deletedItemActions}>
                      <TouchableOpacity
                        style={styles.deletedActionButton}
                        onPress={() => restoreDeletedStory(item.id)}
                      >
                        <Text style={styles.deletedActionText}>Restore</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deletedActionButton}
                        onPress={() => deleteStoryForever(item)}
                      >
                        <Text style={styles.deletedActionDangerText}>Delete Forever</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                contentContainerStyle={styles.deletedListContent}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={actionsVisible}
        onRequestClose={closeStoryActions}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeStoryActions}>
          <Pressable style={styles.actionSheet} onPress={() => {}}>
            <Text style={styles.actionSheetTitle}>{activeStory?.title || "Story"}</Text>
            <TouchableOpacity style={styles.actionSheetItem} onPress={beginRenameStory}>
              <Text style={styles.actionSheetItemText}>Rename story</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionSheetItem} onPress={duplicateStory}>
              <Text style={styles.actionSheetItemText}>Duplicate story</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionSheetItem} onPress={deleteStory}>
              <Text style={styles.actionSheetDeleteText}>Delete story</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionSheetCancel} onPress={closeStoryActions}>
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={renameVisible}
        onRequestClose={() => setRenameVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setRenameVisible(false)}>
          <Pressable style={styles.renameModal} onPress={() => {}}>
            <Text style={styles.renameTitle}>Rename story</Text>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              style={styles.renameInput}
              placeholder="Story title"
              placeholderTextColor="rgba(244,241,255,0.52)"
              autoFocus
              autoCapitalize="sentences"
              autoCorrect
              returnKeyType="done"
              onSubmitEditing={saveRenameStory}
            />
            <View style={styles.renameActions}>
              <TouchableOpacity
                style={styles.renameSecondaryButton}
                onPress={() => setRenameVisible(false)}
              >
                <Text style={styles.renameSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.renamePrimaryButton,
                  !renameValue.trim() && styles.renamePrimaryButtonDisabled,
                ]}
                disabled={!renameValue.trim()}
                onPress={saveRenameStory}
              >
                <Text style={styles.renamePrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {undoStoryId ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.undoSnackbarWrap,
            {
              opacity: undoFadeAnim,
              transform: [
                {
                  translateY: undoFadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.undoSnackbar}>
            <Text style={styles.undoSnackbarText}>Moved to Recently Deleted</Text>
            <TouchableOpacity onPress={handleUndoDelete} style={styles.undoActionButton}>
              <Text style={styles.undoActionText}>UNDO</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : null}
    </View>
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
    paddingBottom: 48,
  },
  mainContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 44,
  },
  headerCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#E4D2B8",
    backgroundColor: "#FFF9EE",
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginBottom: 16,
    shadowColor: "#7A6041",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  eyebrow: {
    color: "#8B6F3E",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    marginBottom: 5,
  },
  header: {
    fontSize: 30,
    fontWeight: "900",
    color: "#25283A",
    marginBottom: 6,
    letterSpacing: 0,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#51566C",
    lineHeight: 22,
    letterSpacing: 0,
  },
  searchInput: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E4D2B8",
    backgroundColor: "#FFFCF4",
    color: "#25283A",
    paddingHorizontal: 15,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
    shadowColor: "#7A6041",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 12,
    color: "#8B6F3E",
    letterSpacing: 0,
    fontWeight: "900",
  },
  sortToggleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sortToggleButton: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DED0BD",
    backgroundColor: "#FFFCF4",
  },
  sortToggleButtonActive: {
    borderColor: "#C9B2E5",
    backgroundColor: "#E8DFF3",
  },
  sortToggleText: {
    fontSize: 12,
    color: "#51566C",
    letterSpacing: 0,
    fontWeight: "800",
  },
  sortToggleTextActive: {
    color: "#493B63",
  },
  list: {
    width: "100%",
  },
  listContent: {
    paddingBottom: 36,
  },
  listFooterSpacer: {
    height: 8,
  },
  recentlyDeletedRow: {
    marginTop: 2,
    marginBottom: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  recentlyDeletedText: {
    fontSize: 12,
    color: "#8B6F3E",
    letterSpacing: 0,
    fontWeight: "800",
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "900",
    color: "#8B6F3E",
    letterSpacing: 0,
  },
  sectionHeaderFirst: {
    marginBottom: 10,
  },
  sectionHeaderDefault: {
    marginTop: 8,
    marginBottom: 10,
  },
  storyCard: {
    backgroundColor: "#FFFCF4",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderColor: "#E4D2B8",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#7A6041",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  storyCover: {
    width: 68,
    height: 82,
    borderRadius: 16,
    backgroundColor: "#E8DFF3",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4D2B8",
    marginRight: 13,
  },
  storyImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  storyCoverFallback: {
    flex: 1,
    color: "#493B63",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    textAlignVertical: "center",
  },
  storyCopy: {
    flex: 1,
    minWidth: 0,
  },
  storyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#25283A",
    letterSpacing: 0,
    lineHeight: 22,
  },
  comingSoonCard: {
    opacity: 0.72,
  },
  comingSoonTitle: {
    color: "#51566C",
  },
  progressStatusText: {
    marginTop: 7,
    fontSize: 12,
    fontWeight: "800",
    color: "#8B6F3E",
    letterSpacing: 0,
  },
  emptyStateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#25283A",
    letterSpacing: 0,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#51566C",
    letterSpacing: 0,
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 20,
  },
  emptyActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.2)",
    backgroundColor: "rgba(47,35,79,0.5)",
  },
  emptyRecentlyDeletedButton: {
    marginBottom: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  emptyRecentlyDeletedText: {
    fontSize: 12,
    color: "#CFC5E5",
    opacity: 0.86,
    letterSpacing: 0.15,
    fontWeight: "600",
  },
  emptyActionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F4F1FF",
    opacity: 0.92,
    letterSpacing: 0.2,
  },
  clearSearchText: {
    fontSize: 12,
    color: "#493B63",
    letterSpacing: 0,
    fontWeight: "900",
  },
  undoSnackbarWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  undoSnackbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(42,33,66,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.12)",
  },
  undoSnackbarText: {
    flex: 1,
    fontSize: 12,
    color: "#DCCFEF",
    letterSpacing: 0.15,
    marginRight: 10,
  },
  undoActionButton: {
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  undoActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F4F1FF",
    letterSpacing: 0.25,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "flex-end",
    padding: 16,
  },
  deletedSheet: {
    maxHeight: "65%",
    backgroundColor: "#2A2142",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.14)",
  },
  deletedSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  deletedSheetTitle: {
    color: "#F4F1FF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
  deletedSheetClose: {
    color: "#CFC5E5",
    fontSize: 12,
    opacity: 0.86,
    letterSpacing: 0.2,
  },
  deletedListContent: {
    paddingBottom: 2,
  },
  deletedEmptyText: {
    color: "#CFC5E5",
    opacity: 0.76,
    fontSize: 12,
    paddingVertical: 12,
  },
  deletedItemRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,230,180,0.08)",
  },
  deletedItemTitle: {
    color: "#F4F1FF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.15,
  },
  deletedItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deletedActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.16)",
    backgroundColor: "rgba(47,35,79,0.45)",
  },
  deletedActionText: {
    color: "#F4F1FF",
    fontSize: 12,
    opacity: 0.9,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
  deletedActionDangerText: {
    color: "#F4B7B7",
    fontSize: 12,
    opacity: 0.95,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
  actionSheet: {
    backgroundColor: "#2A2142",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.14)",
  },
  actionSheetTitle: {
    color: "#F4F1FF",
    opacity: 0.85,
    fontSize: 12,
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  actionSheetItem: {
    paddingVertical: 12,
  },
  actionSheetItemText: {
    color: "#F4F1FF",
    fontSize: 14,
    opacity: 0.92,
  },
  actionSheetDeleteText: {
    color: "#F4B7B7",
    fontSize: 14,
    opacity: 0.92,
  },
  actionSheetCancel: {
    marginTop: 6,
    paddingVertical: 10,
    alignItems: "flex-start",
  },
  actionSheetCancelText: {
    color: "#CFC5E5",
    fontSize: 13,
    opacity: 0.9,
  },
  renameModal: {
    marginHorizontal: 10,
    marginBottom: 180,
    backgroundColor: "#2A2142",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.14)",
  },
  renameTitle: {
    color: "#F4F1FF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  renameInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.18)",
    backgroundColor: "rgba(47,35,79,0.55)",
    color: "#F4F1FF",
    paddingHorizontal: 10,
    fontSize: 14,
  },
  renameActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  renameSecondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.14)",
  },
  renameSecondaryText: {
    fontSize: 12,
    color: "#CFC5E5",
    fontWeight: "600",
  },
  renamePrimaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.3)",
    backgroundColor: "rgba(47,35,79,0.75)",
  },
  renamePrimaryButtonDisabled: {
    opacity: 0.45,
  },
  renamePrimaryText: {
    fontSize: 12,
    color: "#F4F1FF",
    fontWeight: "700",
    letterSpacing: 0.15,
  },
});
