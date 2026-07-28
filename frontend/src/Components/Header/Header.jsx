import React, { useEffect, useState, useRef } from "react";
import "./Header.scss";
import logo from "../../images/chimps-logo-small.png";
import AuthPopup from "../AuthPopup/AuthPopup";
import { useUser } from "../../Contexts/UserProvider";
import { Link } from "react-router-dom";
import soundManager from "../../Helpers/sfxPlayer";
import { apiUrl } from "../../config/api";
import { useAuthPopup } from "../../Contexts/AuthPopupProvider";

const Header = () => {
  const { user, setUser } = useUser();
  const {
    isLogIn,
    isVisible,
    openLogin,
    openSignUp,
    closeAuth,
  } = useAuthPopup();
  const dropdownRef = useRef(null);
  const previousBalanceRef = useRef(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [balanceIncrease, setBalanceIncrease] = useState(null);

  const logOut = async () => {
    try {
      const response = await fetch(apiUrl("/users/log-out"), {
        credentials: "include",
        method: "POST",
      });

      if (response.ok) {
        console.log("log out");
        setUser(null);
        setShowAccountDropdown(false);
      }
    } catch (error) {
      console.log("Error fetching!");
    }
  };

  const formatNum = (num) => {
    const trueNum = parseFloat(num);
    const res = trueNum.toLocaleString("en-US", {
      style: "decimal",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

    return res;
  };

  useEffect(() => {
    if (!showAccountDropdown) return undefined;

    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAccountDropdown(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setShowAccountDropdown(false);
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showAccountDropdown]);

  useEffect(() => {
    const currentBalance = Number(user?.balance);

    if (!Number.isFinite(currentBalance)) {
      previousBalanceRef.current = null;
      return;
    }

    const previousBalance = previousBalanceRef.current;
    previousBalanceRef.current = currentBalance;

    if (previousBalance === null || currentBalance <= previousBalance) return;

    setBalanceIncrease(currentBalance - previousBalance);
    const timerId = setTimeout(() => {
      setBalanceIncrease(null);
    }, 1600);

    return () => clearTimeout(timerId);
  }, [user?.balance]);

  return (
    <header className="app-header">
      <div className="header-wrapper">
        <Link className="header-brand" to="/" aria-label="Chimps Casino home">
          <img src={logo} alt="Chimps" className="logo" />
          <span className="compact-logo" aria-hidden="true">
            C
          </span>
        </Link>
        {user ? (
          <div className="balance-bar">
            <div
              className={`balance-num${
                balanceIncrease !== null ? " balance-increased" : ""
              }`}
            >
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
                ></path>
                <path
                  d="M48.16 21.92c10.16 0 16.56 4.92 20.32 10.72l-8.68 4.72c-2.28-3.44-6.48-6.16-11.64-6.16-8.88 0-15.36 6.84-15.36 16.12 0 9.28 6.48 16.12 15.36 16.12 4.48 0 8.44-1.84 10.6-3.76v-5.96H45.68v-8.96h23.4v18.76c-5 5.6-12 9.28-20.88 9.28-14.32 0-26.12-10-26.12-25.44C22.08 31.92 33.84 22 48.2 22l-.04-.08Z"
                  fill="#473800"
                ></path>
              </svg>
              {balanceIncrease !== null ? (
                <span className="balance-increase-amount">
                  +
                  {formatNum(balanceIncrease)}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              className="wallet-button"
              aria-label="Wallet"
              title="Wallet"
              onClick={() => {
                soundManager.playAudio("bomb");
              }}
            >
              <svg
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M4.75 6.75h13.5A1.75 1.75 0 0 1 20 8.5v9.75H4.75A2.75 2.75 0 0 1 2 15.5v-8A2.75 2.75 0 0 1 4.75 4.75h11.5" />
                <path d="M20 10h-4.25a2.25 2.25 0 0 0 0 4.5H20V10Z" />
                <circle cx="16" cy="12.25" r=".75" fill="currentColor" stroke="none" />
              </svg>
            </button>
          </div>
        ) : null}
        <div className="auth-actions-group">
          {user ? (
            <div className="account-menu" ref={dropdownRef}>
              <button
                type="button"
                className="profile-dropdown-button"
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={showAccountDropdown}
                onClick={() => {
                  setShowAccountDropdown((isOpen) => !isOpen);
                }}
              >
                <svg fill="currentColor" viewBox="0 0 64 64" aria-hidden="true">
                  <path d="M48.322 30.536A19.63 19.63 0 0 0 51.63 19.63 19.619 19.619 0 0 0 32 0a19.63 19.63 0 1 0 16.322 30.536ZM42.197 43.97a26.63 26.63 0 0 0 8.643-5.78A19.84 19.84 0 0 1 64 56.86V64H0v-7.14a19.84 19.84 0 0 1 13.16-18.67 26.63 26.63 0 0 0 29.037 5.78Z"></path>
                </svg>
              </button>
              {showAccountDropdown ? (
                <div className="account-dropdown-menu" role="menu">
                  <span className="arrow" aria-hidden="true"></span>
                  <button type="button" role="menuitem" onClick={logOut}>
                    <span className="logout-icon">
                      <svg fill="currentColor" viewBox="0 0 64 64">
                        <path d="M23.174 48.96h15.174v-6.506h8V56.96H23.174V64L0 56.96V7.04L23.174 0v7.04h23.174v14.506h-8V15.04H23.174v33.92Zm25.332-25.895L64 32l-15.494 8.934V36h-16.16v-8h16.16v-4.934Z"></path>
                      </svg>
                    </span>
                    <span>Log out</span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <button
                className="sign-in-button"
                onClick={openLogin}
              >
                Sign In
              </button>
              <button
                className="register-button"
                onClick={openSignUp}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
      <AuthPopup
        isLogIn={isLogIn}
        isVisible={isVisible}
        close={closeAuth}
      />
    </header>
  );
};

export default Header;
