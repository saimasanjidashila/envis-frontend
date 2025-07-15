import React from "react";

const About = () => {
  return (
    <div style={{ padding: "80px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>About EnVis</h1>
      <p>
        <strong>EnVis</strong> (Environmental Visualization) is a web-based platform designed to help users
        visualize environmental datasets such as Sea Surface Temperature (SST), chlorophyll concentration,
        and other climate indicators using interactive maps.
      </p>

      <p>
        The platform supports uploading custom CSV files, selecting variables to render, and viewing
        geospatial data as color-coded markers over a global Leaflet map. It's optimized for performance
        and built using React (frontend) and Flask (backend).
      </p>

      <p>
        This project is open for customization and supports real-world data workflows, including NetCDF
        parsing and remote sensing visualization.
      </p>

      <p>
        Created by <em>Saima Sanjida Shila</em> for research, learning, and environmental data exploration.
      </p>
    </div>
  );
};

export default About;
