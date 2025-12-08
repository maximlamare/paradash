<template>
  <div class="gear-detail">
    <div v-if="loading" class="loading">Loading gear details...</div>

    <div v-else-if="error" class="error">
      <h2>Error</h2>
      <p>{{ error }}</p>
      <button @click="$router.push('/gear')" class="back-btn">←</button>
    </div>

    <div v-else-if="gear" class="gear-content">
      <!-- Header with back button -->
      <div class="header-section">
        <button @click="$router.push('/gear')" class="back-btn">← Back</button>
      </div>

      <!-- Rescue Warning -->
      <div
        v-if="gear.type === 'rescues' && getRescueWarning()"
        class="warning-banner-detail"
      >
        <span class="warning-icon">⚠️</span>
        <span class="warning-text">
          Repack due since {{ formatWarningDate(getRescueWarning().dueDate) }}
        </span>
      </div>

      <!-- Glider Warning -->
      <div
        v-if="gear.type === 'gliders' && getGliderWarning()"
        class="warning-banner-detail"
      >
        <span class="warning-icon">⚠️</span>
        <span
          class="warning-text"
          v-if="getGliderWarning().type === 'flightTime'"
        >
          Check due: {{ getGliderWarning().totalHours }} flight hours since last
          check
        </span>
        <span
          class="warning-text"
          v-else-if="getGliderWarning().type === 'date'"
        >
          Check due since {{ formatWarningDate(getGliderWarning().dueDate) }}
        </span>
      </div>

      <!-- Gear Information -->
      <div class="gear-info-section">
        <div class="info-card">
          <div class="info-grid">
            <div class="info-item">
              <label>Status:</label>
              <div
                class="status-badge"
                :class="{ active: gear.is_active, retired: !gear.is_active }"
              >
                {{ gear.is_active ? "Active" : "Retired" }}
              </div>
            </div>
            <div class="info-item">
              <label>Type:</label>
              <span>{{ formatType(gear.type) }}</span>
            </div>
            <div class="info-item">
              <label>Manufacturer:</label>
              <span>{{ gear.manufacturer }}</span>
            </div>
            <div class="info-item">
              <label>Model:</label>
              <span>{{ gear.model }}</span>
            </div>
            <div class="info-item">
              <label>Manufacturing Date:</label>
              <span>{{ formatDate(gear.manufacturing_date) }}</span>
            </div>
            <div class="info-item">
              <label>Purchase Date:</label>
              <span>{{ formatDate(gear.purchase_date) }}</span>
            </div>
            <div class="info-item" v-if="gear.serial_number">
              <label>Serial Number:</label>
              <span>{{ gear.serial_number }}</span>
            </div>
            <div class="info-item" v-if="gear.notes">
              <label>Notes:</label>
              <span>{{ gear.notes }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- Maintenance Section -->
      <div class="maintenance-section">
        <div class="maintenance-header">
          <h2>Maintenance History</h2>
          <button
            @click="showAddMaintenanceModal = true"
            class="action-btn add-btn"
          >
            Add Maintenance Record
          </button>
        </div>

        <div v-if="loadingMaintenance" class="loading-maintenance">
          Loading maintenance records...
        </div>

        <div v-else-if="maintenanceRecords.length === 0" class="no-maintenance">
          No maintenance records found. Add your first maintenance record to
          keep track of gear servicing.
        </div>

        <div v-else class="maintenance-list">
          <div 
            v-for="record in maintenanceRecords" 
            :key="record.id"
            class="maintenance-item"
            @click="openMaintenanceDetail(record)"
          >
            <div class="maintenance-item-header">
              <span class="maintenance-date">{{ formatDate(record.date) }}</span>
              <span class="maintenance-category">{{ record.category }}</span>
            </div>
            <div class="maintenance-item-desc">
              {{ record.description || "No description" }}
            </div>
            <div v-if="record.attachment_path" class="maintenance-item-attachment">
              📄 PDF attached
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons (at bottom) -->
      <div class="actions-section-bottom">
        <button
          @click="toggleRetired"
          class="action-btn toggle-btn"
          :class="{ retire: gear.is_active, unretire: !gear.is_active }"
        >
          {{ gear.is_active ? "Retire Gear" : "Unretire Gear" }}
        </button>

        <button @click="showEditModal = true" class="action-btn edit-btn">
          Edit Gear
        </button>

        <button @click="showDeleteModal = true" class="action-btn delete-btn">
          Delete Gear
        </button>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit Gear</h2>
          <button @click="closeEditModal" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="updateGear" class="gear-form">
          <div class="form-group">
            <label for="editType">Gear Type</label>
            <select id="editType" v-model="editForm.type" required>
              <option value="gliders">Glider</option>
              <option value="harnesses">Harness</option>
              <option value="rescues">Rescue</option>
            </select>
          </div>

          <div class="form-group">
            <label for="editManufacturer">Manufacturer</label>
            <input
              type="text"
              id="editManufacturer"
              v-model="editForm.manufacturer"
              required
              placeholder="e.g., Ozone, Advance"
            />
          </div>

          <div class="form-group">
            <label for="editModel">Model</label>
            <input
              type="text"
              id="editModel"
              v-model="editForm.model"
              required
              placeholder="e.g., Rush 6, Epsilon 9"
            />
          </div>

          <div class="form-group">
            <label for="editManufacturingDate">Manufacturing Date</label>
            <input
              type="date"
              id="editManufacturingDate"
              v-model="editForm.manufacturing_date"
            />
          </div>

          <div class="form-group">
            <label for="editPurchaseDate">Purchase Date</label>
            <input
              type="date"
              id="editPurchaseDate"
              v-model="editForm.purchase_date"
            />
          </div>

          <div class="form-group">
            <label for="editSerialNumber">Serial Number (Optional)</label>
            <input
              type="text"
              id="editSerialNumber"
              v-model="editForm.serial_number"
              placeholder="e.g., SN12345"
            />
          </div>

          <div class="form-group">
            <label for="editNotes">Notes (Optional)</label>
            <textarea
              id="editNotes"
              v-model="editForm.notes"
              placeholder="Any additional notes about this gear..."
              rows="3"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeEditModal" class="cancel-btn">
              Cancel
            </button>
            <button type="submit" class="submit-btn">Update Gear</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content confirmation-modal" @click.stop>
        <div class="modal-header">
          <h2>Confirm Delete</h2>
          <button @click="closeDeleteModal" class="close-btn">&times;</button>
        </div>
        <div class="confirmation-content">
          <p>Are you sure you want to delete this gear?</p>
          <div class="gear-preview">
            <strong>{{ gear.manufacturer }} {{ gear.model }}</strong>
            <span class="type">{{ formatType(gear.type) }}</span>
          </div>
          <p class="warning">This action cannot be undone.</p>
        </div>
        <div class="form-actions">
          <button type="button" @click="closeDeleteModal" class="cancel-btn">
            Cancel
          </button>
          <button @click="deleteGear" class="delete-btn">Delete</button>
        </div>
      </div>
    </div>

    <!-- Add Maintenance Modal -->
    <div
      v-if="showAddMaintenanceModal"
      class="modal-overlay"
      @click="closeAddMaintenanceModal"
    >
      <div class="modal-content maintenance-modal" @click.stop>
        <div class="modal-header">
          <h2>Add Maintenance Record</h2>
          <button @click="closeAddMaintenanceModal" class="close-btn">
            &times;
          </button>
        </div>
        <form @submit.prevent="addMaintenanceRecord" class="maintenance-form">
          <div class="form-group">
            <label for="maintenanceDate">Date</label>
            <input
              type="date"
              id="maintenanceDate"
              v-model="maintenanceForm.date"
              required
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="maintenanceCategory">Category</label>
            <select
              id="maintenanceCategory"
              v-model="maintenanceForm.category"
              required
              class="form-control"
            >
              <option value="">Select category</option>
              <option
                v-for="category in maintenanceCategories"
                :key="category"
                :value="category"
              >
                {{ category }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="maintenanceDescription">Description</label>
            <textarea
              id="maintenanceDescription"
              v-model="maintenanceForm.description"
              placeholder="Describe the maintenance work performed..."
              rows="3"
              class="form-control"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Attachment (PDF)</label>
            <div class="file-upload-area">
              <input
                type="file"
                accept=".pdf"
                @change="handlePdfSelect"
                ref="pdfFileInput"
                class="file-input"
              />
              <div v-if="selectedPdf" class="selected-file">
                <span>📄 {{ selectedPdf.name }}</span>
                <button
                  type="button"
                  @click="clearSelectedPdf"
                  class="clear-file-btn"
                >
                  ×
                </button>
              </div>
              <p class="file-hint">Upload a PDF document (optional)</p>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="button"
              @click="closeAddMaintenanceModal"
              class="cancel-btn"
            >
              Cancel
            </button>
            <button type="submit" class="submit-btn" :disabled="uploading">
              {{ uploading ? "Adding..." : "Add Record" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Maintenance Detail Modal -->
    <div
      v-if="showMaintenanceDetail"
      class="modal-overlay"
      @click="closeMaintenanceDetail"
    >
      <div class="modal-content maintenance-detail-modal" @click.stop>
        <div class="modal-header">
          <h2>Maintenance Record</h2>
          <button @click="closeMaintenanceDetail" class="close-btn">
            &times;
          </button>
        </div>
        <div class="maintenance-detail-content" v-if="selectedMaintenance">
          <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">{{ formatDate(selectedMaintenance.date) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Category</span>
            <span class="detail-value category-badge">{{ selectedMaintenance.category }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Description</span>
            <span class="detail-value description">{{ selectedMaintenance.description || "No description" }}</span>
          </div>
          
          <!-- PDF Section -->
          <div v-if="selectedMaintenance.attachment_path" class="pdf-section">
            <h3>Attached Document</h3>
            <div class="pdf-info">
              <span class="pdf-filename">📄 {{ selectedMaintenance.attachment_filename }}</span>
              <button @click="viewPdf(selectedMaintenance.attachment_path)" class="view-pdf-btn">
                Open PDF
              </button>
            </div>
            <!-- PDF Preview (web only) -->
            <div v-if="!isNativePlatform && pdfPreviewUrl" class="pdf-preview">
              <iframe :src="pdfPreviewUrl" width="100%" height="400px"></iframe>
            </div>
          </div>
          <div v-else class="no-pdf">
            <p>No document attached</p>
            <button @click="addDocumentToSelectedRecord" class="add-pdf-btn">
              Add Document
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="detail-actions">
            <button @click="editSelectedMaintenance" class="action-btn edit-btn">
              Edit Record
            </button>
            <button @click="deleteSelectedMaintenance" class="action-btn delete-btn">
              Delete Record
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Maintenance Modal -->
    <div
      v-if="showEditMaintenanceModal"
      class="modal-overlay"
      @click="closeEditMaintenanceModal"
    >
      <div class="modal-content maintenance-modal" @click.stop>
        <div class="modal-header">
          <h2>Edit Maintenance Record</h2>
          <button @click="closeEditMaintenanceModal" class="close-btn">
            &times;
          </button>
        </div>
        <form @submit.prevent="saveMaintenanceEdit" class="maintenance-form">
          <div class="form-group">
            <label for="editMaintenanceDate">Date</label>
            <input
              type="date"
              id="editMaintenanceDate"
              v-model="editMaintenanceForm.date"
              required
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="editMaintenanceCategory">Category</label>
            <select
              id="editMaintenanceCategory"
              v-model="editMaintenanceForm.category"
              required
              class="form-control"
            >
              <option value="">Select category</option>
              <option
                v-for="category in maintenanceCategories"
                :key="category"
                :value="category"
              >
                {{ category }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="editMaintenanceDescription">Description</label>
            <textarea
              id="editMaintenanceDescription"
              v-model="editMaintenanceForm.description"
              placeholder="Describe the maintenance work performed..."
              rows="3"
              class="form-control"
            ></textarea>
          </div>

          <div class="form-actions">
            <button
              type="button"
              @click="closeEditMaintenanceModal"
              class="cancel-btn"
            >
              Cancel
            </button>
            <button type="submit" class="submit-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { gearOperations, maintenanceOperations, flightOperations } from "../database/database.js";
import { formatDate } from "../utils/dateUtils.js";

export default {
  name: "GearDetail",
  setup() {
    const route = useRoute();
    const router = useRouter();

    const gear = ref(null);
    const loading = ref(true);
    const error = ref("");
    const successMessage = ref("");
    const errorMessage = ref("");

    const showEditModal = ref(false);
    const showDeleteModal = ref(false);

    // Maintenance related
    const showAddMaintenanceModal = ref(false);
    const maintenanceRecords = ref([]);
    const loadingMaintenance = ref(false);
    const uploading = ref(false);
    const selectedPdf = ref(null);
    const pdfFileInput = ref(null);

    const maintenanceForm = ref({
      date: new Date().toISOString().split("T")[0], // Today's date
      category: "",
      description: "",
    });

    const maintenanceCategories = ref([]);
    const flights = ref([]);

    // Maintenance detail state
    const showMaintenanceDetail = ref(false);
    const selectedMaintenance = ref(null);
    const pdfPreviewUrl = ref(null);
    const showEditMaintenanceModal = ref(false);
    const editMaintenanceForm = ref({
      date: "",
      category: "",
      description: "",
    });
    const isNativePlatform = true; // Mobile-only app

    // Load maintenance categories from settings
    const loadMaintenanceCategories = () => {
      const saved = localStorage.getItem("maintenanceCategories");
      if (saved) {
        maintenanceCategories.value = JSON.parse(saved);
      } else {
        // Default categories if none saved
        maintenanceCategories.value = [
          "Purchase",
          "Repack",
          "Repair",
          "Check / Trim",
          "Sale",
        ];
      }
    };

    const editForm = ref({
      type: "",
      manufacturer: "",
      model: "",
      manufacturing_date: "",
      purchase_date: "",
      serial_number: "",
      notes: "",
    });

    // Load gear details
    const loadGear = async () => {
      try {
        loading.value = true;
        const gearId = route.params.id;
        gear.value = await gearOperations.getById(gearId);

        // Initialize edit form with current values
        editForm.value = {
          type: gear.value.type,
          manufacturer: gear.value.manufacturer,
          model: gear.value.model,
          manufacturing_date: gear.value.manufacturing_date || "",
          purchase_date: gear.value.purchase_date || "",
          serial_number: gear.value.serial_number || "",
          notes: gear.value.notes || "",
        };
      } catch (err) {
        error.value = "Failed to load gear details";
        console.error("Error loading gear:", err);
      } finally {
        loading.value = false;
      }
    };

    // Toggle retired status
    const toggleRetired = async () => {
      try {
        const newStatus = !gear.value.is_active;
        await gearOperations.toggleActive(gear.value.id, newStatus);
        gear.value.is_active = newStatus;
        successMessage.value = `Gear ${
          newStatus ? "unretired" : "retired"
        } successfully`;
        setTimeout(() => (successMessage.value = ""), 3000);
      } catch (err) {
        errorMessage.value = "Failed to update gear status";
        console.error("Error toggling gear status:", err);
        setTimeout(() => (errorMessage.value = ""), 3000);
      }
    };

    // Update gear
    const updateGear = async () => {
      try {
        await gearOperations.update(gear.value.id, editForm.value);

        // Update local gear object
        Object.assign(gear.value, editForm.value);

        showEditModal.value = false;
        successMessage.value = "Gear updated successfully";
        setTimeout(() => (successMessage.value = ""), 3000);
      } catch (err) {
        errorMessage.value = "Failed to update gear";
        console.error("Error updating gear:", err);
        setTimeout(() => (errorMessage.value = ""), 3000);
      }
    };

    // Delete gear
    const deleteGear = async () => {
      try {
        await gearOperations.delete(gear.value.id);
        router.push("/gear");
      } catch (err) {
        errorMessage.value = "Failed to delete gear";
        console.error("Error deleting gear:", err);
        setTimeout(() => (errorMessage.value = ""), 3000);
      }
    };

    // Modal controls
    const closeEditModal = () => {
      showEditModal.value = false;
      // Reset form to current gear values
      editForm.value = {
        type: gear.value.type,
        manufacturer: gear.value.manufacturer,
        model: gear.value.model,
        manufacturing_date: gear.value.manufacturing_date || "",
        purchase_date: gear.value.purchase_date || "",
        serial_number: gear.value.serial_number || "",
        notes: gear.value.notes || "",
      };
    };

    const closeDeleteModal = () => {
      showDeleteModal.value = false;
    };

    // Maintenance functions
    const loadMaintenanceRecords = async () => {
      if (!gear.value) return;

      loadingMaintenance.value = true;
      try {
        // Use native database operations
        maintenanceRecords.value = await maintenanceOperations.getByGearId(gear.value.id);
      } catch (error) {
        console.error("Error loading maintenance records:", error);
        errorMessage.value = "Failed to load maintenance records";
        setTimeout(() => (errorMessage.value = ""), 3000);
      } finally {
        loadingMaintenance.value = false;
      }
    };

    const loadFlights = async () => {
      if (!gear.value || gear.value.type !== "gliders") return;

      try {
        // Get all flights and filter by glider
        const allFlights = await flightOperations.getAllFlights();
        flights.value = allFlights.filter(f => f.glider === gear.value.id);
      } catch (error) {
        console.error("Error loading flights:", error);
        flights.value = [];
      }
    };

    const readFileAsBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Remove the data URL prefix to get just the base64 string
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    const addMaintenanceRecord = async () => {
      uploading.value = true;
      try {
        let attachmentPath = null;
        let attachmentFilename = null;

        // Handle PDF upload - store locally
        if (selectedPdf.value) {
          const base64Data = await readFileAsBase64(selectedPdf.value);
          const fileName = `${Date.now()}_${selectedPdf.value.name}`;
          
          await Filesystem.writeFile({
            path: `maintenance_pdfs/${fileName}`,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true,
          });
          
          attachmentPath = fileName;
          attachmentFilename = selectedPdf.value.name;
        }

        const maintenanceData = {
          date: maintenanceForm.value.date,
          category: maintenanceForm.value.category,
          description: maintenanceForm.value.description,
          attachment_path: attachmentPath,
          attachment_filename: attachmentFilename,
        };

        // Use native database operations
        await maintenanceOperations.add(gear.value.id, maintenanceData);

        await loadMaintenanceRecords();
        closeAddMaintenanceModal();
        successMessage.value = "Maintenance record added successfully";
        setTimeout(() => (successMessage.value = ""), 3000);
      } catch (error) {
        console.error("Error adding maintenance record:", error);
        errorMessage.value = "Failed to add maintenance record: " + error.message;
        setTimeout(() => (errorMessage.value = ""), 3000);
      } finally {
        uploading.value = false;
      }
    };

    const deleteMaintenanceRecord = async (recordId) => {
      if (
        !confirm("Are you sure you want to delete this maintenance record?")
      ) {
        return;
      }

      try {
        await maintenanceOperations.delete(recordId);

        await loadMaintenanceRecords();
        successMessage.value = "Maintenance record deleted successfully";
        setTimeout(() => (successMessage.value = ""), 3000);
      } catch (error) {
        console.error("Error deleting maintenance record:", error);
        errorMessage.value = "Failed to delete maintenance record";
        setTimeout(() => (errorMessage.value = ""), 3000);
      }
    };

    const viewPdf = async (filename) => {
      try {
        // Get the file URI
        const uriResult = await Filesystem.getUri({
          path: `maintenance_pdfs/${filename}`,
          directory: Directory.Documents,
        });
        
        console.log("PDF URI:", uriResult.uri);
        
        // On Android, we need to use a content:// URI or share intent
        await Share.share({
          title: 'View PDF',
          text: 'Opening maintenance document',
          url: uriResult.uri,
          dialogTitle: 'Open PDF with...',
        });
      } catch (shareError) {
        console.error("Share error:", shareError);
        
        // Fallback: try reading and displaying inline
        try {
          const fileResult = await Filesystem.readFile({
            path: `maintenance_pdfs/${filename}`,
            directory: Directory.Documents,
          });
          
          // Create a data URL and try to open it
          const dataUrl = `data:application/pdf;base64,${fileResult.data}`;
          
          // Create a temporary link and click it
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = filename;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          successMessage.value = "PDF downloaded. Check your downloads.";
          setTimeout(() => (successMessage.value = ""), 3000);
        } catch (fallbackError) {
          console.error("Fallback error:", fallbackError);
          errorMessage.value = "Could not open PDF. File may not exist.";
          setTimeout(() => (errorMessage.value = ""), 3000);
        }
      }
    };

    const closeAddMaintenanceModal = () => {
      showAddMaintenanceModal.value = false;
      maintenanceForm.value = {
        date: new Date().toISOString().split("T")[0],
        category: "",
        description: "",
      };
      clearSelectedPdf();
    };

    const handlePdfSelect = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      // Check by MIME type or file extension (mobile sometimes doesn't set MIME type correctly)
      const isPdf = file.type === "application/pdf" || 
                    file.name.toLowerCase().endsWith(".pdf");
      
      if (isPdf) {
        selectedPdf.value = file;
        console.log("PDF selected:", file.name, file.type);
      } else {
        alert("Please select a valid PDF file");
        event.target.value = "";
      }
    };

    const clearSelectedPdf = () => {
      selectedPdf.value = null;
      if (pdfFileInput.value) {
        pdfFileInput.value.value = "";
      }
    };

    const addDocumentToRecord = async (recordId) => {
      // Create a file input element dynamically
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".pdf";
      fileInput.style.display = "none";

      fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check by MIME type or file extension
        const isPdf = file.type === "application/pdf" || 
                      file.name.toLowerCase().endsWith(".pdf");
        
        if (!isPdf) {
          alert("Please select a valid PDF file");
          return;
        }

        try {
          // Store PDF locally
          const base64Data = await readFileAsBase64(file);
          const fileName = `${Date.now()}_${file.name}`;
          
          await Filesystem.writeFile({
            path: `maintenance_pdfs/${fileName}`,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true,
          });
          
          const attachmentPath = fileName;
          const attachmentFilename = file.name;

          // Get the current maintenance record to preserve existing data
          const currentRecord = maintenanceRecords.value.find(
            (r) => r.id === recordId
          );
          if (!currentRecord) {
            throw new Error("Maintenance record not found");
          }

          const updateData = {
            date: currentRecord.date,
            category: currentRecord.category,
            description: currentRecord.description,
            attachment_path: attachmentPath,
            attachment_filename: attachmentFilename,
          };

          // Update the maintenance record with the attachment
          await maintenanceOperations.update(recordId, updateData);

          // Reload maintenance records to show the new attachment
          await loadMaintenanceRecords();
          successMessage.value = "Document added successfully";
          setTimeout(() => (successMessage.value = ""), 3000);
        } catch (error) {
          console.error("Error adding document:", error);
          errorMessage.value = "Failed to add document: " + error.message;
          setTimeout(() => (errorMessage.value = ""), 3000);
        }
      };

      // Trigger the file input
      document.body.appendChild(fileInput);
      fileInput.click();
      document.body.removeChild(fileInput);
    };

    const removeDocumentFromRecord = async (recordId) => {
      try {
        // Get the current record to preserve existing data and get file info
        const currentRecord = maintenanceRecords.value.find(
          (r) => r.id === recordId
        );
        if (!currentRecord) {
          throw new Error("Maintenance record not found");
        }

        // If there's an attachment, delete the file locally
        if (currentRecord.attachment_path) {
          try {
            await Filesystem.deleteFile({
              path: `maintenance_pdfs/${currentRecord.attachment_path}`,
              directory: Directory.Documents,
            });
          } catch (e) {
            console.warn("Failed to delete file locally:", e);
          }
        }

        // Update the maintenance record to remove the attachment
        await maintenanceOperations.update(recordId, {
          date: currentRecord.date,
          category: currentRecord.category,
          description: currentRecord.description,
          attachment_path: null,
          attachment_filename: null,
        });

        // Reload maintenance records to show the change
        await loadMaintenanceRecords();
        successMessage.value = "Document removed successfully";
        setTimeout(() => (successMessage.value = ""), 3000);
      } catch (error) {
        console.error("Error removing document:", error);
        errorMessage.value = "Failed to remove document";
        setTimeout(() => (errorMessage.value = ""), 3000);
      }
    };

    // Get rescue warning information for the current gear
    const getRescueWarning = () => {
      if (gear.value?.type !== "rescues" || !gear.value?.is_active) {
        return null;
      }

      // Get rescue maintenance records for Purchase or Repack categories
      const rescueMaintenanceRecords = maintenanceRecords.value.filter(
        (record) =>
          record.category === "Purchase" || record.category === "Repack"
      );

      if (rescueMaintenanceRecords.length === 0) {
        return null;
      }

      // Find the latest Purchase or Repack date
      const latestRecord = rescueMaintenanceRecords.reduce(
        (latest, current) => {
          return new Date(current.date) > new Date(latest.date)
            ? current
            : latest;
        }
      );

      // Get rescue warning duration from settings (default 12 months)
      const rescueWarningDuration = parseInt(
        localStorage.getItem("rescueWarningDuration") || "12",
        10
      );

      // Calculate due date
      const lastDate = new Date(latestRecord.date);
      const dueDate = new Date(lastDate);
      dueDate.setMonth(dueDate.getMonth() + rescueWarningDuration);

      // Check if overdue
      const now = new Date();
      if (now > dueDate) {
        return {
          isOverdue: true,
          dueDate: dueDate,
          daysPastDue: Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)),
        };
      }

      return null;
    };

    // Format date for display
    const formatWarningDate = (date) => {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Get glider warning information
    const getGliderWarning = () => {
      if (
        !gear.value ||
        gear.value.type !== "gliders" ||
        !gear.value.is_active
      ) {
        return null;
      }

      // Get glider maintenance records for Purchase or Check / Trim categories
      const gliderMaintenanceRecords = maintenanceRecords.value.filter(
        (record) =>
          record.gear_id === gear.value.id &&
          (record.category === "Purchase" || record.category === "Check / Trim")
      );

      if (gliderMaintenanceRecords.length === 0) {
        return null;
      }

      // Find the latest Purchase or Check / Trim date
      const latestRecord = gliderMaintenanceRecords.reduce(
        (latest, current) => {
          return new Date(current.date) > new Date(latest.date)
            ? current
            : latest;
        }
      );

      // Get glider warning settings from localStorage
      const gliderWarningDuration = parseInt(
        localStorage.getItem("gliderWarningDuration") || "24",
        10
      );
      const gliderWarningFlightTime = parseInt(
        localStorage.getItem("gliderWarningFlightTime") || "100",
        10
      );

      // Check date-based warning
      let dateWarning = null;
      const lastDate = new Date(latestRecord.date);
      const dueDate = new Date(lastDate);
      dueDate.setMonth(dueDate.getMonth() + gliderWarningDuration);
      const now = new Date();

      if (now > dueDate) {
        dateWarning = {
          type: "date",
          isOverdue: true,
          dueDate: dueDate,
          daysPastDue: Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)),
        };
      }

      // Check flight time-based warning
      let flightTimeWarning = null;
      if (flights.value && flights.value.length > 0) {
        // Get flights since the last maintenance record
        const lastMaintenanceDate = new Date(latestRecord.date);
        const flightsSinceLastMaintenance = flights.value.filter(
          (flight) => new Date(flight.date) > lastMaintenanceDate
        );

        // Calculate total flight time in minutes
        let totalMinutes = 0;
        flightsSinceLastMaintenance.forEach((flight) => {
          if (flight.flightTime) {
            const [hours, minutes] = flight.flightTime.split(":").map(Number);
            totalMinutes += hours * 60 + minutes;
          }
        });

        const totalHours = Math.floor(totalMinutes / 60);

        if (totalHours >= gliderWarningFlightTime) {
          flightTimeWarning = {
            type: "flightTime",
            totalHours: totalHours,
            thresholdHours: gliderWarningFlightTime,
          };
        }
      }

      // Return the most urgent warning (flight time takes precedence)
      return flightTimeWarning || dateWarning;
    };

    // Maintenance detail methods
    const openMaintenanceDetail = (record) => {
      selectedMaintenance.value = record;
      showMaintenanceDetail.value = true;
      pdfPreviewUrl.value = null; // No web preview on mobile-only app
    };

    const closeMaintenanceDetail = () => {
      showMaintenanceDetail.value = false;
      selectedMaintenance.value = null;
      pdfPreviewUrl.value = null;
    };

    const editSelectedMaintenance = () => {
      editMaintenanceForm.value = {
        date: selectedMaintenance.value.date,
        category: selectedMaintenance.value.category,
        description: selectedMaintenance.value.description || "",
      };
      showEditMaintenanceModal.value = true;
    };

    const closeEditMaintenanceModal = () => {
      showEditMaintenanceModal.value = false;
    };

    const saveMaintenanceEdit = async () => {
      try {
        const recordId = selectedMaintenance.value.id;
        
        const updateData = {
          date: editMaintenanceForm.value.date,
          category: editMaintenanceForm.value.category,
          description: editMaintenanceForm.value.description,
          attachment_path: selectedMaintenance.value.attachment_path || null,
          attachment_filename: selectedMaintenance.value.attachment_filename || null,
        };

        await maintenanceOperations.update(recordId, updateData);

        await loadMaintenanceRecords();
        closeEditMaintenanceModal();
        closeMaintenanceDetail();
        successMessage.value = "Record updated successfully";
        setTimeout(() => (successMessage.value = ""), 3000);
      } catch (error) {
        console.error("Error updating record:", error);
        errorMessage.value = "Failed to update record";
        setTimeout(() => (errorMessage.value = ""), 3000);
      }
    };

    const deleteSelectedMaintenance = async () => {
      if (!confirm("Are you sure you want to delete this maintenance record?")) {
        return;
      }
      
      try {
        const recordId = selectedMaintenance.value.id;
        await maintenanceOperations.delete(recordId);

        await loadMaintenanceRecords();
        closeMaintenanceDetail();
        successMessage.value = "Maintenance record deleted successfully";
        setTimeout(() => (successMessage.value = ""), 3000);
      } catch (error) {
        console.error("Error deleting maintenance record:", error);
        errorMessage.value = "Failed to delete maintenance record";
        setTimeout(() => (errorMessage.value = ""), 3000);
      }
    };

    const addDocumentToSelectedRecord = () => {
      addDocumentToRecord(selectedMaintenance.value.id);
      closeMaintenanceDetail();
    };

    // Utility functions
    const formatType = (type) => {
      const typeMap = {
        gliders: "Glider",
        harnesses: "Harness",
        rescues: "Rescue",
      };
      return typeMap[type] || type;
    };

    // formatDate imported from utils

    onMounted(async () => {
      loadMaintenanceCategories();
      await loadGear();
      await loadMaintenanceRecords();
      await loadFlights();
    });

    return {
      gear,
      loading,
      error,
      successMessage,
      errorMessage,
      showEditModal,
      showDeleteModal,
      editForm,
      toggleRetired,
      updateGear,
      deleteGear,
      closeEditModal,
      closeDeleteModal,
      formatType,
      formatDate,
      // Maintenance related
      showAddMaintenanceModal,
      maintenanceRecords,
      loadingMaintenance,
      maintenanceForm,
      maintenanceCategories,
      selectedPdf,
      pdfFileInput,
      uploading,
      addMaintenanceRecord,
      deleteMaintenanceRecord,
      viewPdf,
      closeAddMaintenanceModal,
      handlePdfSelect,
      clearSelectedPdf,
      loadMaintenanceRecords,
      addDocumentToRecord,
      removeDocumentFromRecord,
      // Maintenance detail
      showMaintenanceDetail,
      selectedMaintenance,
      pdfPreviewUrl,
      showEditMaintenanceModal,
      editMaintenanceForm,
      isNativePlatform,
      openMaintenanceDetail,
      closeMaintenanceDetail,
      editSelectedMaintenance,
      closeEditMaintenanceModal,
      saveMaintenanceEdit,
      deleteSelectedMaintenance,
      addDocumentToSelectedRecord,
      getRescueWarning,
      getGliderWarning,
      formatWarningDate,
    };
  },
};
</script>

<style scoped>
.gear-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  overflow-x: hidden;
}

/* Loading styles inherited from global */

.error {
  text-align: center;
  padding: 40px;
}

.error h2 {
  color: #e74c3c;
  margin-bottom: 10px;
}

/* Header Section */
.header-section {
  margin-bottom: 20px;
}

.back-btn {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}


/* Warning Banner Styles */
.warning-banner-detail {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.warning-banner-detail .warning-icon {
  font-size: 20px;
}

.warning-banner-detail .warning-text {
  color: #856404;
  font-weight: 600;
  font-size: 1rem;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
  width: fit-content;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-badge.retired {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Info Section */
.gear-info-section {
  margin-bottom: 30px;
}

.info-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-card h2 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.info-item span {
  color: #212529;
  font-size: 16px;
}

.type-badge {
  display: inline-block;
  background: #e3f2fd;
  color: #1565c0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px !important;
  font-weight: 500;
  width: fit-content;
}

/* Actions Section */
.actions-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
}

.toggle-btn.retire {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.toggle-btn.retire:hover {
  background: #ffeaa7;
}

.toggle-btn.unretire {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #b8daff;
}

.toggle-btn.unretire:hover {
  background: #b8daff;
}

.edit-btn {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #bbdefb;
}

.edit-btn:hover {
  background: #bbdefb;
}

.delete-btn {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
  padding: 12px 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.delete-btn:hover {
  background: #ffcdd2;
}

/* Messages - using global styles */
.success-message,
.error-message {
  padding: 12px 16px;
  margin-bottom: 20px;
  margin-top: 0;
}

/* Modal Specific Styles */
.modal-header h2 {
  color: #2c3e50;
}

/* Form Styles */
.gear-form {
  padding: 24px;
}

/* Form styles inherited from global with minor adjustments */
.form-group label {
  color: #495057;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 12px;
  font-size: 14px;
}

.form-actions {
  justify-content: flex-end;
  padding: 0 8px;
}

.confirmation-modal .form-actions {
  margin-top: 32px;
  padding: 20px 24px 24px 24px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  border-radius: 0 0 8px 8px;
}

.cancel-btn {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  padding: 10px 20px;
  font-size: 14px;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.submit-btn {
  background: #007bff;
  padding: 10px 20px;
  font-size: 14px;
}

.submit-btn:hover {
  background: #0056b3;
}

/* Delete Modal */
.confirmation-modal {
  max-width: 450px;
}

.confirmation-content {
  padding: 32px 24px 20px 24px;
}

.confirmation-content p {
  margin: 0 0 16px 0;
  color: #495057;
}

.gear-preview {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
  border-left: 4px solid #007bff;
}

.gear-preview strong {
  display: block;
  color: #2c3e50;
  margin-bottom: 4px;
}

.gear-preview .type {
  font-size: 12px;
  color: #6c757d;
  text-transform: uppercase;
  font-weight: 500;
}

.warning {
  color: #856404 !important;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 768px) {
  .gear-detail {
    padding: 16px;
  }

  .actions-section-bottom {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    text-align: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }

  }

/* Bottom Action Buttons */
.actions-section-bottom {
  display: flex;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #eee;
  flex-wrap: wrap;
}

/* Maintenance Section */
.maintenance-section {
  margin-top: 40px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.maintenance-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 2px solid #eee;
  padding-bottom: 16px;
}

.maintenance-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}

@media (min-width: 600px) {
  .maintenance-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .maintenance-header h2 {
    font-size: 1.5rem;
  }
}

.add-btn {
  background: #549f74;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}

.add-btn:hover {
  background: #4a8c65;
}

.loading-maintenance {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

.no-maintenance {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #ddd;
}

/* Maintenance List Styles */
.maintenance-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.maintenance-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.maintenance-item:hover {
  background: #e9ecef;
  border-color: #549f74;
}

.maintenance-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.maintenance-date {
  font-weight: 600;
  color: #333;
}

.maintenance-category {
  background: #e8f5f0;
  color: #2d7a52;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.maintenance-item-desc {
  color: #666;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.maintenance-item-attachment {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #549f74;
}

/* Maintenance Detail Modal */
.maintenance-detail-modal {
  max-width: 500px;
  width: 95%;
}

.maintenance-detail-content {
  padding: 20px;
}

.detail-row {
  margin-bottom: 16px;
}

.detail-label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 1rem;
  color: #333;
}

.detail-value.category-badge {
  display: inline-block;
  background: #e8f5f0;
  color: #2d7a52;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.detail-value.description {
  display: block;
  white-space: pre-wrap;
  line-height: 1.5;
}

.pdf-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.pdf-section h3 {
  font-size: 1rem;
  color: #333;
  margin: 0 0 12px 0;
}

.pdf-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.pdf-filename {
  color: #666;
  word-break: break-all;
}

.view-pdf-btn {
  background: #549f74;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
}

.view-pdf-btn:hover {
  background: #448060;
}

.pdf-preview {
  margin-top: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.pdf-preview iframe {
  border: none;
  display: block;
}

.no-pdf {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.no-pdf p {
  color: #666;
  margin: 0 0 12px 0;
}

.add-pdf-btn {
  background: #549f74;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
}

.add-pdf-btn:hover {
  background: #448060;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.detail-actions .action-btn {
  flex: 1;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
}

.detail-actions .edit-btn {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #bbdefb;
}

.detail-actions .edit-btn:hover {
  background: #bbdefb;
}

.detail-actions .delete-btn {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.detail-actions .delete-btn:hover {
  background: #ffcdd2;
}


.edit-actions {
  text-align: center;
  white-space: nowrap;
}

.edit-record-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
}

.edit-record-btn:hover {
  background: #f8f9fa;
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.delete-record-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
}

.delete-record-btn:hover {
  background: #f8e8e9;
  border-radius: 4px;
}

.edit-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.save-btn,
.cancel-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.save-btn {
  color: #28a745;
}

.save-btn:hover {
  background: #e8f5e9;
}

.cancel-btn {
  color: #dc3545;
}

.cancel-btn:hover {
  background: #f8e8e9;
}

.attachment-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pdf-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.pdf-btn:hover {
  background: #f0f0f0;
}

.filename {
  font-size: 0.85rem;
  color: #666;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-document-btn {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #dc3545;
  transition: background-color 0.2s;
}

.remove-document-btn:hover {
  background: #f8e8e9;
}

.no-attachment {
  color: #999;
  font-style: italic;
  font-size: 0.85rem;
}

.delete-maintenance-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.delete-maintenance-btn:hover {
  background: #ffebee;
}

/* Maintenance Modal */
.maintenance-modal {
  max-width: 600px;
  width: 100%;
  overflow-x: hidden;
}

.maintenance-form {
  padding: 20px;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .maintenance-modal {
    width: 95%;
    max-width: none;
    margin: 10px;
  }
  
  .maintenance-form {
    padding: 16px;
  }
}

.maintenance-form select.form-control {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20256%20256%22%3E%3Cpath%20fill%3D%22%23549f74%22%20d%3D%22M208.5%2096.5l-80%2080a12%2012%200%2001-17%200l-80-80a12%2012%200%2001%2017-17L128%20151l71.5-71.5a12%2012%200%2001%2017%2017z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
  cursor: pointer;
}

.maintenance-form .form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.maintenance-form .submit-btn {
  background: #549f74;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.maintenance-form .submit-btn:hover:not(:disabled) {
  background: #448060;
}

.maintenance-form .submit-btn:disabled {
  background: #a8d4bb;
  cursor: not-allowed;
}

.maintenance-form .cancel-btn {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.maintenance-form .cancel-btn:hover {
  background: #e9ecef;
}

.file-upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  background: #f9f9f9;
  overflow: hidden;
  word-break: break-word;
}

.file-input {
  margin-bottom: 10px;
}

.selected-file {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px 12px;
  background: #e8f5f0;
  border-radius: 6px;
  margin: 10px 0;
  word-break: break-all;
  overflow: hidden;
}

.selected-file span {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.clear-file-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 12px;
}

.clear-file-btn:hover {
  background: #c82333;
}

.file-hint {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}
</style>
