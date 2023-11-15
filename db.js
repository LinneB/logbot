const { Pool }= require("pg");
const { generateDateQueryParams } = require("./utils");
const config = require("./config");

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
  const query = `CREATE TABLE IF NOT EXISTS ${channel} (
    id SERIAL,
    username VARCHAR NOT NULL,
    message VARCHAR NOT NULL,
    live BOOLEAN NOT NULL,
    created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    isvip BOOLEAN NOT NULL DEFAULT FALSE,
    ismod BOOLEAN NOT NULL DEFAULT FALSE,
    issub BOOLEAN NOT NULL DEFAULT FALSE
) PARTITION BY RANGE (created_at);`;
  try {
    await pool.query(query);
    console.log(`INFO: Created table: ${channel}`);
  } catch (err) {
    console.error(err);
  }
}

// This is a really ugly solution but it works
async function createPartition(channel) {
  const {
    tableName,
    partitionStart,
    partitionEnd
  } = generateDateQueryParams(channel);

  const query = `CREATE TABLE ${tableName} PARTITION OF ${channel} FOR VALUES FROM ('${partitionStart}') TO ('${partitionEnd}');`;
  try {
    await pool.query(query);
    console.log(`INFO: Created table partition: ${tableName}`);
  } catch (err) {
    console.error(err);
  }
}

async function insertMessage(channel, username, message, channelLive, vip, mod, subscriber) {
  const query = `INSERT INTO ${channel} (username, message, live, isvip, ismod, issub) VALUES ($1, $2, $3, $4, $5, $6)`;
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
      console.error(err);
    }
  }
}

module.exports = {
  insertMessage,
};
