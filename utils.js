const axios = require("axios");

async function checkIfLive(config = {}) {
  const { channel, clientid, token } = config.twitch;
  try {
    const channelStreamResponse = await axios.get(
      `https://api.twitch.tv/helix/streams?user_login=${channel}`,
      {
        headers: {
          "Client-ID": clientid,
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const {
      data: { data: streamData },
    } = channelStreamResponse || {};
    return streamData.length > 0;
  } catch (error) {
    console.error(`ERROR: Error getting live status: `, error);
  }
}

module.exports = {
  checkIfLive,
};
