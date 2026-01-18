#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting all services...\n');

const services = [
  {
    name: 'Frontend',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'frontend'),
    color: '\x1b[36m', // Cyan
  },
  {
    name: 'Backend',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'backend'),
    color: '\x1b[33m', // Yellow
  },
  {
    name: 'Agent',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'agent'),
    color: '\x1b[35m', // Magenta
  },
];

const processes = services.map((service) => {
  console.log(`${service.color}Starting ${service.name}...\x1b[0m`);
  
  const proc = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: 'inherit',
    shell: true,
  });

  proc.on('error', (error) => {
    console.error(`${service.color}${service.name} error:\x1b[0m`, error);
  });

  return { name: service.name, process: proc, color: service.color };
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down all services...\n');
  processes.forEach(({ process: proc }) => {
    proc.kill('SIGINT');
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down all services...\n');
  processes.forEach(({ process: proc }) => {
    proc.kill('SIGTERM');
  });
  process.exit(0);
});

console.log('\n✅ All services started! Press Ctrl+C to stop.\n');

