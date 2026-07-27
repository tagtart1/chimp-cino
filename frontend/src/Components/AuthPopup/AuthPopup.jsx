import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import "./AuthPopup.scss";
import SignUp from "./SignUp";
import LogIn from "./LogIn";

const AuthPopup = ({ isLogIn, isVisible, close }) => {
  const [showLogIn, setToggleLogInForm] = useState(null);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 520px)").matches
  );
  const dialogRef = useRef(null);
  const closeRef = useRef(close);

  const closeSelf = useCallback(() => {
    setToggleLogInForm(null);
    closeRef.current();
  }, []);

  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  useEffect(() => {
    setToggleLogInForm(isLogIn);
  }, [isLogIn]);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 520px)");
    const updateMobileState = (event) => setIsMobile(event.matches);

    mobileQuery.addEventListener("change", updateMobileState);
    return () => mobileQuery.removeEventListener("change", updateMobileState);
  }, []);

  const isOpen = isVisible && showLogIn !== null;

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocusedElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeSelf();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = dialogRef.current.querySelectorAll(
        'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
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
  }, [closeSelf, isOpen]);

  if (!isOpen) return null;

  const titleId = showLogIn ? "login-title" : "signup-title";

  return (
    <div className="auth-popup-wrapper">
      <button
        className="auth-overlay"
        type="button"
        tabIndex="-1"
        aria-label="Close dialog backdrop"
        onClick={closeSelf}
      />
      <motion.section
        className="auth-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ y: isMobile ? window.innerHeight : 10 }}
        animate={{ y: 0 }}
        transition={
          isMobile
            ? { type: "spring", duration: 0.52, bounce: 0.2 }
            : { type: "tween", duration: 0.18, ease: "easeOut" }
        }
      >
        <button
          className="close-popup-button"
          type="button"
          aria-label="Close authentication dialog"
          onClick={closeSelf}
        >
          <svg aria-hidden="true" fill="currentColor" viewBox="0 0 64 64">
            <path d="m54.827 16.187-7.013-7.014L32 24.987 16.187 9.173l-7.013 7.014L24.987 32 9.174 47.813l7.013 7.014 15.814-15.814 15.813 15.814 7.013-7.014L39.014 32l15.813-15.813Z" />
          </svg>
        </button>

        {showLogIn ? (
          <LogIn
            autoFocus={!isMobile}
            close={closeSelf}
            titleId={titleId}
            toggleSelf={() => setToggleLogInForm(false)}
          />
        ) : (
          <SignUp
            autoFocus={!isMobile}
            close={closeSelf}
            titleId={titleId}
            toggleSelf={() => setToggleLogInForm(true)}
          />
        )}
      </motion.section>
    </div>
  );
};

export default AuthPopup;
