import Dashboard from "../Dashbaord/Dashboard";
import RoulettePage from "../RoulettePage/RoulettePage";
import "./App.scss";
import { Routes, Route, useNavigate, BrowserRouter } from "react-router-dom";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/roulette" element={<RoulettePage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
