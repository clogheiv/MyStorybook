import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SelectChildScreen({
  navigation,
  profiles = [],
  selectedProfileId,
  onSelectProfile,
}) {
  const [activeProfileId, setActiveProfileId] = React.useState(
    selectedProfileId || profiles[0]?.id || null
  );
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!Array.isArray(profiles) || profiles.length === 0) {
      navigation.reset({
        index: 0,
        routes: [{ name: "AddChild" }],
      });
      return;
    }

    if (activeProfileId && profiles.some((profile) => profile.id === activeProfileId)) {
      return;
    }

    setActiveProfileId(selectedProfileId || profiles[0]?.id || null);
  }, [activeProfileId, navigation, profiles, selectedProfileId]);

  const canContinue = !!activeProfileId && !isSaving;

  const chooseProfile = React.useCallback(
    async (profileId) => {
      setActiveProfileId(profileId);
      if (typeof onSelectProfile !== "function") return;

      try {
        await onSelectProfile(profileId);
      } catch {
        // Keep selection responsive even if persistence fails.
      }
    },
    [onSelectProfile]
  );

  const continueWithProfile = React.useCallback(async () => {
    if (!canContinue || typeof onSelectProfile !== "function") return;

    try {
      setIsSaving(true);
      const selected = await onSelectProfile(activeProfileId);
      if (!selected) return;

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch {
      // Keep selection flow stable even if persistence fails temporarily.
    } finally {
      setIsSaving(false);
    }
  }, [activeProfileId, canContinue, navigation, onSelectProfile]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainContent}>
          <Text style={styles.title}>Choose who we're reading with</Text>
          <View style={styles.listWrap}>
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfileId;
              return (
                <TouchableOpacity
                  key={profile.id}
                  style={[styles.profileItem, isActive && styles.profileItemActive]}
                  onPress={() => chooseProfile(profile.id)}
                  disabled={isSaving}
                >
                  <Text style={[styles.profileName, isActive && styles.profileNameActive]}>
                    {profile.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={continueWithProfile}
            disabled={!canContinue}
          >
            <Text style={styles.continueButtonText}>
              {isSaving ? "Saving..." : "Continue"}
            </Text>
          </TouchableOpacity>
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
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F4F1FF",
    letterSpacing: 0.25,
    textAlign: "center",
    marginBottom: 20,
  },
  listWrap: {
    marginBottom: 16,
  },
  profileItem: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.16)",
    backgroundColor: "rgba(47,35,79,0.52)",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  profileItemActive: {
    borderColor: "rgba(255,230,180,0.34)",
    backgroundColor: "rgba(47,35,79,0.76)",
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
  continueButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: "#A78BFA",
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: "#1F1633",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
