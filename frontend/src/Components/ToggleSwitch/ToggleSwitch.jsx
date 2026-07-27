import React from "react";
import "./ToggleSwitch.scss";

const ToggleSwitch = ({
  checked,
  disabled = false,
  label,
  onChange,
}) => {
  return (
    <label className={`toggle-switch${disabled ? " is-disabled" : ""}`}>
      <span className="toggle-switch-label">{label}</span>
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle-switch-track" aria-hidden="true">
        <span className="toggle-switch-thumb" />
      </span>
    </label>
  );
};

export default ToggleSwitch;
