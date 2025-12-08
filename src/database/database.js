// Native-only database module for ParaDash (Mobile App)
// Uses @capacitor-community/sqlite for Android/iOS

import {
  initializeDatabase as initNativeDb,
  closeDatabase as closeNativeDb,
  wipeAllData as wipeNativeDb,
  nativeFlightOperations,
  nativeGearOperations,
  nativeMaintenanceOperations,
} from './capacitorDatabase.js';

// Track initialization state
let isInitialized = false;

// Initialize database
export async function initializeDatabase() {
  if (isInitialized) {
    return;
  }

  console.log('Initializing native SQLite database...');
  await initNativeDb();
  isInitialized = true;
}

// Close database connection
export async function closeDatabase() {
  await closeNativeDb();
  isInitialized = false;
}

// Wipe all data from database
export async function wipeAllData() {
  return await wipeNativeDb();
}

// Flight operations - direct pass-through to native implementation
export const flightOperations = {
  getAllFlights: nativeFlightOperations.getAllFlights,
  add: nativeFlightOperations.add,
  updateFlight: nativeFlightOperations.updateFlight,
  deleteFlight: nativeFlightOperations.deleteFlight,
  exportDatabase: nativeFlightOperations.exportDatabase,
  exportTableAsCSV: nativeFlightOperations.exportTableAsCSV,
};

// Gear operations - direct pass-through to native implementation
export const gearOperations = {
  getAll: nativeGearOperations.getAll,
  getAllWithStats: nativeGearOperations.getAllWithStats,
  getById: nativeGearOperations.getById,
  add: nativeGearOperations.add,
  update: nativeGearOperations.update,
  delete: nativeGearOperations.delete,
  toggleActive: nativeGearOperations.toggleActive,
};

// Maintenance operations - direct pass-through to native implementation
export const maintenanceOperations = {
  getAll: nativeMaintenanceOperations.getAll,
  getByGearId: nativeMaintenanceOperations.getByGearId,
  add: nativeMaintenanceOperations.add,
  update: nativeMaintenanceOperations.update,
  delete: nativeMaintenanceOperations.delete,
};

// Compatibility aliases for existing code
export const getAllFlights = flightOperations.getAllFlights;
export const getAllGear = gearOperations.getAll;
export const getAllMaintenance = maintenanceOperations.getAll;
export const addFlight = flightOperations.add;
export const addGear = gearOperations.add;

// Database connection helper for compatibility
export const db = {
  close: closeNativeDb,
};

console.log('Database module loaded - native SQLite mode');
