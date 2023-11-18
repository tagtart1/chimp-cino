import React, { useEffect } from "react";
import "./RouletteButton.scss";
import { useState } from "react";
import RouletteChip from "../RouletteChip/RouletteChip";

const RouletteButton = ({
  className,
  text,
  chipValues,
  onClick,
  clearChips,
}) => {
  const [chips, setChips] = useState(0);
  const [buttonValue, setButtonValue] = useState(0);
  const [initChipColor, setInitChipColor] = useState();
  // Increase size of chip stack, max of 5
  const addChip = () => {
    if (chips < 5) {
      setChips((prev) => prev + 1);
    }

    // Carry on normal behavior of adding the chip value to display

    setButtonValue((prev) => prev + chipValues.value);

    onClick();
  };

  // Listens for change in clearChips prop to then reset value
  useEffect(() => {
    setChips(0);
    setButtonValue(0);
  }, [clearChips]);

  // Locks the chip color to the first chip placed in pocket
  // resets to the selected chip color when empty
  useEffect(() => {
    if (chips < 1 && chipValues) {
      setInitChipColor(chipValues.color);
    }
  }, [chipValues, chips]);

  // Creats chip stack, each chip after the first is stacked on top of each other
  // with the style object
  const chipList = [...Array(chips)].map((_, index) => {
    const style =
      index === 0
        ? {}
        : {
            position: "absolute",
            transform: `translate(0%, ${-15 * index}%)`,
            top: 0,
            left: 0,
          };
    let lockVisualValue = false;
    if (buttonValue > 999) {
      lockVisualValue = true;
    }

    return (
      <RouletteChip
        key={index}
        color={initChipColor}
        amount={
          !lockVisualValue
            ? (!buttonValue ? chipValues.value : buttonValue) +
              chipValues.nthValue
            : chipValues.nthValue === "M"
            ? "1B+"
            : "1T+"
        }
        style={style}
      />
    );
  });

  return (
    <button onClick={addChip} className={`${className}`}>
      {text}
      {chipList.length < 1 ? null : (
        <div className="chip-stack-wrapper">
          <div className="wrap" style={{ position: "relative" }}>
            {chipList}
          </div>
        </div>
      )}
    </button>
  );
};

export default RouletteButton;
