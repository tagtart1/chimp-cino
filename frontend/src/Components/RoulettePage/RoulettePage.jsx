import React, { useEffect, useState } from "react";
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
  const [winningNum, setWinningNum] = useState(null);
  const [betMap, setBetMap] = useState({});

  const resetBoard = () => {
    setTotalBetValue(0);
    setToggleReset((prev) => !prev);
    setBetMap({});
  };

  // Updates the bet map, submits to backend
  const addNewBet = (pocketNumbers) => {
    setBetMap((prev) => {
      // Get true betValue by dividing the current chip by how many pocketNumber each pocket represents
      const betValue = chipType.trueValue / pocketNumbers.length;

      // Copy prev state to new object
      const newMap = { ...prev };

      // Update each pocket bet with increased value
      pocketNumbers.forEach((pocketNum) => {
        if (newMap[pocketNum] === undefined) {
          newMap[pocketNum] = 0;
        }
        newMap[pocketNum] += betValue;
      });

      return newMap;
    });

    // Combine all bets into one sum
    setTotalBetValue((prev) => prev + chipType.trueValue);
  };

  useEffect(() => {
    console.log(betMap);
  });

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
        <RouletteButton
          className="green"
          text={0}
          pocketNums={[0]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red odd oneto12 oneto18 top-row"
          text={3}
          pocketNums={[3]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black even oneto12 oneto18 top-row"
          text={6}
          pocketNums={[6]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red odd oneto12 oneto18 top-row"
          text={9}
          pocketNums={[9]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red even oneto12 oneto18 top-row"
          text={12}
          pocketNums={[12]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black odd thirteento24 oneto18 top-row"
          text={15}
          pocketNums={[15]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red even thirteento24 oneto18 top-row"
          text={18}
          pocketNums={[18]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red odd thirteento24 nineteento36 top-row"
          text={21}
          pocketNums={[21]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black even thirteento24 nineteento36 top-row"
          text={24}
          pocketNums={[24]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red odd twentyfiveto36 nineteento36 top-row"
          text={27}
          pocketNums={[27]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red even twentyfiveto36 nineteento36 top-row"
          text={30}
          pocketNums={[30]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black odd twentyfiveto36 nineteento36 top-row"
          text={33}
          pocketNums={[33]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red even twentyfiveto36 nineteento36 top-row"
          text={36}
          pocketNums={[36]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />

        <RouletteButton
          className="standard-button top-row-button"
          text={"2:1"}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
          pocketNums={[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36]}
        />
        <RouletteButton
          className="black even oneto12 oneto18 middle-row"
          text={2}
          pocketNums={[2]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red odd oneto12 oneto18 middle-row"
          text={5}
          pocketNums={[5]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black even oneto12 oneto18 middle-row"
          text={8}
          pocketNums={[8]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black odd oneto12 oneto18 middle-row"
          text={11}
          pocketNums={[11]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red even thirteento24 oneto18 middle-row"
          text={14}
          pocketNums={[14]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black odd thirteento24 oneto18 middle-row"
          text={17}
          pocketNums={[17]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black even thirteento24 nineteento36 middle-row"
          text={20}
          pocketNums={[20]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red odd thirteento24 nineteento36 middle-row"
          text={23}
          pocketNums={[23]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black even twentyfiveto36 nineteento36 middle-row"
          text={26}
          pocketNums={[26]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black odd twentyfiveto36 nineteento36 middle-row"
          text={29}
          pocketNums={[29]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red even twentyfiveto36 nineteento36 middle-row"
          text={32}
          pocketNums={[32]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black odd twentyfiveto36 nineteento36 middle-row"
          text={35}
          pocketNums={[35]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />

        <RouletteButton
          className="standard-button middle-row-button"
          text={"2:1"}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
          pocketNums={[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35]}
        />
        <RouletteButton
          className="red odd oneto12 oneto18 bottom-row"
          text={1}
          pocketNums={[1]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black even oneto12 oneto18  bottom-row"
          text={4}
          pocketNums={[4]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red odd oneto12 oneto18  bottom-row"
          text={7}
          pocketNums={[7]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black even oneto12 oneto18  bottom-row"
          text={10}
          pocketNums={[10]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black odd thirteento24 oneto18  bottom-row"
          text={13}
          pocketNums={[13]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red even thirteento24 oneto18  bottom-row"
          text={16}
          pocketNums={[16]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red odd thirteento24 nineteento36  bottom-row"
          text={19}
          pocketNums={[19]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black even thirteento24 nineteento36  bottom-row"
          text={22}
          pocketNums={[22]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red odd twentyfiveto36 nineteento36  bottom-row"
          text={25}
          pocketNums={[25]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black even twentyfiveto36 nineteento36  bottom-row"
          text={28}
          pocketNums={[28]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="black odd twentyfiveto36 nineteento36  bottom-row"
          text={31}
          pocketNums={[31]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />
        <RouletteButton
          className="red even twentyfiveto36 nineteento36  bottom-row"
          text={34}
          pocketNums={[34]}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
        />

        <RouletteButton
          className="standard-button  bottom-row-button"
          text={"2:1"}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
          pocketNums={[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]}
        />
        <RouletteButton
          className="standard-button column-start-2-span-4 oneto12-button"
          text={"1 to 12"}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
          pocketNums={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
        />
        <RouletteButton
          className="standard-button column-span-4 thirteento24-button"
          text={"13 to 24"}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
          pocketNums={[13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]}
        />
        <RouletteButton
          className="standard-button column-span-4 twentyfiveto36-button"
          text={"25 to 36"}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
          pocketNums={[25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]}
        />
        <RouletteButton
          className="standard-button column-start-2-span-2 oneto18-button"
          text={"1 to 18"}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
          pocketNums={[
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
          ]}
        />
        <RouletteButton
          className="standard-button column-span-2 even-button"
          text={"Even"}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
          pocketNums={[
            2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36,
          ]}
        />
        <RouletteButton
          className="red column-span-2 all-red-hover"
          chipValues={chipType}
          clearChips={toggleReset}
          pocketNums={[
            3, 1, 5, 9, 7, 12, 14, 18, 16, 21, 19, 23, 27, 25, 30, 32, 34, 36,
          ]}
          addNewBet={addNewBet}
        />
        <RouletteButton
          className="black column-span-2 all-black-hover"
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
          pocketNums={[
            2, 4, 6, 8, 11, 10, 15, 13, 17, 20, 24, 22, 26, 29, 28, 31, 33, 35,
          ]}
        />

        <RouletteButton
          className="standard-button column-span-2 odd-button"
          text={"Odd"}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
          pocketNums={[
            1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35,
          ]}
        />
        <RouletteButton
          className="standard-button column-span-2 nineteento36-button"
          text={"19 to 36"}
          chipValues={chipType}
          addNewBet={addNewBet}
          clearChips={toggleReset}
          pocketNums={[
            19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
            36,
          ]}
        />
      </section>
      <Wheel numberOfWedges={37} winningNum={winningNum} />
      <button
        onClick={() => {
          const randomNumber = Math.floor(Math.random() * 37);

          setWinningNum(randomNumber);
        }}
        style={{
          marginTop: 20,
        }}
      >
        Play
      </button>
      <button onClick={resetBoard}>Clear</button>
    </main>
  );
};

export default RoulettePage;
