import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function StoryDetailsScreen({ navigation, route }) {
  const { story, selectedChild } = route?.params || {};
  const [artStyle, setArtStyle] = useState("magical");

  const ART_STYLES = [
    { key: "magical", label: "✨ Magical" },
    { key: "bold_adventure", label: "🐉 Bold" },
    { key: "cozy", label: "🏠 Cozy" },
    { key: "classic", label: "📖 Classic" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{story?.title || "Story"}</Text>
      <Text style={styles.subtitle}>
        {selectedChild ? `A story for ${selectedChild}` : "A story for you"}
      </Text>
      <View style={styles.styleSection}>
        <Text style={styles.styleSectionTitle}>Choose the mood</Text>
        <View style={styles.styleSelector}>
          {ART_STYLES.map((style) => (
            <TouchableOpacity
              key={style.key}
              style={[styles.styleButton, artStyle === style.key && styles.styleButtonActive]}
              onPress={() => setArtStyle(style.key)}
            >
              <Text
                style={[styles.styleButtonText, artStyle === style.key && styles.styleButtonTextActive]}
              >
                {style.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() =>
          navigation.navigate("StoryReader", { story, selectedChild, artStyle })
        }
      >
        <Text style={styles.primaryText}>Start Reading</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryText}>Back to Stories</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#241A3A",
    padding: 24,
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
  styleSection: {
    width: "100%",
    marginTop: 18,
    marginBottom: 18,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  styleSectionTitle: {
    fontSize: 15,
    color: "#F4F1FF",
    opacity: 0.8,
    marginBottom: 10,
    fontWeight: "600",
    letterSpacing: 0.1,
    textAlign: "center",
  },
  styleSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 0,
  },
  styleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(42,31,71,0.8)",
    borderWidth: 1,
    borderColor: "rgba(160,120,255,0.2)",
    marginRight: 0,
    marginBottom: 10,
  },
  styleButtonActive: {
    backgroundColor: "rgba(167,139,250,0.2)",
    borderColor: "rgba(167,139,250,0.6)",
  },
  styleButtonText: {
    fontSize: 13,
    opacity: 0.7,
    color: "#F4F1FF",
  },
  styleButtonTextActive: {
    opacity: 1,
    fontWeight: "600",
    color: "#A78BFA",
  },
});
