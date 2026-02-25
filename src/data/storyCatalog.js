import { withSequentialIllustrationNames } from "./localIllustrations";
const CHILD_NAME_PLACEHOLDER = "{{childName}}";

const STORY_CATALOG = [
  {
    id: "1",
    title: "The Brave Little Turtle",
    description: "A gentle journey about patience, courage, and tiny steady steps.",
    artStyle: "cozy",
    estimatedReadTime: 6,
    personalization: {
      childNamePlaceholder: CHILD_NAME_PLACEHOLDER,
      supportsChildName: true,
    },
    pages: withSequentialIllustrationNames("turtle", [
      { text: "At sunrise, {{childName}} met a little turtle by the pond." },
      { text: "The turtle said, \"I am not fast, but I never stop trying.\"" },
      { text: "{{childName}} and the turtle followed a path through tall grass." },
      { text: "When the wind grew loud, they paused, breathed, and kept going." },
      { text: "At the hilltop, they watched the sky turn warm and gold." },
      { text: "The turtle smiled. \"Brave means taking one more step.\"" },
      { text: "{{childName}} whispered, \"I can do that too.\"" },
      { text: "They walked home slowly, proud and peaceful under evening stars." },
    ]),
  },
  {
    id: "2",
    title: "Rocket Dog to the Rescue",
    description: "A playful night mission where kindness saves the day.",
    artStyle: "bold_adventure",
    estimatedReadTime: 7,
    personalization: {
      childNamePlaceholder: CHILD_NAME_PLACEHOLDER,
      supportsChildName: true,
    },
    pages: withSequentialIllustrationNames("rocket", [
      { text: "Rocket Dog zoomed in wearing a tiny silver cape." },
      { text: "{{childName}} pointed at the moon. \"Someone needs help up there!\"" },
      { text: "With a gentle whoosh, Rocket Dog leaped onto a cloud ladder." },
      { text: "A lost firefly blinked sadly near the sleepy moon gate." },
      { text: "{{childName}} cupped both hands and made a warm little shelter." },
      { text: "The firefly rested, then glowed brighter than before." },
      { text: "Rocket Dog guided the firefly back to its lantern tree." },
      { text: "Mission complete, everyone shared cocoa and a quiet laugh." },
    ]),
  },
  {
    id: "3",
    title: "Emma and the Moon Garden",
    description: "A dreamy bedtime walk through glowing flowers and calm skies.",
    artStyle: "magical",
    estimatedReadTime: 6,
    personalization: {
      childNamePlaceholder: CHILD_NAME_PLACEHOLDER,
      supportsChildName: true,
    },
    pages: withSequentialIllustrationNames("moon", [
      { text: "In the moon garden, every flower opened only at night." },
      { text: "{{childName}} touched a silver petal and heard a tiny chime." },
      { text: "Lantern bees floated by, painting soft light across the path." },
      { text: "A fountain sang slow notes like a gentle lullaby." },
      { text: "{{childName}} planted one small seed beside the shining stones." },
      { text: "The seed grew a star-shaped blossom before their eyes." },
      { text: "The garden keeper bowed. \"You brought kindness, so it bloomed.\"" },
      { text: "{{childName}} waved goodnight and carried that calm glow home." },
    ]),
  },
  {
    id: "4",
    title: "Noah's Secret Treehouse",
    description: "A cozy hideout story about friendship, creativity, and quiet joy.",
    artStyle: "classic",
    estimatedReadTime: 5,
    personalization: {
      childNamePlaceholder: CHILD_NAME_PLACEHOLDER,
      supportsChildName: true,
    },
    pages: withSequentialIllustrationNames("treehouse", [
      { text: "{{childName}} found a hidden ladder behind old ivy leaves." },
      { text: "At the top, a treehouse waited with round windows and cushions." },
      { text: "Inside was a map marked, \"Best place for stories.\"" },
      { text: "{{childName}} read aloud while rain tapped softly on the roof." },
      { text: "Soon two squirrels arrived and listened from a tiny bench." },
      { text: "They built paper boats and sailed them in a teacup pond." },
      { text: "When the clouds cleared, the sunset painted the room amber." },
      { text: "{{childName}} locked the tiny door with a happy sigh." },
    ]),
  },
  {
    id: "5",
    title: "The Library of Laughing Clouds",
    description: "A whimsical shelf of stories where every page feels warm and safe.",
    artStyle: "magical",
    estimatedReadTime: 7,
    personalization: {
      childNamePlaceholder: CHILD_NAME_PLACEHOLDER,
      supportsChildName: true,
    },
    pages: withSequentialIllustrationNames("clouds", [
      { text: "{{childName}} climbed a spiral stair made of quiet clouds." },
      { text: "Rows of floating books hummed like a distant lullaby." },
      { text: "A librarian owl offered a bookmark shaped like a moon." },
      { text: "\"Choose a story that makes your heart feel light,\" she said." },
      { text: "{{childName}} opened a book and heard soft laughter in the air." },
      { text: "The clouds giggled kindly whenever a brave choice was made." },
      { text: "By the final page, the whole room glowed honey-gold." },
      { text: "{{childName}} borrowed that glow and tucked it into bedtime." },
    ]),
  },
];

const fallbackCreatedAtForIndex = (index) => 1704067200000 + index * 86400000;

const childNameFromSelectedChild = (selectedChild) => {
  if (selectedChild && typeof selectedChild === "object") {
    if (typeof selectedChild.name === "string" && selectedChild.name.trim()) {
      return selectedChild.name.trim();
    }
    if (selectedChild.id != null && String(selectedChild.id).trim()) {
      return String(selectedChild.id).trim();
    }
  }
  if (typeof selectedChild === "string" && selectedChild.trim()) {
    return selectedChild.trim();
  }
  return "friend";
};

const personalizeText = (text, selectedChild) => {
  if (typeof text !== "string") return text;
  return text.split(CHILD_NAME_PLACEHOLDER).join(childNameFromSelectedChild(selectedChild));
};

const normalizeCatalogStory = (story, index) => {
  const normalizedPages = Array.isArray(story?.pages)
    ? story.pages
        .map((page) => {
          if (typeof page === "string") {
            return { text: page };
          }
          if (page && typeof page === "object" && typeof page.text === "string") {
            return { ...page, text: page.text };
          }
          return null;
        })
        .filter(Boolean)
    : [];

  return {
    ...story,
    id: String(story.id),
    title: String(story.title),
    description: typeof story.description === "string" ? story.description : "",
    pages: normalizedPages,
    artStyle: typeof story.artStyle === "string" ? story.artStyle : "magical",
    estimatedReadTime: Number.isFinite(Number(story.estimatedReadTime))
      ? Number(story.estimatedReadTime)
      : 5,
    personalization: {
      childNamePlaceholder: CHILD_NAME_PLACEHOLDER,
      supportsChildName: true,
      ...(story?.personalization && typeof story.personalization === "object"
        ? story.personalization
        : {}),
    },
    createdAt: Number.isFinite(Number(story.createdAt))
      ? Number(story.createdAt)
      : fallbackCreatedAtForIndex(index),
  };
};

export const loadStoryCatalog = () => STORY_CATALOG.map(normalizeCatalogStory);

export const catalogStoryById = () => {
  const map = new Map();
  loadStoryCatalog().forEach((story) => {
    map.set(String(story.id), story);
  });
  return map;
};

export const personalizeStoryForChild = (story, selectedChild) => {
  if (!story || typeof story !== "object") return story;
  return {
    ...story,
    title: personalizeText(story.title, selectedChild),
    description: personalizeText(story.description, selectedChild),
    pages: Array.isArray(story.pages)
      ? story.pages.map((page) => {
          if (typeof page === "string") {
            return personalizeText(page, selectedChild);
          }
          if (page && typeof page === "object") {
            return {
              ...page,
              text: personalizeText(page.text, selectedChild),
              prompt: personalizeText(page.prompt, selectedChild),
            };
          }
          return page;
        })
      : [],
  };
};
