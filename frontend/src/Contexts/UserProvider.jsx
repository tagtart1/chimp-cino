import React from "react";

import { createContext, useState, useContext } from "react";

const UserContext = createContext(null);

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

const useUser = () => {
  const context = useContext(UserContext);

  return context;
};

export { UserProvider, useUser };
