import { useEffect, useRef, useState } from "react";
import { useUser } from "../../Contexts/UserProvider";
import DailyBonusModal from "../DailyBonusModal/DailyBonusModal";
import "./WalletBalance.scss";

const BALANCE_TOAST_DURATION_MS = 1800;
const MAX_BALANCE_TOASTS = 2;

const formatNum = (num) =>
  Number(num).toLocaleString("en-US", {
    style: "decimal",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

const WalletBalance = () => {
  const { user } = useUser();
  const previousBalanceRef = useRef(null);
  const balanceToastIdRef = useRef(0);
  const balanceToastTimersRef = useRef(new Map());
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [balanceToasts, setBalanceToasts] = useState([]);

  useEffect(() => {
    const currentBalance = Number(user?.balance);

    if (!Number.isFinite(currentBalance)) {
      previousBalanceRef.current = null;
      balanceToastTimersRef.current.forEach(clearTimeout);
      balanceToastTimersRef.current.clear();
      setBalanceToasts([]);
      setShowDailyBonus(false);
      return;
    }

    const previousBalance = previousBalanceRef.current;
    previousBalanceRef.current = currentBalance;

    if (previousBalance === null || currentBalance <= previousBalance) return;

    const toast = {
      id: ++balanceToastIdRef.current,
      amount: currentBalance - previousBalance,
    };

    setBalanceToasts((currentToasts) =>
      [toast, ...currentToasts].slice(0, MAX_BALANCE_TOASTS)
    );

    const timerId = setTimeout(() => {
      setBalanceToasts((currentToasts) =>
        currentToasts.filter(({ id }) => id !== toast.id)
      );
      balanceToastTimersRef.current.delete(toast.id);
    }, BALANCE_TOAST_DURATION_MS);

    balanceToastTimersRef.current.set(toast.id, timerId);
  }, [user?.balance]);

  useEffect(
    () => () => {
      balanceToastTimersRef.current.forEach(clearTimeout);
      balanceToastTimersRef.current.clear();
    },
    []
  );

  if (!user) return null;

  return (
    <>
      <div className="wallet-balance">
        <div className="balance-num">
          {balanceToasts[0] ? (
            <span
              className="balance-win-highlight"
              key={balanceToasts[0].id}
              aria-hidden="true"
            />
          ) : null}
          <span className="balance-value" title={formatNum(user.balance)}>
            {formatNum(user.balance)}
          </span>
          <svg
            className="coin-icon"
            fill="none"
            viewBox="0 0 96 96"
            aria-hidden="true"
          >
            <path
              d="M48 96c26.51 0 48-21.49 48-48S74.51 0 48 0 0 21.49 0 48s21.49 48 48 48Z"
              fill="#FFC800"
            />
            <path
              d="M48.16 21.92c10.16 0 16.56 4.92 20.32 10.72l-8.68 4.72c-2.28-3.44-6.48-6.16-11.64-6.16-8.88 0-15.36 6.84-15.36 16.12 0 9.28 6.48 16.12 15.36 16.12 4.48 0 8.44-1.84 10.6-3.76v-5.96H45.68v-8.96h23.4v18.76c-5 5.6-12 9.28-20.88 9.28-14.32 0-26.12-10-26.12-25.44C22.08 31.92 33.84 22 48.2 22l-.04-.08Z"
              fill="#473800"
            />
          </svg>
          <span
            className="balance-increase-stack"
            aria-live="polite"
            aria-atomic="false"
          >
            {balanceToasts.map((toast, index) => (
              <span
                className={`balance-increase-slot${
                  index === 1 ? " is-previous" : ""
                }`}
                key={toast.id}
              >
                <span className="balance-increase-amount">
                  +{formatNum(toast.amount)}
                </span>
              </span>
            ))}
          </span>
        </div>
        <button
          type="button"
          className="wallet-button"
          aria-label="Wallet"
          title="Wallet"
          aria-haspopup="dialog"
          aria-expanded={showDailyBonus}
          onClick={() => setShowDailyBonus(true)}
        >
          <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4.75 6.75h13.5A1.75 1.75 0 0 1 20 8.5v9.75H4.75A2.75 2.75 0 0 1 2 15.5v-8A2.75 2.75 0 0 1 4.75 4.75h11.5" />
            <path d="M20 10h-4.25a2.25 2.25 0 0 0 0 4.5H20V10Z" />
            <circle
              cx="16"
              cy="12.25"
              r=".75"
              fill="currentColor"
              stroke="none"
            />
          </svg>
        </button>
      </div>
      <DailyBonusModal
        isOpen={showDailyBonus}
        onClose={() => setShowDailyBonus(false)}
      />
    </>
  );
};

export default WalletBalance;
