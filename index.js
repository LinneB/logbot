const { ChatClient } = require("dank-twitch-irc");
const fs = require("fs");
const emoji = require("node-emoji");
const toml = require("toml");
const utils = require("./utils");

// Global object for storing config and livestatus
globalThis.logbot = {};
logbot.livestatus = {};
logbot.config = toml.parse(fs.readFileSync("config.toml"));

const db = require("./db");

let client = new ChatClient();

client.on("PRIVMSG", (msg) => {
  let channel = msg.channelName;
  let username = msg.senderUsername;
  let message = emoji.unemojify(msg.messageText);
  let channelLive = logbot.livestatus[channel.toLowerCase()] || false;
  let mod = msg.isMod || false;
  let vip = msg.ircTags.vip === "1" ? true : false;
  let subscriber = msg.ircTags.subscriber === "1" ? true : false;
  console.log(`INFO: ${channelLive ? "Live " : "Offline "}[${channel}] ${subscriber ? "SUB " : ""}${mod ? "MOD " : ""}${vip ? "VIP " : ""}${username}: ${message}`);
  db.insertMessage(channel, username, message, channelLive, vip, mod, subscriber);
});

client.on("ready", () => console.log("INFO: Connected to Twitch"));

utils.updateLiveStatus();
setInterval(() => {
  utils.updateLiveStatus();
}, 60000);

// This signal handler is required for the logbot to shut down properly when running in docker
process.on("SIGTERM", () => {
  process.exit();
});

client.connect();
client.joinAll(logbot.config.twitch.channels);
