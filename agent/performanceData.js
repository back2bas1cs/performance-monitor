const io = require("socket.io-client");
// Node API Module(s):
const os = require('os');
// Project Module(s):
const PORT = require("../config/serverConfig.js").PORT;
const TICK = require("../config/serverConfig.js").TICK; 

const socket = io(`http://127.0.0.1:${PORT}`);

socket.on("connect", () => {
  // locate MAC address (associated with an internet connection) → assign as 'ID' of given machine/CPU
  let macAddress = null;
  const foundAddress = Object.values(os.networkInterfaces())
    .some(nI => {
      if (!nI[0].internal) {
        macAddress = nI[0].mac;
        return true;
      }
    });
  // NOTE: error handling shouldn't matter much for our use case (CPU/machine MUST be online)!
  if (!foundAddress) console.log("No MAC Address Found!");
  else if (!/[^0:]/.test(macAddress)) console.log("CPU/Machine Is OFFLINE!");
    
  // simple single-key string authorization for new clients/CPUs/machines
  socket.emit("nodeClientAuth", "nodeClient");

  aggregatePerformanceData().then(allData => {
    allData.macAddress = macAddress;
    // event fires once (to initialize DB model)
    socket.emit("initializePerformanceData", allData);
  });

  let performanceDataInterval = setInterval(() => {
    // event fires every 'TICK'
    aggregatePerformanceData().then(data => {
      socket.emit("performanceData", data);
    });
  }, TICK * 1000);

  // ensures we don't keep "stacking"/adding intervals every time we temporarily disconnect
  // (otherwise, observed UE will be increasingly faster 'TICK')
  socket.on("disconnect", () => {
    clearInterval(performanceDataInterval);
  });
});

function aggregatePerformanceData() {
  return new Promise(async (resolve, reject) => {
    const osType = (os.type() === "Darwin" ? "OS X" : os.type());
    // returns integer (seconds) -- dynamic
    const uptime = os.uptime();

    // returns integer (bytes) 
    const totalRAM = os.totalmem();
    // returns integer (bytes) -- dynamic
    const freeRAM = os.freemem();
    const usedRAM = totalRAM - freeRAM;
    const memoryUsage = ((usedRAM / totalRAM) * 100).toFixed(2);
   
    const cpuCores = os.cpus();
    const numberOfCores = cpuCores.length;
    const coreModel = cpuCores[0].model;
    const coreSpeed = cpuCores[0].speed;
    const cpuLoad = await generateAverageLoad();
    
    resolve({
      osType,
      numberOfCores,
      coreModel,
      coreSpeed,
      uptime,
      totalRAM,
      freeRAM,
      // string (to maintain decimal precision/significant digits)
      memoryUsage,
      // string (to maintain decimal precision/significant digits)
      cpuLoad
    });
  });
}

function generateAverageCPUTimes() {
  // new instance of data on CPU cores
  const cpuCores = os.cpus();
  let idleTime = 0;
  // sift through cores and aggregate all times spent in each/EVERY mode ('user', 'nice', 'sys', 'idle', 'irq'),
  // as well as time spent in just 'idle' mode
  const totalTime = cpuCores
    .reduce((total, core) => {
      idleTime += core.times.idle;
      return total + Object.values(core.times).reduce((totalCoreTimes, time) => totalCoreTimes + time);
    }, 0);

  return { 
    total: totalTime / cpuCores.length, 
    idle: idleTime / cpuCores.length 
  };
}


// CPU Load: a count of the number of processes using or waiting for the CPU at a single point in time
function generateAverageLoad() {
  // since the time (in ms) spent in a given mode for each core 
  // is calculated from "last reboot", we must compare averages over a short interval (i.e. 150ms) 
  // in order to manufacture some approximation of average CPU load 
  return new Promise((resolve, reject) => {
    const averagesAtStart = generateAverageCPUTimes();
    setTimeout(() => {
      const averagesAtEnd = generateAverageCPUTimes();
      const diffInAvgTotal = averagesAtEnd.total - averagesAtStart.total;
      const diffInAvgIdle = averagesAtEnd.idle - averagesAtStart.idle;
      const diffInAvgActive = diffInAvgTotal - diffInAvgIdle;
      const percentageCPULoad = ((diffInAvgActive / diffInAvgTotal) * 100).toFixed(2);
      resolve(percentageCPULoad);
    }, 150);
  });
}

