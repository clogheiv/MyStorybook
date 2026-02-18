import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";

export default function StoryPickerScreen({ navigation, route }) {
  const selectedChild = route?.params?.selectedChild;

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
      <Text style={styles.header}>
        Choose a story for {selectedChild || "them"}
      </Text>
      <Text style={styles.subtitle}>Pick tonight's story</Text>

      <FlatList
        data={stories}
        style={styles.list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openStory(item)}
            style={styles.storyCard}
          >
            <Text style={styles.storyTitle}>📖 {item.title}</Text>
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
    gap: 18,
    paddingBottom: 32,
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
});
