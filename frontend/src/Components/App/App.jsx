import { useEffect, useState } from "react";
import Dashboard from "../Dashbaord/Dashboard";
import Header from "../Header/Header";
import RoulettePage from "../RoulettePage/RoulettePage";
import "./App.scss";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { useUser } from "../../Contexts/UserProvider";
import BlackjackPage from "../BlackjackPage/BlackjackPage";
import Navigation from "../Navigation/Navigation";
import MinesPage from "../MinesPage/MinesPage";
import GlobalLoader from "../GlobalLoader/GlobalLoader";
import NotFoundPage from "../NotFoundPage/NotFoundPage";
import soundManager from "../../Helpers/sfxPlayer";
import { preloadGameAssets } from "../../Helpers/gameAssets";
import { fetchSessionUser } from "../../Helpers/session";
import AdminPage from "../AdminPage/AdminPage";

function App() {
  const { setUser } = useUser();
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    preloadGameAssets();

    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        setUser(await fetchSessionUser());
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
    soundManager.initialize();
  }, [setUser]);

  if (loadingUser) {
    return <GlobalLoader />;
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
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
