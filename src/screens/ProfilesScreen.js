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
          <Text style={styles.title}>Profiles</Text>
          <Text style={styles.subtitle}>Choose the child for tonight's story.</Text>

          <View style={styles.listWrap}>
            {profiles.map((profile) => {
              const isActive = profile.id === selectedProfileId;
              return (
                <View key={profile.id} style={[styles.profileItem, isActive && styles.profileItemActive]}>
                  <TouchableOpacity
                    style={styles.profileTapArea}
                    onPress={() => onPressProfile(profile.id)}
                  >
                    <Text style={[styles.profileName, isActive && styles.profileNameActive]}>
                      {profile.name}
                    </Text>
                    {isActive ? <Text style={styles.selectedStatus}>Selected</Text> : null}
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
    backgroundColor: "#241A3A",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  mainContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F4F1FF",
    letterSpacing: 0.25,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#CFC5E5",
    opacity: 0.85,
    marginBottom: 18,
    letterSpacing: 0.15,
  },
  listWrap: {
    marginBottom: 14,
  },
  profileItem: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.16)",
    backgroundColor: "rgba(47,35,79,0.52)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  profileItemActive: {
    borderColor: "rgba(255,230,180,0.34)",
    backgroundColor: "rgba(47,35,79,0.76)",
  },
  profileTapArea: {
    flex: 1,
    paddingVertical: 4,
    paddingRight: 10,
  },
  profileName: {
    fontSize: 16,
    color: "#CFC5E5",
    letterSpacing: 0.15,
    fontWeight: "600",
  },
  profileNameActive: {
    color: "#F4F1FF",
  },
  selectedStatus: {
    marginTop: 4,
    fontSize: 12,
    color: "#DCD2F3",
    letterSpacing: 0.15,
    fontWeight: "600",
  },
  selectedBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.32)",
    backgroundColor: "rgba(47,35,79,0.72)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F4F1FF",
    letterSpacing: 0.2,
  },
  characterStylePanel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.14)",
    backgroundColor: "rgba(47,35,79,0.42)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  characterStyleLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#CFC5E5",
    opacity: 0.86,
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  characterStyleSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  characterStyleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.18)",
    backgroundColor: "rgba(47,35,79,0.58)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  characterStyleButtonSelected: {
    borderColor: "rgba(255,230,180,0.36)",
    backgroundColor: "rgba(167,139,250,0.24)",
  },
  characterStyleIcon: {
    fontSize: 16,
  },
  characterStyleButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#CFC5E5",
    letterSpacing: 0.15,
  },
  characterStyleButtonTextSelected: {
    color: "#F4F1FF",
  },
  primaryContinueButton: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.36)",
    backgroundColor: "#A78BFA",
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryContinueText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#241A3A",
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  primaryContinueSubtext: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(36,26,58,0.72)",
    letterSpacing: 0.15,
  },
  deleteButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,170,170,0.35)",
    backgroundColor: "rgba(94,41,56,0.45)",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F4C4CC",
    letterSpacing: 0.2,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  addChildButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.25)",
    backgroundColor: "rgba(47,35,79,0.72)",
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  addChildButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F4F1FF",
    letterSpacing: 0.2,
  },
  resetButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,170,170,0.3)",
    backgroundColor: "rgba(94,41,56,0.35)",
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F4C4CC",
    letterSpacing: 0.2,
  },
});
