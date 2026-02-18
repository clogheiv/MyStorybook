/**
 * Image generation utility for story illustrations.
 *
 * Uses real image API when configured, with deterministic story-safe fallback cards.
 * Easy drop-in replacement for:
 * - OpenAI DALL-E
 * - Stability AI
 * - Replicate
 * - Local ML model
 *
 * Set EXPO_PUBLIC_IMAGE_API_URL to enable remote generation.
 * Supported forms:
 * - POST endpoint returning JSON with imageUrl/url
 * - URL template with "{prompt}" token for direct image services
 */

const ILLUSTRATIONS_ENABLED =
  String(process?.env?.EXPO_PUBLIC_ILLUSTRATIONS_ENABLED || "")
    .trim()
    .toLowerCase() === "true";
const IMAGE_API_URL =
  typeof process?.env?.EXPO_PUBLIC_IMAGE_API_URL === "string"
    ? process.env.EXPO_PUBLIC_IMAGE_API_URL.trim()
    : "";
const IMAGE_API_KEY =
  typeof process?.env?.EXPO_PUBLIC_IMAGE_API_KEY === "string"
    ? process.env.EXPO_PUBLIC_IMAGE_API_KEY.trim()
    : "";

const HERO_KEYWORD_MAP = [
  { keyword: "turtle", name: "brave little turtle", emoji: "🐢" },
  { keyword: "rabbit", name: "curious rabbit", emoji: "🐇" },
  { keyword: "bunny", name: "curious rabbit", emoji: "🐇" },
  { keyword: "bear", name: "gentle bear cub", emoji: "🐻" },
  { keyword: "fox", name: "friendly little fox", emoji: "🦊" },
  { keyword: "dragon", name: "gentle baby dragon", emoji: "🐉" },
];

const SCENE_KEYWORD_MAP = [
  { keywords: ["turtle"], emoji: "🐢" },
  { keywords: ["rabbit", "bunny"], emoji: "🐇" },
  { keywords: ["forest", "woods", "trees", "tree"], emoji: "🌲" },
  { keywords: ["pond", "water", "river"], emoji: "🌊" },
  { keywords: ["night", "moon"], emoji: "🌙" },
  { keywords: ["adventure"], emoji: "🧭" },
];

function findFirstMatch(text, matchers) {
  return matchers.find((matcher) => {
    if (typeof matcher.keyword === "string") {
      return text.includes(matcher.keyword);
    }
    if (Array.isArray(matcher.keywords)) {
      return matcher.keywords.some((keyword) => text.includes(keyword));
    }
    return false;
  });
}

function inferHeroName(prompt, storyTitle) {
  const fromPrompt = String(prompt || "").match(/main character:\s*([^.\n]+)/i);
  if (fromPrompt && fromPrompt[1]) {
    const cleaned = fromPrompt[1].trim();
    if (cleaned) return cleaned;
  }

  const corpus = `${storyTitle || ""} ${prompt || ""}`.toLowerCase();
  const matchedHero = findFirstMatch(corpus, HERO_KEYWORD_MAP);
  return matchedHero?.name || "young storybook hero";
}

function inferHeroEmoji(heroName, prompt, storyTitle) {
  const corpus = `${heroName || ""} ${storyTitle || ""} ${prompt || ""}`.toLowerCase();
  const matchedHero = findFirstMatch(corpus, HERO_KEYWORD_MAP);
  return matchedHero?.emoji || "🧒";
}

function inferSceneEmoji(prompt, storyTitle) {
  const corpus = `${storyTitle || ""} ${prompt || ""}`.toLowerCase();
  const matchedScene = findFirstMatch(corpus, SCENE_KEYWORD_MAP);
  return matchedScene?.emoji || "⭐";
}

function buildPlaceholderToken(prompt, storyTitle, artStyle, storyId, childId, pageIndex) {
  const seed = `${storyId}:${childId}:${artStyle}:${pageIndex}`;
  const payload = {
    heroName: inferHeroName(prompt, storyTitle),
    heroEmoji: inferHeroEmoji("", prompt, storyTitle),
    sceneEmoji: inferSceneEmoji(prompt, storyTitle),
    seed,
  };
  return `__placeholder__:${encodeURIComponent(JSON.stringify(payload))}`;
}

/**
 * Build a structured illustration prompt from story context.
 *
 * @param {Object} config - Prompt configuration
 * @param {string} config.storyTitle - Title of the story
 * @param {string} config.pageText - Text content of the current page
 * @param {number} config.pageIndex - Zero-based page index
 * @param {string} config.artStyle - Art style (magical, bold_adventure, cozy, classic)
 * @param {Object} [config.storyContext] - Story-level context for continuity
 * @param {string} [config.storyContext.storyId] - Unique story ID
 * @param {string} [config.storyContext.title] - Full story title
 * @param {string} [config.storyContext.mainCharacter] - Main character name/description
 * @param {string} [config.storyContext.settingHint] - Setting or world context
 * @param {string} [config.childName] - Optional name of child reading
 * @param {string} [config.characterHints] - Optional character descriptions
 * @param {string} [config.toneHint] - Optional tone guidance
 * @returns {string} Structured prompt string
 */
function buildIllustrationPrompt({
  storyTitle,
  pageText,
  pageIndex,
  artStyle,
  storyContext,
  childName,
  characterHints,
  toneHint,
}) {
  // Style directives
  const STYLE_DIRECTIVES = {
    magical:
      "Whimsical children's storybook illustration, soft glowing light, dreamy atmosphere, gentle sparkles, pastel color palette, magical and playful mood",
    bold_adventure:
      "Cinematic family adventure illustration, vibrant colors, dynamic composition, dramatic lighting, heroic framing, Pixar-inspired animated film look, exciting and adventurous mood",
    cozy:
      "Warm cozy picture book illustration, soft textures, warm lamplight, gentle shadows, calm comforting atmosphere, bedtime story feeling",
    classic:
      "Classic timeless storybook illustration, clean linework, balanced composition, soft natural colors, traditional children's book style",
  };

  const styleDirective =
    STYLE_DIRECTIVES[artStyle] ?? STYLE_DIRECTIVES.magical;

  // Build prompt structure: style + context + description + constraints
  const lines = [
    // Line 1: Style directive
    styleDirective,

    // Line 2: Story context
    `Story: "${storyTitle}" (Page ${pageIndex + 1})`,

    // Line 3: Scene description (first 80 chars of page text)
    `Scene: ${pageText.substring(0, 80)}...`,

    // Line 4: Constraints
    "No words or letters in the image. No watermarks. Keep characters visually consistent across pages.",
  ];

  // Story context lines (for narrative continuity)
  if (storyContext) {
    const contextLines = [];
    if (storyContext.mainCharacter) {
      contextLines.push(`Main character: ${storyContext.mainCharacter}`);
    }
    if (storyContext.settingHint) {
      contextLines.push(`Setting: ${storyContext.settingHint}`);
    }
    if (contextLines.length > 0) {
      lines.push(`Story context: ${contextLines.join("; ")}`);
    }
  }

  // Optional additions
  if (characterHints) {
    lines.push(`Characters: ${characterHints}`);
  }
  if (toneHint) {
    lines.push(`Tone: ${toneHint}`);
  }

  return lines.join(" ");
}

/**
 * Generate an illustration for a story page.
 *
 * @param {string} prompt - Detailed prompt describing the scene (from buildIllustrationPrompt)
 * @param {string} storyTitle - Title of the story (context)
 * @param {string} artStyle - Art style theme (magical, bold_adventure, cozy, classic)
 * @param {Object} [options] - Optional context for deterministic placeholders
 * @param {string} [options.storyId] - Story identifier
 * @param {string} [options.childId] - Child identifier
 * @param {number} [options.pageIndex] - Zero-based page index
 * @param {string} [options.gender] - Optional child gender hint
 * @returns {Promise<string>} Image URL
 */
async function generateImageFromAI(
  prompt,
  storyTitle,
  artStyle = "magical",
  options = {}
) {
  const { storyId, childId, pageIndex, gender } = options;
  const safeStoryId =
    storyId != null && String(storyId).trim() ? String(storyId).trim() : "unknown";
  const safeChildId =
    childId != null && String(childId).trim() ? String(childId).trim() : "unknown";
  const safePageIndex = Number.isFinite(Number(pageIndex)) ? Number(pageIndex) : 0;
  const fallbackToPlaceholder = (err) => {
    const returnedValue = buildPlaceholderToken(
      prompt,
      storyTitle,
      artStyle,
      safeStoryId,
      safeChildId,
      safePageIndex
    );
    console.log("[generateImageFromAI] FALLBACK_TO_PLACEHOLDER", {
      reason: err?.message ?? err ?? null,
    });
    return returnedValue;
  };

  if (!ILLUSTRATIONS_ENABLED) {
    return fallbackToPlaceholder("ILLUSTRATIONS_DISABLED");
  }

  try {
    if (!IMAGE_API_URL) {
      return fallbackToPlaceholder("REMOTE_FAILED");
    }

    if (IMAGE_API_URL.includes("{prompt}")) {
      const templateImageUrl = IMAGE_API_URL.replace(
        "{prompt}",
        encodeURIComponent(String(prompt || "").slice(0, 1200))
      );
      const templateResponse = await fetch(templateImageUrl);
      if (!templateResponse.ok) {
        throw new Error(`Template image endpoint failed (${templateResponse.status})`);
      }
      const templateContentType = templateResponse.headers.get("content-type") || "";
      if (templateContentType && !templateContentType.startsWith("image/")) {
        throw new Error(`Template endpoint returned non-image content type: ${templateContentType}`);
      }
      return templateImageUrl;
    }

    const headers = {
      "Content-Type": "application/json",
    };
    if (IMAGE_API_KEY) {
      headers.Authorization = `Bearer ${IMAGE_API_KEY}`;
    }

    const response = await fetch(IMAGE_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        prompt,
        storyTitle,
        artStyle,
        storyId: safeStoryId,
        childId: safeChildId,
        pageIndex: safePageIndex,
        gender: gender ?? "neutral",
      }),
    });
    if (!response.ok) {
      throw new Error(`Image API request failed (${response.status})`);
    }

    const data = await response.json();
    const imageUrl = data?.imageUrl || data?.url || data?.data?.[0]?.url;
    if (typeof imageUrl !== "string" || !imageUrl.trim()) {
      throw new Error("Image API response missing image URL");
    }
    const trimmedImageUrl = imageUrl.trim();
    if (!/^https?:\/\//i.test(trimmedImageUrl)) {
      throw new Error("Image API returned non-http(s) URL");
    }

    return trimmedImageUrl;
  } catch {
    return fallbackToPlaceholder("REMOTE_FAILED");
  }
}

export { buildIllustrationPrompt, generateImageFromAI };
