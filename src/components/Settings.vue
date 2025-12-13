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
              accept=".zip,application/zip,application/x-zip-compressed"
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

          <!-- Import Progress Bar -->
          <div v-if="importProgress" class="import-progress">
            <div class="progress-bar-container">
              <div 
                class="progress-bar-fill" 
                :style="{ width: importProgress.percent + '%' }"
              ></div>
            </div>
            <div class="progress-details">
              <span class="progress-phase">{{ importProgress.details }}</span>
              <span class="progress-percent">{{ importProgress.percent }}%</span>
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
  wipeAllData,
} from "../database/database.js";
import { 
  importFromJson, 
  validateBackupData, 
  BACKUP_CONFIG 
} from "../database/capacitorDatabase.js";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

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
      importProgress: null, // { phase: string, percent: number, details?: string }
      importFailedFiles: [], // Track files that failed to import
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
        // Get all data from database
        const flights = await flightOperations.getAllFlights();
        const gear = await getAllGear();
        const maintenance = await getAllMaintenance();

        // Export database
        const dbExport = await flightOperations.exportDatabase();

        // Dynamically import JSZip only when needed
        const { default: JSZip } = await import('jszip');
        
        // Create ZIP file
        const zip = new JSZip();

        // Add database export
        if (dbExport.success && dbExport.data) {
          zip.file('database.json', JSON.stringify(dbExport.data, null, 2));
        }

        // Add settings
        const settings = {
          version: "1.0",
          exportDate: new Date().toISOString(),
          flightCategories: JSON.parse(localStorage.getItem("flightCategories") || JSON.stringify(this.flightCategories)),
          flightTypes: JSON.parse(localStorage.getItem("flightTypes") || JSON.stringify(this.flightTypes)),
          maintenanceCategories: JSON.parse(localStorage.getItem("maintenanceCategories") || JSON.stringify(this.maintenanceCategories)),
          gliderWarningDuration: localStorage.getItem("gliderWarningDuration") || this.gliderWarningDuration,
          gliderWarningFlightTime: localStorage.getItem("gliderWarningFlightTime") || this.gliderWarningFlightTime,
          rescueWarningDuration: localStorage.getItem("rescueWarningDuration") || this.rescueWarningDuration,
        };
        zip.file('settings.json', JSON.stringify(settings, null, 2));

        // Add all IGC files
        let igcCount = 0;
        const igcFolder = zip.folder('igc');
        for (const flight of flights) {
          if (flight.igcFilePath) {
            try {
              const fileContent = await Filesystem.readFile({
                path: `igc/${flight.igcFilePath}`,
                directory: Directory.Documents,
                encoding: Encoding.UTF8,
              });
              igcFolder.file(flight.igcFilePath, fileContent.data);
              igcCount++;
            } catch (error) {
              console.warn(`Could not read IGC file ${flight.igcFilePath}:`, error);
            }
          }
        }

        // Add all attachment files
        let attachmentCount = 0;
        const attachmentsFolder = zip.folder('attachments');
        for (const record of maintenance) {
          if (record.attachment_path && record.attachment_filename) {
            try {
              const fileContent = await Filesystem.readFile({
                path: record.attachment_path,
                directory: Directory.Documents,
              });
              // Use the original filename
              attachmentsFolder.file(record.attachment_filename, fileContent.data, { base64: true });
              attachmentCount++;
            } catch (error) {
              console.warn(`Could not read attachment ${record.attachment_path}:`, error);
            }
          }
        }

        // Generate ZIP file as base64
        const zipBlob = await zip.generateAsync({ type: 'base64' });

        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const filename = `paradash-backup-${timestamp}.zip`;

        // Write ZIP to cache directory
        await Filesystem.writeFile({
          path: filename,
          data: zipBlob,
          directory: Directory.Cache,
        });
        
        // Get the file URI for sharing
        const fileUri = await Filesystem.getUri({
          path: filename,
          directory: Directory.Cache,
        });
        
        // Share the file - user can choose where to save it
        await Share.share({
          title: 'Save ParaDash Backup',
          text: `Complete backup: database, ${igcCount} IGC files, ${attachmentCount} attachments`,
          url: fileUri.uri,
          dialogTitle: 'Save Backup File',
        });
        
        this.showMessage(
          `Backup created: ${flights.length} flights, ${igcCount} IGC files, ${attachmentCount} attachments`,
          "success"
        );
      } catch (error) {
        console.error("Error exporting data:", error);
        this.showMessage(`Export failed: ${error.message}`, "error");
      } finally {
        this.isExporting = false;
      }
    },

    handleBackupFileSelect(event) {
      const file = event.target.files[0];
      
      if (file) {
        // Validate file - check both extension and MIME type
        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();
        const isZipExtension = fileName.endsWith('.zip');
        const isZipMimeType = fileType === 'application/zip' || 
                               fileType === 'application/x-zip-compressed' ||
                               fileType === 'application/x-zip';
        
        // Accept if either extension or MIME type indicates ZIP, or if no type info (mobile issue)
        if (!isZipExtension && !isZipMimeType && fileType !== '') {
          const msg = `Invalid file format.\nFile: ${file.name}\nType: ${file.type}\nPlease select a ZIP backup file.`;
          this.showMessage(msg, "error");
          alert(msg);
          event.target.value = "";
          return;
        }
        
        this.selectedBackupFile = file;
        this.showMessage(`Selected: ${file.name}`, "success");
      }
    },

    async importBackup() {
      if (!this.selectedBackupFile) {
        const msg = "Please select a backup file first";
        this.showMessage(msg, "error");
        alert(msg);
        return;
      }

      // Confirmation dialog
      const confirmed = window.confirm(
        "⚠️ WARNING: This will replace ALL existing data with the backup.\n\n" +
        "Current data will be permanently deleted. Make sure you have exported your current data first if needed.\n\n" +
        "Continue with import?"
      );

      if (!confirmed) {
        return;
      }

      this.isImporting = true;
      this.importProgress = { phase: 'reading', percent: 0, details: 'Reading backup file...' };
      this.importFailedFiles = [];

      try {
        // Step 1: Read ZIP file
        const { default: JSZip } = await import('jszip');
        this.updateImportProgress('reading', 5, 'Loading ZIP file...');

        const zipData = await this.readFileAsArrayBuffer(this.selectedBackupFile);
        const zip = await JSZip.loadAsync(zipData);
        
        // Step 2: Validate backup structure BEFORE any destructive operations
        this.updateImportProgress('validating', 10, 'Validating backup...');
        await this.validateBackupZip(zip);
        
        // Step 3: Get database content and validate
        this.updateImportProgress('validating', 15, 'Validating database...');
        const dbFile = zip.file(BACKUP_CONFIG.FILES.DATABASE);
        const dbContent = await dbFile.async('string');
        
        const validation = validateBackupData(dbContent);
        if (!validation.valid) {
          throw new Error(`Invalid database backup: ${validation.errors.join('; ')}`);
        }
        
        console.log('Backup validation passed:', validation.stats);

        // Step 4: Import database (handles DROP + CREATE internally)
        this.updateImportProgress('database', 20, 'Importing database...');
        
        const dbResult = await importFromJson(dbContent, (progress) => {
          const percent = 20 + (progress.percent * 0.4); // 20-60%
          this.updateImportProgress('database', percent, `Importing ${progress.table || 'data'}...`);
        });
        
        console.log('Database import result:', dbResult);

        // Step 5: Import settings with validation
        this.updateImportProgress('settings', 65, 'Importing settings...');
        await this.importSettingsFromZip(zip);

        // Step 6: Import IGC files with tracking
        this.updateImportProgress('files', 70, 'Importing IGC files...');
        const igcResult = await this.importIGCFilesFromZip(zip);
        
        // Step 7: Import attachments with tracking
        this.updateImportProgress('files', 85, 'Importing attachments...');
        const attachmentResult = await this.importAttachmentsFromZip(zip);

        // Step 8: Verify and report
        this.updateImportProgress('verifying', 95, 'Verifying import...');
        
        const testFlights = await flightOperations.getAllFlights();
        const testGear = await getAllGear();
        
        await this.loadDataCounts();

        // Clear selected file
        this.selectedBackupFile = null;
        if (this.$refs.backupFileInput) {
          this.$refs.backupFileInput.value = '';
        }

        this.updateImportProgress('complete', 100, 'Import complete!');

        // Build result message
        const successMsg = this.buildImportResultMessage(
          testFlights.length,
          testGear.length,
          igcResult.imported,
          attachmentResult.imported,
          this.importFailedFiles
        );
        
        this.showMessage(successMsg, "success");
        
        // Show detailed alert if there were failures
        if (this.importFailedFiles.length > 0) {
          alert(
            successMsg + 
            '\n\n⚠️ Some files failed to import:\n' + 
            this.importFailedFiles.slice(0, 10).map(f => `• ${f}`).join('\n') +
            (this.importFailedFiles.length > 10 ? `\n... and ${this.importFailedFiles.length - 10} more` : '') +
            '\n\nThe app will now reload.'
          );
        } else {
          alert(successMsg + '\n\nThe app will now reload to show the imported data.');
        }
        
        window.location.reload();

      } catch (error) {
        console.error("Error importing backup:", error);
        const errorMsg = this.getHumanReadableError(error);
        this.showMessage(errorMsg, "error");
        alert(errorMsg);
      } finally {
        this.isImporting = false;
        this.importProgress = null;
      }
    },

    // Helper: Read file as ArrayBuffer
    readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read backup file'));
        reader.readAsArrayBuffer(file);
      });
    },

    // Helper: Update import progress
    updateImportProgress(phase, percent, details) {
      this.importProgress = { phase, percent: Math.round(percent), details };
      this.showMessage(details, 'success');
    },

    // Validate ZIP structure before import
    async validateBackupZip(zip) {
      const errors = [];
      
      // Check required database file
      if (!zip.file(BACKUP_CONFIG.FILES.DATABASE)) {
        errors.push(`Missing required file: ${BACKUP_CONFIG.FILES.DATABASE}`);
      }
      
      if (errors.length > 0) {
        throw new Error(`Invalid backup file: ${errors.join('; ')}`);
      }
    },

    // Import settings with type validation and sanitization
    async importSettingsFromZip(zip) {
      const settingsFile = zip.file(BACKUP_CONFIG.FILES.SETTINGS);
      if (!settingsFile) {
        console.log('No settings file in backup, skipping settings import');
        return;
      }

      try {
        const content = await settingsFile.async('string');
        const settings = JSON.parse(content);

        // Validate and import flightCategories
        if (this.isValidStringArray(settings.flightCategories)) {
          const sanitized = this.sanitizeStringArray(settings.flightCategories, 50);
          if (sanitized.length > 0) {
            localStorage.setItem('flightCategories', JSON.stringify(sanitized));
            this.flightCategories = sanitized;
          }
        }

        // Validate and import flightTypes
        if (this.isValidStringArray(settings.flightTypes)) {
          const sanitized = this.sanitizeStringArray(settings.flightTypes, 50);
          if (sanitized.length > 0) {
            localStorage.setItem('flightTypes', JSON.stringify(sanitized));
            this.flightTypes = sanitized;
          }
        }

        // Validate and import maintenanceCategories
        if (this.isValidStringArray(settings.maintenanceCategories)) {
          const sanitized = this.sanitizeStringArray(settings.maintenanceCategories, 50);
          if (sanitized.length > 0) {
            localStorage.setItem('maintenanceCategories', JSON.stringify(sanitized));
            this.maintenanceCategories = sanitized;
          }
        }

        // Validate and import numeric settings
        if (this.isValidPositiveNumber(settings.gliderWarningDuration, 1, 120)) {
          localStorage.setItem('gliderWarningDuration', settings.gliderWarningDuration.toString());
          this.gliderWarningDuration = settings.gliderWarningDuration;
        }

        if (this.isValidPositiveNumber(settings.gliderWarningFlightTime, 1, 1000)) {
          localStorage.setItem('gliderWarningFlightTime', settings.gliderWarningFlightTime.toString());
          this.gliderWarningFlightTime = settings.gliderWarningFlightTime;
        }

        if (this.isValidPositiveNumber(settings.rescueWarningDuration, 1, 120)) {
          localStorage.setItem('rescueWarningDuration', settings.rescueWarningDuration.toString());
          this.rescueWarningDuration = settings.rescueWarningDuration;
        }

        console.log('Settings imported successfully');
      } catch (error) {
        console.warn('Failed to import settings, using defaults:', error);
        // Non-fatal error - continue with import
      }
    },

    // Validation helpers
    isValidStringArray(arr) {
      return Array.isArray(arr) && arr.every(item => typeof item === 'string');
    },

    sanitizeStringArray(arr, maxLength) {
      return arr
        .filter(item => typeof item === 'string' && item.trim().length > 0)
        .map(item => item.trim().substring(0, maxLength));
    },

    isValidPositiveNumber(value, min, max) {
      return typeof value === 'number' && 
             !isNaN(value) && 
             value >= min && 
             value <= max;
    },

    // Import IGC files with tracking
    async importIGCFilesFromZip(zip) {
      let imported = 0;
      const igcFolder = BACKUP_CONFIG.FOLDERS.IGC;

      for (const filename in zip.files) {
        if (filename.startsWith(igcFolder) && !zip.files[filename].dir) {
          const igcFilename = filename.replace(igcFolder, '');
          if (!igcFilename) continue;

          try {
            const igcFile = zip.file(filename);
            const igcContent = await igcFile.async('string');
            
            await Filesystem.writeFile({
              path: `igc/${igcFilename}`,
              data: igcContent,
              directory: Directory.Documents,
              encoding: Encoding.UTF8,
              recursive: true,
            });
            imported++;
          } catch (error) {
            console.warn(`Failed to import IGC file ${igcFilename}:`, error);
            this.importFailedFiles.push(`IGC: ${igcFilename}`);
          }
        }
      }

      console.log(`Imported ${imported} IGC files`);
      return { imported, failed: this.importFailedFiles.filter(f => f.startsWith('IGC:')).length };
    },

    // Import attachments with tracking
    async importAttachmentsFromZip(zip) {
      let imported = 0;
      const attachmentsFolder = BACKUP_CONFIG.FOLDERS.ATTACHMENTS;

      for (const filename in zip.files) {
        if (filename.startsWith(attachmentsFolder) && !zip.files[filename].dir) {
          const attachmentFilename = filename.replace(attachmentsFolder, '');
          if (!attachmentFilename) continue;

          try {
            const attachmentFile = zip.file(filename);
            const attachmentContent = await attachmentFile.async('base64');
            
            // Write to attachments folder (matching database attachment_path structure)
            await Filesystem.writeFile({
              path: `attachments/${attachmentFilename}`,
              data: attachmentContent,
              directory: Directory.Documents,
              recursive: true,
            });
            imported++;
          } catch (error) {
            console.warn(`Failed to import attachment ${attachmentFilename}:`, error);
            this.importFailedFiles.push(`Attachment: ${attachmentFilename}`);
          }
        }
      }

      console.log(`Imported ${imported} attachments`);
      return { imported, failed: this.importFailedFiles.filter(f => f.startsWith('Attachment:')).length };
    },

    // Build human-readable import result message
    buildImportResultMessage(flights, gear, igcFiles, attachments, failedFiles) {
      let msg = `Import successful! Restored ${flights} flights, ${gear} gear items`;
      
      if (igcFiles > 0 || attachments > 0) {
        msg += `, ${igcFiles} IGC files, ${attachments} attachments`;
      }
      
      if (failedFiles.length > 0) {
        msg += `. Warning: ${failedFiles.length} file(s) failed to import.`;
      }
      
      return msg;
    },

    // Convert error to user-friendly message
    getHumanReadableError(error) {
      const message = error.message || 'Unknown error';
      
      if (message.includes('database.json')) {
        return 'Import failed: The backup file is missing the database. Please select a valid ParaDash backup.';
      }
      if (message.includes('Invalid backup')) {
        return `Import failed: ${message}`;
      }
      if (message.includes('parse') || message.includes('JSON')) {
        return 'Import failed: The backup file appears to be corrupted.';
      }
      
      return `Import failed: ${message}`;
    },

    async wipeDatabase() {
      // First confirmation
      const firstConfirm = window.confirm(
        "⚠️ WARNING: This will permanently delete ALL your data including flights, gear, maintenance records, and files. This cannot be undone!\n\nAre you sure you want to continue?"
      );

      if (!firstConfirm) {
        return;
      }

      // Second confirmation
      const secondConfirm = window.confirm(
        "⚠️ FINAL WARNING: This is your last chance to cancel.\n\nConfirm to permanently delete everything."
      );

      if (!secondConfirm) {
        return;
      }

      this.isWiping = true;
      try {
        // Get all data to know what files to delete
        const flights = await flightOperations.getAllFlights();
        const maintenance = await getAllMaintenance();

        // Delete all IGC files
        let deletedIGCFiles = 0;
        for (const flight of flights) {
          if (flight.igcFilePath) {
            try {
              await Filesystem.deleteFile({
                path: `igc/${flight.igcFilePath}`,
                directory: Directory.Documents,
              });
              deletedIGCFiles++;
            } catch (error) {
              console.warn(`Could not delete IGC file ${flight.igcFilePath}:`, error);
            }
          }
        }

        // Delete all attachment files
        let deletedAttachments = 0;
        for (const record of maintenance) {
          if (record.attachment_path) {
            try {
              await Filesystem.deleteFile({
                path: record.attachment_path,
                directory: Directory.Documents,
              });
              deletedAttachments++;
            } catch (error) {
              console.warn(`Could not delete attachment ${record.attachment_path}:`, error);
            }
          }
        }

        // Delete all database records
        await wipeAllData();

        // Clear localStorage data
        localStorage.clear();

        // Reset settings to defaults
        this.flightCategories = ["On-site", "XC", "H&F"];
        this.flightTypes = ["Paragliding", "Speedflying"];
        this.maintenanceCategories = [
          "Purchase",
          "Repack",
          "Repair",
          "Check / Trim",
          "Sale",
        ];
        this.gliderWarningDuration = 24;
        this.gliderWarningFlightTime = 100;
        this.rescueWarningDuration = 12;

        // Update counts
        await this.loadDataCounts();

        this.showMessage(
          `Database wiped successfully! Deleted ${flights.length} flights, ${deletedIGCFiles} IGC files, and ${deletedAttachments} attachments.`,
          "success"
        );
      } catch (error) {
        console.error("Error wiping database:", error);
        this.showMessage(`Failed to wipe database: ${error.message}`, "error");
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

/* Import Progress Bar */
.import-progress {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.progress-bar-container {
  width: 100%;
  height: 12px;
  background-color: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #549f74, #6bc493);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.progress-phase {
  color: #495057;
  font-weight: 500;
}

.progress-percent {
  color: #549f74;
  font-weight: 600;
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
