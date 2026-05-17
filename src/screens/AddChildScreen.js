import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CHARACTER_STYLE_OPTIONS,
  DEFAULT_CHARACTER_STYLE,
} from "../data/characterStyles";

export default function AddChildScreen({ navigation, route, onAddProfile }) {
  const [name, setName] = React.useState("");
  const [characterStyle, setCharacterStyle] = React.useState(DEFAULT_CHARACTER_STYLE);
  const [isSaving, setIsSaving] = React.useState(false);
  const normalizedName = name.trim();
  const canSave = normalizedName.length > 0 && !isSaving;
  const returnTo = route?.params?.returnTo;

  const saveProfile = React.useCallback(async () => {
    if (!canSave || typeof onAddProfile !== "function") return;

    try {
      setIsSaving(true);
      const created = await onAddProfile(normalizedName, characterStyle);
      if (!created) return;

      if (returnTo === "Profiles") {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("Profiles");
        }
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch {
      // Keep first-run flow stable even if persistence fails temporarily.
    } finally {
      setIsSaving(false);
    }
  }, [canSave, characterStyle, navigation, normalizedName, onAddProfile, returnTo]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainContent}>
          <Text style={styles.title}>Welcome to My Storybook</Text>
          <Text style={styles.subtitle}>Add your child's name to begin.</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Child name"
            placeholderTextColor="rgba(244,241,255,0.55)"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            editable={!isSaving}
            onSubmitEditing={saveProfile}
          />
          <Text style={styles.fieldLabel}>Character Style</Text>
          <View style={styles.characterStyleSelector}>
            {CHARACTER_STYLE_OPTIONS.map((option) => {
              const isSelected = option.key === characterStyle;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.characterStyleButton,
                    isSelected && styles.characterStyleButtonSelected,
                  ]}
                  onPress={() => setCharacterStyle(option.key)}
                  disabled={isSaving}
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
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={saveProfile}
            disabled={!canSave}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F4F1FF",
    letterSpacing: 0.3,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#CFC5E5",
    opacity: 0.9,
    textAlign: "center",
    marginBottom: 22,
    letterSpacing: 0.15,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,230,180,0.18)",
    backgroundColor: "rgba(47,35,79,0.58)",
    color: "#F4F1FF",
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  fieldLabel: {
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
    marginBottom: 18,
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
  saveButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: "#A78BFA",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#1F1633",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
