const path = require('path');
const fs = require('fs');
const Module = require('module');

// Auto-fallback: Resolve dependencies from backend/node_modules if ResultApi/node_modules is not yet installed
const backendNodeModules = path.join(__dirname, '..', 'backend', 'node_modules');
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

const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const resultRoutes = require('./routes/resultRoutes');

const app = express();
const PORT = process.env.RESULT_API_PORT || process.env.PORT || 5002;

// Enable CORS for all public third-party and frontend requests
app.use(cors());

// Parse JSON and URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Bharat Matka Public Result API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount Public Result Routes at multiple paths for developer convenience
app.use('/api/results', resultRoutes);
app.use('/api', resultRoutes);
app.use('/ResultApi', resultRoutes);
app.use('/', resultRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: '0',
    msg: 'Endpoint not found',
    documentation: '/'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ResultApi Error]:', err.stack);
  res.status(500).json({
    success: '0',
    msg: 'Internal Server Error in Result API',
    error: err.message
  });
});

// Start Server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` Bharat Matka Public Result API is running!`);
    console.log(` Port: ${PORT}`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Endpoints:`);
    console.log(`   - GET http://localhost:${PORT}/today`);
    console.log(`   - GET http://localhost:${PORT}/live`);
    console.log(`   - GET http://localhost:${PORT}/all`);
    console.log(`   - GET http://localhost:${PORT}/latest`);
    console.log(`   - GET http://localhost:${PORT}/market/:gameName`);
    console.log(`   - GET http://localhost:${PORT}/date/:date`);
    console.log(`   - GET http://localhost:${PORT}/chart/:gameName`);
    console.log(`   - GET http://localhost:${PORT}/markets`);
    console.log(`===============================================`);
  });
}

module.exports = app;
