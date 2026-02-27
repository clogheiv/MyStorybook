/**
 * Image generation utility for story illustrations.
 *
 * Currently uses deterministic story-safe placeholder cards.
 * Easy drop-in replacement for:
 * - OpenAI DALL-E
 * - Stability AI
 * - Replicate
 * - Local ML model
 *
 * TODO: Wire real image generation API here
 */

const USE_PLACEHOLDER_ILLUSTRATIONS = true;

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
 * @returns {Promise<string>} Image URL
 */
async function generateImageFromAI(
  prompt,
  storyTitle,
  artStyle = "magical",
  options = {}
) {
  const { storyId, childId, pageIndex } = options;

  try {
    if (USE_PLACEHOLDER_ILLUSTRATIONS) {
      const safeStoryId =
        storyId != null && String(storyId).trim() ? String(storyId).trim() : "unknown";
      const safeChildId =
        childId != null && String(childId).trim() ? String(childId).trim() : "unknown";
      const safePageIndex = Number.isFinite(Number(pageIndex)) ? Number(pageIndex) : 0;
      const seed = `${safeStoryId}:${safeChildId}:${artStyle}:${safePageIndex}`;

      const heroName = inferHeroName(prompt, storyTitle);
      const heroEmoji = inferHeroEmoji(heroName, prompt, storyTitle);
      const sceneEmoji = inferSceneEmoji(prompt, storyTitle);
      const payload = { heroName, heroEmoji, sceneEmoji, seed };
      return `__placeholder__:${encodeURIComponent(JSON.stringify(payload))}`;
    }

    // TODO: Replace with real API call
    // Example:
    // const response = await fetch('https://api.openai.com/v1/images/generations', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${OPENAI_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     prompt: prompt,
    //     model: 'dall-e-3',
    //     size: '1024x768',
    //     n: 1,
    //   }),
    // });
    // const data = await response.json();
    // return data.data[0].url;

    // For now: Deterministic placeholder using prompt as seed
    // This ensures the same prompt always produces the same "magical" image
    const seed = encodeURIComponent(prompt);
    const imageUrl = `https://picsum.photos/seed/${seed}/600/400?blur=1`;

    return imageUrl;
  } catch (error) {
    console.error("Image generation failed:", error);
  }
}

export { buildIllustrationPrompt, generateImageFromAI };
