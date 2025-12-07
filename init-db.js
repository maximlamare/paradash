#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * This script initializes an empty database by:
 * 1. Deleting the existing database file
 * 2. Cleaning up IGC files
 * 3. Cleaning up attachment files
 * 4. Cleaning up temp files
 * 
 * The database tables will be automatically recreated when the server starts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const dbPath = path.join(__dirname, 'src', 'data', 'flights.db');
const igcDir = path.join(__dirname, 'src', 'data', 'igc');
const attachmentDir = path.join(__dirname, 'src', 'data', 'attachments');
const tempDir = path.join(__dirname, 'temp');

console.log('🔄 Initializing empty database...\n');

// Delete database file
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Deleted existing database file');
} else {
  console.log('ℹ️  No existing database file found');
}

// Clean IGC directory
if (fs.existsSync(igcDir)) {
  const igcFiles = fs.readdirSync(igcDir);
  igcFiles.forEach(file => {
    fs.unlinkSync(path.join(igcDir, file));
  });
  console.log(`✅ Cleaned ${igcFiles.length} IGC file(s)`);
} else {
  console.log('ℹ️  No IGC directory found');
}

// Clean attachments directory
if (fs.existsSync(attachmentDir)) {
  const attachments = fs.readdirSync(attachmentDir);
  attachments.forEach(file => {
    fs.unlinkSync(path.join(attachmentDir, file));
  });
  console.log(`✅ Cleaned ${attachments.length} attachment(s)`);
} else {
  console.log('ℹ️  No attachments directory found');
}

// Clean temp directory
if (fs.existsSync(tempDir)) {
  const tempFiles = fs.readdirSync(tempDir);
  tempFiles.forEach(file => {
    // Don't delete .gitkeep if it exists
    if (file !== '.gitkeep') {
      const filePath = path.join(tempDir, file);
      if (fs.statSync(filePath).isDirectory()) {
        // Remove directory recursively
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  });
  console.log(`✅ Cleaned ${tempFiles.filter(f => f !== '.gitkeep').length} temp file(s)`);
} else {
  console.log('ℹ️  No temp directory found');
}

console.log('\n✨ Database initialization complete!');
console.log('📝 The database tables will be created automatically when you start the server.');
console.log('💡 No sample data will be inserted - the database will be completely empty.\n');

