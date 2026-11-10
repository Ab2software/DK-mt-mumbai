const path = require('path');
const fs = require('fs');
const Module = require('module');

// Auto-fallback: Resolve dependencies from backend/node_modules if ResultApi/node_modules is not yet installed
const backendNodeModules = path.join(__dirname, '..', '..', 'backend', 'node_modules');
if (fs.existsSync(backendNodeModules)) {
  if (!Module.globalPaths.includes(backendNodeModules)) {
    Module.globalPaths.push(backendNodeModules);
  }
  if (!module.paths.includes(backendNodeModules)) {
    module.paths.unshift(backendNodeModules);
  }
  const origNodeModulePaths = Module._nodeModulePaths;
  Module._nodeModulePaths = function(from) {
    const paths = origNodeModulePaths.call(this, from);
    if (!paths.includes(backendNodeModules)) {
      paths.push(backendNodeModules);
    }
    return paths;
  };
}

const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

function getSharedResultPool() {
  // Reuse main backend pool when mounted inside backend/server.js to avoid opening duplicate pools
  if (global.__BHARAT_MATKA_DB_POOL__) {
    return global.__BHARAT_MATKA_DB_POOL__;
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST || '145.79.209.227',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'u214419219_bharatmatka',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || 'Matka@123!',
    database: process.env.DB_NAME || 'u214419219_bharatmatka',
    waitForConnections: true,
    connectionLimit: 3,
    maxIdle: 3,
    idleTimeout: 3600000,
    connectTimeout: 20000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    timezone: '+05:30',
    dateStrings: true
  });

  global.__BHARAT_MATKA_DB_POOL__ = pool;
  return pool;
}

module.exports = getSharedResultPool();
