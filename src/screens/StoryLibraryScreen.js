import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import ChildProfilePicker from '../components/ChildProfilePicker';

export default function StoryLibraryScreen({ navigation }) {
  const onChooseStory = () => {
    // Placeholder action for choosing a story
    console.log('Choose Story pressed');
    // For now navigate to Home for testing
    navigation.navigate('Home');
  };

  const onParentCorner = () => {
    Alert.alert('Parent access — authentication coming soon');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Storybook</Text>
          <Text style={styles.subtitle}>Stories are better together</Text>
        </View>

        <View style={styles.pickerWrap}>
          <ChildProfilePicker />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={onChooseStory}>
          <Text style={styles.primaryText}>Choose Story</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.parentWrap} onPress={onParentCorner}>
          <Text style={styles.parentText}>Parent Corner</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    justifyContent: 'space-between',
  },
  header: { alignItems: 'flex-start' },
  title: { fontSize: 30, fontWeight: '700', color: '#1f2937' },
  subtitle: { marginTop: 8, fontSize: 16, color: '#6b7280' },
  pickerWrap: { marginTop: 28 },
  primaryButton: {
    backgroundColor: '#E6F4FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 24,
  },
  primaryText: { color: '#0f172a', fontSize: 16, fontWeight: '600' },
  parentWrap: { alignItems: 'center', paddingBottom: 18 },
  parentText: { color: '#6b7280', fontSize: 13 },
});
