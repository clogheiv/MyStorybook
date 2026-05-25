import React, { useState } from "react";
import { Image, ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { personalizeStoryForChild } from "../data/storyCatalog";
import { resolveStoryPageIllustrationAsset } from "../data/localIllustrations";

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
  const selectedCharacterStyle = selectedChild?.gender === "girl" ? "girl" : "boy";
  const coverImage = React.useMemo(
    () =>
      resolveStoryPageIllustrationAsset({
        storyId: story?.id,
        pageNumber: 1,
        gender: selectedCharacterStyle,
      }),
    [selectedCharacterStyle, story?.id]
  );

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
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>Story Preview</Text>
        <Text style={styles.title}>{storyForReader?.title || story?.title || "Story"}</Text>
      </View>

      <View style={styles.previewCard}>
        <View style={styles.coverFrame}>
          {coverImage ? (
            <Image source={coverImage} style={styles.coverImage} />
          ) : (
            <View style={styles.coverFallback}>
              <Text style={styles.coverFallbackIcon}>Book</Text>
              <Text numberOfLines={2} style={styles.coverFallbackTitle}>
                {storyForReader?.title || story?.title || "Story"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.storyCopy}>
          {childDisplayName ? (
            <Text style={styles.readingAsText}>Reading with {childDisplayName}</Text>
          ) : null}
          <Text style={styles.subtitle}>
            {childDisplayName ? `Personalized for ${childDisplayName}` : "A story for you"}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>
                {Array.isArray(storyForReader?.pages) ? storyForReader.pages.length : 12} pages
              </Text>
            </View>
            {resumePageIndex != null ? (
              <View style={styles.metaPill}>
                <Text style={styles.metaText}>Page {resumePageIndex + 1}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.actions}>
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
          <Text style={styles.primaryText}>
            {resumePageIndex != null ? "Start from Beginning" : "Start Reading"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryText}>Back to Stories</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7EFE2",
  },
  containerContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 44,
  },
  headerBlock: {
    marginBottom: 14,
  },
  eyebrow: {
    color: "#8B6F3E",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    marginBottom: 5,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#25283A",
    lineHeight: 35,
    letterSpacing: 0,
  },
  previewCard: {
    borderRadius: 28,
    backgroundColor: "#FFF9EE",
    borderWidth: 1,
    borderColor: "#E4D2B8",
    padding: 14,
    marginBottom: 18,
    shadowColor: "#7A6041",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 5,
  },
  coverFrame: {
    aspectRatio: 1.05,
    borderRadius: 24,
    backgroundColor: "#E8DFF3",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4D2B8",
    marginBottom: 15,
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  coverFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#E8DFF3",
  },
  coverFallbackIcon: {
    color: "#493B63",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
  },
  coverFallbackTitle: {
    color: "#25283A",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
    textAlign: "center",
  },
  storyCopy: {
    paddingHorizontal: 4,
    paddingBottom: 3,
  },
  subtitle: {
    fontSize: 18,
    color: "#303344",
    fontWeight: "900",
    lineHeight: 24,
    letterSpacing: 0,
    marginBottom: 12,
  },
  readingAsText: {
    fontSize: 13,
    color: "#8B6F3E",
    marginBottom: 5,
    letterSpacing: 0,
    fontWeight: "900",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaPill: {
    borderRadius: 999,
    backgroundColor: "#F0DDAF",
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  metaText: {
    color: "#493B63",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
  },
  actions: {
    paddingBottom: 18,
  },
  resumeButton: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: "center",
    backgroundColor: "#E8DFF3",
    borderWidth: 1,
    borderColor: "#D8C8EB",
    marginBottom: 12,
  },
  resumeText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#493B63",
    letterSpacing: 0,
  },
  primaryButton: {
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#493B63",
    shadowColor: "#4C3C62",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 12,
  },
  primaryText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0,
  },
  secondaryButton: {
    alignSelf: "center",
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DED0BD",
    backgroundColor: "#FFFCF4",
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#493B63",
    letterSpacing: 0,
  },
});
