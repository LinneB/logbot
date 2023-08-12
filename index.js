const tmi = require("tmi.js");
const mysql = require("mysql");
const fs = require("fs");
const emoji = require("node-emoji");
const toml = require("toml");
const utils = require("./utils");

// Read config.json
const config = toml.parse(fs.readFileSync("config.toml"));

const { host, user, password, database, port = 3306, table } = config.database;

const db = mysql.createConnection({
  host,
  user,
  password,
  database,
  port
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error("ERROR: Error connecting to database: ", err);
    return;
  }
  console.log("INFO: Connected to database");
});

let channelLive = false;

// Create a client with the given options
const client = new tmi.client({
  channels: [config.twitch.channel]
});

// Register event handlers
client.on("message", (channel, tags, message, self) => {
  if (self) return; // Ignore messages from the bot

  const username = tags.username;
  const { vip: isVip = false, mod: isMod= false, subscriber: isSub = false } = tags || {};

  // Replace emojis with their text representation & remove invalid characters
  const demojifiedMessage = emoji
    .unemojify(message)
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "");
  const sql = `INSERT INTO ${table} (channel, username, message, live, isvip, ismod, issub) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  console.log(`INFO: ${channelLive ? "Live " : "Offline "}[${channel}] ${isSub ? "SUB " : ""}${isMod ? "MOD " : ""}${isVip ? "VIP " : ""}${username}: ${message}`);
  db.query(
    sql,
    [channel, username, demojifiedMessage, channelLive, isVip, isMod, isSub],
    (err, _) => {
      if (err) console.error("ERROR: Error inserting into database: ", err);
    }
  );
});

// Check channel status every minute
setInterval(async () => {
  channelLive = await utils.checkIfLive(config);
  console.log(
    `INFO: Channel ${config.twitch.channel} is ${channelLive ? "live" : "offline"}`
  );
}, 60000);

// Connect to Twitch
client
  .connect()
  .then(() => {
    console.log("INFO: Connected to Twitch");
  })
  .catch((err) => {
    console.error("ERROR: Error connecting to Twitch: ", err);
  });
