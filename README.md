# LinneB's Logbot

A Node.js project that logs messages from a twitch chat into a MySQL/MariaDB database.

- [Dependencies](#dependencies)
  - [Database](#database)
  - [Running with Docker](#running-with-docker)
  - [Running with Node.JS](#running-with-nodejs)
- [Setup](#setup)
  - [Database Setup](#database-setup)
  - [Configuration](#configuration)
- [Usage](#usage)
  - [Docker](#docker)
  - [Manual](#manual)

## Dependencies

### Database

- [MySQL](https://hub.docker.com/_/mysql) or [MariaDB](https://hub.docker.com/_/mariadb)

### Running with Docker

- [Docker](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Running with Node.JS

- [Node.JS](https://nodejs.org/en)
- [npm](https://nodejs.org/en)

## Setup

### Database Setup

You need to create a database and table:

```sql
CREATE DATABASE IF NOT EXISTS logbot;
CREATE TABLE logs (
    id INT NOT NULL AUTO_INCREMENT,
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

It's also good practice to create a seperate user with limited permissions

```sql
CREATE USER 'logbot'@'%' IDENTIFIED BY 'supersecurepassword';
GRANT INSERT ON logbot.logs TO 'logbot'@'%';
```

### Configuration

Rename the example config file to `config.toml` and add your Twitch and database details.

```toml
[twitch]
# Channel to monitor
channel=""
# Twitch token
clientid=""
token=""

[database]
host=""
database=""
user=""
password=""
table=""
# Optional, will default to 3306 if undefined
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

After setting up your config file, you can install the dependencies using npm:

```sh
npm install
```

After that you can run the script using node:

```sh
node index.js
```
