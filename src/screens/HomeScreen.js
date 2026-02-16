import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from '@react-navigation/native';
import ChildProfilePicker from "../components/ChildProfilePicker";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [selectedChild, setSelectedChild] = useState(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to My Storybook 📖</Text>
        <Text style={styles.subtitle}>Pick who we're reading with today</Text>
      </View>

      <View style={styles.childPickerSection}>
        <ChildProfilePicker onSelectChild={setSelectedChild} />
      </View>

      <TouchableOpacity
        style={styles.chooseStoryButton}
        onPress={() => navigation.navigate('StoryLibrary', { selectedChild })}
        disabled={!selectedChild}
      >
        <Text style={styles.chooseStoryText}>Choose Story</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3EA",
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: "center",
  },
  header: {
    marginBottom: 48,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
  childPickerSection: {
    marginBottom: 48,
    alignItems: "center",
  },
  chooseStoryButton: {
    backgroundColor: "#D4A574",
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  chooseStoryText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
});

