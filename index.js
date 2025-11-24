require("dotenv").config();

const express = require("express");
const app = express();

const http = require("http");

//DB
const mongoose = require("mongoose");

var { MONGODB_URI } = process.env;
var PORT = process.env.PORT || 3000;

var BACKEND_VERSION = process.env.BACKEND_VERSION;
if( !BACKEND_VERSION ) throw "BACKEND_VERSION required. ";

var MONGODB_NAME = process.env.MONGODB_NAME;
if( !MONGODB_NAME ) throw "Database name not found.";

var NODE_ENV = process.env.NODE_ENV;
if( !NODE_ENV ) throw "NODE_ENV required. ";

app.get(
    "/health",
    async(req, res) => {
      return res.status(200).json({
          status: "ok",
          request_date: new Date(),
          version: BACKEND_VERSION,
          success: true
      });
    }
);

mongoose
  .connect(MONGODB_URI, 
  { 
    dbName: MONGODB_NAME,
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    maxIdleTimeMS: 30000
  })
  .then(async () => { 
    console.log("MongoDB connection completed. ");
    app.locals.db = mongoose.connection.db;
  })
  .catch((err) => { 
    return process.exit(1);
  });

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true }));
app.use(express.static('public', { dotfiles: 'ignore' }));

var server = http.createServer(app);

server.listen(PORT, () => { 
  console.log("Server running. ");
});

module.exports = app;