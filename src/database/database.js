// API client for ParaDash backend server
// This replaces direct SQLite access with HTTP API calls

const API_BASE_URL = "http://localhost:3001/api";

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

// Database operations using API calls
export const flightOperations = {
  // Get all flights with gear information
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

  // Add new flight (renamed from addFlight for consistency)
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

  // Update flight
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

  // Delete flight
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

  // Export database
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

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "paradash_export.db";
      if (contentDisposition) {
        // Match: attachment; filename="file.db" or attachment; filename=file.db
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // Create blob and download
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

  // Export table as CSV
  exportTableAsCSV: async (tableName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/export/csv/${tableName}`);
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = `HTTP error! status: ${response.status}`;

        // Try to get error details from response
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        }

        throw new Error(errorMessage);
      }

      // Create blob and download
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

// Gear operations using API calls
export const gearOperations = {
  // Get all gear
  getAll: async () => {
    try {
      const response = await apiRequest("/gear");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching gear:", error);
      throw error;
    }
  },

  // Get all gear with flight statistics
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

  // Get gear by ID
  getById: async (id) => {
    try {
      const response = await apiRequest(`/gear/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching gear by ID:", error);
      throw error;
    }
  },

  // Add new gear
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

  // Update gear
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

  // Delete gear
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

  // Toggle active/retired status
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

// Maintenance operations
export const maintenanceOperations = {
  // Get all maintenance records
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

// Compatibility aliases for existing code
export const getAllFlights = flightOperations.getAllFlights;
export const getAllGear = gearOperations.getAll;
export const getAllMaintenance = maintenanceOperations.getAll;
export const addFlight = flightOperations.add;
export const addGear = gearOperations.add;

// Mock database connection for compatibility
export const db = {
  close: () => console.log("API client - no database connection to close"),
};

console.log("API client initialized - connecting to backend at", API_BASE_URL);
