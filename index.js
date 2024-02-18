import { ChatClient } from "dank-twitch-irc";
import config from "./utils/config.js";
import log4js from "./utils/logger.js";
import * as db from "./providers/db.js";
import { helix } from "./providers/helix.js";
const client = new ChatClient();
const logger = log4js.getLogger("main");

const onConnecting = () => logger.info("Connecting to chat...");

const onConnected = () => logger.info("Succesfully connected to chat");

const onMessage = async (msg) => {
  const log = {
    channel: msg.channelName,
    channelID: msg.ircTags["room-id"],
    sender: msg.senderUsername,
    senderDisplayname: msg.ircTags["display-name"],
    senderID: msg.senderUserID,
    message: msg.messageText,
    color: msg.colorRaw,
    vip: msg.ircTags.vip === "1" ? true : false,
    sub: msg.ircTags.subscriber === "1" ? true : false,
    mod: msg.isMod,
    live: helix.getLivestatus(msg.channelName),
  };
  logger.debug(
    `[#${log.channel}] ${log.live ? "LIVE " : ""}${log.vip ? "VIP " : ""}${log.sub ? "SUB " : ""}${log.mod ? "MOD " : ""}${log.senderDisplayname}: ${log.message}`,
  );
  db.insertLog(log);
};

await db.pool
  .query({
    text: db.queries.CREATE.table,
  })
  .then(() => {
    logger.debug("Created logs table");
  })
  .catch((e) => {
    logger.error(e);
  });

let queries = [];
for (const channel of config.twitch.channels) {
  queries.push(
    await db.pool
      .query({
        text: db.queries.CREATE.partition(channel.toLowerCase()),
      })
      .then(() => {
        logger.debug(`Created partition for ${channel}`);
      }),
  );
}
await Promise.all(queries).catch((e) => {
  logger.error(e);
});

client.on("PRIVMSG", onMessage);
client.on("connecting", onConnecting);
client.on("ready", onConnected);
client.connect();
client.joinAll(config.twitch.channels);

// This signal handler is required for the logbot to shut down properly when running in docker
process.on("SIGTERM", () => {
  process.exit();
});
