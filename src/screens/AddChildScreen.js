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
          <View style={styles.topBar}>
            <View style={styles.titleBlock}>
              <Text style={styles.appName}>My Storybook</Text>
              <Text style={styles.title}>Create a child profile</Text>
            </View>
            <Text style={styles.moonAccent}>{"\u{263E}"}</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.subtitle}>
                Add your child's name and choose a character style.
              </Text>
              <View style={styles.bookMotif}>
                <View style={[styles.bookSpine, styles.bookSpineTall]} />
                <View style={[styles.bookSpine, styles.bookSpineGold]} />
                <View style={[styles.bookSpine, styles.bookSpineBlue]} />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Child Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Child name"
              placeholderTextColor="#8A8792"
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
              <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 42,
  },
  mainContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 44,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 12,
  },
  appName: {
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
    lineHeight: 35,
  },
  moonAccent: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8DFF3",
    color: "#493B63",
    fontSize: 23,
    lineHeight: 42,
    overflow: "hidden",
    textAlign: "center",
  },
  formCard: {
    borderRadius: 28,
    backgroundColor: "#FFF9EE",
    borderWidth: 1,
    borderColor: "#E4D2B8",
    padding: 18,
    shadowColor: "#7A6041",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  subtitle: {
    flex: 1,
    fontSize: 18,
    color: "#303344",
    fontWeight: "800",
    lineHeight: 24,
    letterSpacing: 0,
    paddingRight: 12,
  },
  bookMotif: {
    width: 58,
    height: 72,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 5,
  },
  bookSpine: {
    width: 14,
    height: 54,
    borderRadius: 6,
    backgroundColor: "#B7A2D8",
  },
  bookSpineTall: {
    height: 68,
    backgroundColor: "#6E5A8A",
  },
  bookSpineGold: {
    height: 60,
    backgroundColor: "#C6A45D",
  },
  bookSpineBlue: {
    height: 48,
    backgroundColor: "#8DAFC3",
  },
  input: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DED0BD",
    backgroundColor: "#FFFFFF",
    color: "#25283A",
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#8B6F3E",
    letterSpacing: 0,
    marginBottom: 9,
  },
  characterStyleSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },
  characterStyleButton: {
    flexGrow: 1,
    flexBasis: "46%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E4D2B8",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  characterStyleButtonSelected: {
    borderColor: "#D4B989",
    backgroundColor: "#F0DDAF",
  },
  characterStyleIcon: {
    fontSize: 18,
  },
  characterStyleButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#493B63",
    letterSpacing: 0,
  },
  characterStyleButtonTextSelected: {
    color: "#493B63",
  },
  saveButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingVertical: 17,
    paddingHorizontal: 24,
    backgroundColor: "#493B63",
    shadowColor: "#4C3C62",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: "#D3C7B7",
    borderWidth: 1,
    borderColor: "#C4B6A3",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0,
  },
  saveButtonTextDisabled: {
    color: "#7C756C",
  },
});
