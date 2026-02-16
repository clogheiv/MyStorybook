import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
   const navigation = useNavigation();
  return (
  <View style={styles.container}>
       <Text style={styles.title}>Welcome to My Storybook 📖</Text>
  <Text style={styles.subtitle}>A gentle place for stories and voices.</Text>

<Text
  style={{
    marginTop: 30,
    fontSize: 18,
    color: 'white',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    overflow: 'hidden'
  }}
  onPress={() => navigation.navigate('StoryLibrary')}
>
  Choose Story
</Text>

 </View>
  
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { marginTop: 10, fontSize: 16 },
});

