const fs = require("fs");
const toml = require("toml");

const config = toml.parse(fs.readFileSync("config.toml"));

module.exports = config;
