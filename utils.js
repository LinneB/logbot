const axios = require("axios");
const config = require("./config");

let token = null;

async function generateToken() {
  const { clientid, secret } = config.twitch;
  try {
    const response = await axios.post("https://id.twitch.tv/oauth2/token",
      {
        client_id: clientid,
        client_secret: secret,
        grant_type: "client_credentials"
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );
    return response.data.access_token;
  } catch (err) {
    if (err.response.status === 400) {
      console.log("ERROR: Could not generate token");
      process.exit(1);
    } else {
      throw err;
    }
  }
}

async function checkIfLive(channel) {
  try {
    const response = await axios.get(
      `https://api.twitch.tv/helix/streams?user_login=${channel}`,
      {
        headers: {
          "Client-ID": config.twitch.clientid,
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data.data.length > 0;
  } catch (err) {
    if (err.response.status === 400) {
      console.log(`ERROR: Could not get live status of ${channel}, does this user exist?`);
      process.exit(1);
    } else if (err.response.status === 401) {
      console.log("INFO: Token invalid, getting a new one...");
      token = await generateToken();
      return checkIfLive(channel);
    } else{
      throw err;
    }
  }
}

async function updateLiveStatus() {
  if (!token) {
    console.log("INFO: Generating token...");
    token = await generateToken();
  }
  let livestatus = {};
  const channels = config.twitch.channels;
  for (const channel of channels) {
    const live = await checkIfLive(channel);
    livestatus[channel.toLowerCase()] = live;
    console.log(`INFO: ${channel.toLowerCase()} is ${live ? "online" : "offline"}`);
  }
  return livestatus;
}

// Generates the date parameters to be used in database queries
// Super ugly solution, but it works
function generateDateQueryParams(channel) {
  const currentTime = new Date();
  const startMonth = (currentTime.getMonth() + 1).toString().padStart(2, "0");
  const startYear = currentTime.getFullYear();
  // Increment time by one month
  currentTime.setMonth(currentTime.getMonth() + 1);
  const endMonth = (currentTime.getMonth() + 1).toString().padStart(2, "0");
  const endYear = currentTime.getFullYear();

  // Example: forsen_12_2023
  const tableName = `${channel}_${startMonth}_${startYear}`;
  // Example: 2023-12-01
  const partitionStart = `${startYear}-${startMonth}-01`;
  // Example: 2024-01-01
  const partitionEnd = `${endYear}-${endMonth}-01`;

  return {
    tableName,
    partitionStart,
    partitionEnd,
  };
}

module.exports = {
  updateLiveStatus,
  generateToken,
  generateDateQueryParams,
};
