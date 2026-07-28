import { useCallback } from "react";
import { useAuthPopup } from "../Contexts/AuthPopupProvider";
import { useUser } from "../Contexts/UserProvider";

const useGameAuth = () => {
  const { user, setUser } = useUser();
  const { openLogin } = useAuthPopup();

  const requireAuth = useCallback(() => {
    if (user) return true;

    openLogin();
    return false;
  }, [openLogin, user]);

  const handleAuthError = useCallback(
    (error) => {
      if (error?.code !== "SESSION_INVALID") return false;

      setUser(null);
      openLogin();
      return true;
    },
    [openLogin, setUser]
  );

  return { user, setUser, requireAuth, handleAuthError };
};

export default useGameAuth;
