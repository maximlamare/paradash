// Platform-aware database module for ParaDash
// Automatically selects the appropriate database implementation:
// - Native (Android/iOS): Uses @capacitor-community/sqlite
// - Web: Uses HTTP API calls to the backend server

import { Capacitor } from '@capacitor/core';
import {
  initializeDatabase as initNativeDb,
  closeDatabase as closeNativeDb,
  nativeFlightOperations,
  nativeGearOperations,
  nativeMaintenanceOperations,
} from './capacitorDatabase.js';

// API configuration for web platform
const API_BASE_URL = "http://localhost:3001/api";

// Track initialization state
let isInitialized = false;

// Dynamic platform check - called at runtime, not module load time
function isNativePlatform() {
  const platform = Capacitor.getPlatform();
  return platform === 'android' || platform === 'ios';
}

// ============================================================================
// WEB PLATFORM: API Client Implementation
// ============================================================================

// Helper function for making API requests
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    // Handle different response types
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Web flight operations using API calls
const webFlightOperations = {
  getAllFlights: async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await apiRequest(`/flights?_t=${timestamp}`);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching flights:", error);
      throw error;
    }
  },

  add: async (flight) => {
    try {
      const response = await apiRequest("/flights", {
        method: "POST",
        body: JSON.stringify(flight),
      });
      return { id: response.id, ...flight };
    } catch (error) {
      console.error("Error adding flight:", error);
      throw error;
    }
  },

  updateFlight: async (id, flight) => {
    try {
      await apiRequest(`/flights/${id}`, {
        method: "PUT",
        body: JSON.stringify(flight),
      });
      return { id, ...flight };
    } catch (error) {
      console.error("Error updating flight:", error);
      throw error;
    }
  },

  deleteFlight: async (id) => {
    try {
      const response = await apiRequest(`/flights/${id}`, {
        method: "DELETE",
      });
      return { deletedId: id, changes: response.changes };
    } catch (error) {
      console.error("Error deleting flight:", error);
      throw error;
    }
  },

  exportDatabase: async (tables = []) => {
    try {
      const response = await fetch(`${API_BASE_URL}/export/database`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tables }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentDisposition = response.headers.get("content-disposition");
      let filename = "paradash_export.db";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error("Error exporting database:", error);
      throw error;
    }
  },

  exportTableAsCSV: async (tableName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/export/csv/${tableName}`);
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = `HTTP error! status: ${response.status}`;

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${tableName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error("Error exporting CSV:", error);
      throw error;
    }
  },
};

// Web gear operations using API calls
const webGearOperations = {
  getAll: async () => {
    try {
      const response = await apiRequest("/gear");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching gear:", error);
      throw error;
    }
  },

  getAllWithStats: async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await apiRequest(`/gear/with-stats?_t=${timestamp}`);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching gear with stats:", error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiRequest(`/gear/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching gear by ID:", error);
      throw error;
    }
  },

  add: async (gear) => {
    try {
      const response = await apiRequest("/gear", {
        method: "POST",
        body: JSON.stringify(gear),
      });
      return { id: response.id, ...gear };
    } catch (error) {
      console.error("Error adding gear:", error);
      throw error;
    }
  },

  update: async (id, gear) => {
    try {
      await apiRequest(`/gear/${id}`, {
        method: "PUT",
        body: JSON.stringify(gear),
      });
      return { id, ...gear };
    } catch (error) {
      console.error("Error updating gear:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiRequest(`/gear/${id}`, {
        method: "DELETE",
      });
      return { deletedId: id, changes: response.changes };
    } catch (error) {
      console.error("Error deleting gear:", error);
      throw error;
    }
  },

  toggleActive: async (id, isActive) => {
    try {
      await apiRequest(`/gear/${id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive }),
      });
      return { id, is_active: isActive };
    } catch (error) {
      console.error("Error toggling gear active status:", error);
      throw error;
    }
  },
};

// Web maintenance operations using API calls
const webMaintenanceOperations = {
  getAll: async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await apiRequest(`/maintenance?_t=${timestamp}`);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
      throw error;
    }
  },
};

// ============================================================================
// PLATFORM-AWARE EXPORTS
// ============================================================================

// Initialize database (only needed for native platforms)
export async function initializeDatabase() {
  if (isInitialized) {
    return;
  }

  if (isNativePlatform()) {
    console.log('Initializing native SQLite database...');
    await initNativeDb();
  } else {
    console.log('Using web API client - connecting to backend at', API_BASE_URL);
  }

  isInitialized = true;
}

// Close database connection
export async function closeDatabase() {
  if (isNativePlatform()) {
    await closeNativeDb();
  }
  isInitialized = false;
}

// ============================================================================
// DYNAMIC OPERATION WRAPPERS
// These check the platform at call time, not at module load time
// ============================================================================

// Flight operations - dynamically routes to correct implementation
export const flightOperations = {
  getAllFlights: async () => {
    console.log(`flightOperations.getAllFlights called, platform: ${Capacitor.getPlatform()}, isNative: ${isNativePlatform()}`);
    if (isNativePlatform()) {
      return nativeFlightOperations.getAllFlights();
    }
    return webFlightOperations.getAllFlights();
  },

  add: async (flight) => {
    console.log(`flightOperations.add called, platform: ${Capacitor.getPlatform()}, isNative: ${isNativePlatform()}`);
    if (isNativePlatform()) {
      return nativeFlightOperations.add(flight);
    }
    return webFlightOperations.add(flight);
  },

  updateFlight: async (id, flight) => {
    if (isNativePlatform()) {
      return nativeFlightOperations.updateFlight(id, flight);
    }
    return webFlightOperations.updateFlight(id, flight);
  },

  deleteFlight: async (id) => {
    if (isNativePlatform()) {
      return nativeFlightOperations.deleteFlight(id);
    }
    return webFlightOperations.deleteFlight(id);
  },

  exportDatabase: async (tables = []) => {
    if (isNativePlatform()) {
      return nativeFlightOperations.exportDatabase(tables);
    }
    return webFlightOperations.exportDatabase(tables);
  },

  exportTableAsCSV: async (tableName) => {
    if (isNativePlatform()) {
      return nativeFlightOperations.exportTableAsCSV(tableName);
    }
    return webFlightOperations.exportTableAsCSV(tableName);
  },
};

// Gear operations - dynamically routes to correct implementation
export const gearOperations = {
  getAll: async () => {
    if (isNativePlatform()) {
      return nativeGearOperations.getAll();
    }
    return webGearOperations.getAll();
  },

  getAllWithStats: async () => {
    if (isNativePlatform()) {
      return nativeGearOperations.getAllWithStats();
    }
    return webGearOperations.getAllWithStats();
  },

  getById: async (id) => {
    if (isNativePlatform()) {
      return nativeGearOperations.getById(id);
    }
    return webGearOperations.getById(id);
  },

  add: async (gear) => {
    if (isNativePlatform()) {
      return nativeGearOperations.add(gear);
    }
    return webGearOperations.add(gear);
  },

  update: async (id, gear) => {
    if (isNativePlatform()) {
      return nativeGearOperations.update(id, gear);
    }
    return webGearOperations.update(id, gear);
  },

  delete: async (id) => {
    if (isNativePlatform()) {
      return nativeGearOperations.delete(id);
    }
    return webGearOperations.delete(id);
  },

  toggleActive: async (id, isActive) => {
    if (isNativePlatform()) {
      return nativeGearOperations.toggleActive(id, isActive);
    }
    return webGearOperations.toggleActive(id, isActive);
  },
};

// Maintenance operations - dynamically routes to correct implementation
export const maintenanceOperations = {
  getAll: async () => {
    if (isNativePlatform()) {
      return nativeMaintenanceOperations.getAll();
    }
    return webMaintenanceOperations.getAll();
  },
  getByGearId: async (gearId) => {
    if (isNativePlatform()) {
      return nativeMaintenanceOperations.getByGearId(gearId);
    }
    // Web version - not implemented yet, using API directly in component
    return [];
  },
  add: async (gearId, maintenance) => {
    if (isNativePlatform()) {
      return nativeMaintenanceOperations.add(gearId, maintenance);
    }
    // Web version - not implemented yet, using API directly in component
    throw new Error("Web maintenance add not implemented");
  },
  update: async (id, maintenance) => {
    if (isNativePlatform()) {
      return nativeMaintenanceOperations.update(id, maintenance);
    }
    // Web version - not implemented yet, using API directly in component
    throw new Error("Web maintenance update not implemented");
  },
  delete: async (id) => {
    if (isNativePlatform()) {
      return nativeMaintenanceOperations.delete(id);
    }
    // Web version - not implemented yet, using API directly in component
    throw new Error("Web maintenance delete not implemented");
  },
};

// Compatibility aliases for existing code
export const getAllFlights = flightOperations.getAllFlights;
export const getAllGear = gearOperations.getAll;
export const getAllMaintenance = maintenanceOperations.getAll;
export const addFlight = flightOperations.add;
export const addGear = gearOperations.add;

// Mock database connection for compatibility
export const db = {
  close: () => {
    if (isNativePlatform()) {
      closeNativeDb();
    } else {
      console.log("API client - no database connection to close");
    }
  },
};

// Log initial platform detection (this runs at load time for debugging)
console.log(`Database module loaded - detected platform: ${Capacitor.getPlatform()}`);
