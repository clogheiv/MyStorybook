import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function StoryDetailsScreen({ navigation, route }) {
  const { story, selectedChild } = route?.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{story?.title || "Story"}</Text>

      <Text style={styles.subtitle}>
        {selectedChild ? `A story for ${selectedChild}` : "A story for you"}
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() =>
          navigation.navigate("StoryReader", { story, selectedChild })
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
});
