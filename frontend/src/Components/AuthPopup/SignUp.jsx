import React, { useState } from "react";
import "./AuthPopup.scss";
import { useUser } from "../../Contexts/UserProvider";
import { apiUrl } from "../../config/api";
import PasswordField from "./PasswordField";

const SignUp = ({ close, titleId, toggleSelf }) => {
  const { setUser } = useUser();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signUp = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const username = form.username.value;
    const email = form.email.value;
    const password = form.password.value;

    setErrorMessage("");
    setIsSubmitting(true);

    const options = {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
      }),
    };

    try {
      const response = await fetch(apiUrl("/users/sign-up"), options);

      if (!response.ok) {
        const errors = await response.json();
        setErrorMessage(errors.message || "We couldn't create your account.");
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
        <span className="auth-kicker">New player</span>
        <h1 id={titleId}>Create your account</h1>
        <p>Start with 10,000 demo chips and join the table.</p>
      </div>

      <form onSubmit={signUp}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            autoFocus
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            autoCapitalize="none"
            inputMode="email"
            spellCheck="false"
            required
          />
        </div>

        <PasswordField
          id="signup-password"
          autoComplete="new-password"
          helperText="8–32 characters with uppercase, lowercase, number, and symbol."
        />

        {errorMessage && (
          <p className="auth-error" role="alert">
            {errorMessage}
          </p>
        )}

        <button className="submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <div className="auth-switch">
        <span>Already have an account?</span>
        <button type="button" onClick={toggleSelf}>
          Sign in
        </button>
      </div>
    </div>
  );
};

export default SignUp;
