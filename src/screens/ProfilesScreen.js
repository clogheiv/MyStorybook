import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CHARACTER_STYLE_OPTIONS,
  characterStyleFromLegacyData,
} from "../data/characterStyles";

export default function ProfilesScreen({
  navigation,
  profiles = [],
  selectedProfileId,
  onSelectProfile,
  onDeleteProfile,
  onResetAllData,
  onUpdateProfileGender,
}) {
  React.useEffect(() => {
    if (profiles.length > 0) return;

    navigation.reset({
      index: 0,
      routes: [{ name: "AddChild" }],
    });
  }, [navigation, profiles.length]);
  const selectedProfile = React.useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) || null,
    [profiles, selectedProfileId]
  );

  const onPressProfile = React.useCallback(
    async (profileId) => {
      if (typeof onSelectProfile !== "function") return;
      try {
        await onSelectProfile(profileId);
      } catch {
        // Keep profile switching responsive if persistence fails.
      }
    },
    [onSelectProfile]
  );

  const confirmDeleteProfile = React.useCallback(
    (profile) => {
      if (!profile || typeof onDeleteProfile !== "function") return;
      Alert.alert(
        "Delete child profile?",
        `Remove "${profile.name}" from this device?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await onDeleteProfile(profile.id);
              } catch {
                // Keep UI responsive even if storage temporarily fails.
              }
            },
          },
        ]
      );
    },
    [onDeleteProfile]
  );

  const confirmResetAllData = React.useCallback(() => {
    if (typeof onResetAllData !== "function") return;

    Alert.alert(
      "Reset all data?",
      "This will permanently remove all child profiles and reading progress on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset All",
          style: "destructive",
          onPress: async () => {
            try {
              await onResetAllData();
              navigation.reset({
                index: 0,
                routes: [{ name: "AddChild" }],
              });
            } catch {
              // Keep UI stable even if reset fails.
            }
          },
        },
      ]
    );
  }, [navigation, onResetAllData]);

  const chooseStoryForSelectedProfile = React.useCallback(() => {
    if (!selectedProfile) return;
    navigation.navigate("StoryPicker", { selectedChild: selectedProfile });
  }, [navigation, selectedProfile]);

  const updateSelectedCharacterStyle = React.useCallback(
    async (characterStyle) => {
      if (!selectedProfile || typeof onUpdateProfileGender !== "function") return;
      try {
        await onUpdateProfileGender(selectedProfile.id, characterStyle);
      } catch {
        // Keep profile management responsive if persistence fails.
      }
    },
    [onUpdateProfileGender, selectedProfile]
  );

  const selectedCharacterStyle = React.useMemo(
    () => characterStyleFromLegacyData(selectedProfile),
    [selectedProfile]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainContent}>
          <View style={styles.headerCard}>
            <Text style={styles.eyebrow}>Family Library</Text>
            <Text style={styles.title}>Profiles</Text>
            <Text style={styles.subtitle}>Choose who is reading tonight.</Text>
          </View>

          <View style={styles.listWrap}>
            {profiles.map((profile) => {
              const isActive = profile.id === selectedProfileId;
              return (
                <View key={profile.id} style={[styles.profileItem, isActive && styles.profileItemActive]}>
                  <TouchableOpacity
                    style={styles.profileTapArea}
                    onPress={() => onPressProfile(profile.id)}
                  >
                    <View style={[styles.profileAvatar, isActive && styles.profileAvatarActive]}>
                      <Text
                        style={[
                          styles.profileAvatarText,
                          isActive && styles.profileAvatarTextActive,
                        ]}
                      >
                        {profile.name?.trim()?.charAt(0)?.toUpperCase() || "?"}
                      </Text>
                    </View>
                    <View style={styles.profileTextWrap}>
                      <Text
                        numberOfLines={1}
                        style={[styles.profileName, isActive && styles.profileNameActive]}
                      >
                        {profile.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {isActive ? (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>Selected</Text>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => confirmDeleteProfile(profile)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {selectedProfile ? (
            <>
              <View style={styles.characterStylePanel}>
                <Text style={styles.characterStyleLabel}>Character Style</Text>
                <View style={styles.characterStyleSelector}>
                  {CHARACTER_STYLE_OPTIONS.map((option) => {
                    const isSelected = option.key === selectedCharacterStyle;
                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.characterStyleButton,
                          isSelected && styles.characterStyleButtonSelected,
                        ]}
                        onPress={() => updateSelectedCharacterStyle(option.key)}
                      >
                        <Text style={styles.characterStyleIcon}>{option.icon}</Text>
                        <Text
                          style={[
                            styles.characterStyleButtonText,
                            isSelected && styles.characterStyleButtonTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <TouchableOpacity
                style={styles.primaryContinueButton}
                onPress={chooseStoryForSelectedProfile}
              >
                <Text style={styles.primaryContinueText}>Choose a Story</Text>
                <Text style={styles.primaryContinueSubtext}>
                  Reading as {selectedProfile.name}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.addChildButton}
              onPress={() => navigation.navigate("AddChild", { returnTo: "Profiles" })}
            >
              <Text style={styles.addChildButtonText}>Add Child</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={confirmResetAllData}
            >
              <Text style={styles.resetButtonText}>Reset All Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7EFE2",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  mainContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 44,
  },
  headerCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#E4D2B8",
    backgroundColor: "#FFF9EE",
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginBottom: 16,
    shadowColor: "#7A6041",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  eyebrow: {
    color: "#8B6F3E",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    marginBottom: 5,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#25283A",
    letterSpacing: 0,
    lineHeight: 34,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#51566C",
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: 0,
  },
  listWrap: {
    marginBottom: 16,
  },
  profileItem: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E4D2B8",
    backgroundColor: "#FFFCF4",
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#7A6041",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  profileItemActive: {
    borderColor: "#C9B2E5",
    backgroundColor: "#F2EAF8",
  },
  profileTapArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    paddingRight: 8,
    gap: 11,
  },
  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0DDAF",
    borderWidth: 1,
    borderColor: "#D4B989",
  },
  profileAvatarActive: {
    backgroundColor: "#6E5A8A",
    borderColor: "#6E5A8A",
  },
  profileAvatarText: {
    color: "#493B63",
    fontSize: 17,
    fontWeight: "900",
  },
  profileAvatarTextActive: {
    color: "#FFFFFF",
  },
  profileTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: 17,
    color: "#25283A",
    letterSpacing: 0,
    fontWeight: "900",
  },
  profileNameActive: {
    color: "#493B63",
  },
  selectedBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D4B989",
    backgroundColor: "#F0DDAF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#493B63",
    letterSpacing: 0,
  },
  characterStylePanel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E4D2B8",
    backgroundColor: "#FFF9EE",
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 14,
    shadowColor: "#7A6041",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  characterStyleLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#8B6F3E",
    letterSpacing: 0,
    marginBottom: 10,
  },
  characterStyleSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  characterStyleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DED0BD",
    backgroundColor: "#FFFFFF",
    paddingVertical: 9,
    paddingHorizontal: 13,
    gap: 6,
  },
  characterStyleButtonSelected: {
    borderColor: "#C9B2E5",
    backgroundColor: "#E8DFF3",
  },
  characterStyleIcon: {
    fontSize: 16,
  },
  characterStyleButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#51566C",
    letterSpacing: 0,
  },
  characterStyleButtonTextSelected: {
    color: "#493B63",
  },
  primaryContinueButton: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#493B63",
    paddingVertical: 17,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#4C3C62",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryContinueText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0,
    marginBottom: 3,
  },
  primaryContinueSubtext: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E8DFF3",
    letterSpacing: 0,
  },
  deleteButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E8B9B3",
    backgroundColor: "#F7DDDA",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#9F4D4D",
    letterSpacing: 0,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 18,
  },
  addChildButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DED0BD",
    backgroundColor: "#FFFCF4",
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  addChildButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#493B63",
    letterSpacing: 0,
  },
  resetButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E8B9B3",
    backgroundColor: "#FFF9EE",
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#9F4D4D",
    letterSpacing: 0,
  },
});
