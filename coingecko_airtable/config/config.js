const fs = require("fs");

const readData = fs.readFileSync("./config/config.json");
const config = JSON.parse(readData);
module.exports = {
  config,
};
