require("dotenv").config();

const express = require("express");
const app = express();

const crypto = require('crypto');
const helmet = require("helmet");

const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require('express-rate-limit');

const cors = require("cors");
const http = require("http");

const cookieParser = require('cookie-parser');

const mongoose = require("mongoose");
const { GridFSBucket } = require('mongodb');

var rate_limiter = require("./Middleware/rate_limiter");

var read_country_meta_data_report = require("./insert_functions/read_grid_fs");
var shut_down_server_in_safety_mode = require("./MyFunctions/shut_down_server_in_safety_mode");
var { clean_country_meta_data } = require("./countries_fuel_operations/data360_world_bank_fuel_operations/data360_world_bank_fuel_price_operations"); //Gereksiz ülkeler silindi. 

var { MONGODB_URI } = process.env;
var PORT = process.env.PORT || 3000;

var BACKEND_VERSION = process.env.BACKEND_VERSION;
if( !BACKEND_VERSION ) throw "BACKEND_VERSION required. ";

var MONGODB_NAME = process.env.MONGODB_NAME;
if( !MONGODB_NAME ) throw "Database name not found.";

var NODE_ENV = process.env.NODE_ENV;
if( !NODE_ENV ) throw "NODE_ENV required. ";

var JWT_AUDIENCE_DEV = process.env.JWT_AUDIENCE_DEV;
var FRONTEND_API_URL = process.env.FRONTEND_API_URL;

if( !JWT_AUDIENCE_DEV ) throw "JWT_AUDIENCE_DEV required. ";
if( !FRONTEND_API_URL ) throw "FRONTEND_API_URL required. ";

var TRUST_PROXY = process.env.TRUST_PROXY;
if( !TRUST_PROXY ) throw "TRUST_PROXY required. ";

app.set('trust proxy', TRUST_PROXY === 'true');
app.disable('x-powered-by');

var suspiciousPatterns = [/\.php\b/i, /\.env\b/i, /wp-admin\b/i, /phpmyadmin\b/i];
app.use((req, res, next) => {
  if (suspiciousPatterns.some(function(i){   return i.test(req.originalUrl) } )) return res.status(404).send('Not found');
  return next();
});

app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(
      req.method,
      req.originalUrl,
      res.statusCode
    );
  });
  next();
});

//Health servisi.
app.get(
    "/health",
    async(req, res) => { 
      return res.status(200).json({
        request_date: new Date(),
        version: BACKEND_VERSION,
        success: true,
        service_issuer: 'worker.routewiseapp.com',
        server_update_date: '20.01.2026 00:10'
      });
  }
);

var globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    var ip = req.headers['cf-connecting-ip'] || req.ip;
    return ipKeyGenerator(ip); 
  }
});

app.use(globalLimiter);

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

    var country_meta_data_reports = new GridFSBucket(mongoose.connection.db, { bucketName: 'country_meta_data_reports' });

    app.locals.country_meta_data_reports = country_meta_data_reports;
    app.locals.db = mongoose.connection.db;

    var init_cron_jobs = require("./cron_operations/cron_jobs");
    await init_cron_jobs(app);
  })
  .catch((err) => { 
    return process.exit(1);
  });

var devOrigins = [JWT_AUDIENCE_DEV];
var prodOrigins = [FRONTEND_API_URL];

var allowedOrigins = (NODE_ENV === 'production' ? prodOrigins : devOrigins).filter(Boolean);

var corsOptions = {
    origin: function (origin, callback) {

      if( NODE_ENV == 'production' ) {

        if ( !origin ) return callback(new Error("CORS: Origin required. "));
        if ( allowedOrigins.some(function(item){ return item === origin } ) ) return callback(null, true);
        return callback(new Error("CORS: This origin is not authorized. "));
      }
      else if( NODE_ENV == 'development' ) return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'If-None-Match'],   
    credentials: true,
    optionsSuccessStatus: 204,
    preflightContinue: false          
};

app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  return next();
});

app.use(cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },  
  crossOriginOpenerPolicy: false,                       
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }, 
  contentSecurityPolicy: false                            
}));

if(NODE_ENV == "production") app.use(helmet.hsts({ maxAge: 15552000, includeSubDomains: true, preload: true }));

app.use(cookieParser());

app.use((req, res, next) => {

  req.id = crypto.randomUUID();
  req.source_ip = req.headers['cf-connecting-ip'] || req.ip || req.connection.remoteAddress;

  res.setHeader("X-Request-Id", req.id);
  return next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true }));
app.use(express.static('public', { dotfiles: 'ignore' }));

var server = http.createServer(app);

app.post(
  "/read/country-meta-data/reports",
  rate_limiter,
  async(req, res) => {
    var { _id } = req.body;

    var bucket = req.app.locals.country_meta_data_reports;
    var readed_grid_fs = await read_country_meta_data_report(_id, bucket);

    return res.status(200).json({ data: readed_grid_fs });
  }
);

app.use((req, res) => {
  return res.status(404).json({ error: 'Not Found.' });
});

app.use((err, req, res, next) => {
  return res.status(500).json({ error: 'Internal Server Error.' });
});

server.listen(PORT, () => { 
  console.log("Server running. ");
});

process.on('SIGTERM', shut_down_server_in_safety_mode);
process.on('SIGINT', shut_down_server_in_safety_mode);

process.on("uncaughtException", (err) => {
  console.error("Unexpected error!" + err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unexpected promise error!" + reason);
});

module.exports = app;