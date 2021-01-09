const os = require('os');

function aggregatePerformanceData() {
  return new Promise(async (resolve, reject) => {
    const osType = (os.type() === "Darwin" ? "OS X" : os.type());
    // returns integers (seconds) -- dynamic
    const uptime = os.uptime();
    // returns integer (bytes) 
    const totalRAM = os.totalmem();
    // returns integer (bytes) -- dynamic
    const freeRAM = os.freemem();
    const usedRAM = totalRAM - freeRAM;
    const memoryUsage = +((usedRAM / totalRAM) * 100).toFixed(2);
    const cpuCores = os.cpus();
    const numberOfCores = cpuCores.length;
    const coreModel = cpuCores[0].model;
    const coreSpeed = cpuCores[0].speed;
    const cpuLoad = await generateAverageLoad();

    resolve({
      osType,
      uptime,
      totalRAM,
      freeRAM,
      memoryUsage,
      numberOfCores,
      coreModel,
      coreSpeed,
      cpuLoad
    });
  });
}

function generateAverageCPUTimes() {
  // new instance of data on CPU cores
  const cpuCores = os.cpus();
  let idleTime = 0;
  const totalTime = cpuCores.reduce((total, core) => {
    idleTime += core.times.idle;
    return total + Object.values(core.times).reduce((totalCoreTimes, time) => totalCoreTimes + time);
  }, 0);
  return { total: totalTime / cpuCores.length, idle: idleTime / cpuCores.length };
}

// CPU load: a count of the number of processes using or waiting for the CPU at a single point in time
function generateAverageLoad() {
  // since the time (in ms) spent in a given mode ('user', 'nice', 'sys', 'idle', 'irq') for each core 
  // is calculated from "last reboot", we must compare averages over a short interval (i.e. 200ms) 
  // in order to manufacture some approximation of average CPU load 
  return new Promise((resolve, reject) => {
    const averagesAtStart = generateAverageCPUTimes();
    setTimeout(() => {
      const averagesAtEnd = generateAverageCPUTimes();
      const diffInAvgTotal = averagesAtEnd.total - averagesAtStart.total;
      const diffInAvgIdle = averagesAtEnd.idle - averagesAtStart.idle;
      const diffInAvgActive = diffInAvgTotal - diffInAvgIdle;
      const percentageCPULoad = +((diffInAvgActive / diffInAvgTotal) * 100).toFixed(2);
      resolve(percentageCPULoad);
    }, 200);
  });
}
