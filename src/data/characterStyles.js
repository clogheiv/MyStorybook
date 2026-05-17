const DEFAULT_CHARACTER_STYLE = "boy";

const CHARACTER_STYLE_OPTIONS = [
  {
    key: "boy",
    label: "Boy",
    icon: "👦",
  },
  {
    key: "girl",
    label: "Girl",
    icon: "👧",
  },
];

const normalizeCharacterStyle = (inputStyle) => {
  const style = typeof inputStyle === "string" ? inputStyle.trim().toLowerCase() : "";
  return CHARACTER_STYLE_OPTIONS.some((option) => option.key === style)
    ? style
    : DEFAULT_CHARACTER_STYLE;
};

const characterStyleFromLegacyData = (profile) => {
  if (!profile || typeof profile !== "object") return DEFAULT_CHARACTER_STYLE;
  if (typeof profile.gender === "string" && profile.gender.trim()) {
    return normalizeCharacterStyle(profile.gender);
  }

  return DEFAULT_CHARACTER_STYLE;
};

export {
  CHARACTER_STYLE_OPTIONS,
  DEFAULT_CHARACTER_STYLE,
  characterStyleFromLegacyData,
  normalizeCharacterStyle,
};
