/**
 * Image generation utility for story illustrations.
 *
 * Currently uses deterministic Picsum placeholder.
 * Easy drop-in replacement for:
 * - OpenAI DALL-E
 * - Stability AI
 * - Replicate
 * - Local ML model
 *
 * TODO: Wire real image generation API here
 */

/**
 * Build a structured illustration prompt from story context.
 *
 * @param {Object} config - Prompt configuration
 * @param {string} config.storyTitle - Title of the story
 * @param {string} config.pageText - Text content of the current page
 * @param {number} config.pageIndex - Zero-based page index
 * @param {string} config.artStyle - Art style (magical, bold_adventure, cozy, classic)
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
  childName,
  characterHints,
  toneHint,
}) {
  // Style directives
  const STYLE_DIRECTIVES = {
    magical:
      "Whimsical children's storybook illustration, soft glow, dreamy lighting, sparkles",
    bold_adventure:
      "Cinematic, colorful, family-friendly 3D animated film look, adventurous",
    cozy:
      "Warm, cozy picture book illustration, gentle textures, soft warm light",
    classic:
      "Classic storybook illustration, clean linework, timeless composition",
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
    "Constraints: No words or letters in image, no watermarks, keep characters consistent.",
  ];

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
 * @returns {Promise<string>} Image URL
 */
async function generateImageFromAI(
  prompt,
  storyTitle,
  artStyle = "magical"
) {
  try {
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

    // Fallback: Generic placeholder so reader never breaks
    return `https://picsum.photos/600/400?random=${Date.now()}`;
  }
}

export { buildIllustrationPrompt, generateImageFromAI };
