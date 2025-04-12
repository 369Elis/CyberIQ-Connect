// config/database.js
const mysql = require("mysql2");

// Load .env variables only for local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config(); // Make sure .env is in the root of your project
}

// Log current DB config (only for dev/testing)
console.log("🔌 DB config:", {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
});

// Setup MySQL connection using Railway-compatible env vars
const connection = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error(" Database connection failed:", err.stack);
  } else {
    console.log(" Connected to MySQL database.");
  }
});

module.exports = connection;
