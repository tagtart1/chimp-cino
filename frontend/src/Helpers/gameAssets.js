import cardBack from "../images/card-back-chimps2.svg";
import gem from "../images/gem.svg";
import gemGold from "../images/gem-gold.svg";
import gemPink from "../images/gem-pink.svg";
import gemPurple from "../images/gem-purple.svg";
import gemRed from "../images/gem-red.svg";
import mine from "../images/mine.svg";
import mineExplosion from "../images/mineExplosion.CTwuSNug.gif";

export const gameAssetUrls = Object.freeze({
  cardBack,
  gem,
  gemGold,
  gemPink,
  gemPurple,
  gemRed,
  mine,
  mineExplosion,
});

const preloadableGameAssetUrls = [
  cardBack,
  gem,
  gemGold,
  gemPink,
  gemPurple,
  gemRed,
  mine,
];

const preloadImage = async (src) => {
  const image = new Image();
  image.src = src;

  if (typeof image.decode === "function") {
    try {
      await image.decode();
      return;
    } catch {
      // Fall back to the load event for browsers that reject decode().
    }
  }

  if (image.complete) return;

  await new Promise((resolve) => {
    image.onload = resolve;
    image.onerror = resolve;
  });
};

let preloadPromise;

export const preloadGameAssets = () => {
  if (!preloadPromise) {
    preloadPromise = Promise.all(preloadableGameAssetUrls.map(preloadImage));
  }

  return preloadPromise;
};
