const axios = require("axios");

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
      if (response.status === 200) {
        logbot.livestatus[channel.toLowerCase()] = response.data.data.length > 0;
        console.log(`INFO: ${channel.toLowerCase()} is ${response.data.data.length > 0 ? "online" : "offline"}`)
      } else {
        console.error(`ERROR: Twitch API request returned status code ${response.status}: ${response.data}`);
      };
    } catch(error) {
      console.error("ERROR: Could not update live status: ", error.response.data);
    };
  };
};

module.exports = {
  updateLiveStatus,
};
