# LinneB's twitch logbot

A javascript project that logs messages from a twitch chat into a mysql/mariadb database.

I decided to re-write this in javascript because python as being really annoying.
I don't have much experience with JS so the script may be a bit shit.

## How to run the script

Copy the 'example_config.json' file to 'config.json', and configure all the variables there.
**Note that 'liveInterval' is in milliseconds, so 60000 would be 60 seconds.*

Use `npm install` to install all dependencies.
Use `node index.js` to start the logbot.