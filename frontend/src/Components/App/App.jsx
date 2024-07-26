import { useEffect, useState } from "react";
import Dashboard from "../Dashbaord/Dashboard";
import Header from "../Header/Header";
import RoulettePage from "../RoulettePage/RoulettePage";
import "./App.scss";
import { Routes, Route, useNavigate, BrowserRouter } from "react-router-dom";
import { useUser } from "../../Contexts/UserProvider";
import BlackjackPage from "../BlackjackPage/BlackjackPage";
import Navigation from "../Navigation/Navigation";
import MinesPage from "../MinesPage/MinesPage";

function App() {
  const { user, setUser } = useUser();
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (user) return;

    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const response = await fetch(
          "http://localhost:5000/api/v1/users/validate-user",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          // Show login notification
          return;
        }

        const result = await response.json();

        setUser(result.data);
      } catch (err) {
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [setUser, user]);

  // use skeleton later
  if (loadingUser) {
    return <div className="loading-test">LOADING</div>;
  }
  return (
    <div className="App">
      <BrowserRouter>
        <div className="app-container">
          <Navigation />
          <div className="app-wrapper">
            <Header />

            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/home" element={<Dashboard />} />
              <Route path="/roulette" element={<RoulettePage />} />
              <Route path="/blackjack" element={<BlackjackPage />} />
              <Route path="/mines" element={<MinesPage />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
