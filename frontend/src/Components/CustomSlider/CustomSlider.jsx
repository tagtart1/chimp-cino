import "./CustomSlider.scss";

const DEFAULT_OPTIONS = {
  breakpoints: [],
  colors: [
    { value: 0, color: "#ffc800" },
    { value: 1, color: "#00e701" },
  ],
  inactiveColor: "#304550",
  showEndpointBreakpoints: false,
  snapToBreakpoints: false,
  thumbBackground: "rgba(255, 255, 255, 0.9)",
  thumbColor: "#263d49",
  thumbSize: 32,
  trackHeight: 28,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const getBreakpointValue = (breakpoint) =>
  typeof breakpoint === "number" ? breakpoint : breakpoint.value;

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
  thumbIcon = null,
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
  const breakpointValues = breakpoints
    .map(getBreakpointValue)
    .filter(Number.isFinite)
    .map((breakpoint) => clamp(breakpoint, min, max))
    .sort((first, second) => first - second);
  const visibleBreakpointValues = sliderOptions.showEndpointBreakpoints
    ? breakpointValues
    : breakpointValues.filter(
        (breakpoint) => breakpoint > min && breakpoint < max
      );
  const shouldSnap =
    sliderOptions.snapToBreakpoints && breakpointValues.length > 0;
  const toPercent = (optionValue) =>
    clamp(((optionValue - min) / range) * 100, 0, 100);
  const snapToNearestBreakpoint = (nextValue) =>
    breakpointValues.reduce((nearest, breakpoint) =>
      Math.abs(breakpoint - nextValue) < Math.abs(nearest - nextValue)
        ? breakpoint
        : nearest
    );
  const gradient = `linear-gradient(90deg, ${colors
    .map(
      ({ color, value: colorValue }) =>
        `${color} ${toPercent(colorValue)}%`
    )
    .join(", ")})`;
  const handleChange = (nextValue) => {
    onChange?.(
      shouldSnap ? snapToNearestBreakpoint(nextValue) : nextValue
    );
  };
  const handleKeyDown = (event) => {
    if (!shouldSnap) return;

    const currentIndex = breakpointValues.indexOf(
      snapToNearestBreakpoint(currentValue)
    );
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      nextIndex = Math.min(currentIndex + 1, breakpointValues.length - 1);
    } else if (
      event.key === "ArrowLeft" ||
      event.key === "ArrowDown"
    ) {
      nextIndex = Math.max(currentIndex - 1, 0);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = breakpointValues.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    onChange?.(breakpointValues[nextIndex]);
  };

  return (
    <div
      className={`custom-slider${className ? ` ${className}` : ""}${
        currentPercent === 0 ? " is-empty" : ""
      }`}
      style={{
        "--custom-slider-gradient": gradient,
        "--custom-slider-inactive": sliderOptions.inactiveColor,
        "--custom-slider-progress": `${currentPercent}%`,
        "--custom-slider-thumb-background":
          sliderOptions.thumbBackground,
        "--custom-slider-thumb-color": sliderOptions.thumbColor,
        "--custom-slider-thumb-size": `${sliderOptions.thumbSize}px`,
        "--custom-slider-track-height": `${sliderOptions.trackHeight}px`,
      }}
    >
      <div className="custom-slider__track" aria-hidden="true">
        <span className="custom-slider__inactive-track" />
        <span className="custom-slider__breakpoints">
          {visibleBreakpointValues.map((breakpoint, index) => {
            const breakpointPercent = toPercent(breakpoint);

            return (
              <span
                key={`${breakpoint}-${index}`}
                style={{ left: `${breakpointPercent}%` }}
              />
            );
          })}
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
        step={shouldSnap ? Math.abs(range) / 1000 : step}
        value={currentValue}
        onChange={(event) => handleChange(Number(event.target.value))}
        onKeyDown={handleKeyDown}
      />
      <span className="custom-slider__thumb-rail" aria-hidden="true">
        <span className="custom-slider__thumb">{thumbIcon}</span>
      </span>
    </div>
  );
};

export default CustomSlider;
