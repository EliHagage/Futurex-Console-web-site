global["http"] = require('http');
global["homedir"] = process.env.PWD || __dirname;
global["port"] = process.env.PORT || 80;
process.setMaxListeners(0);
global["config"] = {};
global["api"] = Object.create(null);
global["api"]["subscribers"] = Object.create(null);
global["config"]["log"] = false;
global["config"]["rconlog"] = true;
global["config"]["ipslog"] = false;

global["config"]["steamWebApi"] = "Test12324";
global["config"]["expressSecretString"] = "This-Is-My-SECRET-Express-Key-ISRAELI";
// test db for now

global["config"]["database"] = new Object();
// User Database for web control
global["config"]["database"] = {
    host: "127.0.0.1",
    user: "test",
    password: "Test",
    database: "Test"
};
// Server Database for web control
global["config"]["databases"] = {
    servers: "db_servers_web_control"
};

// test rcon
global["config"]["rcon"] = {};
global["config"]["rcon"]["host"] = "127.0.0.1";
global["config"]["rcon"]["port"] = 2403;
global["config"]["rcon"]["password"] = "Tetst";
