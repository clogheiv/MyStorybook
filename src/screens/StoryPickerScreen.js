import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from "react-native";

export default function StoryPickerScreen({ navigation, route }) {
  const selectedChild = route?.params?.selectedChild;
    const stories = [
    { id: "1", title: "The Brave Little Turtle" },
    { id: "2", title: "Rocket Dog to the Rescue" },
    { id: "3", title: "Emma and the Moon Garden" },
    { id: "4", title: "Noah’s Secret Treehouse" },
    { id: "5", title: "The Library of Laughing Clouds" },
  ];

 const openStory = (story) => {
  navigation.navigate("StoryDetails", {
    story,
    selectedChild,
  });
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
  Pick a Story{selectedChild ? ` for ${selectedChild}` : ""}
</Text>

      <Text style={styles.subtitle}>
        Next step: show a list of stories for the selected child.
      </Text>

      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 18 }}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openStory(item)}
            style={styles.storyCard}
          >
            <Text style={styles.storyTitle}>{item.title}</Text>
            <Text style={styles.storyMeta}>
              {selectedChild ? `For ${selectedChild}` : "Select a child to personalize"}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Back to My Storybook</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 24, opacity: 0.7 },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#E6F4FF",
  },
  buttonText: { fontSize: 16, fontWeight: "600" },
    storyCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  storyTitle: { fontSize: 16, fontWeight: "700" },
  storyMeta: { marginTop: 4, fontSize: 13, opacity: 0.65 },

});
