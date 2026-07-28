import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "../../Contexts/UserProvider";
import { apiUrl } from "../../config/api";
import CoinIcon from "../BetAmountInput/CoinIcon";
import CustomSelect from "../CustomSelect/CustomSelect";
import MinesIcon from "../Navigation/MinesIcon";
import "./StatsDrawer.scss";

const PAGE_SIZE = 10;
const EMPTY_SUMMARY = {
  gamesPlayed: 0,
  totalWagered: 0,
  totalPayout: 0,
  netResult: 0,
  maxGameNet: null,
};
const GAME_NAMES = {
  blackjack: "Blackjack",
  mines: "Mines",
  roulette: "Roulette",
};
const GAME_OPTIONS = [
  { value: "all", label: "All Games" },
  { value: "roulette", label: "Roulette" },
  { value: "blackjack", label: "Blackjack" },
  { value: "mines", label: "Mines" },
];
const HISTORY_SKELETON_ROWS = 6;

const formatMoney = (value, { signed = false } = {}) => {
  const number = Number(value) || 0;
  const formatted = Math.abs(number).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (!signed || number === 0) return formatted;
  return `${number > 0 ? "+" : "-"}${formatted}`;
};

const formatCompletedAt = (value) => {
  const completedAt = new Date(value);
  if (Number.isNaN(completedAt.getTime())) return "";

  return completedAt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const GameIcon = ({ game }) => {
  if (game === "mines") return <MinesIcon />;

  if (game === "roulette") {
    return (
      <svg fill="currentColor" viewBox="0 0 96 96" aria-hidden="true">
        <path d="M8.313 21.03h5.595l3.995 3.995 22.056 22.137a6.021 6.021 0 0 0 0 .857v-.018a7.992 7.992 0 1 0 15.985 0 7.992 7.992 0 0 0-7.992-7.992h-.84L20.9 13.916V.049h-9.91v10.99H0v9.988l8.313.003ZM47.952.052A47.352 47.352 0 0 0 28.67 4.17l.303-.12v6.593l2.997 2.997c4.723-2.26 10.267-3.581 16.12-3.581 21.031 0 38.08 17.049 38.08 38.08 0 21.032-17.049 38.08-38.08 38.08-21.032 0-38.081-17.048-38.081-38.08 0-5.765 1.282-11.23 3.574-16.127l.007.007.1-.23-.107.224-2.99-2.952H4C1.537 34.645.102 41.157.102 48.001c0 26.483 21.466 47.95 47.949 47.95C74.534 95.95 96 74.483 96 48 96 21.518 74.534.052 48.05.052h-.098ZM30.009 48.463c.246 9.707 8.181 17.501 17.942 17.52l-.003.041h.219c9.931 0 17.98-8.05 17.98-17.98 0-9.854-7.926-17.859-17.762-17.981l-8.79-8.751-.194.054a27.416 27.416 0 0 1 8.475-1.334h.072c15.445 0 27.97 12.52 27.97 27.97 0 15.445-12.525 27.969-27.97 27.969-15.446 0-27.97-12.52-27.97-27.97v-.071c0-2.958.468-5.805 1.28-8.28l8.75 8.789v.024Z" />
      </svg>
    );
  }

  return (
    <svg fill="currentColor" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M7.36 42.39c1-12.78 14.729-25.29 17.926-29.976 2.778-4.206 1.72-9.203.83-11.4a.78.78 0 0 1 .893-1h-.004c13.89 2.918 14.588 13.48 14.169 18.206-.42 4.726.42 7.913 3.477 7.224C47.71 24.754 46.68 17 46.68 17s14.04 16.676 8.893 33.073c-2.587 8.574-9.032 12.19-14.448 13.89-.28.14-.56-.14-.56-.55.7-2.638 2.508-4.726 3.058-7.644 1.12-4.796-3.327-9.213-6.625-11.71-2.062-1.538-3.385-3.97-3.385-6.712 0-.127.002-.255.008-.381v.018c0-.28-.42-.42-.55-.28a90.106 90.106 0 0 1-6.652 7.202l-.023.022c-5.135 5.696-7.783 12.09-3.197 19.175.14.28-.14.69-.41.56-11.4-3.068-16.117-11.691-15.427-21.273Z" />
    </svg>
  );
};

const GameFilterIcon = ({ game }) => {
  if (game !== "all") return <GameIcon game={game} />;

  return (
    <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="4" height="4" rx="1" />
      <rect x="4" y="10" width="4" height="4" rx="1" />
      <rect x="4" y="16" width="4" height="4" rx="1" />
      <path d="M11 6h9M11 12h9M11 18h9" />
    </svg>
  );
};

const SummarySkeleton = ({ game }) => (
  <div
    className="stats-summary-skeleton"
    role="status"
    aria-label="Loading statistics"
  >
    <div className="stats-summary-grid" aria-hidden="true">
      <div className="stats-summary-card">
        <span className="stats-skeleton-line stats-skeleton-summary-label" />
        <span className="stats-skeleton-line stats-skeleton-summary-total" />
      </div>
      <div className="stats-summary-card">
        <span className="stats-skeleton-line stats-skeleton-summary-label" />
        <span className="stats-skeleton-line stats-skeleton-summary-value" />
      </div>
      <div className="stats-summary-card">
        <span className="stats-skeleton-line stats-skeleton-summary-label" />
        <span className="stats-skeleton-line stats-skeleton-summary-value" />
      </div>
    </div>
    <div className="stats-game-breakdown" aria-hidden="true">
      {Array.from({ length: game === "all" ? 3 : 1 }, (_, index) => (
        <div key={index}>
          <span>
            <span className="stats-skeleton-circle stats-skeleton-game-icon" />
            <span className="stats-skeleton-line stats-skeleton-game-name" />
          </span>
          <span className="stats-skeleton-line stats-skeleton-game-result" />
        </div>
      ))}
    </div>
  </div>
);

const HistorySkeleton = () => (
  <div
    className="stats-history-skeleton"
    role="status"
    aria-label="Loading game history"
  >
    <div aria-hidden="true">
      {Array.from({ length: HISTORY_SKELETON_ROWS }, (_, index) => (
        <div className="stats-history-row" key={index}>
          <div className="stats-history-game">
            <span className="stats-skeleton-circle stats-skeleton-history-icon" />
            <div>
              <span className="stats-skeleton-line stats-skeleton-history-name" />
              <span className="stats-skeleton-line stats-skeleton-history-time" />
            </div>
          </div>
          <div className="stats-skeleton-history-result">
            <span className="stats-skeleton-line stats-skeleton-history-value" />
            <span className="stats-skeleton-circle stats-skeleton-coin" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StatsDrawer = ({
  desktopOffset = 240,
  isMobile,
  isOpen,
  onClose,
}) => {
  const { user } = useUser();
  const userId = user?.id;
  const [range, setRange] = useState("day");
  const [game, setGame] = useState("all");
  const [analytics, setAnalytics] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [results, setResults] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyReady, setHistoryReady] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const dialogRef = useRef(null);
  const scrollRef = useRef(null);
  const loadMoreRef = useRef(null);
  const historyRequestId = useRef(0);
  const historyLoadingRef = useRef(false);

  const games = useMemo(() => {
    const rows = analytics?.games ?? [];
    return ["roulette", "blackjack", "mines"].map(
      (game) => rows.find((row) => row.game === game) ?? {
        game,
        ...EMPTY_SUMMARY,
      }
    );
  }, [analytics]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocusedElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
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
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !userId) return undefined;

    const controller = new AbortController();
    setAnalytics(null);
    setSummaryLoading(true);
    setSummaryError("");

    fetch(apiUrl(`/analytics?range=${range}&game=${game}`), {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load your stats.");
        return response.json();
      })
      .then(setAnalytics)
      .catch((error) => {
        if (error.name !== "AbortError") {
          setSummaryError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setSummaryLoading(false);
      });

    return () => controller.abort();
  }, [game, isOpen, range, userId]);

  const fetchHistory = useCallback(
    async (cursor = null, replace = false) => {
      if (!isOpen || !userId || historyLoadingRef.current) return;

      const requestId = ++historyRequestId.current;
      historyLoadingRef.current = true;
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const params = new URLSearchParams({
          game,
          limit: String(PAGE_SIZE),
        });
        if (cursor) params.set("cursor", cursor);

        const response = await fetch(
          apiUrl(`/analytics/history?${params.toString()}`),
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Unable to load your game history.");

        const page = await response.json();
        if (requestId !== historyRequestId.current) return;

        setResults((current) =>
          replace ? page.results : [...current, ...page.results]
        );
        setNextCursor(page.nextCursor);
        setHistoryReady(true);
      } catch (error) {
        if (requestId === historyRequestId.current) {
          setHistoryError(error.message);
          setHistoryReady(true);
        }
      } finally {
        if (requestId === historyRequestId.current) {
          historyLoadingRef.current = false;
          setHistoryLoading(false);
        }
      }
    },
    [game, isOpen, userId]
  );

  useEffect(() => {
    historyRequestId.current += 1;
    setResults([]);
    setNextCursor(null);
    setHistoryReady(false);
    setHistoryError("");
    historyLoadingRef.current = false;
    setHistoryLoading(false);
    scrollRef.current?.scrollTo?.({ top: 0 });

    if (isOpen && userId) void fetchHistory(null, true);
  }, [fetchHistory, game, isOpen, userId]);

  useEffect(() => {
    if (
      !isOpen ||
      !userId ||
      !historyReady ||
      historyLoading ||
      !nextCursor ||
      !loadMoreRef.current
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void fetchHistory(nextCursor);
      },
      { root: scrollRef.current, rootMargin: "160px 0px" }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [
    fetchHistory,
    historyLoading,
    historyReady,
    isOpen,
    nextCursor,
    userId,
  ]);

  const summary = analytics?.summary ?? EMPTY_SUMMARY;
  const handleRangeChange = (nextRange) => {
    if (nextRange === range) return;

    setAnalytics(null);
    setSummaryError("");
    setRange(nextRange);
  };
  const handleGameChange = (nextGame) => {
    if (nextGame === game) return;

    setAnalytics(null);
    setSummaryError("");
    setResults([]);
    setHistoryReady(false);
    setHistoryError("");
    setGame(nextGame);
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div
          className={`stats-drawer-layer${isMobile ? " is-mobile" : ""}`}
          style={{ "--stats-drawer-left": `${desktopOffset}px` }}
        >
          <motion.button
            className="stats-drawer-backdrop"
            type="button"
            tabIndex="-1"
            aria-label="Close stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            id="stats-drawer"
            className="stats-drawer"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Game statistics"
            initial={
              isMobile ? { y: "100%" } : { x: -28, opacity: 0 }
            }
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={isMobile ? { y: "100%" } : { x: -28, opacity: 0 }}
            transition={
              isMobile
                ? { type: "spring", duration: 0.52, bounce: 0.18 }
                : { type: "spring", duration: 0.38, bounce: 0.08 }
            }
          >
            {isMobile ? <span className="stats-drawer-handle" /> : null}
            <header className="stats-drawer-header">
              <CustomSelect
                className="stats-game-select"
                label="Game"
                menuLabel="Games"
                options={GAME_OPTIONS}
                value={game}
                onChange={handleGameChange}
                renderIcon={(option) => (
                  <GameFilterIcon game={option.value} />
                )}
              />
              <button
                className="stats-close-button"
                type="button"
                aria-label="Close stats"
                autoFocus
                onClick={onClose}
              >
                <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </header>

            <div className="stats-drawer-scroll" ref={scrollRef}>
              <section className="stats-overview" aria-label="Stats summary">
                <div className="stats-range-toggle">
                  <button
                    type="button"
                    className={range === "day" ? "is-selected" : ""}
                    aria-pressed={range === "day"}
                    onClick={() => handleRangeChange("day")}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className={range === "week" ? "is-selected" : ""}
                    aria-pressed={range === "week"}
                    onClick={() => handleRangeChange("week")}
                  >
                    7 days
                  </button>
                </div>

                {summaryError ? (
                  <p className="stats-error" role="alert">
                    {summaryError}
                  </p>
                ) : analytics ? (
                  <>
                    <div
                      className="stats-summary-grid"
                      aria-busy={summaryLoading}
                    >
                      <div className="stats-summary-card">
                        <span>Games played</span>
                        <strong>{summary.gamesPlayed}</strong>
                      </div>
                      <div className="stats-summary-card">
                        <span>Net result</span>
                        <strong
                          className={
                            Number(summary.netResult) > 0
                              ? "is-positive"
                              : Number(summary.netResult) < 0
                                ? "is-negative"
                                : ""
                          }
                        >
                          {formatMoney(summary.netResult, {
                            signed: true,
                          })}
                          <CoinIcon />
                        </strong>
                      </div>
                      <div className="stats-summary-card">
                        <span>Wagered</span>
                        <strong>
                          {formatMoney(summary.totalWagered)}
                          <CoinIcon />
                        </strong>
                      </div>
                    </div>

                    <div className="stats-game-breakdown">
                      {games
                        .filter(
                          (gameRow) =>
                            game === "all" || gameRow.game === game
                        )
                        .map((gameRow) => (
                          <div key={gameRow.game}>
                            <span>
                              <GameIcon game={gameRow.game} />
                              {GAME_NAMES[gameRow.game]}
                            </span>
                            <strong
                              className={
                                Number(gameRow.netResult) > 0
                                  ? "is-positive"
                                  : Number(gameRow.netResult) < 0
                                    ? "is-negative"
                                    : ""
                              }
                            >
                              {formatMoney(gameRow.netResult, {
                                signed: true,
                              })}
                            </strong>
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <SummarySkeleton game={game} />
                )}
              </section>

              <section className="stats-history" aria-label="Game history">
                <div className="stats-history-title">
                  <div>
                    <span>Recent activity</span>
                    <h3>Game history</h3>
                  </div>
                  <span>Result</span>
                </div>

                {!historyReady &&
                results.length === 0 &&
                !historyError ? (
                  <HistorySkeleton />
                ) : null}

                {results.map((result) => (
                  <article className="stats-history-row" key={result.id}>
                    <div className="stats-history-game">
                      <span className="stats-game-icon">
                        <GameIcon game={result.game} />
                      </span>
                      <div>
                        <strong>{GAME_NAMES[result.game]}</strong>
                        <time dateTime={result.completedAt}>
                          {formatCompletedAt(result.completedAt)}
                        </time>
                      </div>
                    </div>
                    <span
                      className={`stats-history-result${
                        Number(result.netResult) > 0
                          ? " is-positive"
                          : Number(result.netResult) < 0
                            ? " is-negative"
                            : ""
                      }`}
                    >
                      {formatMoney(result.netResult, { signed: true })}
                      <CoinIcon />
                    </span>
                  </article>
                ))}

                {historyReady &&
                !historyLoading &&
                !historyError &&
                results.length === 0 ? (
                  <div className="stats-empty-history">
                    <p>No completed games yet.</p>
                    <span>Your next result will show up here.</span>
                  </div>
                ) : null}

                {historyError ? (
                  <div className="stats-history-error">
                    <p role="alert">{historyError}</p>
                    <button
                      type="button"
                      onClick={() =>
                        fetchHistory(
                          results.length ? nextCursor : null,
                          results.length === 0
                        )
                      }
                    >
                      Try again
                    </button>
                  </div>
                ) : null}

                <div
                  className="stats-history-sentinel"
                  ref={loadMoreRef}
                  aria-hidden="true"
                />
                {historyLoading && results.length > 0 ? (
                  <div
                    className="stats-history-loading"
                    aria-label="Loading more game history"
                  >
                    <span />
                    <span />
                    <span />
                  </div>
                ) : null}
              </section>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default StatsDrawer;
