const axios = require("axios");

async function generateToken() {
  const { clientid, secret } = logbot.config.twitch;
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
  logbot.config.twitch.token = response.data.access_token;
  updateLiveStatus();
}

async function updateLiveStatus() {
  const channels = logbot.config.twitch.channels;
  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i];
    try {
      const response = await axios.get(
        `https://api.twitch.tv/helix/streams?user_login=${channel}`,
        {
          headers: {
            "Client-ID": logbot.config.twitch.clientid,
            Authorization: `Bearer ${logbot.config.twitch.token}`,
          },
        },
      );
      logbot.livestatus[channel.toLowerCase()] = response.data.data.length > 0;
      console.log(`INFO: ${channel.toLowerCase()} is ${response.data.data.length > 0 ? "online" : "offline"}`);
    } catch(error) {
      if (logbot.config.twitch.token) {
        console.info("INFO: Invalid token, generating a new one...");
      } else {
        console.info("INFO: Generating token...");
      }
      generateToken();
      break;
    }
  }
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
