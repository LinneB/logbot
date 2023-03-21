const tmi = require('tmi.js');
const mysql = require('mysql');
const axios = require('axios');
const fs = require('fs');
const emoji = require('node-emoji');

// Read config.json
const config = JSON.parse(fs.readFileSync('config.json'));

const db = mysql.createConnection({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ', err);
    return;
  }
  console.log('Connected to database!');
});

// Twitch API call to check if channel is live
async function checkIfLive(channel) {
  const res = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${channel}`, {
    headers: {
      'Client-ID': config.twitch.clientId,
      'Authorization': `Bearer ${config.twitch.apioauth}`
    }
  });
  return res.data.data.length > 0;
}

// Twitch configuration options
const opts = {
  identity: {
    username: config.twitch.botUsername,
    password: config.twitch.botOauth
  },
  channels: [
    config.twitch.channel
  ]
};

// Create a client with the given options
const client = new tmi.client(opts);

// Register event handlers
client.on('message', (channel, tags, message, self) => {
  if (self) return; // Ignore messages from the bot
  const username = tags.username;
  
  // Replace emojis with their text representation & remove invalid characters
  const demojifiedMessage = emoji.unemojify(message).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
  const sql = 'INSERT INTO chatlog (channel, username, message, live) VALUES (?, ?, ?, ?)';
  console.log(`${channelLive}, ${channel} - ${username}: ${message}`)
  db.query(sql, [channel, username, demojifiedMessage, channelLive], (err, result) => {
    if (err) console.error('Error inserting into database: ', err);
  });
});

let channelLive = false;

// Check channel status every minute
setInterval(() => {
  checkIfLive(opts.channels[0].slice(1))
    .then((live) => {
      channelLive = live;
      console.log(`Channel ${opts.channels[0]} is ${live ? 'live' : 'offline'}`);
    })
    .catch((err) => {
      console.error('Error checking if channel is live: ', err);
    });
}, 60000);

// Connect to Twitch
client.connect()
  .then(() => {
    console.log('Connected to Twitch!');
  })
  .catch((err) => {
    console.error('Error connecting to Twitch: ', err);
  });
