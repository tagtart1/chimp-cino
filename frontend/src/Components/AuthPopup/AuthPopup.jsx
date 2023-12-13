import React, { useEffect, useState, useRef } from "react";
import "./AuthPopup.scss";
import { useUser } from "../../Contexts/UserProvider";
import SignUp from "./SignUp";
import LogIn from "./LogIn";

const AuthPopup = ({ isLogIn, isVisible, close }) => {
  const [showLogIn, setToggleLogInForm] = useState(null);

  const closeSelf = () => {
    setToggleLogInForm(null);
    close();
  };

  useEffect(() => {
    setToggleLogInForm(isLogIn);
  }, [isLogIn]);

  if (!isVisible || showLogIn === null) return;
  return (
    <div className="auth-popup-wrapper">
      {showLogIn ? (
        <LogIn close={closeSelf} toggleSelf={() => setToggleLogInForm(false)} />
      ) : (
        <SignUp close={closeSelf} toggleSelf={() => setToggleLogInForm(true)} />
      )}
    </div>
  );
};

export default AuthPopup;
