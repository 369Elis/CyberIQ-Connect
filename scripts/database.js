require("dotenv").config(); // just this, no { path: ... }
const mysql = require("mysql2");

// Then process.env.MYSQLHOST etc. will be read correctly

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
