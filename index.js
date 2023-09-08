const { ChatClient } = require("dank-twitch-irc");
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

let client = new ChatClient();

client.on("PRIVMSG", (msg) => {
  let channel = msg.channelName;
  let username = msg.senderUsername;
  let message = msg.messageText;
  let mod = msg.isMod || false;
  let vip = msg.ircTags.vip === '1' ? true : false;
  let subscriber = msg.ircTags.subscriber === '1' ? true : false;
  console.log(`INFO: ${channelLive ? "Live " : "Offline "}[${channel}] ${subscriber ? "SUB " : ""}${mod ? "MOD " : ""}${vip ? "VIP " : ""}${username}: ${message}`);
  const query = `INSERT INTO ${table} (channel, username, message, live, isvip, ismod, issub) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  pool.query(
    query,
    [channel, username, emoji.unemojify(message).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ""), channelLive, vip, mod, subscriber],
    (err, _) => {
      if (err) console.error("ERROR: Error inserting into database: ", err);
    },
  );
});

client.on("ready", () => console.log("INFO: Connected to Twitch"));

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

client.connect();
client.join(config.twitch.channel);
