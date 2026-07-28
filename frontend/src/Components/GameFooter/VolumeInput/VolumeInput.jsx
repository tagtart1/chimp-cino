import React, { useState, useEffect } from "react";
import CustomSlider from "../../CustomSlider/CustomSlider";
import "./VolumeInput.scss";

const volumeBreakpoints = [0, 0.2, 0.4, 0.6, 0.8, 1];
const defaultVolume = 0.6;
const volumeSliderOptions = {
  colors: [
    { value: 0, color: "#f5c84c" },
    { value: 0.2, color: "#e1d64b" },
    { value: 0.4, color: "#bdd84b" },
    { value: 0.6, color: "#88d052" },
    { value: 0.8, color: "#50c166" },
    { value: 1, color: "#2aad72" },
  ],
  breakpoints: volumeBreakpoints,
  inactiveColor: "#304550",
  snapToBreakpoints: true,
  thumbSize: 36,
  trackHeight: 30,
};

const snapVolume = (volume) =>
  volumeBreakpoints.reduce((nearest, breakpoint) =>
    Math.abs(breakpoint - volume) < Math.abs(nearest - volume)
      ? breakpoint
      : nearest
  );

const VolumeIcon = ({ muted }) => (
  <svg
    className={`volume-slider__speaker-icon${
      muted ? " volume-slider__speaker-icon--muted" : ""
    }`}
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M11 5 6 9H2v6h4l5 4V5Z" />
    {muted ? (
      <>
        <path d="m16 9 6 6" />
        <path d="m22 9-6 6" />
      </>
    ) : (
      <>
        <path d="M15.25 9.1a4.1 4.1 0 0 1 0 5.8" />
        <path d="M17.8 6.75a7.35 7.35 0 0 1 0 10.5" />
      </>
    )}
  </svg>
);

const VolumeInput = () => {
  const [volume, setVolume] = useState(fetchVolume);

  useEffect(() => {
    // Set localStorage volume
    setAudioVolume(volume);
  }, [volume]);

  const handleVolumeChange = (value) => {
    setVolume(value);
  };

  return (
    <div className="volume-setting-wrapper">
      <CustomSlider
        className="volume-slider"
        ariaLabel="Volume"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={handleVolumeChange}
        options={volumeSliderOptions}
        thumbIcon={<VolumeIcon muted={volume === 0} />}
        formatValue={(value) => `${Math.round(value * 100)}%`}
      />
    </div>
  );
};

const setAudioVolume = (volume) => {
  if (typeof volume === "number" && volume >= 0 && volume <= 1) {
    localStorage.setItem("audioVolume", volume);
  }
};

const fetchVolume = () => {
  const volume = localStorage.getItem("audioVolume");
  const parsedVolume = parseFloat(volume);
  return Number.isFinite(parsedVolume) &&
    parsedVolume >= 0 &&
    parsedVolume <= 1
    ? snapVolume(parsedVolume)
    : defaultVolume;
};

export default VolumeInput;
