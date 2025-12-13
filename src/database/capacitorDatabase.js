// Capacitor SQLite Database Service for Native Platforms
// This module handles all database operations using @capacitor-community/sqlite
// for Android/iOS native apps

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

// Database configuration
const DB_NAME = 'paradash';
const DB_VERSION = 1;

// Backup configuration constants
export const BACKUP_CONFIG = {
  VERSION: '1.0',
  SUPPORTED_VERSIONS: ['1.0'],
  FILES: {
    DATABASE: 'database.json',
    SETTINGS: 'settings.json',
  },
  FOLDERS: {
    IGC: 'igc/',
    ATTACHMENTS: 'attachments/',
  },
  TABLES: ['gear', 'flights', 'gear_maintenance'], // Whitelisted tables in dependency order
};

// SQLite connection instance
let sqlite = null;
let db = null;
let isInitialized = false;

// Database schema
const CREATE_GEAR_TABLE = `
  CREATE TABLE IF NOT EXISTS gear (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer TEXT NOT NULL,
    type TEXT NOT NULL,
    model TEXT NOT NULL,
    manufacturing_date TEXT,
    purchase_date TEXT,
    serial_number TEXT,
    notes TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

const CREATE_FLIGHTS_TABLE = `
  CREATE TABLE IF NOT EXISTS flights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    type TEXT,
    date TEXT,
    glider INTEGER,
    flightStart TEXT,
    flightEnd TEXT,
    takeoffLocation TEXT,
    takeoffCountryCode TEXT,
    landingLocation TEXT,
    landingCountryCode TEXT,
    flightTime TEXT,
    trackDistance REAL,
    straightDistance REAL,
    maxAltitude INTEGER,
    links TEXT,
    comments TEXT,
    igcFilePath TEXT,
    igcSerial TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (glider) REFERENCES gear(id)
  )
`;

const CREATE_MAINTENANCE_TABLE = `
  CREATE TABLE IF NOT EXISTS gear_maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gear_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    attachment_path TEXT,
    attachment_filename TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gear_id) REFERENCES gear(id) ON DELETE CASCADE
  )
`;

// Initialize the database connection
export async function initializeDatabase() {
  if (isInitialized && db) {
    return db;
  }

  try {
    const platform = Capacitor.getPlatform();

    // Create SQLite connection
    sqlite = new SQLiteConnection(CapacitorSQLite);

    // Check connection consistency (important for Android)
    const retCC = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

    if (retCC.result && isConn) {
      db = await sqlite.retrieveConnection(DB_NAME, false);
    } else {
      db = await sqlite.createConnection(
        DB_NAME,
        false,
        'no-encryption',
        DB_VERSION,
        false
      );
    }

    // Open the database
    await db.open();

    // Enable foreign keys
    await db.execute('PRAGMA foreign_keys = ON');

    // Create tables
    await db.execute(CREATE_GEAR_TABLE);
    await db.execute(CREATE_FLIGHTS_TABLE);
    await db.execute(CREATE_MAINTENANCE_TABLE);

    // Run migrations for existing databases
    // Check if columns exist before trying to add them
    const tableInfo = await db.query("PRAGMA table_info(gear)");
    const existingColumns = (tableInfo.values || []).map(col => col.name);
    
    if (!existingColumns.includes('serial_number')) {
      await db.execute('ALTER TABLE gear ADD COLUMN serial_number TEXT');
    }
    
    if (!existingColumns.includes('notes')) {
      await db.execute('ALTER TABLE gear ADD COLUMN notes TEXT');
    }
    
    isInitialized = true;

    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Close database connection
export async function closeDatabase() {
  if (db) {
    try {
      await sqlite.closeConnection(DB_NAME, false);
      db = null;
      isInitialized = false;
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}

// Flight operations
export const nativeFlightOperations = {
  // Get all flights with gear information
  getAllFlights: async () => {
    try {
      await initializeDatabase();
      const query = `
        SELECT f.*, g.manufacturer, g.model 
        FROM flights f 
        LEFT JOIN gear g ON f.glider = g.id 
        ORDER BY f.date DESC, f.flightStart DESC
      `;
      const result = await db.query(query);
      return result.values || [];
    } catch (error) {
      console.error('Error fetching flights:', error);
      throw error;
    }
  },

  // Add new flight
  add: async (flight) => {
    try {
      await initializeDatabase();
      const {
        category, type, date, glider, flightStart, flightEnd,
        takeoffLocation, takeoffCountryCode, landingLocation, landingCountryCode,
        flightTime, trackDistance, straightDistance, maxAltitude,
        links, comments, igcFilePath, igcSerial
      } = flight;

      const query = `
        INSERT INTO flights (
          category, type, date, glider, flightStart, flightEnd,
          takeoffLocation, takeoffCountryCode, landingLocation, landingCountryCode,
          flightTime, trackDistance, straightDistance, maxAltitude,
          links, comments, igcFilePath, igcSerial
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await db.run(query, [
        category, type, date, glider, flightStart, flightEnd,
        takeoffLocation, takeoffCountryCode, landingLocation, landingCountryCode,
        flightTime, trackDistance || null, straightDistance || null, maxAltitude || null,
        links, comments, igcFilePath, igcSerial
      ]);

      return { id: result.changes?.lastId, ...flight };
    } catch (error) {
      console.error('Error adding flight:', error);
      throw error;
    }
  },

  // Update flight
  updateFlight: async (id, flight) => {
    try {
      await initializeDatabase();
      const {
        category, type, date, glider, flightStart, flightEnd,
        takeoffLocation, takeoffCountryCode, landingLocation, landingCountryCode,
        flightTime, trackDistance, straightDistance, maxAltitude,
        links, comments, igcFilePath, igcSerial
      } = flight;

      const query = `
        UPDATE flights 
        SET category = ?, type = ?, date = ?, glider = ?, flightStart = ?, flightEnd = ?, 
            takeoffLocation = ?, takeoffCountryCode = ?, landingLocation = ?, landingCountryCode = ?, 
            flightTime = ?, trackDistance = ?, straightDistance = ?, maxAltitude = ?, 
            links = ?, comments = ?, igcFilePath = ?, igcSerial = ?, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await db.run(query, [
        category, type, date, glider, flightStart, flightEnd,
        takeoffLocation, takeoffCountryCode, landingLocation, landingCountryCode,
        flightTime, trackDistance || null, straightDistance || null, maxAltitude || null,
        links, comments, igcFilePath, igcSerial, id
      ]);

      return { id, ...flight };
    } catch (error) {
      console.error('Error updating flight:', error);
      throw error;
    }
  },

  // Delete flight
  deleteFlight: async (id) => {
    try {
      await initializeDatabase();
      const result = await db.run('DELETE FROM flights WHERE id = ?', [id]);
      return { deletedId: id, changes: result.changes?.changes || 0 };
    } catch (error) {
      console.error('Error deleting flight:', error);
      throw error;
    }
  },

  // Export database as JSON
  exportDatabase: async () => {
    try {
      await initializeDatabase();
      const exportData = await db.exportToJson('full');
      return { success: true, data: exportData.export };
    } catch (error) {
      console.error('Error exporting database:', error);
      return { success: false, message: error.message };
    }
  },

  // Export CSV - not supported on native
  exportTableAsCSV: async () => {
    console.warn('CSV export not yet implemented for native platform');
    return { success: false, message: 'CSV export not available on mobile' };
  },
};

// Gear operations
export const nativeGearOperations = {
  // Get all gear
  getAll: async () => {
    try {
      await initializeDatabase();
      const result = await db.query('SELECT * FROM gear ORDER BY type, purchase_date DESC');
      return result.values || [];
    } catch (error) {
      console.error('Error fetching gear:', error);
      throw error;
    }
  },

  // Get all gear with flight statistics
  getAllWithStats: async () => {
    try {
      await initializeDatabase();
      const query = `
        SELECT 
          g.*,
          CASE 
            WHEN g.type = 'gliders' THEN COUNT(f.id)
            ELSE 0
          END as flight_count,
          CASE 
            WHEN g.type = 'gliders' THEN COALESCE(SUM(
              CASE 
                WHEN f.flightTime IS NOT NULL AND f.flightTime != '' 
                THEN (
                  CAST(substr(f.flightTime, 1, instr(f.flightTime, ':') - 1) AS INTEGER) * 60 +
                  CAST(substr(f.flightTime, instr(f.flightTime, ':') + 1) AS INTEGER)
                )
                ELSE 0
              END
            ), 0)
            ELSE 0
          END as total_flight_minutes
        FROM gear g
        LEFT JOIN flights f ON g.id = f.glider AND g.type = 'gliders'
        GROUP BY g.id
        ORDER BY g.type, g.purchase_date DESC
      `;
      
      const result = await db.query(query);
      const rows = result.values || [];

      // Convert total minutes back to hours:minutes format
      return rows.map((row) => ({
        ...row,
        total_flight_time:
          row.total_flight_minutes > 0
            ? `${Math.floor(row.total_flight_minutes / 60)}:${String(
                row.total_flight_minutes % 60
              ).padStart(2, '0')}`
            : '0:00',
      }));
    } catch (error) {
      console.error('Error fetching gear with stats:', error);
      throw error;
    }
  },

  // Get gear by ID
  getById: async (id) => {
    try {
      await initializeDatabase();
      const result = await db.query('SELECT * FROM gear WHERE id = ?', [id]);
      return result.values?.[0] || null;
    } catch (error) {
      console.error('Error fetching gear by ID:', error);
      throw error;
    }
  },

  // Add new gear
  add: async (gear) => {
    try {
      await initializeDatabase();
      const { manufacturer, model, type, manufacturing_date, purchase_date, serial_number, notes } = gear;

      const result = await db.run(
        `INSERT INTO gear (manufacturer, model, type, manufacturing_date, purchase_date, serial_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [manufacturer, model, type, manufacturing_date, purchase_date, serial_number || null, notes || null]
      );

      const gearId = result.changes?.lastId;

      // Automatically create a purchase maintenance record if purchase_date is provided
      if (purchase_date && gearId) {
        await db.run(
          `INSERT INTO gear_maintenance (gear_id, date, category, description) VALUES (?, ?, ?, ?)`,
          [gearId, purchase_date, 'Purchase', `Initial purchase of ${manufacturer} ${model}`]
        );
      }

      return { id: gearId, ...gear };
    } catch (error) {
      console.error('Error adding gear:', error);
      throw error;
    }
  },

  // Update gear
  update: async (id, gear) => {
    try {
      await initializeDatabase();
      const { manufacturer, model, type, manufacturing_date, purchase_date, serial_number, notes } = gear;

      await db.run(
        `UPDATE gear SET manufacturer = ?, model = ?, type = ?, manufacturing_date = ?, purchase_date = ?, serial_number = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [manufacturer, model, type, manufacturing_date, purchase_date, serial_number || null, notes || null, id]
      );

      return { id, ...gear };
    } catch (error) {
      console.error('Error updating gear:', error);
      throw error;
    }
  },

  // Delete gear
  delete: async (id) => {
    try {
      await initializeDatabase();
      const result = await db.run('DELETE FROM gear WHERE id = ?', [id]);
      return { deletedId: id, changes: result.changes?.changes || 0 };
    } catch (error) {
      console.error('Error deleting gear:', error);
      throw error;
    }
  },

  // Toggle active/retired status
  toggleActive: async (id, isActive) => {
    try {
      await initializeDatabase();
      await db.run(
        `UPDATE gear SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [isActive ? 1 : 0, id]
      );
      return { id, is_active: isActive };
    } catch (error) {
      console.error('Error toggling gear active status:', error);
      throw error;
    }
  },
};

// Maintenance operations
export const nativeMaintenanceOperations = {
  // Get all maintenance records
  getAll: async () => {
    try {
      await initializeDatabase();
      const result = await db.query('SELECT * FROM gear_maintenance ORDER BY date DESC');
      return result.values || [];
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      throw error;
    }
  },

  // Get maintenance records for a gear item
  getByGearId: async (gearId) => {
    try {
      await initializeDatabase();
      const result = await db.query(
        'SELECT * FROM gear_maintenance WHERE gear_id = ? ORDER BY date DESC',
        [gearId]
      );
      return result.values || [];
    } catch (error) {
      console.error('Error fetching maintenance by gear ID:', error);
      throw error;
    }
  },

  // Add maintenance record
  add: async (gearId, maintenance) => {
    try {
      await initializeDatabase();
      const { date, category, description, attachment_path, attachment_filename } = maintenance;

      const result = await db.run(
        `INSERT INTO gear_maintenance (gear_id, date, category, description, attachment_path, attachment_filename) VALUES (?, ?, ?, ?, ?, ?)`,
        [gearId, date, category, description, attachment_path, attachment_filename]
      );

      return {
        id: result.changes?.lastId,
        gear_id: gearId,
        ...maintenance,
      };
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      throw error;
    }
  },

  // Update maintenance record
  update: async (id, maintenance) => {
    try {
      await initializeDatabase();
      const { date, category, description, attachment_path, attachment_filename } = maintenance;

      await db.run(
        `UPDATE gear_maintenance SET date = ?, category = ?, description = ?, attachment_path = ?, attachment_filename = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [date, category, description, attachment_path, attachment_filename, id]
      );

      return { id, ...maintenance };
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      throw error;
    }
  },

  // Delete maintenance record
  delete: async (id) => {
    try {
      await initializeDatabase();
      const result = await db.run('DELETE FROM gear_maintenance WHERE id = ?', [id]);
      return { deletedId: id, changes: result.changes?.changes || 0 };
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
      throw error;
    }
  },
};

// Wipe all data from the database (legacy method - use recreateDatabase for imports)
export async function wipeAllData() {
  try {
    await initializeDatabase();
    
    // Delete all records from all tables
    await db.execute('DELETE FROM flights');
    await db.execute('DELETE FROM gear');
    await db.execute('DELETE FROM gear_maintenance');
    
    // Reset auto-increment counters
    await db.execute("DELETE FROM sqlite_sequence WHERE name='flights'");
    await db.execute("DELETE FROM sqlite_sequence WHERE name='gear'");
    await db.execute("DELETE FROM sqlite_sequence WHERE name='gear_maintenance'");
    
    return { success: true };
  } catch (error) {
    console.error('Error wiping database:', error);
    throw error;
  }
}

// Recreate database tables from scratch (DROP + CREATE)
// This is the preferred method for imports - guarantees clean slate
export async function recreateDatabase() {
  try {
    await initializeDatabase();
    
    // Disable foreign keys during recreation
    await db.execute('PRAGMA foreign_keys = OFF');
    
    // Drop tables in reverse dependency order (maintenance -> flights -> gear)
    await db.execute('DROP TABLE IF EXISTS gear_maintenance');
    await db.execute('DROP TABLE IF EXISTS flights');
    await db.execute('DROP TABLE IF EXISTS gear');
    
    // Recreate with current schema (ensures any migrations are preserved)
    await db.execute(CREATE_GEAR_TABLE);
    await db.execute(CREATE_FLIGHTS_TABLE);
    await db.execute(CREATE_MAINTENANCE_TABLE);
    
    // Re-enable foreign keys
    await db.execute('PRAGMA foreign_keys = ON');
    
    console.log('Database tables recreated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error recreating database:', error);
    // Try to re-enable foreign keys even on error
    try {
      await db.execute('PRAGMA foreign_keys = ON');
    } catch (fkError) {
      console.error('Failed to re-enable foreign keys:', fkError);
    }
    throw error;
  }
}

// Validate backup data structure before import
export function validateBackupData(jsonString) {
  const errors = [];
  
  try {
    const data = JSON.parse(jsonString);
    
    // Check basic structure
    if (!data || typeof data !== 'object') {
      errors.push('Invalid backup format: not a valid JSON object');
      return { valid: false, errors, data: null };
    }
    
    // Check for tables array
    if (!Array.isArray(data.tables)) {
      errors.push('Invalid backup format: missing tables array');
      return { valid: false, errors, data: null };
    }
    
    // Check required tables exist
    const tableNames = data.tables.map(t => t.name);
    for (const requiredTable of BACKUP_CONFIG.TABLES) {
      if (!tableNames.includes(requiredTable)) {
        errors.push(`Missing required table: ${requiredTable}`);
      }
    }
    
    // Validate each table has proper structure
    for (const table of data.tables) {
      if (!table.name || typeof table.name !== 'string') {
        errors.push('Invalid table: missing or invalid name');
        continue;
      }
      
      // Check table is in whitelist
      if (!BACKUP_CONFIG.TABLES.includes(table.name)) {
        console.warn(`Skipping unknown table: ${table.name}`);
        continue;
      }
      
      if (!Array.isArray(table.values)) {
        errors.push(`Table ${table.name}: missing values array`);
      }
      
      if (!Array.isArray(table.schema)) {
        errors.push(`Table ${table.name}: missing schema definition`);
      }
    }
    
    return { 
      valid: errors.length === 0, 
      errors, 
      data,
      stats: {
        tables: tableNames.length,
        gear: data.tables.find(t => t.name === 'gear')?.values?.length || 0,
        flights: data.tables.find(t => t.name === 'flights')?.values?.length || 0,
        maintenance: data.tables.find(t => t.name === 'gear_maintenance')?.values?.length || 0,
      }
    };
    
  } catch (parseError) {
    errors.push(`Failed to parse backup JSON: ${parseError.message}`);
    return { valid: false, errors, data: null };
  }
}

// Import database from JSON export (uses DROP + CREATE for clean slate)
export async function importFromJson(jsonString, progressCallback = null) {
  // Step 1: Validate before any destructive operations
  const validation = validateBackupData(jsonString);
  if (!validation.valid) {
    throw new Error(`Invalid backup: ${validation.errors.join('; ')}`);
  }
  
  const importData = validation.data;
  console.log('Backup validated successfully:', validation.stats);
  
  if (progressCallback) progressCallback({ phase: 'validated', percent: 10 });
  
  try {
    await initializeDatabase();
    
    // Step 2: Disable foreign keys first
    await db.execute('PRAGMA foreign_keys = OFF');
    
    // Step 3: Recreate tables (DROP + CREATE) for clean slate
    if (progressCallback) progressCallback({ phase: 'recreating', percent: 20 });
    
    // Drop tables in reverse dependency order
    await db.execute('DROP TABLE IF EXISTS gear_maintenance');
    await db.execute('DROP TABLE IF EXISTS flights');
    await db.execute('DROP TABLE IF EXISTS gear');
    
    // Recreate with current schema
    await db.execute(CREATE_GEAR_TABLE);
    await db.execute(CREATE_FLIGHTS_TABLE);
    await db.execute(CREATE_MAINTENANCE_TABLE);
    
    console.log('Database tables recreated successfully');
    
    if (progressCallback) progressCallback({ phase: 'importing', percent: 30 });
    
    const importStats = { inserted: {}, errors: {} };
    
    // Import tables in dependency order (gear -> flights -> maintenance)
    for (let i = 0; i < BACKUP_CONFIG.TABLES.length; i++) {
      const tableName = BACKUP_CONFIG.TABLES[i];
      const table = importData.tables.find(t => t.name === tableName);
      
      if (!table || !table.values?.length) {
        console.log(`Skipping empty table: ${tableName}`);
        importStats.inserted[tableName] = 0;
        importStats.errors[tableName] = 0;
        continue;
      }
      
      // Get current schema columns (app's schema, not backup's)
      const tableInfo = await db.query(`PRAGMA table_info(${tableName})`);
      const currentColumns = (tableInfo.values || []).map(col => col.name);
      
      // Get backup schema columns
      const backupColumns = table.schema?.map(s => s.column) || [];
      
      console.log(`Importing ${table.values.length} rows into ${tableName}`);
      console.log(`  Current schema: ${currentColumns.join(', ')}`);
      console.log(`  Backup schema: ${backupColumns.join(', ')}`);
      
      let insertedCount = 0;
      let errorCount = 0;
      
      for (const row of table.values) {
        try {
          // Map backup columns to current schema
          // This handles schema differences gracefully
          const values = currentColumns.map(col => {
            const backupIdx = backupColumns.indexOf(col);
            if (backupIdx >= 0 && backupIdx < row.length) {
              const val = row[backupIdx];
              return val === undefined ? null : val;
            }
            return null; // Column doesn't exist in backup, use null
          });
          
          const placeholders = currentColumns.map(() => '?').join(', ');
          const query = `INSERT INTO ${tableName} (${currentColumns.join(', ')}) VALUES (${placeholders})`;
          
          await db.run(query, values);
          insertedCount++;
        } catch (rowError) {
          errorCount++;
          console.warn(`Error inserting row into ${tableName}:`, rowError.message);
        }
      }
      
      importStats.inserted[tableName] = insertedCount;
      importStats.errors[tableName] = errorCount;
      
      console.log(`  Completed: ${insertedCount} inserted, ${errorCount} errors`);
      
      // Update progress
      if (progressCallback) {
        const progress = 30 + ((i + 1) / BACKUP_CONFIG.TABLES.length) * 50;
        progressCallback({ phase: 'importing', table: tableName, percent: Math.round(progress) });
      }
    }
    
    // Re-enable foreign keys
    await db.execute('PRAGMA foreign_keys = ON');
    
    if (progressCallback) progressCallback({ phase: 'verifying', percent: 90 });
    
    // Verify import
    const verifyStats = await getTableCounts();
    console.log('Import verification:', verifyStats);
    
    if (progressCallback) progressCallback({ phase: 'complete', percent: 100 });
    
    return { 
      success: true, 
      stats: importStats,
      verified: verifyStats
    };
    
  } catch (error) {
    console.error('Error importing database:', error);
    // Try to re-enable foreign keys on error
    try {
      await db.execute('PRAGMA foreign_keys = ON');
    } catch (fkError) {
      console.warn('Failed to re-enable foreign keys:', fkError);
    }
    throw error;
  }
}

// Get count of records in each table
async function getTableCounts() {
  const counts = {};
  for (const table of BACKUP_CONFIG.TABLES) {
    const result = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
    counts[table] = result.values?.[0]?.count || 0;
  }
  return counts;
}

// Check if running on native platform
export function isNativePlatform() {
  const platform = Capacitor.getPlatform();
  return platform === 'android' || platform === 'ios';
}

export default {
  initializeDatabase,
  closeDatabase,
  isNativePlatform,
  wipeAllData,
  recreateDatabase,
  importFromJson,
  validateBackupData,
  BACKUP_CONFIG,
  flightOperations: nativeFlightOperations,
  gearOperations: nativeGearOperations,
  maintenanceOperations: nativeMaintenanceOperations,
};

