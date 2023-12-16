import React, { useEffect, useState, useRef } from "react";
import "./AuthPopup.scss";
import { useUser } from "../../Contexts/UserProvider";

const LogIn = ({ close, toggleSelf }) => {
  const { setUser } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const logInEndpoint = "https://api.chimpcino.com/api/v1/users/log-in";

  const passwordInputRef = useRef(null);

  const togglePasswordVisible = (showPass) => {
    const input = passwordInputRef.current;

    if (showPass) {
      setShowPassword(true);
      input.type = "text";
    } else {
      setShowPassword(false);
      input.type = "password";
    }
  };

  const closeSelf = () => {
    setShowPassword(false);
    close();
  };

  const logIn = async (e) => {
    e.preventDefault();
    const form = e.target;
    const emailOrUsername = form.emailOrUsername.value;
    const password = form.password.value;

    // Do errors later

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
      const response = await fetch(logInEndpoint, options);

      if (!response.ok) {
        const errors = await response.json();
        console.log(errors);
        return;
      }

      const result = await response.json();
      // Set global client user
      setUser(result.data);
      // Close form
      closeSelf();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <div className="auth-overlay"></div>

      <div className="login-module">
        <button className="close-popup-button" onClick={closeSelf}>
          <svg fill="currentColor" viewBox="0 0 64 64">
            <path d="m54.827 16.187-7.013-7.014L32 24.987 16.187 9.173l-7.013 7.014L24.987 32 9.174 47.813l7.013 7.014 15.814-15.814 15.813 15.814 7.013-7.014L39.014 32l15.813-15.813Z"></path>
          </svg>
        </button>
        <h1>Sign In</h1>
        <form onSubmit={logIn}>
          <div className="form-group">
            <label htmlFor="emailOrUsername">Email or Username</label>
            <input type="text" id="emailOrUsername" name="emailOrUsername" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                type="password"
                id="password"
                ref={passwordInputRef}
                autoComplete="on"
                name="password"
              />
              {showPassword ? (
                <button
                  type="button"
                  aria-label="Hide password"
                  className="password-toggle-button"
                  onClick={() => {
                    togglePasswordVisible(false);
                  }}
                >
                  <svg fill="currentColor" viewBox="0 0 64 64">
                    <path d="M47.7 47.72 3.86 3.89.12 7.63l11.51 11.51C6.858 22.546 2.954 26.852.102 31.836L0 32.03C6.63 43.7 18.48 51.48 32 51.48h.012c3.613 0 7.095-.559 10.367-1.593L52.602 60.11l3.74-3.74-8.64-8.64-.002-.01ZM32.06 45.9c-7.656-.012-13.86-6.222-13.86-13.88 0-1.9.382-3.712 1.074-5.362l-.034.092 4.66 4.65v.63a8.2 8.2 0 0 0 8.2 8.2h.63l4.65 4.65c-1.544.646-3.336 1.02-5.218 1.02h-.102Zm0-27.74h.002c7.66 0 13.87 6.21 13.87 13.87 0 1.904-.384 3.72-1.079 5.373l-.003-.003-.034.09.037-.087 7.527 7.527c4.764-3.414 8.664-7.722 11.518-12.706L64 32.03c-6.63-11.67-18.48-19.45-32-19.45a34.73 34.73 0 0 0-10.616 1.668l.246-.068 5.07 5.06c1.582-.682 3.424-1.08 5.36-1.08Zm8.16 14.61-8.9-8.9.033-.003c.238-.019.466-.037.667-.037a8.2 8.2 0 0 1 8.2 8.2v.74Z"></path>
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  className="password-toggle-button"
                  aria-label="Reveal password"
                  onClick={() => {
                    togglePasswordVisible(true);
                  }}
                >
                  <svg fill="currentColor" viewBox="0 0 64 64">
                    <path d="M0 32c6.63-11.67 18.48-19.45 32-19.45S57.37 20.33 64 32c-6.63 11.67-18.48 19.45-32 19.45S6.63 43.67 0 32Zm18.19 0c0 7.66 6.21 13.87 13.87 13.87h.01c7.654 0 13.86-6.206 13.86-13.86V32c0-7.66-6.21-13.87-13.87-13.87-7.66 0-13.87 6.21-13.87 13.87Zm13.87 8.2a8.2 8.2 0 0 0 0-16.4 8.201 8.201 0 0 0 0 16.4Z"></path>
                  </svg>
                </button>
              )}
            </div>
          </div>
          <button className="submit-button" type="submit">
            Sign In
          </button>
        </form>
        <p onClick={toggleSelf}>
          Don't have an account? <span> Register an Account</span>
        </p>
      </div>
    </>
  );
};

export default LogIn;
