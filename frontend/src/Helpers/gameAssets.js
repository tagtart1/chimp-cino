import cardBack from "../images/card-back-chimps2.svg";
import gem from "../images/gem.svg";
import mine from "../images/mine.svg";
import mineExplosion from "../images/mineExplosion.CTwuSNug.gif";

export const gameAssetUrls = Object.freeze({
  cardBack,
  gem,
  mine,
  mineExplosion,
});

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
    preloadPromise = Promise.all(
      Object.values(gameAssetUrls).map(preloadImage)
    );
  }

  return preloadPromise;
};
