const DEFAULT_ILLUSTRATION = require("../../assets/icon.png");

const padIndex = (index) => String(index).padStart(2, "0");

const buildSequentialNames = (prefix, count) =>
  Array.from({ length: count }, (_, index) => `${prefix}_${padIndex(index + 1)}.png`);

const buildAssetEntries = (names, source) =>
  names.reduce((accumulator, name) => {
    accumulator[name] = source;
    return accumulator;
  }, {});

const LOCAL_ILLUSTRATION_ASSETS = Object.freeze({
  ...buildAssetEntries(buildSequentialNames("turtle", 32), DEFAULT_ILLUSTRATION),
  ...buildAssetEntries(buildSequentialNames("rocket", 32), DEFAULT_ILLUSTRATION),
  ...buildAssetEntries(buildSequentialNames("moon", 32), DEFAULT_ILLUSTRATION),
  ...buildAssetEntries(buildSequentialNames("treehouse", 32), DEFAULT_ILLUSTRATION),
  ...buildAssetEntries(buildSequentialNames("clouds", 32), DEFAULT_ILLUSTRATION),
  ...buildAssetEntries(buildSequentialNames("zoo", 32), DEFAULT_ILLUSTRATION),
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

const resolveLocalIllustrationAsset = (assetName) => {
  if (typeof assetName !== "string" || !assetName.trim()) return null;
  return LOCAL_ILLUSTRATION_ASSETS[assetName.trim()] || DEFAULT_ILLUSTRATION;
};

export { resolveLocalIllustrationAsset, withSequentialIllustrationNames };
