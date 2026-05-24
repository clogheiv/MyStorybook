import {
  withSequentialIllustrationNames,
  withStoryPageIllustrations,
} from "./localIllustrations";
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
  {
    id: "a-day-at-the-farm",
    title: "A Day at the Farm",
    description: "A sunny farm visit with chickens, goats, cows, a tractor ride, muddy piglets, and a peaceful hayride.",
    artStyle: "cozy",
    estimatedReadTime: 5,
    pages: withStoryPageIllustrations("a-day-at-the-farm", [
      "Early in the morning, {{childName}} bounced excitedly down the farm driveway.\n\nA bright red barn stood beside wide green fields while the smell of fresh hay drifted through the air.\n\nToday was farm day.",
      "“Cock-a-doodle-doo!”\n\nA rooster flapped its feathers and crowed proudly from the fence post while chickens scratched busily in the dirt below.\n\n{{childName}} laughed at all the noisy morning sounds.",
      "Soon it was time to feed the chickens.\n\nTiny chicks hurried around {{childName}}’s boots, peeping softly while searching for scattered grain.\n\nTheir fluffy feathers looked as soft as little clouds.",
      "Inside the chicken coop, warm eggs rested carefully in the straw.\n\n{{childName}} gently placed each egg into a basket while trying very hard not to drop a single one.\n\nThe farmer smiled proudly.",
      "Near the barn fence, playful baby goats bounced and hopped through the grass.\n\nOne little goat stretched up on its tiny back legs and tried nibbling {{childName}}’s sleeve.\n\nIt made everyone laugh.",
      "Farther down the path stood enormous cows slowly chewing hay beneath the shade trees.\n\nOne curious calf waddled over to sniff {{childName}}’s hand with its big wet nose.\n\nIts ears twitched happily.",
      "Next came the tractor ride.\n\nThe tractor rumbled loudly across the fields while tall grass swayed in the warm breeze all around them.\n\n{{childName}} held on tightly and grinned from ear to ear.",
      "Near the muddy pen, pink piglets splashed and rolled through puddles with happy squeals.\n\nMud flew everywhere.\n\nOne piglet slipped sideways and landed with a funny SPLAT.",
      "A sleepy orange barn cat quietly followed {{childName}} through the farmyard.\n\nSometimes it rubbed against {{childName}}’s legs.\n\nSometimes it disappeared beneath the old wooden porch.\n\nBut somehow it always came back.",
      "Later, everyone climbed aboard a hayride wagon filled with soft golden straw.\n\nThe wagon rolled slowly past waving fields, old fences, and fluttering scarecrows beneath the bright blue sky.\n\nEverything felt peaceful and wide open.",
      "By afternoon, the farm stand was filled with fresh lemonade, apples, homemade jam, and warm pies cooling beside the windows.\n\n{{childName}} sat beneath a shady tree sipping cold lemonade while watching the animals wander through the fields.",
      "As the sun began to lower, {{childName}} waved goodbye to the farm.\n\nThe animals, the tractor, the barn, and the rolling green fields slowly disappeared down the road behind them.\n\n“I can’t wait to come back,” {{childName}} said with a happy smile.",
    ]),
  },
  {
    id: "the-campout-in-the-backyard",
    title: "The Campout in the Backyard",
    description: "A cozy backyard camping story with a tent, fireflies, flashlight shadows, stars, and a sleepy goodnight.",
    artStyle: "cozy",
    estimatedReadTime: 5,
    pages: withStoryPageIllustrations("the-campout-in-the-backyard", [
      "The backyard looked different as the evening sky turned soft and golden.\n\n{{childName}} helped carry blankets, pillows, and a little lantern outside.\n\nTonight was a backyard campout.",
      "A small tent stood beneath the trees with its door flap open wide.\n\n{{childName}} crawled inside and made a cozy nest with blankets and a favorite stuffed animal.\n\nThe tent felt like a tiny house under the sky.",
      "As the sun slipped lower, fireflies began blinking over the grass.\n\n{{childName}} watched their tiny lights float and disappear like little stars practicing for nighttime.\n\nOne firefly glowed right beside the tent.",
      "Soon it was time for campout snacks.\n\n{{childName}} sat on a picnic blanket with fruit, crackers, and a cup of cocoa.\n\nEverything tasted better outside in the cool evening air.",
      "A flashlight made funny shadows dance across the tent wall.\n\n{{childName}} moved their hands and giggled as the shadows stretched tall, tiny, wiggly, and wide.\n\nEven the stuffed animal seemed to be watching.",
      "The crickets started chirping from the bushes.\n\n{{childName}} listened carefully and tried to count each chirp.\n\nThe whole backyard sounded like a tiny nighttime orchestra.",
      "A gentle breeze rustled the leaves above the tent.\n\n{{childName}} peeked out and saw the moon rising over the roof.\n\nIt looked calm and bright, like it was keeping watch.",
      "Everyone gathered close for a quiet story under the stars.\n\n{{childName}} held the blanket snug beneath their chin.\n\nThe story sounded softer outside, with the night all around.",
      "A sleepy dog padded across the yard and curled up beside the tent.\n\n{{childName}} reached out to give one gentle pat.\n\nThe dog sighed happily and closed its eyes.",
      "The stars grew brighter as the backyard became still.\n\n{{childName}} pointed up and found one star that seemed to twinkle extra bright.\n\nMaybe it was saying goodnight.",
      "Inside the tent, the lantern glowed softly beside the blankets.\n\n{{childName}} snuggled down and listened to the crickets, the leaves, and the quiet night.\n\nThe backyard felt peaceful and safe.",
      "“This was the best campout,” {{childName}} said with a happy grin.\n\nThere had been fireflies, crickets, stars, snacks, stories, and a tent right in the backyard.\n\n{{childName}} already could not wait until the next adventure under the night sky. 🌙✨",
    ]),
  },
  {
    id: "my-first-monster-truck-show",
    title: "My First Monster Truck Show",
    description: "A big, cheerful arena adventure with giant tires, colorful trucks, muddy splashes, and a roaring finale.",
    artStyle: "cozy",
    estimatedReadTime: 5,
    pages: withSequentialIllustrationNames("monster_truck_placeholder", [
      "The arena lights glowed bright as {{childName}} walked inside for the very first monster truck show.\n\nHuge tires towered near the track, and colorful trucks waited under the sparkling lights.\n\nEverything felt big, loud, and exciting.",
      "A deep rumble shook the seats as the first monster truck rolled forward.\n\n{{childName}} covered their ears and grinned as the engine roared like thunder.\n\nThe whole crowd cheered together.",
      "One blue truck bounced over a row of dirt bumps with its giant wheels rolling high.\n\n{{childName}} watched the truck climb, dip, and rumble across the track.\n\nIt looked like a toy truck come to life.",
      "Then a bright red truck drove slowly around the arena waving to the crowd.\n\n{{childName}} waved back as the driver gave a friendly thumbs-up from the window.\n\nThe truck’s headlights shined like happy eyes.",
      "Soon the trucks lined up for the jump ramp.\n\n{{childName}} held their breath as one monster truck climbed the ramp and flew through the air.\n\nFor one amazing moment, it looked like the truck was touching the lights.",
      "The truck landed with a giant BOOM that made the dirt puff up beneath its tires.\n\n{{childName}} laughed and clapped as the crowd jumped to its feet.\n\nEven the floor seemed to cheer.",
      "Next came the muddy part of the track.\n\nA green truck spun its huge tires and splashed mud in every direction.\n\n{{childName}} giggled as muddy drops flew across the bright arena lights.",
      "During a quiet break, {{childName}} got to see a monster truck up close.\n\nThe tire was taller than them, with deep grooves big enough to hide tiny shadows.\n\nIt was the biggest wheel they had ever seen.",
      "A small toy monster truck waited at the souvenir table.\n\n{{childName}} held it carefully and rolled it across their lap.\n\nNow there was a little truck to remember the big show.",
      "For the finale, all the monster trucks rolled out together in a colorful parade.\n\n{{childName}} saw red, blue, green, yellow, and purple trucks rumbling side by side.\n\nThe arena sparkled with lights, cheers, and engine sounds.",
      "When the final horn sounded, the trucks parked beneath the glowing lights.\n\n{{childName}} clapped as hard as they could, still smiling from all the jumps and rumbles.\n\nThe first monster truck show had been even better than imagined.",
      "“I want to come back again,” {{childName}} said with a happy grin.\n\nThere had been giant tires, roaring engines, flying jumps, muddy splashes, and cheers all around.\n\nIt was an adventure they would never forget. 🛞✨",
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
