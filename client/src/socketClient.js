import io from "socket.io-client";
// Project Module(s):
const PORT = require("../../config/serverConfig.js").PORT;

let socket = io.connect(`http://localhost:${PORT}`);

// register as client manager
socket.emit("nodeClientAuth", "client-manager");

export default socket;