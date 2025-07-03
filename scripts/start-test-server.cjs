#!/usr/bin/env node

// Load environment variables from .env.test
require('dotenv').config({ path: '.env.test' });

// Start the Next.js server
const { spawn } = require('child_process');
const nextProcess = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  env: process.env
});

nextProcess.on('error', (error) => {
  console.error('Failed to start Next.js server:', error);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  process.exit(code);
}); 