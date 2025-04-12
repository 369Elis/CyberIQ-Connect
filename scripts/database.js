const mysql = require("mysql2");

// Use Railway's standard DB_* variables first
const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  port: process.env.DB_PORT || process.env.MYSQLPORT,
};

console.log("🔌 Final DB Config:", dbConfig);

// Validate configuration
const required = ["host", "user", "password", "database", "port"];
for (const field of required) {
  if (!dbConfig[field]) {
    throw new Error(`Missing database config for: ${field}`);
  }
}

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error("DATABASE CONNECTION FAILED:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL database");
});

module.exports = connection;
