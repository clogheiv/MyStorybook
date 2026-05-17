import { withStoryPageIllustrations } from "./localIllustrations";
const CHILD_NAME_PLACEHOLDER = "{{childName}}";
const CHILD_NAME_PLACEHOLDER_PATTERN = /{{\s*(childName|child['’]s name)\s*}}/gi;

const STORY_CATALOG = [
  {
    id: "a-day-at-the-zoo",
    title: "A Day at the Zoo",
    description: "A bright zoo adventure with monkeys, elephants, giraffes, penguins, lions, and a cozy bedtime ending.",
    artStyle: "cozy",
    estimatedReadTime: 5,
    pages: withStoryPageIllustrations("a-day-at-the-zoo", [
      "The morning sun was already shining when {{childName}} climbed into the car with a big smile.\n\nToday was zoo day.\n\nAnd {{childName}} could hardly wait.",
      "As the zoo gates opened, {{childName}} heard birds chirping, children laughing, and somewhere far away…\n\na lion roaring.\n\nEverything smelled like sunshine, popcorn, and fresh green grass.",
      "The very first animals were the monkeys.\n\nThey swung from ropes, climbed branches, and chattered noisily to one another high above the trees.\n\nOne silly monkey scratched its head and made {{childName}} laugh out loud.",
      "Next came the elephants.\n\nA great big elephant lifted its long trunk and sprayed a sparkling shower of water into the air.\n\nTiny droplets splashed through the sunshine like glittering rain.",
      "Near the tall trees stood a family of giraffes.\n\n{{childName}} tilted farther and farther back trying to see all the way to the top of their long necks.\n\nOne giraffe slowly chewed leaves while blinking calm, sleepy eyes.",
      "At the penguin habitat, little penguins waddled across the rocks with their tiny flippers sticking out at their sides.\n\nOne penguin slipped into the water with a splash and zoomed away like a little feathered torpedo.",
      "The lions rested beneath warm sunny rocks.\n\nTheir golden fur glowed in the afternoon light.\n\nOne enormous lion opened its mouth in a giant yawn before settling back down for another nap.",
      "Bright parrots fluttered and squawked inside a colorful bird garden filled with flowers.\n\nBlue feathers, red feathers, yellow feathers…\n\nEverywhere {{childName}} looked, beautiful colors danced through the air.",
      "By lunchtime, {{childName}} sat at a picnic table enjoying a sandwich, apple slices, and a cold drink.\n\nNearby, flamingos stood quietly in the water balancing on one leg.\n\n“How do they do that?” {{childName}} wondered.",
      "Before leaving, {{childName}} visited the bears.\n\nOne giant brown bear splashed happily in a cool pool while another rolled lazily in the grass.\n\nThe bears looked big and strong…\n\nand surprisingly playful.",
      "As the sun began to lower in the sky, the zoo slowly grew quieter.\n\n{{childName}} waved goodbye to the animals while walking toward the gates.\n\nIt had been such a wonderful day full of amazing surprises.",
      "That night, tucked beneath cozy blankets, {{childName}} closed sleepy eyes and smiled.\n\nIn happy dreams, monkeys swung through trees, penguins splashed in icy water, and giraffes stretched all the way to the clouds.\n\nThe zoo had been even more magical than {{childName}} imagined.",
    ]),
  },
  {
    id: "the-rainy-day-adventure",
    title: "The Rainy Day Adventure",
    description: "A cozy indoor adventure with blanket forts, cocoa, puddles, and a rainbow surprise.",
    artStyle: "cozy",
    estimatedReadTime: 5,
    pages: withStoryPageIllustrations("the-rainy-day-adventure", [
      "Raindrops tapped softly against the window while gray clouds drifted across the sky.\n\n{{childName}} peeked outside and sighed.\n\nThe rainy day had changed all the outdoor plans.",
      "But inside the house, everything felt warm and cozy.\n\nA lamp glowed softly beside the couch while the smell of cinnamon and cocoa floated through the kitchen.\n\nMaybe rainy days could still be special.",
      "{{childName}} gathered blankets, pillows, and cushions from all around the living room.\n\nSoon, a great blanket fort stretched across the couch like a secret castle.\n\nIt was the perfect place for an adventure.",
      "With a flashlight in hand, {{childName}} crawled deep inside the fort.\n\nThe blankets glowed warmly overhead while rain pattered softly outside the windows.\n\nInside the fort felt quiet, magical, and safe.",
      "Sometimes the fort became a pirate ship sailing stormy seas.\n\nOther times it became a hidden cave filled with treasure.\n\n{{childName}} could imagine almost anything inside the cozy little fort.",
      "Later, warm cocoa waited in a favorite mug topped with tiny marshmallows.\n\n{{childName}} wrapped both hands around the warm cup while listening to the rain outside.\n\nThe whole house felt sleepy and peaceful.",
      "Colorful crayons soon covered the table.\n\n{{childName}} drew giant dragons, rainbow forests, silly animals, and floating castles while the rain continued to fall outside.\n\nRainy days were wonderful for imagination.",
      "Music began playing softly somewhere in the house.\n\n{{childName}} slid across the floor in fuzzy socks, spinning and laughing through the living room.\n\nEven the rainy windows seemed to dance with the music.",
      "By afternoon, the rain began to slow.\n\nTiny drops still rolled gently down the windows while pale sunlight peeked through the clouds.\n\nThe whole world outside looked fresh and sparkling clean.",
      "Bundled inside a raincoat and boots, {{childName}} stepped carefully into the cool wet air.\n\nPuddles shimmered like tiny mirrors across the sidewalk.\n\nSPLASH!\n\nWater sprayed everywhere with every happy jump.",
      "Far above the houses, a beautiful rainbow slowly stretched across the sky.\n\n{{childName}} stood quietly beneath the umbrella, smiling up at all the glowing colors.\n\nRainy days could hold beautiful surprises too.",
      "That night, tucked beneath cozy blankets, {{childName}} listened to the soft rain outside the bedroom window.\n\nThe house felt warm, sleepy, and peaceful.\n\nAnd somewhere deep in happy dreams, blanket forts and rainbows waited for tomorrow.",
    ]),
  },
  {
    id: "first-day-of-school",
    title: "The First Day of School",
    description: "A warm first-school-day story about courage, new friends, and coming home proud.",
    artStyle: "cozy",
    estimatedReadTime: 4,
    pages: withStoryPageIllustrations("first-day-of-school", [
      "The morning sun peeked softly through {{childName}}’s bedroom window.\n\nToday was a very special day.\n\nIt was the very first day of school.",
      "A brand-new backpack waited by the door.\n\nInside were shiny crayons, a little notebook, and a lunch packed with love.\n\n{{childName}} put on a favorite pair of shoes and took a deep breath.",
      "Outside, the big yellow school bus rumbled gently down the street.\n\nMom gave {{childName}} a warm hug and a kiss on the forehead.\n\n“Today is going to be wonderful,” she whispered.",
      "The bus doors folded open with a soft whoosh.\n\n“Good morning!” the bus driver said with a friendly smile.\n\n{{childName}} climbed aboard and found a seat by the window.",
      "As the bus rolled along, {{childName}} saw trees swaying, birds flying, and children laughing together.\n\nOne little boy waved.\n\nA little girl scooted over and smiled.\n\n“There’s room right here,” she said.",
      "When the bus arrived at school, the doors opened to a bright, busy building full of colorful drawings and happy voices.\n\nEverything felt new.\n\nAnd a little exciting.",
      "At the classroom door stood a kind teacher with gentle eyes.\n\n“Welcome, {{childName}},” she said warmly.\n\n“We’ve been waiting for you.”",
      "Inside the classroom were books, puzzles, paints, and tiny chairs lined up neatly beside the tables.\n\n{{childName}} painted a picture, sang a song, and listened to a story with the class.\n\nSchool was full of wonderful little surprises.",
      "At lunchtime, {{childName}} sat beside new friends.\n\nThey shared smiles, apple slices, and funny stories about their pets at home.\n\nThe classroom no longer felt unfamiliar.\n\nIt began to feel comfortable.",
      "Outside on the playground, children climbed, swung, and chased one another in the sunshine.\n\n{{childName}} laughed while racing with new friends.",
      "Before long, the school day was over.\n\n{{childName}} could not wait to get home and tell the family about all the wonderful first-day adventures.",
      "That night, tucked safely beneath cozy blankets, {{childName}} smiled sleepily.\n\nSchool was not so scary after all.\n\nIn fact…\n\n{{childName}} could not wait to go back tomorrow.",
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
  const childName = childNameFromSelectedChild(selectedChild);

  return text.replace(CHILD_NAME_PLACEHOLDER_PATTERN, childName);
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
