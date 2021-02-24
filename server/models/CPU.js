const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CPU = new Schema({
  macAddress: String,
  osType: String,
  numberOfCores: Number,
  coreModel: String,
  coreSpeed: Number,
  uptime: Number,
  totalRAM: Number,
  freeRAM: Number,
  memoryUsage: String,
  cpuLoad: String
});

module.exports = mongoose.model("CPU", CPU);