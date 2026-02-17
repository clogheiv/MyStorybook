import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
// import StoryLibraryScreen from '../screens/StoryLibraryScreen'; // REMOVE unused
import StoryPickerScreen from '../screens/StoryPickerScreen';
import StoryReaderScreen from '../screens/StoryReaderScreen';
import StoryDetailsScreen from '../screens/StoryDetailsScreen';
     

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
return (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <Stack.Screen
        name="StoryPicker"
        component={StoryPickerScreen}
        options={{ title: "Choose Story" }}
      />
      <Stack.Screen
        name="StoryDetails"
        component={StoryDetailsScreen}
        options={{ title: "Story Details" }}
      />
      <Stack.Screen
        name="StoryReader"
        component={StoryReaderScreen}
        options={{ headerShown: false }}
      />

    </Stack.Navigator>
  </NavigationContainer>
); 
}
