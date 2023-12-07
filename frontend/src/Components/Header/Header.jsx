import React, { useEffect, useState, useRef } from "react";
import "./Header.scss";
import logo from "../../images/chimps-logo-small.png";
import AuthPopup from "../AuthPopup/AuthPopup";
import { useUser } from "../../Contexts/UserProvider";

const Header = () => {
  const { user, setUser } = useUser();
  const dropdownRef = useRef(null);
  const [showLogin, setShowLogin] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const logoutEndpoint = "http://localhost:5000/api/v1/users/log-out";

  const logOut = async () => {
    try {
      const response = await fetch(logoutEndpoint, {
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
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAccountDropdown(false);
        document.removeEventListener("mouseup", handleOutsideClick);
      }
    };

    document.addEventListener("mouseup", handleOutsideClick);
    return () => {
      document.removeEventListener("mouseup", handleOutsideClick);
    };
  }, [showAccountDropdown]);

  return (
    <header>
      <div className="header-wrapper">
        <img src={logo} alt="logo" className="logo" />
        {user ? (
          <div className="balance-bar">
            <div className="balance-num">
              {formatNum(user.balance)}
              <svg fill="none" viewBox="0 0 96 96">
                <path
                  d="M48 96c26.51 0 48-21.49 48-48S74.51 0 48 0 0 21.49 0 48s21.49 48 48 48Z"
                  fill="#FFC800"
                ></path>
                <path
                  d="M48.16 21.92c10.16 0 16.56 4.92 20.32 10.72l-8.68 4.72c-2.28-3.44-6.48-6.16-11.64-6.16-8.88 0-15.36 6.84-15.36 16.12 0 9.28 6.48 16.12 15.36 16.12 4.48 0 8.44-1.84 10.6-3.76v-5.96H45.68v-8.96h23.4v18.76c-5 5.6-12 9.28-20.88 9.28-14.32 0-26.12-10-26.12-25.44C22.08 31.92 33.84 22 48.2 22l-.04-.08Z"
                  fill="#473800"
                ></path>
              </svg>
            </div>
            <div className="wallet-button">Wallet</div>
          </div>
        ) : null}
        <div className="auth-actions-group">
          {user ? (
            <button
              className="profile-dropdown-button"
              aria-label="Open Dropdown"
              onClick={() => {
                setShowAccountDropdown(true);
              }}
            >
              <svg fill="currentColor" viewBox="0 0 64 64">
                <path d="M48.322 30.536A19.63 19.63 0 0 0 51.63 19.63 19.619 19.619 0 0 0 32 0a19.63 19.63 0 1 0 16.322 30.536ZM42.197 43.97a26.63 26.63 0 0 0 8.643-5.78A19.84 19.84 0 0 1 64 56.86V64H0v-7.14a19.84 19.84 0 0 1 13.16-18.67 26.63 26.63 0 0 0 29.037 5.78Z"></path>
              </svg>
              {showAccountDropdown ? (
                <div className="account-dropdown-menu" ref={dropdownRef}>
                  <div className="arrow"></div>
                  <ul>
                    <li onClick={logOut}>
                      <svg fill="currentColor" viewBox="0 0 64 64">
                        <path d="M23.174 48.96h15.174v-6.506h8V56.96H23.174V64L0 56.96V7.04L23.174 0v7.04h23.174v14.506h-8V15.04H23.174v33.92Zm25.332-25.895L64 32l-15.494 8.934V36h-16.16v-8h16.16v-4.934Z"></path>
                      </svg>
                      <p>Logout</p>
                    </li>
                  </ul>
                </div>
              ) : null}
            </button>
          ) : (
            <>
              <button
                className="sign-in-button"
                onClick={() => {
                  setShowLogin(true);
                  setShowPopup(true);
                }}
              >
                Sign In
              </button>
              <button
                className="register-button"
                onClick={() => {
                  setShowLogin(false);
                  setShowPopup(true);
                }}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
      <AuthPopup
        isLogIn={showLogin}
        isVisible={showPopup}
        close={() => setShowPopup(false)}
      />
    </header>
  );
};

export default Header;
