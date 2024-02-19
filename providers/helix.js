import axios from "axios";
import log4js from "../utils/logger.js";
import { chunkArray } from "../utils/utils.js";
const logger = log4js.getLogger("helix");

export class HelixWrapper {
  constructor(config) {
    this._config = config;
    this._livestatus = {};
    this._axios = axios.create({
      baseURL: "https://api.twitch.tv/helix",
      headers: {
        "Client-ID": this._config.clientid,
      },
      validateStatus: false,
    });
    this._initialize();
  }

  async _initialize() {
    this._token = await this._generateToken(
      this._config.clientid,
      this._config.secret,
    );
    this._axios.defaults.headers["Authorization"] = `Bearer ${this._token}`;
    this._updateLivestatus();
    this._updateLoop = setInterval(
      this._updateLivestatus.bind(this),
      20 * 1000,
    );
  }

  async _updateLivestatus() {
    logger.debug("Getting live status");
    // Default all channels to offline
    let livestatus = {};
    const channels = this._config.channels;
    channels.forEach((c) => (livestatus[c] = false));

    for (const chunk of chunkArray(channels, 100)) {
      const res = await this._axios({
        method: "get",
        url: `streams?user_login=${chunk.join("&user_login=")}`,
      });
      if (res.status === 200) {
        for (const channel of res.data.data) {
          // Set channel to online if they have stream data
          livestatus[channel.user_login] = true;
          logger.debug(`${channel.user_name} is live`);
        }
      }
      if (res.status === 401) {
        logger.warn("Token invalid, generating a new one");
        this._token = await this._generateToken(
          this._config.clientid,
          this._config.secret,
        );
        this._axios.defaults.headers["Authorization"] = `Bearer ${this._token}`;
        return this._updateLivestatus();
      }
    }
    this._livestatus = livestatus;
  }

  async _generateToken(clientid, secret) {
    const res = await this._axios({
      method: "post",
      url: "https://id.twitch.tv/oauth2/token",
      data: {
        client_id: clientid,
        client_secret: secret,
        grant_type: "client_credentials",
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (res.status === 200) {
      return res.data.access_token;
    }
    logger.fatal(
      "Could not generate helix token. Make sure clientID and client secret are valid",
    );
    process.exit(1);
  }

  getLivestatus(channel) {
    return this._livestatus[channel] || false;
  }
}
