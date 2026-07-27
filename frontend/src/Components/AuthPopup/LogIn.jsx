import React, { useState } from "react";
import "./AuthPopup.scss";
import { useUser } from "../../Contexts/UserProvider";
import { apiUrl } from "../../config/api";
import PasswordField from "./PasswordField";

const LogIn = ({ close, titleId, toggleSelf }) => {
  const { setUser } = useUser();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logIn = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const emailOrUsername = form.emailOrUsername.value;
    const password = form.password.value;

    setErrorMessage("");
    setIsSubmitting(true);

    const options = {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailOrUsername: emailOrUsername,
        password: password,
      }),
    };

    try {
      const response = await fetch(apiUrl("/users/log-in"), options);

      if (!response.ok) {
        const errors = await response.json();
        setErrorMessage(errors.message || "We couldn't sign you in.");
        return;
      }

      const result = await response.json();
      setUser(result.data);
      close();
    } catch {
      setErrorMessage("We couldn't reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-form-content">
      <div className="auth-heading">
        <span className="auth-kicker">Welcome back</span>
        <h1 id={titleId}>Sign in to Chimpcino</h1>
        <p>Your balance and games are waiting.</p>
      </div>

      <form onSubmit={logIn}>
        <div className="form-group">
          <label htmlFor="emailOrUsername">Email or username</label>
          <input
            type="text"
            id="emailOrUsername"
            name="emailOrUsername"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            autoFocus
            required
          />
        </div>

        <PasswordField id="login-password" autoComplete="current-password" />

        {errorMessage && (
          <p className="auth-error" role="alert">
            {errorMessage}
          </p>
        )}

        <button className="submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="auth-switch">
        <span>New to Chimpcino?</span>
        <button type="button" onClick={toggleSelf}>
          Create an account
        </button>
      </div>
    </div>
  );
};

export default LogIn;
