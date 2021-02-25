const mongoose = require("mongoose");
// Project Module(s):
const CPU = require("./models/CPU.js");

mongoose.connect("mongodb://127.0.0.1/CPUPerformanceData", { useNewUrlParser: true }); 

function socketServer(io, socket) {
  let macAddress = null;

  socket.on("nodeClientAuth", key => {
    // valid node client has joined server
    if (key === "node-client") socket.join("nodeClients");
    else if (key === "client-manager") { // valid node client manager
      socket.join('clientManager') 
      console.log("react client manager joined!");
    } else socket.disconnect(true);
  });

  socket.on("initializePerformanceData", async data => {
    macAddress = data.macAddress;
    const mongooseResponse = await checkDBForCPU(data);
    // console.log(mongooseResponse);  
  });

  socket.on("performanceData", data => {
    // console.log(data);
  });
}

// check to see if given CPU/machine has registered with our server before (if not, add to DB)
function checkDBForCPU(allData) {
  return new Promise((resolve, reject) => {
    CPU.findOne(
      { macAddress: allData.macAddress },
      (err, doc) => {
        if (err) {
          throw err;
          reject(err);
        } else if (!doc) { // add CPU/machine to DB
          const cpu = new CPU(allData);
          cpu.save();
          resolve("Added New CPU to DB!"); 
        } else { // CPU/machine has already been added to DB
          resolve("Found Registered CPU (in DB)!");  
        }
      }
    );
  });
}

module.exports = socketServer;

