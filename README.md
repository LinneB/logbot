# LinneB's Logbot

A Node.js project that logs messages from a twitch chat into a PostgreSQL database.

- [Setup](#setup)
  - [Database Setup](#database-setup)
  - [Configuration](#configuration)
- [Usage](#usage)
  - [Docker](#docker)
  - [Manual](#manual)
- [Contributing](#contributing)

## Setup

### Database Setup

You will obviously need a PostgreSQL database. You can run it using [Docker](https://hub.docker.com/_/postgres) or as a native package per your operating system.

If you want to, you can create a dedicated database rather than using the default 'root' database:

```sql
CREATE DATABASE logbot;
```

### Configuration

Rename the example config file to `config.toml` and add your Twitch and database details.

```toml
[misc]
# Levels: off, fatal, error, warn, info, debug, trace, all
# loglevel="info"

[twitch]
channels=["forsen", "LinneB"]
clientid="abdef123456"
secret="abcdef123456"

[database]
host=""
database=""
user=""
password=""
# Optional, will default to 5432
# port=""
```

## Usage

There are two ways of running the script, using Docker Compose or manually using node.

### Docker

After setting up your config file, you can run the script using Docker Compose:

```sh
docker-compose up -d
```

Make sure to check the logs to ensure everything is working correctly:

```sh
docker-compose logs
```

### Manual

First you need to install the dependencies using npm:

```sh
npm install
```

After that you can simply run the script using node:

```sh
node index.js
```

## Contributing

Contributions are welcome, just open up a pull request.

**Before commiting, make sure you format your changes using `npm run format` and fix any linting errors from `npm run lint`**

If you're reporting a bug or have a feature request, please open an issue.

If you have any questions, feel free reach out to me on [Twitch](https://twitch.tv/LinneB)
