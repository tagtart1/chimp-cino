import React, { useState } from "react";
import "./RoulettePage.scss";
import RouletteChip from "../RouletteChip/RouletteChip";
import RouletteButton from "../RouletteButton/RouletteButton";

const RoulettePage = () => {
  const [chipType, setChipType] = useState({
    value: 1,
    color: "rgb(243, 57, 25)",
    trueValue: 1,
    nthValue: "M",
  });

  const [totalBetValue, setTotalBetValue] = useState(0);
  const [activeChip, setActiveChip] = useState(0);

  return (
    <main className="roulette-main">
      <section>
        <input type="text" readOnly value={totalBetValue.toFixed(2)} />
      </section>
      <section className="chip-selection">
        <div
          onClick={() => {
            setActiveChip(0);
            setChipType({
              value: 1,
              color: "rgb(243, 57, 25)",
              trueValue: 1,
              nthValue: "M",
            });
          }}
        >
          <RouletteChip
            amount={"1M"}
            showBorder={activeChip === 0 ? true : false}
          />
        </div>
        <div
          onClick={() => {
            setActiveChip(1);
            setChipType({
              value: 10,
              color: "rgb(255, 10, 25)",
              trueValue: 10,
              nthValue: "M",
            });
          }}
        >
          <RouletteChip
            amount={"10M"}
            showBorder={activeChip === 1 ? true : false}
          />
        </div>
      </section>
      <section className="roulette-buttons">
        <RouletteButton className="red" text={3} />
        <RouletteButton className="black" text={6} />
        <RouletteButton className="red" text={9} />
        <RouletteButton className="red" text={12} />
        <RouletteButton className="black" text={15} />
        <RouletteButton className="red" text={18} />
        <RouletteButton className="red" text={21} />
        <RouletteButton className="black" text={24} />
        <RouletteButton className="red" text={27} />
        <RouletteButton className="red" text={30} />
        <RouletteButton className="black" text={33} />
        <RouletteButton className="red" text={36} />
        <RouletteButton
          className="standard-button column-span-4"
          text={"1 to 12"}
        />
        <RouletteButton
          className="standard-button column-span-4"
          text={"13 to 24"}
        />
        <RouletteButton
          className="standard-button column-span-4"
          text={"25 to 36"}
        />
        <RouletteButton
          className="standard-button column-span-2"
          text={"1 to 18"}
        />
        <RouletteButton
          className="standard-button column-span-2"
          text={"Even"}
        />
        <RouletteButton
          className="black column-span-2"
          chipValues={chipType}
          onClick={() => setTotalBetValue((prev) => prev + chipType.trueValue)}
        />
        <RouletteButton
          className="red column-span-2 all-red-hover"
          chipValues={chipType}
          onClick={() => setTotalBetValue((prev) => prev + chipType.trueValue)}
        />
        <RouletteButton
          className="standard-button column-span-2"
          text={"Odd"}
          chipValues={chipType}
          onClick={() => setTotalBetValue((prev) => prev + chipType.trueValue)}
        />
        <RouletteButton
          className="standard-button column-span-2"
          chipValues={chipType}
          text={"19 to 36"}
          onClick={() => setTotalBetValue((prev) => prev + chipType.trueValue)}
        />
      </section>
    </main>
  );
};

export default RoulettePage;
