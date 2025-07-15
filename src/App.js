
import React, { useState } from "react";
import MapComponent from "./MapComponent";
import Sidebar from "./Sidebar";
import "./App.css";
import { useNavigate } from "react-router-dom";

function App() {
  const [showSST, setShowSST] = useState(false);
  const [showDust, setShowDust] = useState(false);  // <-- Must be added
  const [uploadedGeoJSON, setUploadedGeoJSON] = useState(null);
  const [variableName, setVariableName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [showPredSST, setShowPredSST] = useState(false);

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-left">
          <button className="sidebar-toggle-top" onClick={() => setSidebarOpen((prev) => !prev)}>☰</button>
          <div className="nav-title">🌍 EnVis - Environmental Visualization</div>
        </div>
        <div className="nav-links">
          <button onClick={() => navigate("/about")}>About</button>
          <a href="mailto:sshila1@lsu.edu" style={{ textDecoration: "none" }}>
            <button>Contact</button>
          </a>
        </div>
      </nav>

      <Sidebar
        showSST={showSST}
        setShowSST={setShowSST}
        showDust={showDust}
        setShowDust={setShowDust}
        showPredSST={showPredSST}
        setShowPredSST={setShowPredSST}
        onGeoJSONUpload={({ geo, variable }) => {
          setUploadedGeoJSON(geo);
          setVariableName(variable);
        }}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <MapComponent
        showSST={showSST}
        showDust={showDust}
        showPredSST={showPredSST}
        uploadedGeoJSON={uploadedGeoJSON}
        variableName={variableName}
      />
      <footer className="footer">
      🌊 EnVis — Environmental Visualization Platform © 2025
      </footer>

    </div>
  );
}

export default App;
