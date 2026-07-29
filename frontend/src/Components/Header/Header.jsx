import React, { useEffect, useState, useRef } from "react";
import "./Header.scss";
import logo from "../../images/chimps-logo-small.png";
import AuthPopup from "../AuthPopup/AuthPopup";
import { useUser } from "../../Contexts/UserProvider";
import { Link } from "react-router-dom";
import { apiUrl } from "../../config/api";
import { useAuthPopup } from "../../Contexts/AuthPopupProvider";
import WalletBalance from "../WalletBalance/WalletBalance";

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
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

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

  return (
    <header className="app-header">
      <div className="header-wrapper">
        <Link className="header-brand" to="/" aria-label="Chimps Casino home">
          <img src={logo} alt="Chimps" className="logo" />
          <span className="compact-logo" aria-hidden="true">
            C
          </span>
        </Link>
        <WalletBalance />
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
