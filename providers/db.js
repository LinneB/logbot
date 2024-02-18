import pg from "pg";
import config from "../utils/config.js";
import log4js from "../utils/logger.js";
const { Pool } = pg;
const logger = log4js.getLogger("database");

if (!config.database) {
  logger.fatal("Missing database section in config");
  process.exit(1);
}

const { host, user, password, database, port = 5432 } = config.database;

if (!host || !user || !password || !database) {
  logger.fatal("Missing options in config database section");
  process.exit(1);
}

export const pool = new Pool({
  host,
  user,
  password,
  database,
  port,
});

export const queries = {
  INSERT: {
    log: `INSERT INTO logs (channel, channel_id, sender_displayname, sender_username, sender_userid, sender_color, message, live, vip, mod, sub)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
  },
  CREATE: {
    table: `CREATE TABLE IF NOT EXISTS logs(
      id SERIAL NOT NULL,
      channel TEXT NOT NULL,
      channel_id INT NOT NULL,
      sender_displayname TEXT NOT NULL,
      sender_username TEXT NOT NULL,
      sender_userid INT NOT NULL,
      sender_color TEXT NOT NULL,
      message TEXT NOT NULL,
      sent_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      live boolean NOT NULL,
      vip boolean NOT NULL DEFAULT false,
      mod boolean NOT NULL DEFAULT false,
      sub boolean NOT NULL DEFAULT false
    ) PARTITION BY LIST (channel);`,
    partition: (channel) =>
      `CREATE TABLE IF NOT EXISTS ${channel} PARTITION OF logs FOR VALUES IN ('${channel}')`,
  },
};

export const statusCodes = {
  tableNotFound: "42P01",
  duplicateTable: "42P07",
  partitionNotFound: "23514",
  hostUnreachable: "EHOSTUNREACH",
};

export async function insertLog(msg) {
  const values = [
    msg.channel,
    msg.channelID,
    msg.senderDisplayname,
    msg.sender,
    msg.senderID,
    msg.color,
    msg.message,
    msg.live,
    msg.vip,
    msg.mod,
    msg.sub,
  ];

  await pool
    .query({
      text: queries.INSERT.log,
      values,
    })
    .catch((e) => {
      // In theory tableNotFound and partitionNotFound should never happen, both are created at startup
      if (e.code === statusCodes.tableNotFound) {
        logger.info("Logs table does not exist, creating it now...");
        pool
          .query({
            text: queries.CREATE.table,
          })
          .then(() => {
            logger.info("Created logs table");
            insertLog(msg);
          });
      } else if (e.code === statusCodes.partitionNotFound) {
        logger.info(
          `No partition found for ${msg.channel}, creating it now...`,
        );
        pool
          .query({
            text: queries.CREATE.partition(msg.channel),
          })
          .then(() => {
            logger.info("Created partition");
            insertLog(msg);
          })
          .catch((e) => {
            logger.error(e);
          });
      } else if (e.code === statusCodes.hostUnreachable) {
        logger.error("Could not connect to database");
      } else {
        logger.error("Could not insert into database", e);
      }
    });
}
