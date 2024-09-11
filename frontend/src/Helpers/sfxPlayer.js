import gemSFX from "../Audio/gem-sound.mp3";
import bombSFX from "../Audio/bomb-sound.mp3";
import cashoutSFX from "../Audio/cashout-sound.mp3";

const soundManager = {
  sounds: {
    gem: null,
    bomb: null,
    cashout: null,
  },

  initialize() {
    this.sounds.gem = new Audio(gemSFX);
    this.sounds.bomb = new Audio(bombSFX);
    this.sounds.cashout = new Audio(cashoutSFX);

    // Preload the sounds and set initial volume
    Object.values(this.sounds).forEach((audio) => {
      audio.preload = "auto";
      audio.volume = fetchVolume();
      audio.load(); // Preload the audio
    });
  },

  playAudio(key) {
    if (this.sounds[key]) {
      // Create a new Audio instance to allow overlapping
      const audio = new Audio(this.sounds[key].src);
      audio.volume = fetchVolume(); // Set volume from local storage
      audio.play(); // Play the audio
    }
  },
};

const fetchVolume = () => {
  const volume = localStorage.getItem("audioVolume");
  return volume !== null ? parseFloat(volume) : 0.5; // Default to .5
};

export default soundManager;
