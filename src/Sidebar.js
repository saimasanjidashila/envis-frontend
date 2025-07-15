import React, { useState } from "react";
import "./Sidebar.css";
import { FaWater, FaWind, FaCloudSunRain, FaUpload } from "react-icons/fa";

const Sidebar = ({showSST,setShowSST,showDust,setShowDust,showPredSST,setShowPredSST,onGeoJSONUpload,sidebarOpen,setSidebarOpen,}) => {
  const [uploading, setUploading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [csvColumns, setCsvColumns] = useState([]);
  const [selectedVariable, setSelectedVariable] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [sstMode, setSstMode] = useState("");
  const [sstMetadata, setSstMetadata] = useState(null);
  const [dustMode, setDustMode] = useState("");
  const [dustMetadata, setDustMetadata] = useState(null);
  const [tomorrowSSTMode, setTomorrowSSTMode] = useState("");
  const [tomorrowSSTMetadata, setTomorrowSSTMetadata] = useState(null);

  const handleSSTToggle = () => {
    setShowSST((prev) => {
      if (!prev) setShowDust(false);
      return !prev;
    });
    setSstMode("");
  };

  const handleDustToggle = () => {
    setShowDust((prev) => {
      if (!prev) setShowSST(false);
      return !prev;
    });
    setDustMode("");
  };

  const handleTomorrowSSTToggle = () => {
    setShowPredSST((prev) => {
      if (!prev) {
        setShowSST(false);
        setShowDust(false);
      }
      return !prev;
    });
    setTomorrowSSTMode("");
  };

  const handleSSTDetails = () => {
    setSstMode("details");
    setSstMetadata({
      variable_name: "SST",
      long_name: "Sea Surface Temperature",
      units: "°C",
      source: "NOAA OISST V2",
      institution: "NOAA",
      date_range: "Real time",
      shape: [24, 361, 720, 1],
      dimensions: ["Time", "Latitude", "Longitude", "zlev"],
    });
  };

  const handleDustDetails = () => {
    setDustMode("details");
    setDustMetadata({
      variable_name: "DUCMASS",
      long_name: "Dust Column Mass Density",
      units: "kg/m²",
      source: "MERRA-2",
      institution: "NASA",
      resolution: "0.25°",
      last_updated: "Today",
    });
  };

  const handleTomorrowSSTDetails = () => {
    setTomorrowSSTMode("details");
    setTomorrowSSTMetadata({
      variable_name: "sst_predicted",
      long_name: "Predicted Sea Surface Temperature",
      units: "°C",
      source: "ML Model Forecast",
      institution: "AI Pipeline",
      date_range: "Tomorrow",
      shape: [1, 361, 720],
      dimensions: ["time", "lat", "lon"],
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFileName(file.name);
  };

  const handleUploadCSV = async () => {
    const fileInput = document.querySelector('input[type="file"]');
    const file = fileInput.files[0];
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    try {
      const res = await fetch("https://envis-backend.onrender.com/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.columns) {
        setCsvColumns(result.columns);
        setUploadedFileName(result.filename);
        setSelectedVariable("");
      } else {
        alert(result.error || "Upload failed.");
      }
    } catch (err) {
      alert("File upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRenderMap = async () => {
    if (!selectedVariable) {
      alert("Please select a variable to render.");
      return;
    }
    const formData = new FormData();
    formData.append("filename", uploadedFileName);
    formData.append("variable", selectedVariable);

    setRendering(true);
    try {
      const res = await fetch("https://envis-backend.onrender.com/render", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.path && result.variable) {
        const geo = await fetch(`https://envis-backend.onrender.com${result.path}`).then((res) => res.json());
        onGeoJSONUpload({ geo, variable: result.variable });
      } else {
        alert(result.error || "Failed to render map.");
      }
    } catch (err) {
      alert("Render failed: " + err.message);
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <h2>👓 View Data</h2>

      {/* SST Section */}
      <div className="sidebar-data">
        <h3><FaWater style={{ marginRight: "8px" }}/> Today's SST</h3>
        <div className="button-group">
          <button onClick={() => setSstMode("preview")}>Preview</button>
          <button onClick={handleSSTDetails}>Details</button>
          <button onClick={handleSSTToggle}>View</button>
        </div>
        {sstMode === "preview" && (
          <img
            src="https://envis-backend.onrender.com/sst-preview"
            alt="Today's SST"
            style={{ width: "100%", borderRadius: "10px", marginTop: "10px" }}
          />
        )}
        {sstMode === "details" && sstMetadata && (
          <div className="metadata-box">
            <strong>Variable:</strong> {sstMetadata.variable_name}<br />
            <strong>Long Name:</strong> {sstMetadata.long_name}<br />
            <strong>Units:</strong> {sstMetadata.units}<br />
            <strong>Source:</strong> {sstMetadata.source}<br />
            <strong>Institution:</strong> {sstMetadata.institution}<br />
            <strong>Date Range:</strong> {sstMetadata.date_range}<br />
            <strong>Shape:</strong> {sstMetadata.shape.join(" x ")}<br />
            <strong>Dimensions:</strong> {sstMetadata.dimensions.join(", ")}
          </div>
        )}
      </div>

      {/* Dust Section */}
      <div className="sidebar-data">
        <h3><FaWind style={{ marginRight: "8px" }}/> Today's Dust</h3>
        <div className="button-group">
          <button onClick={() => setDustMode("dust-preview")}>Preview</button>
          <button onClick={handleDustDetails}>Details</button>
          <button onClick={handleDustToggle}>View</button>
        </div>
        {dustMode === "dust-preview" && (
          <img
            src="https://envis-backend.onrender.com/dust-preview"
            alt="Today's Dust"
            style={{ width: "100%", borderRadius: "10px", marginTop: "10px" }}
          />
        )}
        {dustMode === "details" && dustMetadata && (
          <div className="metadata-box">
            <strong>Variable:</strong> {dustMetadata.variable_name}<br />
            <strong>Long Name:</strong> {dustMetadata.long_name}<br />
            <strong>Units:</strong> {dustMetadata.units}<br />
            <strong>Source:</strong> {dustMetadata.source}<br />
            <strong>Institution:</strong> {dustMetadata.institution}<br />
            <strong>Resolution:</strong> {dustMetadata.resolution}<br />
            <strong>Last Updated:</strong> {dustMetadata.last_updated}
          </div>
        )}
      </div>

      {/* Tomorrow SST Section */}
      <div className="sidebar-data">
        <h3><FaCloudSunRain style={{ marginRight: "8px" }}/>Tomorrow's SST</h3>
        <div className="button-group">
          <button onClick={() => setTomorrowSSTMode("preview")}>Preview</button>
          <button onClick={handleTomorrowSSTDetails}>Details</button>
          <button onClick={handleTomorrowSSTToggle}>View</button>
        </div>
        {tomorrowSSTMode === "preview" && (
          <img
            src="https://envis-backend.onrender.com/sst-tomorrow-preview"
            alt="Predicted SST for Tomorrow"
            style={{ width: "100%", borderRadius: "10px", marginTop: "10px" }}
          />
        )}
        {tomorrowSSTMode === "details" && tomorrowSSTMetadata && (
          <div className="metadata-box">
            <strong>Variable:</strong> {tomorrowSSTMetadata.variable_name}<br />
            <strong>Long Name:</strong> {tomorrowSSTMetadata.long_name}<br />
            <strong>Units:</strong> {tomorrowSSTMetadata.units}<br />
            <strong>Source:</strong> {tomorrowSSTMetadata.source}<br />
            <strong>Institution:</strong> {tomorrowSSTMetadata.institution}<br />
            <strong>Date Range:</strong> {tomorrowSSTMetadata.date_range}<br />
            <strong>Shape:</strong> {tomorrowSSTMetadata.shape?.join(" x ")}<br />
            <strong>Dimensions:</strong> {tomorrowSSTMetadata.dimensions?.join(", ")}
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="sidebar-data">
        <h3><FaUpload style={{ marginRight: "8px" }}/> Upload Your File</h3>
        <input type="file" accept=".csv" onChange={handleFileChange} style={{ marginTop: "10px" }} />
        <button onClick={handleUploadCSV} style={{ marginTop: "10px", padding: "10px", width: "100%" }} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload CSV"}
        </button>
        {csvColumns.length > 0 && (
          <>
            <div style={{ marginTop: "15px", color: "gray", fontStyle: "italic" }}>
              Please select a variable from the dropdown.
            </div>
            <select
              value={selectedVariable}
              onChange={(e) => setSelectedVariable(e.target.value)}
              style={{ marginTop: "5px", padding: "6px", width: "95%" }}
            >
              <option value="">Select Variable</option>
              {csvColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <button onClick={handleRenderMap} style={{ marginTop: "10px", padding: "10px", width: "100%" }} disabled={rendering}>
              {rendering ? "Processing... please wait" : "Render Map"}
            </button>
          </>
        )}
        {!uploading && (
          <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "#f9f9f9", border: "1px solid #ddd", borderRadius: "4px", fontSize: "13px", color: "#333" }}>
            ⚠️ Note: For performance reasons, only <strong>150k</strong> data points will be visualized on the map.
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
