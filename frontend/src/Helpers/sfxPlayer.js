import gemSFX from "../Audio/gem-sound.mp3";
import bombSFX from "../Audio/bomb-sound.mp3";
import cashoutSFX from "../Audio/cashout-sound.mp3";

const soundManager = {
  sounds: {
    gem: gemSFX,
    bomb: bombSFX,
    cashout: cashoutSFX,
  },

  playAudio(key) {
    const audio = new Audio(this.sounds[key]);
    audio.volume = fetchVolume();
    audio.play();
  },
};

const fetchVolume = () => {
  const volume = localStorage.getItem("audioVolume");
  return volume !== null ? parseFloat(volume) : 0.5; // Default to .5
};

export default soundManager;
