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
    backgroundColor: "#1F1633",
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
    color: "#F5F3FF",
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: "rgba(167,139,250,0.4)",
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(245,243,255,0.7)",
    fontWeight: "500",
  },
  childPickerSection: {
    marginBottom: 48,
    alignItems: "center",
  },
  chooseStoryButton: {
    backgroundColor: "#A78BFA",
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  chooseStoryText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F1633",
  },
});

