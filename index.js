const tmi = require("tmi.js");
const mysql = require("mysql");
const fs = require("fs");
const emoji = require("node-emoji");
const utils = require("./utils");

// Read config.json
const config = utils.parseJSON(fs.readFileSync("config.json"), {});

const { database = {}, twitch = {} } = config || {};

const { host, user, password, name: databaseName, table } = database;

const db = mysql.createConnection({
  host,
  user,
  password,
  database: databaseName,
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error("Error connecting to database: ", err);
    return;
  }
  console.log("Connected to database!");
});

const { botUsername, botOauth, channel, liveInterval} = twitch;

// Twitch configuration options
const opts = {
  identity: {
    username: botUsername,
    password: botOauth,
  },
  channels: [channel],
};

// Global variable used in multiple functional scopes - TODO: Can this be scoped?
let channelLive = false;

// Create a client with the given options
const client = new tmi.client(opts);

// Register event handlers
client.on("message", (channel, tags, message, self) => {
  if (self) return; // Ignore messages from the bot

  const username = tags.username;
  const isMod = tags.mod;
  // Sometimes the VIP badge is a little weird, so this loop is required, also make sure to make the default in the SQL column is False.
  let isVip = false;
  if (tags.vip === true) {
    isVip = true;
  };
  
  // Replace emojis with their text representation & remove invalid characters
  const demojifiedMessage = emoji
    .unemojify(message)
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "");
    const sql = `INSERT INTO ${table} (channel, username, message, live, isvip, ismod) VALUES (?, ?, ?, ?, ?, ?)`;
    console.log(`${channelLive ? "Live " : "Offline "}[${channel}] ${tags.mod ? "MOD " : ""}${isVip ? "VIP " : ""}${username}: ${message}`);
  db.query(
    sql,
    [channel, username, demojifiedMessage, channelLive, isVip, isMod],
    (err, _) => {
      if (err) console.error("Error inserting into database: ", err);
    }
  );
});

// Check channel status every minute
setInterval(async () => {
  channelLive = await utils.checkIfLive(channel, config);
  console.log(
    `Channel ${channel} is ${channelLive ? "live" : "offline"}`
  );
}, liveInterval);

// Connect to Twitch
client
  .connect()
  .then(() => {
    console.log("Connected to Twitch!");
  })
  .catch((err) => {
    console.error("Error connecting to Twitch: ", err);
  });
