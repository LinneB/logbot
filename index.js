const tmi = require("tmi.js");
const mysql = require("mysql");
const fs = require("fs");
const emoji = require("node-emoji");
const toml = require("toml");
const utils = require("./utils");

const config = toml.parse(fs.readFileSync("config.toml"));

const { host, user, password, database, port = 3306, table } = config.database;

const pool = mysql.createPool({
  host,
  user,
  password,
  database,
  port,
  connectionLimit: 50,
});

let channelLive = false;

const client = new tmi.client({
  channels: [config.twitch.channel]
});

client.on("message", (channel, tags, message, self) => {
  const {
    username,
    vip = false,
    mod = false,
    subscriber = false
  } = tags;
  // Replace emojis with their text representation & remove invalid characters
  const demojifiedMessage = emoji
    .unemojify(message)
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "");
  console.log(`INFO: ${channelLive ? "Live " : "Offline "}[${channel}] ${subscriber ? "SUB " : ""}${mod ? "MOD " : ""}${vip ? "VIP " : ""}${username}: ${demojifiedMessage}`);
  const query = `INSERT INTO ${table} (channel, username, message, live, isvip, ismod, issub) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  pool.query(
    query,
    [channel, username, demojifiedMessage, channelLive, vip, mod, subscriber],
    (err, _) => {
      if (err) console.error("ERROR: Error inserting into database: ", err);
    }
  );
});

(async () => {
  channelLive = await utils.checkIfLive(config);
  console.log(
    `INFO: Channel ${config.twitch.channel} is ${channelLive ? "live" : "offline"}`
  );
})();

setInterval(async () => {
  channelLive = await utils.checkIfLive(config);
  console.log(
    `INFO: Channel ${config.twitch.channel} is ${channelLive ? "live" : "offline"}`
  );
}, 60000);

// This signal handler is required for the logbot to shut down properly when running in docker
process.on("SIGTERM", () => {
  process.exit();
});

client
  .connect()
  .then(() => {
    console.log("INFO: Connected to Twitch");
  })
  .catch((err) => {
    console.error("ERROR: Error connecting to Twitch: ", err);
  });
