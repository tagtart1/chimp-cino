import "./CustomSlider.scss";

const DEFAULT_OPTIONS = {
  breakpoints: [],
  colors: [
    { value: 0, color: "#ffc800" },
    { value: 1, color: "#00e701" },
  ],
  inactiveColor: "#304550",
  thumbSize: 32,
  trackHeight: 28,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const CustomSlider = ({
  ariaLabel,
  className = "",
  disabled = false,
  formatValue,
  max = 100,
  min = 0,
  onChange,
  options = DEFAULT_OPTIONS,
  step = 1,
  value,
}) => {
  const range = max - min || 1;
  const numericValue = Number(value);
  const currentValue = Number.isFinite(numericValue)
    ? clamp(numericValue, min, max)
    : min;
  const currentPercent = ((currentValue - min) / range) * 100;
  const sliderOptions = { ...DEFAULT_OPTIONS, ...options };
  const colors = sliderOptions.colors?.length
    ? sliderOptions.colors
    : DEFAULT_OPTIONS.colors;
  const breakpoints = Array.isArray(sliderOptions.breakpoints)
    ? sliderOptions.breakpoints
    : DEFAULT_OPTIONS.breakpoints;
  const toPercent = (optionValue) =>
    clamp(((optionValue - min) / range) * 100, 0, 100);
  const gradient = `linear-gradient(90deg, ${colors
    .map(
      ({ color, value: colorValue }) =>
        `${color} ${toPercent(colorValue)}%`
    )
    .join(", ")})`;

  return (
    <div
      className={`custom-slider${className ? ` ${className}` : ""}${
        currentPercent === 0 ? " is-empty" : ""
      }`}
      style={{
        "--custom-slider-gradient": gradient,
        "--custom-slider-inactive": sliderOptions.inactiveColor,
        "--custom-slider-progress": `${currentPercent}%`,
        "--custom-slider-thumb-size": `${sliderOptions.thumbSize}px`,
        "--custom-slider-track-height": `${sliderOptions.trackHeight}px`,
      }}
    >
      <div className="custom-slider__track" aria-hidden="true">
        <span className="custom-slider__inactive-track" />
        <span className="custom-slider__breakpoints">
          {breakpoints.map((breakpoint) => (
            <span
              key={breakpoint}
              style={{ left: `${toPercent(breakpoint)}%` }}
            />
          ))}
        </span>
      </div>
      <input
        className="custom-slider__input"
        type="range"
        aria-label={ariaLabel}
        aria-valuetext={
          formatValue ? formatValue(currentValue) : String(currentValue)
        }
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={(event) => onChange?.(Number(event.target.value))}
      />
    </div>
  );
};

export default CustomSlider;
