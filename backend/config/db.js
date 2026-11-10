const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'u336761313_shreematka',
  waitForConnections: true,
  connectionLimit: 5,
  maxIdle: 3,
  idleTimeout: 30000,
  connectTimeout: 20000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: '+05:30',
  dateStrings: true
});

const TRANSIENT_CODES = new Set([
  'ECONNRESET',
  'PROTOCOL_CONNECTION_LOST',
  'ETIMEDOUT',
  'EPIPE',
  'ER_CLIENT_INTERACTION_TIMEOUT'
]);

const origQuery = pool.query.bind(pool);
const origExecute = pool.execute.bind(pool);

pool.query = async (...args) => {
  try {
    return await origQuery(...args);
  } catch (err) {
    if (err && (TRANSIENT_CODES.has(err.code) || /closed state|Connection lost/i.test(err.message || ''))) {
      return await origQuery(...args);
    }
    throw err;
  }
};

pool.execute = async (...args) => {
  try {
    return await origExecute(...args);
  } catch (err) {
    if (err && (TRANSIENT_CODES.has(err.code) || /closed state|Connection lost/i.test(err.message || ''))) {
      return await origExecute(...args);
    }
    throw err;
  }
};

module.exports = pool;
