# LinneB's twitch logbot

A javascript project that logs messages from a twitch chat into a mysql/mariadb database.

I decided to re-write this in javascript because python as being really annoying.
I don't have much experience with JS so the script may be a bit shit.

## How to run the script

Copy the 'example_config.json' file to 'config.json', and configure all the variables there.

**Note that 'liveInterval' is in milliseconds, so 60000 would be 60 seconds.*

Use `npm install` to install all dependencies.
Use `node index.js` to start the logbot.

## MySQL table creation

This is an example 'create table' command that should work with the script, but you can edit it to fit your needs.
```
CREATE TABLE table_name (
    id INT(11) NOT NULL AUTO_INCREMENT,
    channel VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL,
    message VARCHAR(600),
    live TINYINT(1) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    isvip TINYINT(1) NOT NULL DEFAULT 0,
    ismod TINYINT(1) NOT NULL DEFAULT 0,
    issub TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);
```
