const axios = require("axios");

function parseJSON(inputString = "", fallback) {
  if (inputString) {
    try {
      return JSON.parse(inputString);
    } catch (e) {
      return fallback;
    }
  }
}

async function checkIfLive(channelName = "", config = {}) {
  const { twitch = {} } = config;
  const { clientId, apioauth } = twitch;
  try {
    const channelStreamResponse = await axios.get(
      `https://api.twitch.tv/helix/streams?user_login=${channelName}`,
      {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${apioauth}`,
        },
      }
    );
    const {
      data: { data: streamData },
    } = channelStreamResponse || {};
    return streamData.length > 0;
  } catch (error) {
    console.error(`Error while checking if ${channelName} is live: `, error);
  }
}

module.exports = {
  parseJSON,
  checkIfLive,
};
