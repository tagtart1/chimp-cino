import React, { useState } from "react";
import "./BlackjackPage.scss";
import { useRef, useEffect } from "react";
import BlackjackActions from "./BlackjackActions/BlackjackActions";
import { PlayingCard } from "../PlayingCard/PlayingCard";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import BlackjackCardStack from "./BlackjackCardStack/BlackjackCardStack";
import { useUser } from "../../Contexts/UserProvider";
import { v4 as uuid } from "uuid";
import {
  delay,
  isHandSoft,
  getCardValueFromArray,
} from "../../Helpers/blackjackHelpers";
import { BlackjackBetInput } from "./BlackjackBetInput/BlackjackBetInput";

// TODO: MODULARIZE THIS COMPONENT TOO MUCH STUFF HERE

const BlackjackPage = () => {
  const blackjackStartEndpoint = "http://localhost:5000/api/v1/blackjack/games";
  const blackjackInProgressEndpoint =
    "http://localhost:5000/api/v1/blackjack/games/in-progress";
  const gameScreenRef = useRef(null);
  const playerStackRef = useRef(null);
  const dealerStackRef = useRef(null);
  const staticCardsRef = useRef(null);

  const { user, setUser } = useUser();

  const [playerHands, setPlayerHands] = useState([[]]);
  const [selectedHandIndex, setSelectedHandIndex] = useState(0);
  const [showSelectedOutline, setShowSelectedOutline] = useState(false);
  const [playerValues, setPlayerValues] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [dealerValue, setDealerValue] = useState(0);
  const [startCardExit, setStartCardExit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWinners, setGameWinners] = useState([]);
  const [betAmount, setBetAmount] = useState(0);
  const [loadedBet, setLoadedBet] = useState(0);

  const thresholdWidth = 875;

  const playGame = async () => {
    const res = await fetch(blackjackStartEndpoint, {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        betAmount: betAmount,
      }),
    });

    if (!res.ok) {
      const errors = await res.json();
      console.log("Error", errors);
      return;
    }
    const gameData = await res.json();
    // Change UI balance

    setUser((prev) => {
      const newCosmeticBal = { ...prev };

      newCosmeticBal.balance -= betAmount;
      return newCosmeticBal;
    });
    if (gameOver) {
      setDealerValue(0);
      setPlayerValues([0]);

      setGameLoaded(false);
      setGameOver(false);
      setGameWinners([]);
      await delay(1);

      setStartCardExit(true);
      setShowSelectedOutline(false);
      await delay(500);
      setPlayerHands([[]]);
      setDealerCards([]);
      setSelectedHandIndex(0);

      await delay(200);
    }

    // TRICKLE THE STATE
    // SET PLAYER CARD, WAIT .5 SECOND, ADD PLAYER CARD
    setStartCardExit(false);
    dealInitialCards(gameData);
  };

  useEffect(() => {
    // Scales down the game screen when its width is below the threshold
    // Calculation numbers may need changing once we add nav bar to the left
    const handleResize = () => {
      if (!gameScreenRef.current) return;

      const width = gameScreenRef.current.offsetWidth;
      if (width < thresholdWidth && width > 535) {
        const widthDifference = thresholdWidth - width;
        const heightReduction = widthDifference * 0.8; // 0.8px reduction for every 1px width reduction
        const newMinHeight = 630 - heightReduction;

        // Calcualte font size
        const range = thresholdWidth - 535;
        const difference = width - 535;
        const mult = (difference / range) * 0.44 + 0.56;

        if (gameScreenRef.current) {
          gameScreenRef.current.style.minHeight = newMinHeight + "px";
          gameScreenRef.current.style.fontSize = mult + "em";
        }
      } else if (width > thresholdWidth) {
        gameScreenRef.current.style.minHeight = 630 + "px";
        gameScreenRef.current.style.fontSize = 1 + "em";
      }
    };

    window.addEventListener("resize", handleResize);

    // Initial check
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const getGame = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(blackjackInProgressEndpoint, {
          credentials: "include",
          method: "GET",
        });

        if (!response.ok) {
          return;
        }

        const results = await response.json();
        if (results.data.is_game_over) {
          return;
        }

        const playerHands = results.data.player.hands;
        const dealerCards = results.data.dealer.cards;

        // Check if game is new to send a blank
        if (dealerCards.length === 1) {
          dealerCards.push({ isStatic: true, isBlank: true });
        }
        // Set cards to the array of cards
        for (const hand of playerHands) {
          for (const card of hand) {
            card.isStatic = true;
          }
        }

        for (const card of dealerCards) {
          card.isStatic = true;
        }

        if (playerHands.length > 1) {
          console.log("MULTIUPLE HANDS");
        }

        setSelectedHandIndex(results.data.player.selectedHandIndex);
        setPlayerHands(playerHands);
        setDealerCards(dealerCards);

        setGameLoaded(true);
        // Grab total value

        setDealerValue(getCardValueFromArray(dealerCards));
        let playerValueArray = [];
        for (const hand of playerHands) {
          playerValueArray.push(getCardValueFromArray(hand));
        }
        setPlayerValues(playerValueArray);
        setLoadedBet(results.data.bet);
        setBetAmount(results.data.bet);

        if (playerHands.length > 1) setShowSelectedOutline(true);
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    };

    getGame();
  }, []);

  // Once game loads the cards into the card states we turn of the game is loaded
  useEffect(() => {
    setGameLoaded(false);
  }, [playerHands, dealerCards]);

  // The delay matches the animation speed it takes to get in position
  const dealInitialCards = async (gameData) => {
    const actionDelay = 510;
    const dealerCards = gameData.data.dealer.cards;
    const playerCards = gameData.data.player.hands[0];

    playerCards.forEach((card) => {
      if (card.value === 1) {
        card.value = 11;
      }
    });

    dealerCards.forEach((card) => {
      if (card.value === 1) {
        card.value = 11;
      }
    });
    let playerHand = [playerCards[0]];
    setPlayerHands([playerHand]);

    await delay(actionDelay);
    setPlayerValues([getCardValueFromArray([playerCards[0]])]);
    setDealerCards((currentCards) => [...currentCards, dealerCards[0]]);

    await delay(actionDelay);
    setDealerValue(getCardValueFromArray([dealerCards[0]]));
    playerHand.push(playerCards[1]);
    setPlayerHands([playerHand]);

    await delay(actionDelay);
    setDealerCards((currentCards) => [
      ...currentCards,
      { isStatic: false, isBlank: true },
    ]);
    setPlayerValues([getCardValueFromArray([playerCards[0], playerCards[1]])]);

    if (gameData.data.is_game_over) {
      let dealerValue;

      setDealerCards((currentCards) => {
        let newCards = [...currentCards];
        newCards[1] = dealerCards[1];

        currentCards[1] = dealerCards[1];

        dealerValue = getCardValueFromArray(newCards);
        return newCards;
      });
      await delay(actionDelay);
      setDealerValue(dealerValue);
      await delay(actionDelay);
      setGameOver(true);
      setGameWinners(gameData.data.game_winners);

      if (
        gameData.data.game_winners[0] === "push" ||
        gameData.data.game_winners[0] === "player"
      ) {
        setUser((prev) => {
          const user = { ...prev };
          console.log(gameData.data.payout);
          user.balance += gameData.data.payout;
          return user;
        });
      }
    }
  };

  const handleActionResults = async (results, isHit, isDoubled) => {
    if (isDoubled) {
      setUser((prev) => {
        const user = { ...prev };

        user.balance -= betAmount;

        return user;
      });
    }

    if (isHit) {
      const card = results.player.cards[results.player.cards.length - 1];
      await dealNewCard(
        results.player.cards.slice(0, results.player.cards.length - 1),
        true,
        card,
        selectedHandIndex
      );
    }

    // When hitting on a split, you can only move from right to left. If the split selection started on the left then the right hand is completed already by 21
    if (results.goToNextHand && selectedHandIndex > 0) {
      if (isHit) await delay(720);
      setSelectedHandIndex((prev) => prev - 1);
    }
    if (results.dealer && results.is_game_over) {
      // Show dealer cards
      for (let i = 1; i < results.dealer.cards.length; i++) {
        await dealNewCard(
          results.dealer.cards.slice(0, i),
          false,
          results.dealer.cards[i],
          0
        );

        // Check if it's not the last iteration before delaying
        if (i < results.dealer.cards.length - 1) {
          await delay(520);
        }
      }
    }

    if (results.is_game_over) {
      await delay(520);
      setGameOver(true);
      setGameWinners(results.game_winners);

      console.log(results);
      if (!results.payout) return;
      setUser((prev) => {
        const user = { ...prev };

        parseFloat(user.balance);
        user.balance += results.payout;

        return user;
      });
    }
  };

  const handleSplit = async (resultData) => {
    const playerResult = resultData.player;
    const leftCard = playerResult.hands[0][playerResult.hands[0].length - 1];
    const rightCard = playerResult.hands[1][playerResult.hands[1].length - 1];

    // Subtract bet again for UI
    setUser((prev) => {
      const user = { ...prev };

      user.balance -= betAmount;

      return user;
    });

    setSelectedHandIndex(playerResult.selectedHandIndex);
    setPlayerHands((hands) => {
      const newHands = [...hands];

      // Modify the first hand
      newHands[0] = [...newHands[0]];
      newHands[0].pop();

      // Add a new hand
      const newHand = playerResult.hands[1].slice(
        0,
        playerResult.hands[1].length - 1
      );
      newHand[0].isStatic = true;
      newHand[0].isSplit = true;
      newHands.push(newHand);

      return newHands;
    });
    // Set player values
    // getCardValueFromArray handles Aces
    setPlayerValues([
      getCardValueFromArray([playerResult.hands[0][0]]),
      getCardValueFromArray([playerResult.hands[1][0]]),
    ]);

    // Deal right hand new card
    await delay(720);
    await dealNewCard(
      playerResult.hands[0].slice(0, playerResult.hands[0].length - 1),
      true,
      rightCard,
      1
    );

    await delay(520);
    // Deal left hand new card

    await dealNewCard(
      playerResult.hands[1].slice(0, playerResult.hands[1].length - 1),
      true,
      leftCard,
      0
    );

    if (resultData.dealer.cards) {
      for (let i = 1; i < resultData.dealer.cards.length; i++) {
        await dealNewCard(
          resultData.dealer.cards.slice(0, i),
          false,
          resultData.dealer.cards[i],
          0
        );

        if (i < resultData.dealer.cards.length - 1) {
          await delay(520);
        }
      }
    }

    await delay(520);
    if (resultData.is_game_over) {
      setGameOver(true);
      setGameWinners(resultData.game_winners);

      setUser((prev) => {
        const user = { ...prev };

        parseFloat(user.balance);
        user.balance += resultData.payout;

        return user;
      });
    } else {
      setShowSelectedOutline(true);
    }
  };

  const dealNewCard = async (hand, isPlayer, card, handIndex) => {
    setGameLoaded(false);

    let newValue;
    if (isPlayer) {
      setPlayerHands((currentHands) => {
        // Clone the current state to avoid direct mutation
        const updatedHands = [...currentHands];

        // Get the hand you want to update
        const handToUpdate = updatedHands[handIndex];

        // Calculate new value
        newValue = getCardValueFromArray([...handToUpdate, card]);

        // Add the new card to the specific hand
        updatedHands[handIndex] = [...handToUpdate, card];

        // Return the updated state

        return updatedHands;
      });

      await delay(520);
      setPlayerValues((values) => {
        const newValues = [...values];

        // Modfiy the value
        newValues[handIndex] = newValue;

        return newValues;
      });
    } else if (!isPlayer) {
      setDealerCards((currentCards) => {
        // Find the index of the first null element
        const nullIndex = currentCards.findIndex(
          (card) => card.isBlank === true
        );

        // Replace the first null element if it exists, otherwise add the new card to the end
        if (nullIndex !== -1) {
          let newCards = [...currentCards];

          newCards[nullIndex] = card;

          newValue = getCardValueFromArray(newCards);

          return newCards;
        } else {
          newValue = getCardValueFromArray([...hand, card]);
          return [...currentCards, card];
        }
      });
      await delay(520);
      setDealerValue(newValue);
    }
  };

  const calculateShift = (stackRef) => {
    if (!staticCardsRef.current || !stackRef.current) return;
    const staticCardsRect = staticCardsRef.current.getBoundingClientRect();
    const cardStackRect = stackRef.current.getBoundingClientRect();

    // Add a temporary margin-left for calculation
    staticCardsRef.current.style.marginLeft = "-2.2em";

    // Get the computed style of staticCardsRef after adding the margin
    const computed = window.getComputedStyle(staticCardsRef.current);

    const marginLeft = computed.getPropertyValue("margin-left");

    let trueMargin = parseFloat(marginLeft);
    console.log(trueMargin);
    if (playerHands[0].length === 1) {
      trueMargin = 0;
    }
    // Calculate pixel shift for card
    const initX = staticCardsRect.right - cardStackRect.right;
    let initY = staticCardsRect.bottom - cardStackRect.bottom;
    console.log("Shift: ", trueMargin);
    // the -6 proves that we need to use the magin left of the new cards being added NOT the truemargin from the static stack
    return {
      x: initX + trueMargin - 6,
      y: initY,
    };
  };

  const renderCardStack = (cards, isDealer = false) => {
    const shifts = calculateShift(dealerStackRef);
    return cards.map((card, index) => {
      const style =
        index === 0
          ? { transform: `${card.isStatic ? "rotateY(180deg)" : ""}` }
          : {
              marginTop: `${index}em`,
              marginLeft: "-2.2em",
              transform: `${
                card.isStatic && card.value ? "rotateY(180deg)" : ""
              }`,
            };

      if (!card.value)
        return (
          <PlayingCard
            key={index}
            style={style}
            nthCard={index}
            isBlank={true}
            dealerCard={isDealer}
            staticCard={card.isStatic}
            startExit={startCardExit}
            shiftX={shifts.x}
            shiftY={shifts.y}
          />
        );

      return (
        <PlayingCard
          key={index}
          style={style}
          nthCard={index}
          isBlank={!card.value ? true : false}
          suit={card.suit}
          rank={card.rank}
          dealerCard={isDealer}
          staticCard={card.isStatic}
          gameResults={gameWinners[index]}
          startExit={startCardExit}
          shiftX={shifts.x}
          shiftY={shifts.y}
        />
      );
    });
  };

  const determineStyles = (index) => {
    let backgroundColor, color;

    // Determine if the current item is selected
    const isSelected =
      selectedHandIndex === index && showSelectedOutline && !gameOver;

    // Determine background color based on game winners
    if (gameWinners[index] === "player") {
      backgroundColor = "#1FFF20";
      color = "#000";
    } else if (gameWinners[index] === "dealer") {
      backgroundColor = "#E9113C";
      color = "#FFF";
    } else if (gameWinners[index] === "push") {
      backgroundColor = "#FF9D00";
      color = "#000";
    } else if (isSelected) {
      backgroundColor = "#4391e7";
      color = "#000";
    } else {
      color = "#FFF";
      backgroundColor = "#2F4553";
    }

    return { backgroundColor, color };
  };

  const renderPlayerStacks = (hands) => {
    const loaded = gameLoaded;
    // Grab furst card. apply the initial margin style then return that and apple that to the shift ??

    return hands.map((hand, index) => {
      const shifts = calculateShift(playerStackRef);
      return (
        <div>
          <motion.div
            className={`card-stack ${index}`}
            layout={loaded && index === 0 ? false : "position"}
            key={index}
            ref={playerStackRef}
            transition={{ duration: 0.3 }}
          >
            {playerValues.length !== 0 &&
            !startCardExit &&
            playerValues[index] !== 0 ? (
              <motion.div
                className={`cards-value`}
                layout="position"
                initial={
                  gameLoaded
                    ? {
                        backgroundColor: determineStyles(index).backgroundColor,
                        color: determineStyles(index).color,
                      }
                    : null
                }
                animate={{
                  backgroundColor: determineStyles(index).backgroundColor,

                  color: determineStyles(index).color,
                  transition: { duration: 0.15 },
                }}
                transition={{ duration: 0.3 }}
              >
                {playerValues[index]}
              </motion.div>
            ) : null}

            {hand.map((card, cardIndex) => {
              const style =
                cardIndex === 0
                  ? {
                      transform: `${card.isStatic ? "rotateY(180deg)" : ""}`,
                    }
                  : {
                      marginTop: `${cardIndex}em`,
                      marginLeft: "-2.2em",
                      transform: `${
                        card.isStatic && card.value ? "rotateY(180deg)" : ""
                      }`,
                    };

              const isSelected =
                selectedHandIndex === index && showSelectedOutline;

              return (
                <PlayingCard
                  key={cardIndex}
                  style={style}
                  nthCard={cardIndex}
                  suit={card.suit}
                  rank={card.rank}
                  dealerCard={false}
                  staticCard={card.isStatic}
                  gameResults={gameWinners[index]}
                  startExit={startCardExit}
                  splitCard={card.isSplit}
                  selected={isSelected}
                  shiftX={shifts.x}
                  shiftY={shifts.y}
                  // Pass in the handIndex and if the hands are split
                />
              );
            })}
          </motion.div>
        </div>
      );
    });
  };

  const dealerCardsMap = renderCardStack(dealerCards, true);

  const cardsMap = renderPlayerStacks(playerHands);

  return (
    <main className="blackjack-main">
      <section className="blackjack-game-section">
        {isLoading ? (
          <div></div>
        ) : (
          <div className="bet-controls">
            <BlackjackBetInput
              setBetAmount={setBetAmount}
              loadedBet={loadedBet}
            />
            <BlackjackActions
              handleAction={handleActionResults}
              handleSplit={handleSplit}
            />
            <button className="blackjack-play-button" onClick={playGame}>
              Play
            </button>
          </div>
        )}
        <div className="game-screen" ref={gameScreenRef}>
          <div className="card-group dealer-side">
            <motion.div
              className="card-stack"
              layout={gameLoaded ? false : "position"}
              transition={{ duration: 0.3 }}
              ref={dealerStackRef}
            >
              <AnimatePresence>
                {dealerValue !== 0 ? (
                  <motion.div
                    className="cards-value"
                    layout="position"
                    key={0}
                    transition={{ duration: 0.3 }}
                  >
                    {dealerValue}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {dealerCards.length > 0 && dealerCardsMap}
            </motion.div>
          </div>
          <div className="card-group player-side">
            {playerHands.length > 0 && cardsMap}
          </div>
          <BlackjackCardStack theRef={staticCardsRef} />
        </div>
      </section>
    </main>
  );
};

export default BlackjackPage;
