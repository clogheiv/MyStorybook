import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SectionList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function StoryPickerScreen({ navigation, route }) {
  const selectedChild = route?.params?.selectedChild;
  const [progressByStory, setProgressByStory] = React.useState({});
  const [lastOpenedAtByStory, setLastOpenedAtByStory] = React.useState({});

  // Configure subtle header with back arrow
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerStyle: {
        backgroundColor: "#241A3A",
        borderBottomWidth: 0,
        elevation: 0,
      },
      headerTintColor: "#F4F1FF",
      headerBackTitle: " ",
    });
  }, [navigation]);

  const stories = React.useMemo(() => {
    const baseStories = [
      { id: "1", title: "The Brave Little Turtle" },
      { id: "2", title: "Rocket Dog to the Rescue" },
      { id: "3", title: "Emma and the Moon Garden" },
      { id: "4", title: "Noah's Secret Treehouse" },
      { id: "5", title: "The Library of Laughing Clouds" },
    ];

    // Treat existing list order as creation order fallback.
    return baseStories.map((story, index) => ({
      ...story,
      createdAtOrder: baseStories.length - index,
    }));
  }, []);

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
        stories.map(async (story) => {
          const key = `readerProgress:${story.id}:${childId}`;
          const raw = await AsyncStorage.getItem(key);
          return { storyId: story.id, raw };
        })
      );

      const nextProgress = {};
      const nextLastOpenedAt = {};
      entries.forEach(({ storyId, raw }) => {
        if (!raw) return;

        try {
          const parsed = JSON.parse(raw);
          const savedPageIndex = Number(parsed?.pageIndex);
          if (Number.isFinite(savedPageIndex) && savedPageIndex >= 0) {
            nextProgress[storyId] = Math.floor(savedPageIndex);
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
      setLastOpenedAtByStory(nextLastOpenedAt);
    } catch {
      setProgressByStory({});
      setLastOpenedAtByStory({});
    }
  }, [stories, childId]);

  useFocusEffect(
    React.useCallback(() => {
      loadProgress();
      return undefined;
    }, [loadProgress])
  );

  const openStory = (story) => {
    navigation.navigate("StoryDetails", {
      story,
      selectedChild,
    });
  };

  const sortedStories = React.useMemo(() => {
    return [...stories].sort((a, b) => {
      const lastOpenedA = Number(lastOpenedAtByStory[a.id]);
      const lastOpenedB = Number(lastOpenedAtByStory[b.id]);
      const hasA = Number.isFinite(lastOpenedA);
      const hasB = Number.isFinite(lastOpenedB);

      if (hasA && hasB) return lastOpenedB - lastOpenedA;
      if (hasA) return -1;
      if (hasB) return 1;

      return (b.createdAtOrder || 0) - (a.createdAtOrder || 0);
    });
  }, [stories, lastOpenedAtByStory]);

  const continueStories = React.useMemo(
    () => sortedStories.filter((story) => Number(progressByStory[story.id]) > 0),
    [sortedStories, progressByStory]
  );

  const sections = React.useMemo(() => {
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
      data: sortedStories.map((story) => ({ key: `all:${story.id}`, story })),
    });

    return nextSections;
  }, [continueStories, sortedStories]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Choose a story for {selectedChild || "them"}
      </Text>
      <Text style={styles.subtitle}>Pick tonight's story</Text>

      <SectionList
        sections={sections}
        style={styles.list}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
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
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openStory(item.story)}
            style={styles.storyCard}
          >
            <Text style={styles.storyTitle}>{"\u{1F4D6} "}{item.story.title}</Text>
            {Number.isFinite(progressByStory[item.story.id]) && progressByStory[item.story.id] > 0 && (
              <Text style={styles.lastReadText}>
                Continue reading {"\u2022"} Page {progressByStory[item.story.id] + 1}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#241A3A",
    padding: 20,
    paddingTop: 24,
  },
  header: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F4F1FF",
    marginBottom: 8,
    opacity: 0.9,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#F4F1FF",
    marginBottom: 24,
    opacity: 0.75,
    letterSpacing: 0.2,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#CFC5E5",
    opacity: 0.72,
    letterSpacing: 0.2,
  },
  sectionHeaderFirst: {
    marginBottom: 10,
  },
  sectionHeaderDefault: {
    marginTop: 8,
    marginBottom: 10,
  },
  storyCard: {
    backgroundColor: "#2F234F",
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 20,
    borderColor: "rgba(255,230,180,0.12)",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F4F1FF",
    letterSpacing: 0.2,
  },
  lastReadText: {
    marginTop: 7,
    fontSize: 12,
    fontWeight: "500",
    color: "#CFC5E5",
    opacity: 0.75,
    letterSpacing: 0.15,
  },
});
