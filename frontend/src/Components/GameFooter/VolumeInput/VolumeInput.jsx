import React, { useState, useEffect, useRef } from "react";
import "./VolumeInput.scss";

const defaultVolume = 0.5;

const VolumeInput = () => {
  const [volume, setVolume] = useState(fetchVolume);
  const inputRef = useRef(null);
  useEffect(() => {
    // Set localStorage volume
    setAudioVolume(volume);

    if (inputRef.current) {
      inputRef.current.style.setProperty("--current", `${volume * 100}%`);
    }
  }, [volume]);

  const handleVolumeChange = (e) => {
    const element = e.target;

    const value = parseFloat(element.value);
    if (value > 0) {
      setAudioBeforeMute(0.5);
    }
    setVolume(value);
  };

  const handleMute = () => {
    if (volume !== 0) {
      setAudioBeforeMute(volume);
      setVolume(0);
    } else {
      // Unmuting
      const audio = fetchAudioBeforeMute();
      if (audio) {
        setVolume(audio);
      }
    }
  };

  return (
    <div className="volume-setting-wrapper">
      <button onClick={handleMute}>
        {volume > 0 ? (
          <svg fill="currentColor" viewBox="0 0 64 64">
            <path d="M0 20.8v22.4h16L35.2 56V8L16 20.8H0ZM41.6 9.6v8C49.552 17.6 56 24.048 56 32s-6.448 14.4-14.4 14.4v8C53.972 54.4 64 44.372 64 32 64 19.628 53.972 9.6 41.6 9.6ZM41.574 24a8 8 0 0 1 0 16V24Z"></path>
          </svg>
        ) : (
          <svg fill="currentColor" viewBox="0 0 64 64" className="muted">
            <path d="M0 42.987V21.013h15.706l18.826-12.56v47.094l-18.826-12.56H0Zm58.986-21.656L64 26.345l-6.666 6.666L64 39.705l-5.014 5.014-6.694-6.666-6.666 6.666-5.04-5.014 6.694-6.694-6.694-6.666 5.04-5.014 6.666 6.666 6.694-6.666Z"></path>
          </svg>
        )}
      </button>
      <input
        ref={inputRef}
        id="volume-range-input"
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={handleVolumeChange}
      />
    </div>
  );
};

const setAudioVolume = (volume) => {
  if (typeof volume === "number" && volume >= 0 && volume <= 1) {
    localStorage.setItem("audioVolume", volume);
  }
};

const setAudioBeforeMute = (volume) => {
  if (typeof volume === "number" && volume >= 0 && volume <= 1) {
    localStorage.setItem("audioBeforeMute", volume);
  }
};

const fetchAudioBeforeMute = () => {
  const volume = localStorage.getItem("audioBeforeMute");
  return parseFloat(volume);
};

const fetchVolume = () => {
  const volume = localStorage.getItem("audioVolume");
  return volume !== null ? parseFloat(volume) : defaultVolume; // Default to .5
};

export default VolumeInput;
