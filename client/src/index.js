import React from "react";
import ReactDOM from "react-dom";
// Component(s)/Container(s)
import App from "./components/App.jsx";

ReactDOM.render(
  <App />, 
  document.querySelector("#root")
);

if (module.hot) module.hot.accept();
