import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function StoryDetailsScreen({ navigation, route }) {
  const { story, selectedChild } = route?.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{story?.title || "Story"}</Text>

      <Text style={styles.subtitle}>
        {selectedChild ? `For ${selectedChild}` : "Choose a child to personalize"}
      </Text>

      <Text style={styles.meta}>
        (Details later: illustration, length, difficulty, favorites, read-aloud)
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
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 14, opacity: 0.7 },
  meta: { fontSize: 14, marginBottom: 22, opacity: 0.55 },

  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#E6F4FF",
    marginBottom: 12,
  },
  primaryText: { fontSize: 18, fontWeight: "700" },

  secondaryButton: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  secondaryText: { fontSize: 16, fontWeight: "600", opacity: 0.75 },
});
