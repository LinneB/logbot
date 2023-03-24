const CHECK_LIVE_TIME = 60000;

const queries = {
  insert: {
    chatLog:
      "INSERT INTO chatlog (channel, username, message, live) VALUES (?, ?, ?, ?)",
  },
};

module.exports = {
  CHECK_LIVE_TIME,
  queries,
};
