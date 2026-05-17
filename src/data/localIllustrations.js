const DEFAULT_ILLUSTRATION = require("../../assets/adaptive-icon.png");

const padIndex = (index) => String(index).padStart(2, "0");

const LOCAL_ILLUSTRATION_ASSETS = Object.freeze({});

const A_DAY_AT_THE_ZOO_ASSETS = Object.freeze({
  1: {
    boy: require("../../assets/stories/a-day-at-the-zoo/page-01-boy.png"),
    girl: require("../../assets/stories/a-day-at-the-zoo/page-01-girl.png"),
  },
  2: {
    boy: require("../../assets/stories/a-day-at-the-zoo/page-02-boy.png"),
    girl: require("../../assets/stories/a-day-at-the-zoo/page-02-girl.png"),
  },
  3: {
    boy: require("../../assets/stories/a-day-at-the-zoo/page-03-boy.png"),
    girl: require("../../assets/stories/a-day-at-the-zoo/page-03-girl.png"),
  },
  4: {
    boy: require("../../assets/stories/a-day-at-the-zoo/page-04-boy.png"),
    girl: require("../../assets/stories/a-day-at-the-zoo/page-04-girl.png"),
  },
  5: {
    boy: require("../../assets/stories/a-day-at-the-zoo/page-05-boy.png"),
    girl: require("../../assets/stories/a-day-at-the-zoo/page-05-girl.png"),
  },
  6: {
    boy: require("../../assets/stories/a-day-at-the-zoo/page-06-boy.png"),
    girl: require("../../assets/stories/a-day-at-the-zoo/page-06-girl.png"),
  },
  7: {
    boy: require("../../assets/stories/a-day-at-the-zoo/page-07-boy.png"),
    girl: require("../../assets/stories/a-day-at-the-zoo/page-07-girl.png"),
  },
  8: {
    boy: require("../../assets/stories/a-day-at-the-zoo/page-08-boy.png"),
    girl: require("../../assets/stories/a-day-at-the-zoo/page-08-girl.png"),
  },
  9: {
    boy: require("../../assets/stories/a-day-at-the-zoo/page-09-boy.png"),
    girl: require("../../assets/stories/a-day-at-the-zoo/page-09-girl.png"),
  },
  10: {
    boy: require("../../assets/stories/a-day-at-the-zoo/page-10-boy.png"),
    girl: require("../../assets/stories/a-day-at-the-zoo/page-10-girl.png"),
  },
  11: {
    boy: require("../../assets/stories/a-day-at-the-zoo/page-11-boy.png"),
    girl: require("../../assets/stories/a-day-at-the-zoo/page-11-girl.png"),
  },
  12: {
    boy: require("../../assets/stories/a-day-at-the-zoo/page-12-boy.png"),
    girl: require("../../assets/stories/a-day-at-the-zoo/page-12-girl.png"),
  },
});

const THE_RAINY_DAY_ADVENTURE_ASSETS = Object.freeze({
  1: {
    boy: require("../../assets/stories/the-rainy-day-adventure/page-01-boy.png"),
    girl: require("../../assets/stories/the-rainy-day-adventure/page-01-girl.png"),
  },
  2: {
    boy: require("../../assets/stories/the-rainy-day-adventure/page-02-boy.png"),
    girl: require("../../assets/stories/the-rainy-day-adventure/page-02-girl.png"),
  },
  3: {
    boy: require("../../assets/stories/the-rainy-day-adventure/page-03-boy.png"),
    girl: require("../../assets/stories/the-rainy-day-adventure/page-03-girl.png"),
  },
  4: {
    boy: require("../../assets/stories/the-rainy-day-adventure/page-04-boy.png"),
    girl: require("../../assets/stories/the-rainy-day-adventure/page-04-girl.png"),
  },
  5: {
    boy: require("../../assets/stories/the-rainy-day-adventure/page-05-boy.png"),
    girl: require("../../assets/stories/the-rainy-day-adventure/page-05-girl.png"),
  },
  6: {
    boy: require("../../assets/stories/the-rainy-day-adventure/page-06-boy.png"),
    girl: require("../../assets/stories/the-rainy-day-adventure/page-06-girl.png"),
  },
  7: {
    boy: require("../../assets/stories/the-rainy-day-adventure/page-07-boy.png"),
    girl: require("../../assets/stories/the-rainy-day-adventure/page-07-girl.png"),
  },
  8: {
    boy: require("../../assets/stories/the-rainy-day-adventure/page-08-boy.png"),
    girl: require("../../assets/stories/the-rainy-day-adventure/page-08-girl.png"),
  },
  9: {
    boy: require("../../assets/stories/the-rainy-day-adventure/page-09-boy.png"),
    girl: require("../../assets/stories/the-rainy-day-adventure/page-09-girl.png"),
  },
  10: {
    boy: require("../../assets/stories/the-rainy-day-adventure/page-10-boy.png"),
    girl: require("../../assets/stories/the-rainy-day-adventure/page-10-girl.png"),
  },
  11: {
    boy: require("../../assets/stories/the-rainy-day-adventure/page-11-boy.png"),
    girl: require("../../assets/stories/the-rainy-day-adventure/page-11-girl.png"),
  },
  12: {
    boy: require("../../assets/stories/the-rainy-day-adventure/page-12-boy.png"),
    girl: require("../../assets/stories/the-rainy-day-adventure/page-12-girl.png"),
  },
});

const FIRST_DAY_OF_SCHOOL_ASSETS = Object.freeze({
  1: {
    boy: require("../../assets/stories/first-day-of-school/page-01-boy.png"),
    girl: require("../../assets/stories/first-day-of-school/page-01-girl.png"),
  },
  2: {
    boy: require("../../assets/stories/first-day-of-school/page-02-boy.png"),
    girl: require("../../assets/stories/first-day-of-school/page-02-girl.png"),
  },
  3: {
    boy: require("../../assets/stories/first-day-of-school/page-03-boy.png"),
    girl: require("../../assets/stories/first-day-of-school/page-03-girl.png"),
  },
  4: {
    boy: require("../../assets/stories/first-day-of-school/page-04-boy.png"),
    girl: require("../../assets/stories/first-day-of-school/page-04-girl.png"),
  },
  5: {
    boy: require("../../assets/stories/first-day-of-school/page-05-boy.png"),
    girl: require("../../assets/stories/first-day-of-school/page-05-girl.png"),
  },
  6: {
    boy: require("../../assets/stories/first-day-of-school/page-06-boy.png"),
    girl: require("../../assets/stories/first-day-of-school/page-06-girl.png"),
  },
  7: {
    boy: require("../../assets/stories/first-day-of-school/page-07-boy.png"),
    girl: require("../../assets/stories/first-day-of-school/page-07-girl.png"),
  },
  8: {
    boy: require("../../assets/stories/first-day-of-school/page-08-boy.png"),
    girl: require("../../assets/stories/first-day-of-school/page-08-girl.png"),
  },
  9: {
    boy: require("../../assets/stories/first-day-of-school/page-09-boy.png"),
    girl: require("../../assets/stories/first-day-of-school/page-09-girl.png"),
  },
  10: {
    boy: require("../../assets/stories/first-day-of-school/page-10-boy.png"),
    girl: require("../../assets/stories/first-day-of-school/page-10-girl.png"),
  },
  11: {
    boy: require("../../assets/stories/first-day-of-school/page-11-boy.png"),
    girl: require("../../assets/stories/first-day-of-school/page-11-girl.png"),
  },
  12: {
    boy: require("../../assets/stories/first-day-of-school/page-12-boy.png"),
    girl: require("../../assets/stories/first-day-of-school/page-12-girl.png"),
  },
});

const STORY_ILLUSTRATION_ASSETS = Object.freeze({
  "a-day-at-the-zoo": A_DAY_AT_THE_ZOO_ASSETS,
  "first-day-of-school": FIRST_DAY_OF_SCHOOL_ASSETS,
  "the-rainy-day-adventure": THE_RAINY_DAY_ADVENTURE_ASSETS,
});

const normalizePage = (page) => {
  if (typeof page === "string") {
    return { text: page };
  }
  if (page && typeof page === "object" && typeof page.text === "string") {
    return { ...page, text: page.text };
  }
  return null;
};

const withSequentialIllustrationNames = (prefix, pages) => {
  if (!Array.isArray(pages)) return [];

  return pages
    .map((page, index) => {
      const normalizedPage = normalizePage(page);
      if (!normalizedPage) return null;

      return {
        ...normalizedPage,
        illustrationAssetName: `${prefix}_${padIndex(index + 1)}.png`,
      };
    })
    .filter(Boolean);
};

const withStoryPageIllustrations = (storyId, pages) => {
  if (!Array.isArray(pages)) return [];

  return pages
    .map((page, index) => {
      const normalizedPage = normalizePage(page);
      if (!normalizedPage) return null;

      return {
        ...normalizedPage,
        illustrationStoryId: storyId,
        illustrationPageNumber: index + 1,
      };
    })
    .filter(Boolean);
};

const resolveLocalIllustrationAsset = (assetName) => {
  if (typeof assetName !== "string" || !assetName.trim()) return null;
  return LOCAL_ILLUSTRATION_ASSETS[assetName.trim()] || DEFAULT_ILLUSTRATION;
};

const resolveStoryPageIllustrationAsset = ({ storyId, pageNumber, gender }) => {
  if (typeof storyId !== "string" || !storyId.trim()) return null;
  const pageAssets = STORY_ILLUSTRATION_ASSETS[storyId.trim()]?.[Number(pageNumber)];
  if (!pageAssets) return null;
  return pageAssets[gender === "girl" ? "girl" : "boy"] || pageAssets.boy || null;
};

export {
  resolveLocalIllustrationAsset,
  resolveStoryPageIllustrationAsset,
  withStoryPageIllustrations,
  withSequentialIllustrationNames,
};
