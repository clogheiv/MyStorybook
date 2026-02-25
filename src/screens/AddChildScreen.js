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

export default function AddChildScreen({ navigation, route, onAddProfile }) {
  const [name, setName] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const normalizedName = name.trim();
  const canSave = normalizedName.length > 0 && !isSaving;
  const returnTo = route?.params?.returnTo;

  const saveProfile = React.useCallback(async () => {
    if (!canSave || typeof onAddProfile !== "function") return;

    try {
      setIsSaving(true);
      const created = await onAddProfile(normalizedName);
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
  }, [canSave, navigation, normalizedName, onAddProfile, returnTo]);

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
