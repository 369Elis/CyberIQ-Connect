// config/database.js
const mysql = require("mysql2");
require("dotenv").config({ path: "../database.env" });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

setInterval(() => {
  pool.query("SELECT 1", (err) => {
    if (err) {
      console.error("MySQL keep-alive error:", err);
    }
  });
}, 300_000);

module.exports = pool;
