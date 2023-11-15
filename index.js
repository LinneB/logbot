const { ChatClient } = require("dank-twitch-irc");
const emoji = require("node-emoji");
const utils = require("./utils");
const config = require("./config");
const db = require("./db");

let livestatus = {};

let client = new ChatClient();

client.on("PRIVMSG", (msg) => {
  let channel = msg.channelName;
  let username = msg.senderUsername;
  let message = emoji.unemojify(msg.messageText);
  let channelLive = livestatus[channel.toLowerCase()] || false;
  let mod = msg.isMod || false;
  let vip = msg.ircTags.vip === "1" ? true : false;
  let subscriber = msg.ircTags.subscriber === "1" ? true : false;
  console.log(`INFO: ${channelLive ? "Live " : "Offline "}[${channel}] ${subscriber ? "SUB " : ""}${mod ? "MOD " : ""}${vip ? "VIP " : ""}${username}: ${message}`);
  db.insertMessage(channel, username, message, channelLive, vip, mod, subscriber);
});

client.on("ready", () => console.log("INFO: Connected to Twitch"));

utils.updateLiveStatus().then((status) => livestatus = status);
setInterval(() => {
  utils.updateLiveStatus().then((status) => livestatus = status);
}, 60000);

// This signal handler is required for the logbot to shut down properly when running in docker
process.on("SIGTERM", () => {
  process.exit();
});

client.connect();
client.joinAll(config.twitch.channels);
