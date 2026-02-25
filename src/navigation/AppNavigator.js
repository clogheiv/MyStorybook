import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import StoryPickerScreen from "../screens/StoryPickerScreen";
import StoryReaderScreen from "../screens/StoryReaderScreen";
import StoryDetailsScreen from "../screens/StoryDetailsScreen";
import AddChildScreen from "../screens/AddChildScreen";
import SelectChildScreen from "../screens/SelectChildScreen";
import ProfilesScreen from "../screens/ProfilesScreen";

const Stack = createNativeStackNavigator();

const PROFILES_STORAGE_KEY = "msb_profiles";
const SELECTED_PROFILE_ID_STORAGE_KEY = "msb_selectedProfileId";
const STORY_PROGRESS_STORAGE_KEY = "storyProgress:v1";
const STORY_PROGRESS_PREFIX = "readerProgress:";

const normalizeProfiles = (inputProfiles) => {
  if (!Array.isArray(inputProfiles)) return [];

  return inputProfiles
    .map((profile) => {
      if (!profile || typeof profile !== "object") return null;

      const id = profile.id != null ? String(profile.id).trim() : "";
      const name = typeof profile.name === "string" ? profile.name.trim() : "";
      if (!id || !name) return null;

      const parsedCreatedAt = Number(profile.createdAt);
      const createdAt = Number.isFinite(parsedCreatedAt) && parsedCreatedAt > 0
        ? parsedCreatedAt
        : Date.now();

      return { id, name, createdAt };
    })
    .filter(Boolean);
};

const buildProfileId = () => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `child-${timestamp}-${randomSuffix}`;
};

export default function AppNavigator() {
  const [profiles, setProfiles] = React.useState([]);
  const [selectedProfileId, setSelectedProfileId] = React.useState(null);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const hydrateProfiles = async () => {
      try {
        const [profilesRaw, selectedProfileIdRaw] = await Promise.all([
          AsyncStorage.getItem(PROFILES_STORAGE_KEY),
          AsyncStorage.getItem(SELECTED_PROFILE_ID_STORAGE_KEY),
        ]);

        const parsedProfiles = profilesRaw ? JSON.parse(profilesRaw) : [];
        const normalizedProfiles = normalizeProfiles(parsedProfiles);
        const rawSelectedId =
          typeof selectedProfileIdRaw === "string" && selectedProfileIdRaw.trim()
            ? selectedProfileIdRaw.trim()
            : null;
        const hasSelectedProfile =
          rawSelectedId != null &&
          normalizedProfiles.some((profile) => profile.id === rawSelectedId);
        const nextSelectedProfileId = hasSelectedProfile ? rawSelectedId : null;

        if (!cancelled) {
          setProfiles(normalizedProfiles);
          setSelectedProfileId(nextSelectedProfileId);
        }
      } catch {
        if (!cancelled) {
          setProfiles([]);
          setSelectedProfileId(null);
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    hydrateProfiles();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistProfiles = React.useCallback(async (nextProfiles) => {
    setProfiles(nextProfiles);
    await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(nextProfiles));
  }, []);

  const persistSelectedProfileId = React.useCallback(async (nextSelectedProfileId) => {
    setSelectedProfileId(nextSelectedProfileId);
    if (nextSelectedProfileId) {
      await AsyncStorage.setItem(SELECTED_PROFILE_ID_STORAGE_KEY, nextSelectedProfileId);
      return;
    }

    await AsyncStorage.removeItem(SELECTED_PROFILE_ID_STORAGE_KEY);
  }, []);

  const onAddProfile = React.useCallback(
    async (name) => {
      const normalizedName = typeof name === "string" ? name.trim() : "";
      if (!normalizedName) return null;

      const newProfile = {
        id: buildProfileId(),
        name: normalizedName,
        createdAt: Date.now(),
      };
      const nextProfiles = [...profiles, newProfile];
      const nextSelectedProfileId = selectedProfileId || newProfile.id;

      await Promise.all([
        persistProfiles(nextProfiles),
        persistSelectedProfileId(nextSelectedProfileId),
      ]);

      return newProfile;
    },
    [persistProfiles, persistSelectedProfileId, profiles, selectedProfileId]
  );

  const onSelectProfile = React.useCallback(
    async (profileId) => {
      if (!profileId || !profiles.some((profile) => profile.id === profileId)) {
        return false;
      }

      await persistSelectedProfileId(profileId);
      return true;
    },
    [persistSelectedProfileId, profiles]
  );

  const onDeleteProfile = React.useCallback(
    async (profileId) => {
      if (!profileId) return false;
      if (!profiles.some((profile) => profile.id === profileId)) return false;

      const nextProfiles = profiles.filter((profile) => profile.id !== profileId);
      const nextSelectedProfileId =
        selectedProfileId === profileId
          ? nextProfiles[0]?.id || null
          : selectedProfileId;

      await Promise.all([
        persistProfiles(nextProfiles),
        persistSelectedProfileId(nextSelectedProfileId),
      ]);
      return true;
    },
    [persistProfiles, persistSelectedProfileId, profiles, selectedProfileId]
  );

  const onResetAllData = React.useCallback(async () => {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToClear = allKeys.filter(
      (key) =>
        key === PROFILES_STORAGE_KEY ||
        key === SELECTED_PROFILE_ID_STORAGE_KEY ||
        key === STORY_PROGRESS_STORAGE_KEY ||
        key.startsWith(STORY_PROGRESS_PREFIX)
    );

    if (keysToClear.length > 0) {
      await AsyncStorage.multiRemove(keysToClear);
    }

    setProfiles([]);
    setSelectedProfileId(null);
    return true;
  }, []);

  const selectedProfile = React.useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) || null,
    [profiles, selectedProfileId]
  );

  if (!isHydrated) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="small" color="#C8B04A" />
      </View>
    );
  }

  const initialRouteName =
    profiles.length === 0
      ? "AddChild"
      : !selectedProfile
      ? "SelectChild"
      : "Home";

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen
          name="AddChild"
          options={({ route }) => ({
            title: "Add Child",
            headerBackVisible: route?.params?.returnTo === "Profiles",
          })}
        >
          {(screenProps) => (
            <AddChildScreen
              {...screenProps}
              onAddProfile={onAddProfile}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="SelectChild"
          options={{ title: "Select Child", headerBackVisible: false }}
        >
          {(screenProps) => (
            <SelectChildScreen
              {...screenProps}
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              onSelectProfile={onSelectProfile}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Home"
          options={{ title: "Home" }}
        >
          {(screenProps) => (
            <HomeScreen
              {...screenProps}
              selectedProfile={selectedProfile}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Profiles"
          options={{ title: "Manage Kids" }}
        >
          {(screenProps) => (
            <ProfilesScreen
              {...screenProps}
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              onSelectProfile={onSelectProfile}
              onDeleteProfile={onDeleteProfile}
              onResetAllData={onResetAllData}
            />
          )}
        </Stack.Screen>
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

const styles = StyleSheet.create({
  loadingState: {
    flex: 1,
    backgroundColor: "#241A3A",
    alignItems: "center",
    justifyContent: "center",
  },
});
