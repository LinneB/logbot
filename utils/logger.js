import log4js from "log4js";
import config from "./config.js";

log4js.configure({
  appenders: {
    console: { type: "stdout" },
  },
  categories: {
    default: { appenders: ["console"], level: config.misc.loglevel || "info" },
  },
});

export default log4js;
