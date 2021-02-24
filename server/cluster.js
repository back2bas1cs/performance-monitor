const express = require("express");
const socket_io = require("socket.io");
const redis = require("socket.io-redis");
const farmhash = require("farmhash");
// Node API Module(s):
const cluster = require("cluster");
const net = require("net");
// Project Module(s):
const socketServer = require("./socketServer.js");
const PORT = require("../config/serverConfig.js").PORT;

const numberOfProcesses = require("os").cpus().length;

if (cluster.isMaster) {
  // store workers so we can reference them based on source IP address (useful for auto-restart, for example)
  let workers = [];
  // helper function for spawning workers (at index 'i')
  const spawn = i => {
    workers[i] = cluster.fork();
    // restart worker on exit
    workers[i].on("exit", (code, signal) => {
      console.log("Respawning Worker: ", i);
      spawn(i);
    });
  };

  // spawn workers
  for (let i = 0; i < numberOfProcesses; i++) spawn(i);

  // helper function for getting a worker index based on IP address --
  // convertes IP address to a number by removing non-numeric characters, 
  // then compressing it to the number of slots available (i.e. 'numberOfProcesses')
  // [compared to "real" hashing (from sticky-session code) and "real" IP number conversion, 
  // this function is "on par" in terms of worker index distribution 
  // ('farmhash' is fastest and works with IPv6)]
  const workerIndex = (ip, length) => farmhash.fingerprint32(ip) % length; 

  // start up a TCP connection via 'net' module (instead of 'http' module)
  // 'express' will still use HTTP, but must have an independent TCP port open to enable cluster
  // this is the port that will "face" the outside/internet
  const server = net
    // NOTE: callback will run any time a TCP connection is made to the port we're listening to 
    .createServer({ pauseOnConnect: true }, connection => {
      // pass received connection to appropriate worker
      const worker = workers[workerIndex(connection.remoteAddress, numberOfProcesses)];
      // pass worker for this connection's source IP to connection
      worker.send("sticky-session:connection", connection);
    })
    .listen(PORT);
} else {
  // NOTE: don't use port here because the "master" is listening on it for us (i.e. acts as "proxy")
  const app = new express();

  /* here we could use middleware, attach routes, etc. */

  // protect our internal server from exposure 
  const server = app.listen(0, "localhost");
  const io = socket_io(server);

  // tell 'Socket.IO' to use the 'Redis' adapter 
  io.adapter(redis({ host: "localhost", port: 6379 }));

  // send server and socket over to our module
  io.on("connection", socket => {
    socketServer(io, socket);
    console.log(`Connected to Worker: ${cluster.worker.id} (ID)`);
  });

  // listen to messages sent from the "master" (ignore all other traffic/noise)
  process.on("message", (message, connection) => {
    if (message !== "sticky-session:connection") return;
    // emulate connection event on server by emitting event with the connection "master" sent us
    server.emit("connection", connection);
    connection.resume();
  });
}
