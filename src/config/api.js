// API Configuration for Paradash
// Centralized configuration for all API endpoints

const API_CONFIG = {
  // Base URL for the main server
  BASE_URL: 'http://localhost:3001',
  
  // Legacy URLs (kept for reference, but not used)
  LEGACY_DATABASE_URL: 'http://localhost:3000',
  LEGACY_API_URL: 'http://localhost:3002'
};

// API Endpoints
export const API_ENDPOINTS = {
  // Flight operations
  FLIGHTS: `${API_CONFIG.BASE_URL}/items`,
  SAVE_FLIGHT: `${API_CONFIG.BASE_URL}/save-flight`,
  DELETE_FLIGHT: (id) => `${API_CONFIG.BASE_URL}/delete-flight/${id}`,
  
  // Gear operations
  GEAR: `${API_CONFIG.BASE_URL}/gear`,
  GEAR_BY_ID: (id) => `${API_CONFIG.BASE_URL}/gear/${id}`,
  
  // Maintenance operations
  MAINTENANCE: `${API_CONFIG.BASE_URL}/maintenance`,
  MAINTENANCE_BY_GEAR: (gearId) => `${API_CONFIG.BASE_URL}/maintenance?gear_id=${gearId}`,
  
  // File operations
  UPLOAD_FILE: `${API_CONFIG.BASE_URL}/uploadFile`,
  READ_IGC: (filePath) => `${API_CONFIG.BASE_URL}/read-igc?filePath=${encodeURIComponent(filePath)}`,
  DELETE_IGC_FILE: `${API_CONFIG.BASE_URL}/delete-igc-file`,
  
  // Settings
  SAVE_SETTINGS: `${API_CONFIG.BASE_URL}/save-settings`,
  GET_SETTINGS: `${API_CONFIG.BASE_URL}/get-settings`,
  
  // Reference data
  LAUNCH_SITES: `${API_CONFIG.BASE_URL}/launch_sites`,
  COUNTRY_CODES: `${API_CONFIG.BASE_URL}/fetchCountryCodes`,
  
  // Database management
  GET_TABLES: `${API_CONFIG.BASE_URL}/get-tables`,
  EXPORT_DATABASE: `${API_CONFIG.BASE_URL}/export-database`,
  EXPORT_CSV: `${API_CONFIG.BASE_URL}/export-csv`,
  UPLOAD_DB: `${API_CONFIG.BASE_URL}/upload-db`,
  
  // Proxy endpoints
  REVERSE_GEOCODING: `${API_CONFIG.BASE_URL}/reverse`
};

export default API_CONFIG;
