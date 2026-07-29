import {
  gameAssetUrls,
  preloadGameAssets,
} from "./gameAssets";

describe("preloadGameAssets", () => {
  it("does not pre-play the one-shot explosion GIF", async () => {
    const loadedSources = [];
    const OriginalImage = global.Image;

    global.Image = class MockImage {
      set src(value) {
        loadedSources.push(value);
      }

      decode() {
        return Promise.resolve();
      }
    };

    try {
      await preloadGameAssets();
    } finally {
      global.Image = OriginalImage;
    }

    expect(loadedSources).toContain(gameAssetUrls.gem);
    expect(loadedSources).not.toContain(gameAssetUrls.mineExplosion);
  });
});
