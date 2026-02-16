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
 * Generate an illustration for a story page.
 *
 * @param {string} prompt - Detailed prompt describing the scene
 * @param {string} storyTitle - Title of the story (context)
 * @param {string} artStyle - Art style theme (magical, bold_adventure, cozy, classic)
 * @returns {Promise<string>} Image URL
 */
async function generateImageFromAI(
  prompt,
  storyTitle,
  artStyle = "magical"
) {
  const STYLE_TEXT = {
    magical:
      "magical watercolor storybook illustration, soft glow, whimsical, sparkles, dreamy",
    bold_adventure:
      "bold adventure storybook illustration, dramatic lighting, high contrast, cinematic, exciting",
    cozy:
      "cozy bedtime picture book illustration, warm pastel, soft texture, gentle lighting, peaceful",
    classic:
      "classic children's book illustration, clean linework, storybook charm, timeless",
  };

  try {
    const styleText = STYLE_TEXT[artStyle] ?? STYLE_TEXT.magical;
    const finalPrompt = `${styleText}. ${prompt}. No text, no watermark. Kid-friendly, wholesome.`;

    // TODO: Replace with real API call
    // Example:
    // const response = await fetch('https://api.openai.com/v1/images/generations', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${OPENAI_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     prompt: finalPrompt,
    //     model: 'dall-e-3',
    //     size: '1024x768',
    //     n: 1,
    //   }),
    // });
    // const data = await response.json();
    // return data.data[0].url;

    // For now: Deterministic placeholder using prompt as seed
    // This ensures the same prompt always produces the same "magical" image
    const seed = encodeURIComponent(finalPrompt);
    const imageUrl = `https://picsum.photos/seed/${seed}/600/400?blur=1`;

    return imageUrl;
  } catch (error) {
    console.error("Image generation failed:", error);

    // Fallback: Generic placeholder so reader never breaks
    return `https://picsum.photos/600/400?random=${Date.now()}`;
  }
}

export { generateImageFromAI };
