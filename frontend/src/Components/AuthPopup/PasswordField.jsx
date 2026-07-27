import React, { useState } from "react";

const PasswordField = ({ autoComplete, helperText, id }) => {
  const [showPassword, setShowPassword] = useState(false);
  const helperId = helperText ? `${id}-helper` : undefined;

  return (
    <div className="form-group">
      <label htmlFor={id}>Password</label>
      <div className="password-wrapper">
        <input
          type={showPassword ? "text" : "password"}
          id={id}
          name="password"
          autoComplete={autoComplete}
          aria-describedby={helperId}
          required
        />
        <button
          type="button"
          className="password-toggle-button"
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((isVisible) => !isVisible)}
        >
          {showPassword ? (
            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 64 64">
              <path d="M47.7 47.72 3.86 3.89.12 7.63l11.51 11.51C6.858 22.546 2.954 26.852.102 31.836L0 32.03C6.63 43.7 18.48 51.48 32 51.48h.012c3.613 0 7.095-.559 10.367-1.593L52.602 60.11l3.74-3.74-8.64-8.64-.002-.01ZM32.06 45.9c-7.656-.012-13.86-6.222-13.86-13.88 0-1.9.382-3.712 1.074-5.362l-.034.092 4.66 4.65v.63a8.2 8.2 0 0 0 8.2 8.2h.63l4.65 4.65c-1.544.646-3.336 1.02-5.218 1.02h-.102Zm0-27.74h.002c7.66 0 13.87 6.21 13.87 13.87 0 1.904-.384 3.72-1.079 5.373l-.003-.003-.034.09.037-.087 7.527 7.527c4.764-3.414 8.664-7.722 11.518-12.706L64 32.03c-6.63-11.67-18.48-19.45-32-19.45a34.73 34.73 0 0 0-10.616 1.668l.246-.068 5.07 5.06c1.582-.682 3.424-1.08 5.36-1.08Zm8.16 14.61-8.9-8.9.033-.003c.238-.019.466-.037.667-.037a8.2 8.2 0 0 1 8.2 8.2v.74Z" />
            </svg>
          ) : (
            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 64 64">
              <path d="M0 32c6.63-11.67 18.48-19.45 32-19.45S57.37 20.33 64 32c-6.63 11.67-18.48 19.45-32 19.45S6.63 43.67 0 32Zm18.19 0c0 7.66 6.21 13.87 13.87 13.87h.01c7.654 0 13.86-6.206 13.86-13.86V32c0-7.66-6.21-13.87-13.87-13.87-7.66 0-13.87 6.21-13.87 13.87Zm13.87 8.2a8.2 8.2 0 0 0 0-16.4 8.201 8.201 0 0 0 0 16.4Z" />
            </svg>
          )}
        </button>
      </div>
      {helperText && (
        <span className="field-helper" id={helperId}>
          {helperText}
        </span>
      )}
    </div>
  );
};

export default PasswordField;
