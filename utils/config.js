import fs from "fs";
import toml from "toml";

function validateConfig(config) {
  const requiredOptions = {
    "twitch": ["clientid", "secret", "channels"],
    "database": ["host", "database", "user", "password"]
  };
  for (const section of Object.keys(requiredOptions)) {
    if (!config[section]) {
      throw new Error(`Missing ${section} section from config file`);
    }
    for (const option of requiredOptions[section]) {
      if (!config[section][option]) {
        throw new Error(`Missing ${option} option in ${section} section of config file`);
      }
    }
  }
}

const config = toml.parse(fs.readFileSync("config.toml"));
validateConfig(config);
export default config;
