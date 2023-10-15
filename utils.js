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

module.exports = {
  updateLiveStatus,
  generateToken,
};
