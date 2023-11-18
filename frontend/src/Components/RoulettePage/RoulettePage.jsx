import React, { useState } from "react";
import "./RoulettePage.scss";
import RouletteChip from "../RouletteChip/RouletteChip";
import RouletteButton from "../RouletteButton/RouletteButton";
import Wheel from "../Wheel/Wheel";

const RoulettePage = () => {
  const [chipType, setChipType] = useState({
    value: 1,
    color: "rgb(252, 120, 32)",
    trueValue: 1,
    nthValue: "M",
  });

  const [totalBetValue, setTotalBetValue] = useState(0);
  const [activeChip, setActiveChip] = useState(0);
  const [toggleReset, setToggleReset] = useState(false);
  const [winningNum, setWinningNum] = useState(0);

  const resetBoard = () => {
    setTotalBetValue(0);
    setToggleReset((prev) => !prev);
  };

  return (
    <main className="roulette-main">
      <section>
        <div>Chip Value{chipType.trueValue.toFixed(2)}</div>
        <input type="text" readOnly value={totalBetValue.toFixed(2)} />
      </section>
      <section className="chip-selection">
        <div
          onClick={() => {
            setActiveChip(0);
            setChipType({
              value: 1,
              color: "rgb(252, 120, 32)",
              trueValue: 1,
              nthValue: "M",
            });
          }}
        >
          <RouletteChip
            amount={"1M"}
            showBorder={activeChip === 0 ? true : false}
            color={"rgb(252, 120, 32)"}
          />
        </div>
        <div
          onClick={() => {
            setActiveChip(1);
            setChipType({
              value: 10,
              color: "rgb(252, 98, 24)",
              trueValue: 10,
              nthValue: "M",
            });
          }}
        >
          <RouletteChip
            amount={"10M"}
            showBorder={activeChip === 1 ? true : false}
            color={"rgb(252, 98, 24)"}
          />
        </div>
        <div
          onClick={() => {
            setActiveChip(2);
            setChipType({
              value: 100,
              color: "rgb(252, 76, 17)",
              trueValue: 100,
              nthValue: "M",
            });
          }}
        >
          <RouletteChip
            amount={"100M"}
            showBorder={activeChip === 2 ? true : false}
            color={"rgb(252, 76, 17)"}
          />
        </div>
      </section>
      <section className="roulette-buttons">
        <RouletteButton className="green" text={0} />
        <RouletteButton className="red odd oneto12" text={3} />
        <RouletteButton className="black even oneto12" text={6} />
        <RouletteButton className="red odd oneto12" text={9} />
        <RouletteButton className="red even oneto12" text={12} />
        <RouletteButton className="black odd" text={15} />
        <RouletteButton className="red even" text={18} />
        <RouletteButton className="red odd" text={21} />
        <RouletteButton className="black even" text={24} />
        <RouletteButton className="red odd" text={27} />
        <RouletteButton className="red even" text={30} />
        <RouletteButton className="black odd" text={33} />
        <RouletteButton className="red even" text={36} />
        <RouletteButton className="standard-button" text={"2:1"} />
        <RouletteButton className="black even oneto12" text={2} />
        <RouletteButton className="red odd oneto12" text={5} />
        <RouletteButton className="black even oneto12" text={8} />
        <RouletteButton className="black odd oneto12" text={11} />
        <RouletteButton className="red even" text={14} />
        <RouletteButton className="black odd" text={17} />
        <RouletteButton className="black even" text={20} />
        <RouletteButton className="red odd" text={23} />
        <RouletteButton className="black even" text={26} />
        <RouletteButton className="black odd" text={29} />
        <RouletteButton className="red even" text={32} />
        <RouletteButton className="black odd" text={35} />
        <RouletteButton className="standard-button" text={"2:1"} />
        <RouletteButton className="red odd oneto12" text={1} />
        <RouletteButton className="black even oneto12" text={4} />
        <RouletteButton className="red odd oneto12" text={7} />
        <RouletteButton className="black even oneto12" text={10} />
        <RouletteButton className="black odd" text={13} />
        <RouletteButton className="red even" text={16} />
        <RouletteButton className="red odd" text={19} />
        <RouletteButton className="black even" text={22} />
        <RouletteButton className="red odd" text={25} />
        <RouletteButton className="black even" text={28} />
        <RouletteButton className="black odd" text={31} />
        <RouletteButton className="red even" text={34} />
        <RouletteButton className="standard-button" text={"2:1"} />
        <RouletteButton
          className="standard-button column-start-2-span-4 oneto12-button"
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
          className="standard-button column-start-2-span-2"
          text={"1 to 18"}
        />
        <RouletteButton
          className="standard-button column-span-2 even-button"
          text={"Even"}
        />
        <RouletteButton
          className="red column-span-2 all-red-hover"
          chipValues={chipType}
          onClick={() => setTotalBetValue((prev) => prev + chipType.trueValue)}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black column-span-2 all-black-hover"
          chipValues={chipType}
          onClick={() => setTotalBetValue((prev) => prev + chipType.trueValue)}
          clearChips={toggleReset}
        />

        <RouletteButton
          className="standard-button column-span-2 odd-button"
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
      <Wheel numberOfWedges={37} winningNum={winningNum} />
      <button
        onClick={() => {
          const randomNumber = Math.floor(Math.random() * 37);
          console.log(randomNumber);
          setWinningNum(randomNumber);
        }}
        style={{
          marginTop: 20,
          pointerEvents: "all",
        }}
      >
        Play
      </button>
      <button onClick={resetBoard}>Clear</button>
    </main>
  );
};

export default RoulettePage;
