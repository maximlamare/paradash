<template>
  <div class="settings-container">
    <h1>Settings</h1>

    <!-- Flight Categories Section -->
    <div class="card settings-section">
      <h3>Flight Categories</h3>
      <p class="section-description">Manage the types of flights you can log</p>

      <div class="categories-list">
        <div
          v-for="(category, index) in flightCategories"
          :key="index"
          class="category-item"
        >
          <span class="category-name">{{ category }}</span>
          <button
            @click="removeCategory(index)"
            class="btn btn-danger btn-sm"
            :disabled="flightCategories.length <= 1"
            title="Remove category"
          >
            ×
          </button>
        </div>
      </div>

      <div class="add-category">
        <input
          v-model="newCategory"
          @keyup.enter="addCategory"
          type="text"
          placeholder="Enter new category"
          class="category-input"
          maxlength="50"
        />
        <button
          @click="addCategory"
          class="btn btn-primary"
          :disabled="
            !newCategory.trim() || flightCategories.includes(newCategory.trim())
          "
        >
          Add Category
        </button>
      </div>
    </div>

    <!-- Sport Types Section -->
    <div class="card settings-section">
      <h3>Flight Types</h3>
      <p class="section-description">Manage the type of flying you can log</p>

      <div class="categories-list">
        <div
          v-for="(flightType, index) in flightTypes"
          :key="index"
          class="category-item"
        >
          <span class="category-name">{{ flightType }}</span>
          <button
            @click="removeFlightType(index)"
            class="btn btn-danger btn-sm"
            :disabled="flightTypes.length <= 1"
            title="Remove flight type"
          >
            ×
          </button>
        </div>
      </div>

      <div class="add-category">
        <input
          v-model="newFlightType"
          @keyup.enter="addFlightType"
          type="text"
          placeholder="Enter new flight type"
          class="category-input"
          maxlength="50"
        />
        <button
          @click="addFlightType"
          class="btn btn-primary"
          :disabled="
            !newFlightType.trim() || flightTypes.includes(newFlightType.trim())
          "
        >
          Add Flight Type
        </button>
      </div>
    </div>

    <!-- Maintenance Categories Section -->
    <div class="card settings-section">
      <h3>Maintenance Categories</h3>
      <p class="section-description">
        Manage the types of maintenance you can log for your gear
      </p>

      <div class="categories-list">
        <div
          v-for="(category, index) in maintenanceCategories"
          :key="index"
          class="category-item"
        >
          <span class="category-name">{{ category }}</span>
          <button
            @click="removeMaintenanceCategory(index)"
            class="btn btn-danger btn-sm"
            :disabled="maintenanceCategories.length <= 1"
            title="Remove maintenance category"
          >
            ×
          </button>
        </div>
      </div>

      <div class="add-category">
        <input
          v-model="newMaintenanceCategory"
          @keyup.enter="addMaintenanceCategory"
          type="text"
          placeholder="Enter new maintenance category"
          class="category-input"
          maxlength="50"
        />
        <button
          @click="addMaintenanceCategory"
          class="btn btn-primary"
          :disabled="
            !newMaintenanceCategory.trim() ||
            maintenanceCategories.includes(newMaintenanceCategory.trim())
          "
        >
          Add Category
        </button>
      </div>
    </div>

    <!-- Glider Maintenance Warnings Section -->
    <div class="card settings-section">
      <h3>Glider Maintenance Warnings</h3>
      <p class="section-description">
        Set reminders for regular glider checks and maintenance
      </p>

      <div class="warning-settings">
        <div class="setting-item">
          <label for="gliderWarningDuration" class="setting-label">
            Glider Warning Duration (months)
          </label>
          <p class="setting-description">
            Set the reminder time for your glider check
          </p>
          <input
            id="gliderWarningDuration"
            v-model.number="gliderWarningDuration"
            type="number"
            min="1"
            max="120"
            class="setting-input"
          />
        </div>

        <div class="setting-item">
          <label for="gliderWarningFlightTime" class="setting-label">
            Glider Warning Flight time (hours)
          </label>
          <p class="setting-description">
            Set the flight time for your glider check
          </p>
          <input
            id="gliderWarningFlightTime"
            v-model.number="gliderWarningFlightTime"
            type="number"
            min="1"
            max="1000"
            class="setting-input"
          />
        </div>

        <div class="setting-item">
          <label for="rescueWarningDuration" class="setting-label">
            Rescue Warning Duration (months)
          </label>
          <p class="setting-description">
            Set the reminder time for your rescue check
          </p>
          <input
            id="rescueWarningDuration"
            v-model.number="rescueWarningDuration"
            type="number"
            min="1"
            max="120"
            class="setting-input"
          />
        </div>
      </div>
    </div>

    <!-- Advanced Options Button -->
    <div class="advanced-options-toggle">
      <button
        @click="showAdvancedOptions = !showAdvancedOptions"
        class="btn btn-secondary"
      >
        {{
          showAdvancedOptions
            ? "Hide Advanced Options"
            : "Show Advanced Options"
        }}
      </button>
    </div>

    <!-- Advanced Options Sections -->
    <div v-if="showAdvancedOptions" class="advanced-sections">
      <!-- Database Export Section -->
      <div class="card settings-section">
        <h3>Export Data</h3>
        <p class="section-description">
          Export all your data (flights, gear, maintenance, and IGC files) as a complete backup
        </p>

        <div class="export-options">
          <button
            @click="exportAllData"
            class="btn btn-success btn-large"
            :disabled="isExporting"
          >
            <span v-if="isExporting">Exporting...</span>
            <span v-else>Export All Data</span>
          </button>
        </div>
      </div>

      <!-- Database Import Section -->
      <div class="card settings-section">
        <h3>Import Data</h3>
        <p class="section-description">
          Import your complete backup (flights, gear, maintenance, and IGC files)
        </p>

        <div class="import-options">
          <div class="import-warning">
            <strong>⚠️ Warning:</strong> Importing will replace all existing
            data and IGC files. Make sure to export your current data first if you want to
            keep it.
          </div>

          <div class="import-format">
            <input
              type="file"
              ref="backupFileInput"
              accept=".zip"
              @change="handleBackupFileSelect"
              class="file-input"
              style="display: none"
            />
            <div class="format-buttons">
              <button
                @click="$refs.backupFileInput.click()"
                class="btn btn-info"
                :disabled="isImporting"
              >
                <span v-if="isImporting">Importing...</span>
                <span v-else>{{
                  selectedBackupFile ? selectedBackupFile.name : "Select Backup File (.zip)"
                }}</span>
              </button>
              <button
                v-if="selectedBackupFile"
                @click="importBackup"
                class="btn btn-success"
                :disabled="isImporting"
              >
                Import Backup
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Database Wipe Section -->
      <div class="card settings-section danger-section">
        <h3>Danger Zone</h3>
        <p class="section-description">
          Permanently delete all data from the database
        </p>

        <div class="danger-content">
          <div class="danger-warning">
            <strong>⚠️ Critical Warning:</strong> This action will permanently
            delete ALL flights, gear, maintenance records, and IGC files. This cannot be
            undone. Make sure to export your data first!
          </div>

          <button
            @click="wipeDatabase"
            class="btn btn-danger-full"
            :disabled="isWiping"
          >
            <span v-if="isWiping">Wiping Database...</span>
            <span v-else>Wipe All Data</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="settings-actions">
      <button @click="saveSettings" class="btn btn-success">
        Save Settings
      </button>
      <button @click="resetToDefaults" class="btn btn-secondary">
        Reset to Defaults
      </button>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script>
import {
  flightOperations,
  getAllGear,
  getAllMaintenance,
} from "../database/database.js";

export default {
  name: "Settings",
  data() {
    return {
      flightCategories: ["On-site", "XC", "H&F"],
      flightTypes: ["Paragliding", "Speedflying"],
      maintenanceCategories: [
        "Purchase",
        "Repack",
        "Repair",
        "Check / Trim",
        "Sale",
      ],
      newCategory: "",
      newFlightType: "",
      newMaintenanceCategory: "",
      gliderWarningDuration: 24,
      gliderWarningFlightTime: 100,
      rescueWarningDuration: 12,
      message: "",
      messageType: "success",
      flightCount: 0,
      gearCount: 0,
      maintenanceCount: 0,
      isExporting: false,
      exportFormat: "",
      isImporting: false,
      selectedBackupFile: null,
      showAdvancedOptions: false,
      isWiping: false,
    };
  },
  mounted() {
    this.loadSettings();
    this.loadDataCounts();
  },
  methods: {
    loadSettings() {
      // Load settings from localStorage or use defaults
      const savedCategories = localStorage.getItem("flightCategories");
      const savedFlightTypes = localStorage.getItem("flightTypes");
      const savedMaintenanceCategories = localStorage.getItem(
        "maintenanceCategories"
      );
      const savedGliderWarningDuration = localStorage.getItem(
        "gliderWarningDuration"
      );
      const savedGliderWarningFlightTime = localStorage.getItem(
        "gliderWarningFlightTime"
      );
      const savedRescueWarningDuration = localStorage.getItem(
        "rescueWarningDuration"
      );

      if (savedCategories) {
        this.flightCategories = JSON.parse(savedCategories);
      }

      if (savedFlightTypes) {
        this.flightTypes = JSON.parse(savedFlightTypes);
      }

      if (savedMaintenanceCategories) {
        this.maintenanceCategories = JSON.parse(savedMaintenanceCategories);
      }

      if (savedGliderWarningDuration) {
        this.gliderWarningDuration = parseInt(savedGliderWarningDuration, 10);
      }

      if (savedGliderWarningFlightTime) {
        this.gliderWarningFlightTime = parseInt(
          savedGliderWarningFlightTime,
          10
        );
      }

      if (savedRescueWarningDuration) {
        this.rescueWarningDuration = parseInt(savedRescueWarningDuration, 10);
      }
    },

    addCategory() {
      const category = this.newCategory.trim();
      if (category && !this.flightCategories.includes(category)) {
        this.flightCategories.push(category);
        this.newCategory = "";
        this.showMessage("Category added successfully", "success");
      }
    },

    removeCategory(index) {
      if (this.flightCategories.length > 1) {
        this.flightCategories.splice(index, 1);
        this.showMessage("Category removed successfully", "success");
      }
    },

    addFlightType() {
      const flightType = this.newFlightType.trim();
      if (flightType && !this.flightTypes.includes(flightType)) {
        this.flightTypes.push(flightType);
        this.newFlightType = "";
        this.showMessage("Flight type added successfully", "success");
      }
    },

    removeFlightType(index) {
      if (this.flightTypes.length > 1) {
        this.flightTypes.splice(index, 1);
        this.showMessage("Flight type removed successfully", "success");
      }
    },

    addMaintenanceCategory() {
      const category = this.newMaintenanceCategory.trim();
      if (category && !this.maintenanceCategories.includes(category)) {
        this.maintenanceCategories.push(category);
        this.newMaintenanceCategory = "";
        this.showMessage("Maintenance category added successfully", "success");
      }
    },

    removeMaintenanceCategory(index) {
      if (this.maintenanceCategories.length > 1) {
        this.maintenanceCategories.splice(index, 1);
        this.showMessage(
          "Maintenance category removed successfully",
          "success"
        );
      }
    },

    saveSettings() {
      // Save to localStorage
      localStorage.setItem(
        "flightCategories",
        JSON.stringify(this.flightCategories)
      );
      localStorage.setItem("flightTypes", JSON.stringify(this.flightTypes));
      localStorage.setItem(
        "maintenanceCategories",
        JSON.stringify(this.maintenanceCategories)
      );
      localStorage.setItem(
        "gliderWarningDuration",
        this.gliderWarningDuration.toString()
      );
      localStorage.setItem(
        "gliderWarningFlightTime",
        this.gliderWarningFlightTime.toString()
      );
      localStorage.setItem(
        "rescueWarningDuration",
        this.rescueWarningDuration.toString()
      );

      this.showMessage("Settings saved successfully!", "success");
    },

    resetToDefaults() {
      this.flightCategories = ["On-site", "XC", "H&F"];
      this.flightTypes = ["Paragliding", "Speedflying"];
      this.gliderWarningDuration = 24;
      this.gliderWarningFlightTime = 100;
      this.rescueWarningDuration = 12;

      // Clear localStorage
      localStorage.removeItem("flightCategories");
      localStorage.removeItem("flightTypes");
      localStorage.removeItem("gliderWarningDuration");
      localStorage.removeItem("gliderWarningFlightTime");
      localStorage.removeItem("rescueWarningDuration");

      this.showMessage("Settings reset to defaults", "success");
    },

    showMessage(text, type = "success") {
      this.message = text;
      this.messageType = type;

      setTimeout(() => {
        this.message = "";
      }, 3000);
    },

    async loadDataCounts() {
      try {
        const flights = await flightOperations.getAllFlights();
        const gear = await getAllGear();
        const maintenance = await getAllMaintenance();
        this.flightCount = flights.length;
        this.gearCount = gear.length;
        this.maintenanceCount = maintenance.length;
      } catch (error) {
        console.error("Error loading data counts:", error);
        this.showMessage("Error loading data counts", "error");
      }
    },

    async exportAllData() {
      this.isExporting = true;

      try {
        const response = await fetch("http://localhost:3001/api/export/full");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get("content-disposition");
        let filename = "paradash_backup.zip";
        if (contentDisposition) {
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

        this.showMessage(
          `Successfully exported all data (${this.flightCount} flights, ${this.gearCount} gear, ${this.maintenanceCount} maintenance records, and all IGC files)`,
          "success"
        );
      } catch (error) {
        console.error("Export error:", error);
        this.showMessage("Error during export: " + error.message, "error");
      } finally {
        this.isExporting = false;
      }
    },

    handleBackupFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        // Validate file extension
        if (!file.name.toLowerCase().endsWith('.zip')) {
          this.showMessage("Invalid file format. Please select a ZIP backup file.", "error");
          event.target.value = "";
          return;
        }
        this.selectedBackupFile = file;
      }
    },

    async importBackup() {
      if (!this.selectedBackupFile) {
        this.showMessage("Please select a backup file to import", "error");
        return;
      }

      // Confirm with user
      if (
        !confirm(
          "⚠️ WARNING: This will replace ALL existing data including flights, gear, maintenance records, and IGC files.\n\nAre you sure you want to continue?"
        )
      ) {
        return;
      }

      this.isImporting = true;

      try {
        const formData = new FormData();
        formData.append("backup", this.selectedBackupFile);

        const response = await fetch(
          "http://localhost:3001/api/import/full",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to import backup");
        }

        const result = await response.json();
        this.showMessage(
          `Backup imported successfully! ${
            result.imported.flights || 0
          } flights, ${result.imported.gear || 0} gear items, ${
            result.imported.maintenance || 0
          } maintenance records, and ${result.imported.igcFiles || 0} IGC files.`,
          "success"
        );

        // Reset file selection
        this.selectedBackupFile = null;
        this.$refs.backupFileInput.value = "";

        // Reload data counts
        await this.loadDataCounts();
      } catch (error) {
        console.error("Import error:", error);
        this.showMessage("Error during import: " + error.message, "error");
      } finally {
        this.isImporting = false;
      }
    },

    async wipeDatabase() {
      // First confirmation
      const firstConfirm = confirm(
        "⚠️ WARNING: You are about to permanently delete ALL data from the database.\n\n" +
          "This includes:\n" +
          "- All flight records\n" +
          "- All gear items\n" +
          "- All maintenance records\n" +
          "- All IGC files\n\n" +
          "This action CANNOT be undone!\n\n" +
          "Are you sure you want to continue?"
      );

      if (!firstConfirm) {
        return;
      }

      // Second confirmation with typing requirement
      const confirmText = prompt(
        "To confirm deletion, please type 'DELETE ALL DATA' (case sensitive):"
      );

      if (confirmText !== "DELETE ALL DATA") {
        this.showMessage(
          "Database wipe cancelled - confirmation text did not match",
          "error"
        );
        return;
      }

      this.isWiping = true;

      try {
        const response = await fetch(
          "http://localhost:3001/api/database/wipe",
          {
            method: "POST",
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to wipe database");
        }

        const result = await response.json();
        this.showMessage(
          `Database wiped successfully. Deleted ${result.deleted.flights} flights, ${result.deleted.gear} gear items, ${result.deleted.maintenance} maintenance records, and ${result.deleted.igcFiles || 0} IGC files.`,
          "success"
        );

        // Reload data counts
        await this.loadDataCounts();
      } catch (error) {
        console.error("Wipe error:", error);
        this.showMessage("Error wiping database: " + error.message, "error");
      } finally {
        this.isWiping = false;
      }
    },
  },
};
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
}

.settings-container h1 {
  color: #549f74;
  margin-bottom: 30px;
  text-align: center;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section h3 {
  color: #495057;
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
}

.section-description {
  color: #6c757d;
  margin-bottom: 1.5rem;
  font-style: italic;
}

.categories-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f8f9fa;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  border: 1px solid #dee2e6;
}

.category-name {
  font-weight: 500;
  color: #495057;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
  border-color: #bd2130;
}

.btn-danger:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.add-category {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.category-input {
  flex: 1;
  max-width: 300px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.category-input:focus {
  outline: none;
  border-color: #549f74;
  box-shadow: 0 0 0 2px rgba(84, 159, 116, 0.25);
}

/* Button styles - matching Choose IGC File button */
.btn-primary,
.btn-success {
  display: inline-block;
  padding: 10px 20px;
  background: #549f74;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-primary:hover:not(:disabled),
.btn-success:hover:not(:disabled) {
  background: #448060;
}

.btn-primary:active:not(:disabled),
.btn-success:active:not(:disabled) {
  background: #3a7055;
}

.btn-primary:disabled,
.btn-success:disabled {
  background: #a8d4bb;
  cursor: not-allowed;
}

.btn-large {
  padding: 12px 24px;
  font-size: 1rem;
}

.btn-secondary {
  display: inline-block;
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.settings-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

/* Message styles - using global success-message and error-message classes */
.message {
  margin-top: 1rem;
  font-weight: 500;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  padding: 0.75rem 1rem;
  border-radius: 4px;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  padding: 0.75rem 1rem;
  border-radius: 4px;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.export-options h4 {
  color: #495057;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
}

.table-selection {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #495057;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #53b889;
}

.checkbox-label:first-child {
  font-weight: 600;
  color: #333;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 0.5rem;
}

.format-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-info {
  background-color: #17a2b8;
  border-color: #17a2b8;
  color: white;
  min-width: 140px;
}

.btn-info:hover:not(:disabled) {
  background-color: #138496;
  border-color: #117a8b;
}

.btn-info:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Advanced Options Toggle */
.advanced-options-toggle {
  text-align: center;
  margin: 2rem 0;
}

.advanced-options-toggle .btn {
  min-width: 200px;
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.advanced-options-toggle .btn:hover {
  background-color: #f1b0b7;
  border-color: #f1a8ae;
  color: #491217;
}

.advanced-sections {
  margin-top: 2rem;
}

/* Import Options Styles */
.import-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.import-options h4 {
  color: #495057;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
}

.import-warning {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 1rem;
  color: #856404;
  font-size: 0.95rem;
}

.import-format {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.import-format .format-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.file-input {
  display: none;
}

/* Danger Zone Styles */
.danger-section {
  border: 2px solid #dc3545;
  background-color: #fff5f5;
}

.danger-section h3 {
  color: #dc3545;
}

.danger-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.danger-warning {
  background-color: #f8d7da;
  border: 2px solid #dc3545;
  border-radius: 4px;
  padding: 1rem;
  color: #721c24;
  font-size: 0.95rem;
  font-weight: 500;
}

.btn-danger-full {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.btn-danger-full:hover:not(:disabled) {
  background-color: #c82333;
  border-color: #bd2130;
}

.btn-danger-full:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Warning Settings Styles */
.warning-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-label {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.setting-description {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
  font-style: italic;
}

.setting-input {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  font-size: 1rem;
  background-color: #fff;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  max-width: 200px;
}

.setting-input:focus {
  border-color: #53b889;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(83, 184, 137, 0.25);
}

@media (max-width: 768px) {
  .add-category {
    flex-direction: column;
    align-items: stretch;
  }

  .category-input {
    max-width: none;
  }

  .settings-actions {
    flex-direction: column;
  }

  .categories-list {
    gap: 0.5rem;
  }

  .category-item {
    font-size: 0.9rem;
    padding: 0.4rem 0.6rem;
  }

  .format-buttons {
    flex-direction: column;
  }

  .btn-info {
    min-width: auto;
  }
}
</style>
