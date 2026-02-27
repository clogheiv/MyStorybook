import { withSequentialIllustrationNames } from "./localIllustrations";
const CHILD_NAME_PLACEHOLDER = "{{childName}}";

const STORY_CATALOG = [];

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
