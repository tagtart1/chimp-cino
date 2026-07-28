import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const AuthPopupContext = createContext(null);

const AuthPopupProvider = ({ children }) => {
  const [authView, setAuthView] = useState(null);

  const openLogin = useCallback(() => setAuthView("login"), []);
  const openSignUp = useCallback(() => setAuthView("signup"), []);
  const closeAuth = useCallback(() => setAuthView(null), []);

  const value = useMemo(
    () => ({
      isVisible: authView !== null,
      isLogIn: authView === "login",
      openLogin,
      openSignUp,
      closeAuth,
    }),
    [authView, closeAuth, openLogin, openSignUp]
  );

  return (
    <AuthPopupContext.Provider value={value}>
      {children}
    </AuthPopupContext.Provider>
  );
};

const useAuthPopup = () => {
  const context = useContext(AuthPopupContext);

  if (!context) {
    throw new Error("useAuthPopup must be used inside AuthPopupProvider");
  }

  return context;
};

export { AuthPopupProvider, useAuthPopup };
