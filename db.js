const { Pool }= require("pg");
const { generateDateQueryParams } = require("./utils");
const config = require("./config");
const log = require("loglevel");
log.setLevel(config.misc.loglevel || "info");

const queries = {
  insert: {
    log: (channel) => `
      INSERT INTO ${channel} (username, message, live, isvip, ismod, issub)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
  },
  create: {
    partition: (tableName, channel, partitionStart, partitionEnd) => `
      CREATE TABLE ${tableName}
      PARTITION OF ${channel}
      FOR VALUES FROM ('${partitionStart}') TO ('${partitionEnd}');
    `,
    table: (channel) => `
      CREATE TABLE IF NOT EXISTS ${channel} (
        id SERIAL,
        username VARCHAR NOT NULL,
        message VARCHAR NOT NULL,
        live BOOLEAN NOT NULL,
        created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        isvip BOOLEAN NOT NULL DEFAULT FALSE,
        ismod BOOLEAN NOT NULL DEFAULT FALSE,
        issub BOOLEAN NOT NULL DEFAULT FALSE
      ) PARTITION BY RANGE (created_at);
    `,
  },
};
const { host, user, password, database, port = 5432 } = config.database;

const pool = new Pool({
  host,
  user,
  password,
  database,
  port,
  max: 20,
});

async function createTable(channel) {
  const query = queries.create.table(channel);
  try {
    await pool.query(query);
    log.info(`INFO: Created table: ${channel}`);
  } catch (err) {
    log.error(err);
  }
}

// This is a really ugly solution but it works
async function createPartition(channel) {
  const {
    tableName,
    partitionStart,
    partitionEnd
  } = generateDateQueryParams(channel);

  const query = queries.create.partition(tableName, channel, partitionStart, partitionEnd);
  try {
    await pool.query(query);
    log.info(`INFO: Created table partition: ${tableName}`);
  } catch (err) {
    log.error(err);
  }
}

async function insertMessage(channel, username, message, channelLive, vip, mod, subscriber) {
  const query = queries.insert.log(channel);
  try {
    await pool.query(
      query,
      [username, message, channelLive, vip, mod, subscriber]
    );
  } catch (err) {
    if (err.code === "42P01") {
      // Table not found
      await createTable(channel);
      insertMessage(channel, username, message, channelLive, vip, mod, subscriber);
    } else if (err.code === "23514") {
      // No matching partition found
      await createPartition(channel);
      insertMessage(channel, username, message, channelLive, vip, mod, subscriber);
    } else {
      log.error(err);
    }
  }
}

module.exports = {
  insertMessage,
};
