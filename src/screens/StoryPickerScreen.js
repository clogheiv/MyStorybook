import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";

export default function StoryPickerScreen({ navigation, route }) {
  const selectedChild = route?.params?.selectedChild;

  // Configure subtle header with back arrow
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerStyle: {
        backgroundColor: "#1F1633",
        borderBottomWidth: 0,
        elevation: 0,
      },
      headerTintColor: "#A78BFA",
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

      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openStory(item)}
            style={styles.storyCard}
          >
            <Text style={styles.storyTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F1633",
    padding: 20,
    paddingTop: 24,
  },
  header: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F5F3FF",
    marginBottom: 24,
    opacity: 0.9,
    letterSpacing: 0.3,
  },
  listContent: {
    gap: 14,
  },
  storyCard: {
    backgroundColor: "#2A1F47",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderColor: "rgba(160,120,255,0.15)",
    borderWidth: 1,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F5F3FF",
  },
});
