import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { personalizeStoryForChild } from "../data/storyCatalog";

export default function StoryDetailsScreen({ navigation, route }) {
  const { story, selectedChild } = route?.params || {};
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
  const [artStyle, setArtStyle] = useState(
    typeof story?.artStyle === "string" && story.artStyle.trim()
      ? story.artStyle
      : "magical"
  );
  const [resumePageIndex, setResumePageIndex] = useState(null);

  React.useEffect(() => {
    if (typeof story?.artStyle === "string" && story.artStyle.trim()) {
      setArtStyle(story.artStyle);
    }
  }, [story?.id, story?.artStyle]);

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

  const loadProgressForStory = React.useCallback(async () => {
    const storyId = readerIdentity.storyId;
    if (!storyId || storyId === "unknown") {
      setResumePageIndex(null);
      return;
    }

    try {
      const raw = await AsyncStorage.getItem(progressStorageKey);
      if (!raw) {
        setResumePageIndex(null);
        return;
      }

      const parsed = JSON.parse(raw);
      const savedPageIndex = Number(parsed?.pageIndex);
      if (!Number.isFinite(savedPageIndex) || savedPageIndex < 0) {
        setResumePageIndex(null);
        return;
      }

      setResumePageIndex(Math.floor(savedPageIndex));
    } catch {
      setResumePageIndex(null);
    }
  }, [progressStorageKey, readerIdentity.storyId]);

  useFocusEffect(
    React.useCallback(() => {
      const run = async () => {
        await loadProgressForStory();
      };

      run();

      return undefined;
    }, [loadProgressForStory])
  );

  const storyForReader = React.useMemo(
    () => personalizeStoryForChild(story, selectedChild),
    [story, selectedChild]
  );
  const onResume = React.useCallback(() => {
    navigation.navigate("StoryReader", {
      storyId: readerIdentity.storyId,
      story: storyForReader,
      selectedChild,
      artStyle,
      startPageIndex: resumePageIndex != null ? Math.max(0, Math.floor(resumePageIndex)) : 0,
      forceStart: false,
    });
  }, [navigation, readerIdentity.storyId, storyForReader, selectedChild, artStyle, resumePageIndex]);
  const onStartReading = React.useCallback(() => {
    navigation.navigate("StoryReader", {
      storyId: readerIdentity.storyId,
      story: storyForReader,
      selectedChild,
      artStyle,
      startPageIndex: 0,
      forceStart: true,
    });
  }, [navigation, readerIdentity.storyId, storyForReader, selectedChild, artStyle]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.containerContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{storyForReader?.title || story?.title || "Story"}</Text>
      {childDisplayName ? (
        <Text style={styles.readingAsText}>Reading as {childDisplayName}</Text>
      ) : null}
      <Text style={styles.subtitle}>
        {childDisplayName ? `A story for ${childDisplayName}` : "A story for you"}
      </Text>
      {resumePageIndex != null && (
        <TouchableOpacity
          style={styles.resumeButton}
          onPress={onResume}
        >
          <Text style={styles.resumeText}>Resume from page {resumePageIndex + 1}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onStartReading}
      >
        <Text style={styles.primaryText}>Start Reading</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryText}>Back to Stories</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#241A3A",
    paddingHorizontal: 24,
  },
  containerContent: {
    flexGrow: 1,
    paddingVertical: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#F4F1FF",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.2,
    textShadowColor: "rgba(167,139,250,0.18)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#F4F1FF",
    opacity: 0.8,
    marginBottom: 32,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  readingAsText: {
    fontSize: 12,
    color: "#CFC5E5",
    opacity: 0.78,
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: 0.15,
    fontWeight: "600",
  },
  resumeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: "rgba(167,139,250,0.18)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
    marginBottom: 14,
  },
  resumeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F4F1FF",
    opacity: 0.9,
    letterSpacing: 0.15,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#A78BFA",
    shadowColor: "#A78BFA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 18,
  },
  primaryText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F4F1FF",
    letterSpacing: 0.2,
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.75,
    color: "#F4F1FF",
  },
});
