import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ViktorPage from "./ViktorPage";
import LovisaPage from "./LovisaPage";

//Sida för att visa och välja sin användare
function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul className="navbar">
            <li>
              <Link to="/users/Lovisa">LOVISA</Link>
            </li>
            <li>
              <Link to="/users/Viktor">VIKTOR</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/users/Viktor" element={<ViktorPage />} />
          <Route path="/users/Lovisa" element={<LovisaPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
