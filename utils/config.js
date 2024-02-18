import fs from "fs";
import toml from "toml";

const config = toml.parse(fs.readFileSync("config.toml"));
export default config;
