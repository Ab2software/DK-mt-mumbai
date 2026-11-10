const mysql = require('mysql2/promise');
require('dotenv').config();

function getSharedPool() {
  if (global.__BHARAT_MATKA_DB_POOL__) {
    return global.__BHARAT_MATKA_DB_POOL__;
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'u336761313_shreematka',
    waitForConnections: true,
    connectionLimit: 4,
    maxIdle: 4,
    idleTimeout: 3600000, // Keep idle connections warm for 1 hour to prevent Hostinger max_connections_per_hour churn
    connectTimeout: 20000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    timezone: '+05:30',
    dateStrings: true
  });

  // Only retry when an existing idle socket unexpectedly dropped, NEVER when connection limit/hourly quota is reached
  const TRANSIENT_SOCKET_CODES = new Set([
    'ECONNRESET',
    'PROTOCOL_CONNECTION_LOST',
    'EPIPE'
  ]);

  const origQuery = pool.query.bind(pool);
  const origExecute = pool.execute.bind(pool);

  const isRetryableSocketDrop = (err) => {
    if (!err) return false;
    if (err.code === 'ER_USER_LIMIT_REACHED' || err.errno === 1226 || err.errno === 1040) return false;
    return TRANSIENT_SOCKET_CODES.has(err.code) || /closed state|Connection lost/i.test(err.message || '');
  };

  pool.query = async (...args) => {
    try {
      return await origQuery(...args);
    } catch (err) {
      if (isRetryableSocketDrop(err)) {
        return await origQuery(...args);
      }
      throw err;
    }
  };

  pool.execute = async (...args) => {
    try {
      return await origExecute(...args);
    } catch (err) {
      if (isRetryableSocketDrop(err)) {
        return await origExecute(...args);
      }
      throw err;
    }
  };

  global.__BHARAT_MATKA_DB_POOL__ = pool;
  return pool;
}

module.exports = getSharedPool();
