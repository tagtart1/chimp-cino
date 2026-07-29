import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import { createPortal } from "react-dom";
import CoinIcon from "../BetAmountInput/CoinIcon";
import { useUser } from "../../Contexts/UserProvider";
import { apiUrl } from "../../config/api";
import { gameAssetUrls } from "../../Helpers/gameAssets";
import soundManager from "../../Helpers/sfxPlayer";
import { createDailyBonusReel } from "./dailyBonusReel";
import "./DailyBonusModal.scss";

const MILESTONES = [1, 3, 5, 7, 10];
const CAN_RESET_FOR_TESTING = process.env.NODE_ENV !== "production";
const SPIN_DURATION_SECONDS = 5;
const MODAL_EXPANSION_FALLBACK_MS = 450;
const MOBILE_MODAL_MAX_WIDTH = 520;

const RARITY_ASSETS = Object.freeze({
  GREEN: gameAssetUrls.gem,
  PURPLE: gameAssetUrls.gemPurple,
  PINK: gameAssetUrls.gemPink,
  RED: gameAssetUrls.gemRed,
  GOLD: gameAssetUrls.gemGold,
});

const formatAmount = (amount) =>
  Number(amount).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

const countdownToNextUtcDay = (timestamp) => {
  const now = new Date(timestamp);
  const nextUtcDay = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  const totalSeconds = Math.max(
    0,
    Math.ceil((nextUtcDay - now.getTime()) / 1000)
  );

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
};

const utcDay = (value = new Date()) => {
  const date = new Date(value);
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
};

const rarityClass = (rarity) => `rarity-${rarity.toLowerCase()}`;

const GemSlot = ({ isRevealed, item, winnerRef }) => (
  <div
    className={`daily-bonus-gem-slot ${rarityClass(item.rarity)}`}
    ref={item.isWinner ? winnerRef : null}
    data-rarity={item.rarity}
    data-testid={
      item.isWinner
        ? "daily-bonus-winning-slot"
        : "daily-bonus-gem-slot"
    }
    data-winner={item.isWinner ? "true" : undefined}
  >
    <img
      src={RARITY_ASSETS[item.rarity]}
      alt={
        item.isWinner && isRevealed
          ? `${item.rarity.toLowerCase()} rarity gem`
          : ""
      }
    />
    <span aria-hidden="true" />
  </div>
);

const DailyBonusModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useUser();
  const prefersReducedMotion = useReducedMotion();
  const reelControls = useAnimationControls();
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState("");
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const dialogRef = useRef(null);
  const reelViewportRef = useRef(null);
  const winningSlotRef = useRef(null);
  const markerRef = useRef(null);
  const claimButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const isOpenRef = useRef(isOpen);
  const resultRef = useRef(null);
  const resultAppliedRef = useRef(false);

  const currentStreak = Number(user?.dailyBonusStreak || 0);
  const lastClaimedDay = user?.lastDailyBonusClaimedOn
    ? utcDay(user.lastDailyBonusClaimedOn)
    : null;
  const isClaimedToday = lastClaimedDay === utcDay();
  const activeMilestoneIndex = MILESTONES.findLastIndex(
    (milestone) => currentStreak >= milestone
  );
  const progress = Math.max(0, activeMilestoneIndex) * 20;
  const nextClaimCountdown = countdownToNextUtcDay(countdownNow);
  const reel = useMemo(
    () => (result ? createDailyBonusReel(result.rarity) : []),
    [result]
  );

  const applyResult = useCallback(
    (bonusResult = resultRef.current) => {
      if (!bonusResult || resultAppliedRef.current) return;
      resultAppliedRef.current = true;
      setUser((currentUser) =>
        currentUser
          ? {
              ...currentUser,
              balance: bonusResult.balance,
              dailyBonusStreak: bonusResult.dailyBonusStreak,
              lastDailyBonusClaimedOn:
                bonusResult.lastDailyBonusClaimedOn,
            }
          : currentUser
      );
    },
    [setUser]
  );

  const closeModal = useCallback(() => {
    applyResult();
    onClose();
  }, [applyResult, onClose]);

  useEffect(() => {
    if (!isOpen || !isClaimedToday) return undefined;

    setCountdownNow(Date.now());
    const timer = setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isClaimedToday, isOpen]);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) return;

    applyResult();
    resultRef.current = null;
    resultAppliedRef.current = false;
    setPhase("idle");
    setResult(null);
    setIsClaiming(false);
    setIsResetting(false);
    setError("");
    reelControls.set({ x: 0 });
  }, [applyResult, isOpen, reelControls]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocusedElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!claimButtonRef.current || claimButtonRef.current.disabled) {
      dialogRef.current?.focus();
    } else {
      claimButtonRef.current?.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeModal();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = dialogRef.current.querySelectorAll(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [closeModal, isOpen]);

  useEffect(() => {
    if (!result || phase !== "spinning") return undefined;
    dialogRef.current?.focus();

    if (prefersReducedMotion) {
      setPhase("revealed");
      return undefined;
    }

    let animationFrame;
    let expansionFallback;
    let hasStarted = false;
    const modal = dialogRef.current;

    const startSpin = () => {
      if (isCancelled || hasStarted) return;
      hasStarted = true;
      if (expansionFallback) clearTimeout(expansionFallback);
      modal?.removeEventListener("transitionend", handleTransitionEnd);

      animationFrame = requestAnimationFrame(() => {
        const winner = winningSlotRef.current;
        const marker = markerRef.current;
        if (!winner || !marker) return;

        const markerBounds = marker.getBoundingClientRect();
        const winnerBounds = winner.getBoundingClientRect();
        const targetX =
          markerBounds.left +
          markerBounds.width / 2 -
          (winnerBounds.left + winnerBounds.width / 2);
        reelControls.set({ x: 0 });
        reelControls
          .start({
            x: targetX,
            transition: {
              duration: SPIN_DURATION_SECONDS,
              ease: [0.12, 0.72, 0.18, 1],
            },
          })
          .then(() => {
            if (!isCancelled && isOpenRef.current) {
              setPhase("revealed");
            }
          });
      });
    };

    const handleTransitionEnd = (event) => {
      if (event.target === modal && event.propertyName === "width") {
        startSpin();
      }
    };

    let isCancelled = false;
    if (document.documentElement.clientWidth > MOBILE_MODAL_MAX_WIDTH) {
      modal?.addEventListener("transitionend", handleTransitionEnd);
      expansionFallback = setTimeout(
        startSpin,
        MODAL_EXPANSION_FALLBACK_MS
      );
    } else {
      startSpin();
    }

    return () => {
      isCancelled = true;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (expansionFallback) clearTimeout(expansionFallback);
      modal?.removeEventListener("transitionend", handleTransitionEnd);
      reelControls.stop();
    };
  }, [phase, prefersReducedMotion, reelControls, result]);

  useEffect(() => {
    if (phase !== "revealed" || !result) return;
    applyResult(result);
    soundManager.playAudio("gem");
  }, [applyResult, phase, result]);

  useEffect(() => {
    if (phase !== "revealed") return undefined;

    let animationFrame;
    const alignWinner = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const winner = winningSlotRef.current;
        if (!winner) return;

        reelControls.set({
          x: -(winner.offsetLeft + winner.offsetWidth / 2),
        });
      });
    };

    alignWinner();
    window.addEventListener("resize", alignWinner);
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", alignWinner);
    };
  }, [phase, reelControls]);

  const claim = useCallback(async () => {
    setIsClaiming(true);
    setError("");

    try {
      const response = await fetch(apiUrl("/users/daily-bonus/claim"), {
        method: "POST",
        credentials: "include",
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || "Could not claim the daily bonus");
      }

      resultRef.current = body.data;
      resultAppliedRef.current = false;

      if (isOpenRef.current) {
        setPhase("spinning");
        setResult(body.data);
      } else {
        applyResult(body.data);
      }
    } catch (claimError) {
      if (isOpenRef.current) setError(claimError.message);
    } finally {
      if (isOpenRef.current) setIsClaiming(false);
    }
  }, [applyResult]);

  const resetForTesting = useCallback(async () => {
    setIsResetting(true);
    setError("");

    try {
      const response = await fetch(
        apiUrl("/users/daily-bonus/reset-for-testing"),
        {
          method: "POST",
          credentials: "include",
        }
      );
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || "Could not reset the daily bonus");
      }

      resultRef.current = null;
      resultAppliedRef.current = false;
      setUser((currentUser) =>
        currentUser
          ? {
              ...currentUser,
              dailyBonusStreak: body.data.dailyBonusStreak,
              lastDailyBonusClaimedOn: body.data.lastDailyBonusClaimedOn,
            }
          : currentUser
      );

      if (isOpenRef.current) {
        setPhase("idle");
        setResult(null);
        reelControls.set({ x: 0 });
      }
    } catch (resetError) {
      if (isOpenRef.current) setError(resetError.message);
    } finally {
      if (isOpenRef.current) setIsResetting(false);
    }
  }, [reelControls, setUser]);

  if (!isOpen || !user) return null;

  const hasResult = Boolean(result);
  const isSpinning = phase === "spinning";

  return createPortal(
    <AnimatePresence>
      <div className="daily-bonus-modal-layer">
        <button
          className="daily-bonus-backdrop"
          type="button"
          tabIndex="-1"
          aria-label="Close daily bonus dialog backdrop"
          onClick={closeModal}
        />

        <motion.section
          className={`daily-bonus-modal${
            isSpinning ? " has-case-opening" : ""
          }`}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="daily-bonus-title"
          tabIndex="-1"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <header className="daily-bonus-header">
            <div className="daily-bonus-title">
              <svg
                className="daily-bonus-title-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M4 9h16v11H4V9Zm-1-3h18v4H3V6Zm9 0v14" />
                <path d="M12 6H8.5A2.5 2.5 0 0 1 6 3.5C6 2.1 7.1 2 8 2c1.8 0 3.2 1.6 4 4Zm0 0h3.5A2.5 2.5 0 0 0 18 3.5C18 2.1 16.9 2 16 2c-1.8 0-3.2 1.6-4 4Z" />
              </svg>
              <h1 id="daily-bonus-title">Daily Reward</h1>
            </div>
            <button
              className="daily-bonus-close"
              ref={closeButtonRef}
              type="button"
              aria-label="Close daily bonus dialog"
              onClick={closeModal}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div
            className={`daily-bonus-streak-summary ${
              isClaimedToday ? "is-lit" : "is-off"
            }`}
            data-testid="daily-bonus-streak-summary"
            aria-label={`${currentStreak} day streak. Daily bonus ${
              isClaimedToday ? "claimed today" : "available"
            }.`}
          >
            <svg
              className="daily-bonus-streak-flame"
              viewBox="0 0 32 40"
              aria-hidden="true"
            >
              <path
                className="flame-outer"
                d="M17.6 2.3c1 7.2-4.2 10.1-4.2 15.2 0 2.4 1.3 4.4 3.5 5.3-.2-3.7 2.2-5.7 4.5-8.5.8 3.1 5 5.8 5 11.9 0 6.7-4.7 11.5-11.1 11.5S4.2 33.2 4.2 26.5c0-6.2 4-10.7 7.7-14.5.7 4.3 2.8 6.5 4.5 7.4.4-5.8 4.8-11 1.2-17.1Z"
              />
              <path
                className="flame-inner"
                d="M15.6 34.3c-3.1 0-5.2-2.2-5.2-5.3 0-2.7 1.7-4.7 3.5-6.6.2 2.2 1.5 3.6 2.6 4.2.3-2.7 2.2-4.7 2.1-7.1 2 2.5 3 5.2 3 8.1 0 4-2.4 6.7-6 6.7Z"
              />
            </svg>
            <div className="daily-bonus-streak-copy">
              <strong>{currentStreak}</strong>
              <span>day streak</span>
            </div>
          </div>

          <div
            className="daily-bonus-necklace"
            style={{ "--streak-progress": `${progress}%` }}
            aria-label={`Streak milestones. Current streak: ${currentStreak} days.`}
          >
            <span className="necklace-line" aria-hidden="true" />
            <span className="necklace-progress" aria-hidden="true" />
            {MILESTONES.map((milestone) => (
              <div
                className={`streak-bead${
                  currentStreak >= milestone ? " is-active" : ""
                }`}
                key={milestone}
              >
                <span>{milestone}</span>
              </div>
            ))}
          </div>

          <AnimatePresence initial={false}>
            {hasResult ? (
              <motion.div
                className={`daily-bonus-draw${
                  phase === "revealed" ? " is-revealed" : ""
                }`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <div
                  className={`daily-bonus-case-presentation ${
                    phase === "revealed" ? "is-revealed" : "is-spinning"
                  } ${rarityClass(result.rarity)}`}
                >
                  <motion.div
                    className="daily-bonus-case-stage"
                    animate={
                      phase === "revealed"
                        ? { opacity: 0, scaleY: 0 }
                        : { opacity: 1, scaleY: 1 }
                    }
                    transition={{
                      delay:
                        phase === "revealed" && !prefersReducedMotion
                          ? 0.18
                          : 0,
                      duration: prefersReducedMotion ? 0 : 0.58,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  />

                  <div
                    className="daily-bonus-reel-viewport"
                    ref={reelViewportRef}
                    aria-hidden={phase !== "revealed"}
                  >
                    <motion.div
                      className="daily-bonus-reel"
                      animate={reelControls}
                      style={{ y: "-50%" }}
                    >
                      {reel.map((item) => (
                        <GemSlot
                          isRevealed={phase === "revealed"}
                          item={item}
                          key={item.id}
                          winnerRef={winningSlotRef}
                        />
                      ))}
                    </motion.div>
                  </div>

                  <motion.div
                    className="daily-bonus-case-overlay"
                    animate={
                      phase === "revealed"
                        ? { opacity: 0, scaleY: 0 }
                        : { opacity: 1, scaleY: 1 }
                    }
                    transition={{
                      delay:
                        phase === "revealed" && !prefersReducedMotion
                          ? 0.18
                          : 0,
                      duration: prefersReducedMotion ? 0 : 0.58,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  >
                    <span
                      className="daily-bonus-case-marker"
                      ref={markerRef}
                    />
                    <span className="daily-bonus-edge-fade fade-left" />
                    <span className="daily-bonus-edge-fade fade-right" />
                  </motion.div>

                  {phase === "revealed" ? (
                    <motion.div
                      className="daily-bonus-payout"
                      role="status"
                      aria-live="polite"
                      aria-label={`${formatAmount(result.payout)} gold`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: prefersReducedMotion ? 0 : 0.58,
                        duration: prefersReducedMotion ? 0 : 0.3,
                        ease: "easeOut",
                      }}
                    >
                      <span aria-hidden="true">
                        {formatAmount(result.payout)}
                      </span>
                      <CoinIcon className="daily-bonus-payout-icon" />
                    </motion.div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {isClaimedToday ? (
              <motion.section
                className="daily-bonus-next-claim"
                aria-labelledby="daily-bonus-next-claim-title"
                initial={{ height: 0, marginTop: 0, opacity: 0 }}
                animate={{ height: "auto", marginTop: 14, opacity: 1 }}
                exit={{ height: 0, marginTop: 0, opacity: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.3,
                  ease: "easeOut",
                }}
              >
                <h2 id="daily-bonus-next-claim-title">
                  Next claim in
                </h2>
                <div
                  className="daily-bonus-countdown"
                  role="timer"
                  aria-label={`${nextClaimCountdown.days} days, ${nextClaimCountdown.hours} hours, ${nextClaimCountdown.minutes} minutes, and ${nextClaimCountdown.seconds} seconds until the next claim`}
                >
                  {[
                    ["Day", nextClaimCountdown.days],
                    ["Hour", nextClaimCountdown.hours],
                    ["Min", nextClaimCountdown.minutes],
                    ["Sec", nextClaimCountdown.seconds],
                  ].map(([label, value]) => (
                    <div
                      className="daily-bonus-countdown-unit"
                      key={label}
                    >
                      <strong>{value}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="daily-bonus-next-claim-button"
                  type="button"
                  disabled
                >
                  Claim Daily Bonus
                </button>
              </motion.section>
            ) : null}
          </AnimatePresence>

          {(!hasResult && !isClaimedToday) ||
          error ||
          CAN_RESET_FOR_TESTING ? (
            <div className="daily-bonus-actions">
              {error ? (
                <p className="daily-bonus-error" role="alert">
                  {error}
                </p>
              ) : null}
              {!hasResult && !isClaimedToday ? (
                <button
                  ref={claimButtonRef}
                  className="daily-bonus-claim"
                  type="button"
                  disabled={isClaiming || isResetting || isClaimedToday}
                  onClick={claim}
                >
                  {isClaiming
                    ? "Opening…"
                    : "Claim Daily Bonus"}
                </button>
              ) : null}
              {CAN_RESET_FOR_TESTING ? (
                <button
                  className="daily-bonus-reset"
                  type="button"
                  disabled={isClaiming || isResetting || isSpinning}
                  onClick={resetForTesting}
                >
                  {isResetting ? "Resetting…" : "Reset for testing"}
                </button>
              ) : null}
            </div>
          ) : null}
        </motion.section>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default DailyBonusModal;
