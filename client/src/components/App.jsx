import React from "react";
// Project Module(s):
import socket from "../socketClient.js";
// Component(s):
// import NavBar from "./Navbar/NavBar.jsx";
import DataGraph from "./DataGraph/DataGraph.jsx";

function App() {
  return (
    <div>
      {/* <NavBar /> */}
      <DataGraph />
    </div>
  );
}

export default App;