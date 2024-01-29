import React, { useEffect, useState } from "react";
import "./Navigation.scss";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MiniNavigation from "./MiniNavigation";

const Navigation = () => {
  const navigate = useNavigate();
  const [minimize, setMinimize] = useState(() => {
    const storedValue = localStorage.getItem("isSidebarOpen");
    return storedValue ? JSON.parse(storedValue) : true;
  });

  useEffect(() => {
    localStorage.setItem("isSidebarOpen", JSON.stringify(minimize));
  }, [minimize]);

  return (
    <motion.div
      className="navigation-container"
      initial={{ maxWidth: minimize ? "60px" : "240px" }}
      animate={{ maxWidth: minimize ? "60px" : "240px" }}
      transition={{ duration: 0.2 }}
    >
      {!minimize ? (
        <div>
          <div className="nav-top">
            <div
              className="svg-container"
              onClick={() => {
                setMinimize(!minimize);
              }}
            >
              <svg fill="#B1BAD3" viewBox="0 0 64 64">
                <path d="M0 0h64v13H0V0Zm0 25.5h64v13H0v-13ZM64 51H0v13h64V51Z"></path>
              </svg>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1, delay: 0.1 }}
              className="nav-title"
              onClick={() => {
                navigate("/");
              }}
            >
              CHIMP CINO
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 0.1, delay: 0.2 }}
            className="nav-content"
          >
            <div className="nav-content-block">
              <div className="block-header">
                <h2>Games</h2>
              </div>
              <ul>
                <li
                  onClick={() => {
                    navigate("/blackjack");
                  }}
                >
                  <svg fill="#B1BAD3" viewBox="0 0 64 64">
                    <path d="M7.36 42.39c1-12.78 14.729-25.29 17.926-29.976 2.778-4.206 1.72-9.203.83-11.4a.78.78 0 0 1 .893-1h-.004c13.89 2.918 14.588 13.48 14.169 18.206-.42 4.726.42 7.913 3.477 7.224C47.71 24.754 46.68 17 46.68 17s14.04 16.676 8.893 33.073c-2.587 8.574-9.032 12.19-14.448 13.89-.28.14-.56-.14-.56-.55.7-2.638 2.508-4.726 3.058-7.644 1.12-4.796-3.327-9.213-6.625-11.71-2.062-1.538-3.385-3.97-3.385-6.712 0-.127.002-.255.008-.381v.018c0-.28-.42-.42-.55-.28a90.106 90.106 0 0 1-6.652 7.202l-.023.022c-5.135 5.696-7.783 12.09-3.197 19.175.14.28-.14.69-.41.56-11.4-3.068-16.117-11.691-15.427-21.273Z"></path>
                  </svg>
                  Blackjack
                </li>
                <li
                  onClick={() => {
                    navigate("/roulette");
                  }}
                >
                  <svg fill="#B1BAD3" viewBox="0 0 96 96">
                    <path d="M8.313 21.03h5.595l3.995 3.995 22.056 22.137a6.021 6.021 0 0 0 0 .857v-.018a7.992 7.992 0 1 0 15.985 0 7.992 7.992 0 0 0-7.992-7.992h-.84L20.9 13.916V.049h-9.91v10.99H0v9.988l8.313.003ZM47.952.052A47.352 47.352 0 0 0 28.67 4.17l.303-.12v6.593l2.997 2.997c4.723-2.26 10.267-3.581 16.12-3.581 21.031 0 38.08 17.049 38.08 38.08 0 21.032-17.049 38.08-38.08 38.08-21.032 0-38.081-17.048-38.081-38.08 0-5.765 1.282-11.23 3.574-16.127l.007.007.1-.23-.107.224-2.99-2.952H4C1.537 34.645.102 41.157.102 48.001c0 26.483 21.466 47.95 47.949 47.95C74.534 95.95 96 74.483 96 48 96 21.518 74.534.052 48.05.052h-.098ZM30.009 48.463c.246 9.707 8.181 17.501 17.942 17.52l-.003.041h.219c9.931 0 17.98-8.05 17.98-17.98 0-9.854-7.926-17.859-17.762-17.981l-8.79-8.751-.194.054a27.416 27.416 0 0 1 8.475-1.334h.072c15.445 0 27.97 12.52 27.97 27.97 0 15.445-12.525 27.969-27.97 27.969-15.446 0-27.97-12.52-27.97-27.97v-.071c0-2.958.468-5.805 1.28-8.28l8.75 8.789v.024Z"></path>
                  </svg>
                  Roulette
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      ) : (
        <MiniNavigation setMinimize={setMinimize} minimize={minimize} />
      )}
    </motion.div>
  );
};

export default Navigation;
