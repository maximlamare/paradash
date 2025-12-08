<template>
  <div class="gear-overview">
    <div class="header-section">
      <button @click="showAddGearModal = true" class="add-gear-btn">
        + Add New Gear
      </button>
      <h1>Gear Overview</h1>
      <div class="toggle-section">
        <label class="toggle-label">
          <span>Show Retired</span>
          <div class="toggle-switch">
            <input type="checkbox" v-model="showRetired" class="toggle-input" />
            <span class="toggle-slider"></span>
          </div>
        </label>
      </div>
    </div>

    <!-- Add Gear Modal -->
    <div v-if="showAddGearModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Add New Gear</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="addGear" class="gear-form">
          <div class="form-group">
            <label for="gearType">Gear Type</label>
            <select id="gearType" v-model="newGear.type" required class="form-control">
              <option value="">Select gear type</option>
              <option value="gliders">Glider</option>
              <option value="harnesses">Harness</option>
              <option value="rescues">Rescue</option>
            </select>
          </div>

          <div class="form-group">
            <label for="brand">Brand</label>
            <input
              type="text"
              id="brand"
              v-model="newGear.manufacturer"
              required
              placeholder="e.g., Ozone, Advance"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="model">Model</label>
            <input
              type="text"
              id="model"
              v-model="newGear.model"
              required
              placeholder="e.g., Rush 6, Epsilon 9"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="manufacturingDate">Manufacturing Date</label>
            <input
              type="date"
              id="manufacturingDate"
              v-model="newGear.manufacturingDate"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="purchaseDate">Purchase Date</label>
            <input
              type="date"
              id="purchaseDate"
              v-model="newGear.purchaseDate"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="serialNumber">Serial Number (Optional)</label>
            <input
              type="text"
              id="serialNumber"
              v-model="newGear.serialNumber"
              placeholder="e.g., SN12345"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              v-model="newGear.notes"
              placeholder="Any additional notes about this gear..."
              rows="3"
              class="form-control"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn">
              Cancel
            </button>
            <button type="submit" class="submit-btn">Add Gear</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <p>Loading gear data...</p>
    </div>

    <!-- Error state -->
    <div v-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadGearData" class="retry-btn">Retry</button>
    </div>

    <!-- Gear content (only show when not loading and no error) -->
    <div v-if="!loading && !error">
      <!-- Gliders Section -->
      <div class="gear-category">
        <h2>Gliders</h2>
        <div class="gear-grid">
          <div
            v-for="glider in filteredGliders"
            :key="glider.id"
            class="gear-card"
            @click="goToGearDetail(glider.id)"
          >
            <div class="gear-info">
              <h3>
                {{ glider.manufacturer }} {{ glider.model }} ({{
                  getYear(glider.manufacturing_date)
                }})
              </h3>

              <!-- Glider Warning -->
              <div v-if="getGliderWarning(glider.id)" class="warning-banner">
                <span class="warning-icon">⚠️</span>
                <span
                  class="warning-text"
                  v-if="getGliderWarning(glider.id).type === 'flightTime'"
                >
                  Check due: {{ getGliderWarning(glider.id).totalHours }} flight
                  hours since last check
                </span>
                <span
                  class="warning-text"
                  v-else-if="getGliderWarning(glider.id).type === 'date'"
                >
                  Check due since
                  {{ formatWarningDate(getGliderWarning(glider.id).dueDate) }}
                </span>
              </div>

              <div class="gear-details">
                <div class="gear-detail">
                  <span class="detail-label">Purchase Date:</span>
                  <span class="detail-value purchase-date">{{
                    formatDate(glider.purchase_date)
                  }}</span>
                </div>
                <div class="gear-detail">
                  <span class="detail-label">Total Flight Time:</span>
                  <span class="detail-value flight-time">{{
                    glider.total_flight_time || "0:00"
                  }}</span>
                </div>
                <div class="gear-detail">
                  <span class="detail-label">Number of Flights:</span>
                  <span class="detail-value flight-count">{{
                    glider.flight_count || 0
                  }}</span>
                </div>
              </div>
              <div
                class="gear-status"
                :class="{
                  active: glider.is_active,
                  retired: !glider.is_active,
                }"
              >
                {{ glider.is_active ? "Active" : "Retired" }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Harnesses Section -->
      <div class="gear-category">
        <h2>Harnesses</h2>
        <div class="gear-grid">
          <div
            v-for="harness in filteredHarnesses"
            :key="harness.id"
            class="gear-card"
            @click="goToGearDetail(harness.id)"
          >
            <div class="gear-info">
              <h3>
                {{ harness.manufacturer }} {{ harness.model }} ({{
                  getYear(harness.manufacturing_date)
                }})
              </h3>
              <div class="gear-details">
                <div class="gear-detail">
                  <span class="detail-label">Purchase Date:</span>
                  <span class="detail-value purchase-date">{{
                    formatDate(harness.purchase_date)
                  }}</span>
                </div>
              </div>
              <div
                class="gear-status"
                :class="{
                  active: harness.is_active,
                  retired: !harness.is_active,
                }"
              >
                {{ harness.is_active ? "Active" : "Retired" }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Rescues Section -->
      <div class="gear-category">
        <h2>Rescues</h2>
        <div class="gear-grid">
          <div
            v-for="rescue in filteredRescues"
            :key="rescue.id"
            class="gear-card"
            @click="goToGearDetail(rescue.id)"
          >
            <div class="gear-info">
              <h3>
                {{ rescue.manufacturer }} {{ rescue.model }} ({{
                  getYear(rescue.manufacturing_date)
                }})
              </h3>

              <!-- Rescue Warning -->
              <div v-if="getRescueWarning(rescue.id)" class="warning-banner">
                <span class="warning-icon">⚠️</span>
                <span class="warning-text">
                  Repack due since
                  {{ formatWarningDate(getRescueWarning(rescue.id).dueDate) }}
                </span>
              </div>

              <div class="gear-details">
                <div class="gear-detail">
                  <span class="detail-label">Purchase Date:</span>
                  <span class="detail-value purchase-date">{{
                    formatDate(rescue.purchase_date)
                  }}</span>
                </div>
              </div>
              <div
                class="gear-status"
                :class="{
                  active: rescue.is_active,
                  retired: !rescue.is_active,
                }"
              >
                {{ rescue.is_active ? "Active" : "Retired" }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- End gear content -->
  </div>
</template>

<script>
import { ref, onMounted, onActivated, computed } from "vue";
import { useRouter } from "vue-router";
import { gearOperations, getAllMaintenance, flightOperations } from "../database/database.js";
import { formatDate } from "../utils/dateUtils.js";

export default {
  name: "GearOverview",
  setup() {
    const router = useRouter();
    const showAddGearModal = ref(false);
    const showRetired = ref(false);
    const allGear = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const maintenanceRecords = ref([]);
    const allFlights = ref([]);

    const newGear = ref({
      type: "",
      manufacturer: "",
      model: "",
      manufacturingDate: "",
      purchaseDate: "",
      serialNumber: "",
      notes: "",
    });

    // Load gear data from database
    const loadGearData = async () => {
      try {
        loading.value = true;
        error.value = null;
        const [gearData, maintenance] = await Promise.all([
          gearOperations.getAllWithStats(),
          getAllMaintenance(),
        ]);
        await loadAllFlights();
        allGear.value = gearData;
        maintenanceRecords.value = maintenance;
      } catch (err) {
        error.value = "Failed to load gear data: " + err.message;
        console.error("Error loading gear:", err);
      } finally {
        loading.value = false;
      }
    };

    const loadAllFlights = async () => {
      try {
        allFlights.value = await flightOperations.getAllFlights();
      } catch (error) {
        console.error("Error loading flights:", error);
        allFlights.value = [];
      }
    };

    // Get rescue warning information
    const getRescueWarning = (rescueId) => {
      // Check if gear is active (retired gear should not show warnings)
      const gear = allGear.value.find((g) => g.id === rescueId);
      if (!gear || !gear.is_active) {
        return null;
      }

      // Get rescue maintenance records for Purchase or Repack categories
      const rescueMaintenanceRecords = maintenanceRecords.value.filter(
        (record) =>
          record.gear_id === rescueId &&
          (record.category === "Purchase" || record.category === "Repack")
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
    const getGliderWarning = (gliderId) => {
      // Check if gear is active (retired gear should not show warnings)
      const gear = allGear.value.find((g) => g.id === gliderId);
      if (!gear || !gear.is_active) {
        return null;
      }

      // Get glider maintenance records for Purchase or Check / Trim categories
      const gliderMaintenanceRecords = maintenanceRecords.value.filter(
        (record) =>
          record.gear_id === gliderId &&
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
      if (allFlights.value && allFlights.value.length > 0) {
        // Get flights for this glider since the last maintenance record
        const lastMaintenanceDate = new Date(latestRecord.date);
        const gearFlights = allFlights.value.filter(
          (flight) =>
            flight.glider === gliderId &&
            new Date(flight.date) > lastMaintenanceDate
        );

        // Calculate total flight time in minutes
        let totalMinutes = 0;
        gearFlights.forEach((flight) => {
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

    // Load data on component mount
    onMounted(() => {
      loadGearData();
    });

    onActivated(() => {
      loadGearData();
    });

    // Computed properties to separate gear by type
    const gliders = computed(() => {
      return allGear.value.filter((item) => item.type === "gliders");
    });

    const harnesses = computed(() => {
      return allGear.value.filter((item) => item.type === "harnesses");
    });

    const rescues = computed(() => {
      return allGear.value.filter((item) => item.type === "rescues");
    });

    // Computed properties to filter gear based on showRetired toggle
    const filteredGliders = computed(() => {
      return showRetired.value
        ? gliders.value
        : gliders.value.filter((item) => item.is_active);
    });

    const filteredHarnesses = computed(() => {
      return showRetired.value
        ? harnesses.value
        : harnesses.value.filter((item) => item.is_active);
    });

    const filteredRescues = computed(() => {
      return showRetired.value
        ? rescues.value
        : rescues.value.filter((item) => item.is_active);
    });

    // Modal functions
    const closeModal = () => {
      showAddGearModal.value = false;
      resetForm();
    };

    const resetForm = () => {
      newGear.value = {
        type: "",
        manufacturer: "",
        model: "",
        manufacturingDate: "",
        purchaseDate: "",
        serialNumber: "",
        notes: "",
      };
    };

    // formatDate imported from utils

    const getYear = (dateString) => {
      if (!dateString) return "Unknown";
      const date = new Date(dateString);
      return date.getFullYear();
    };

    const addGear = async () => {
      try {
        // Create new gear object
        const gearItem = {
          manufacturer: newGear.value.manufacturer,
          model: newGear.value.model,
          type: newGear.value.type,
          manufacturing_date: newGear.value.manufacturingDate,
          purchase_date: newGear.value.purchaseDate,
          serial_number: newGear.value.serialNumber,
          notes: newGear.value.notes,
        };

        // Add to database
        const result = await gearOperations.add(gearItem);

        // Reload gear data to get the updated list
        await loadGearData();

        closeModal();
      } catch (err) {
        error.value = "Failed to add gear: " + err.message;
        console.error("Error adding gear:", err);
      }
    };

    // Navigate to gear detail page
    const goToGearDetail = (gearId) => {
      router.push(`/gear/${gearId}`);
    };

    return {
      showAddGearModal,
      showRetired,
      newGear,
      gliders,
      harnesses,
      rescues,
      filteredGliders,
      filteredHarnesses,
      filteredRescues,
      closeModal,
      addGear,
      goToGearDetail,
      formatDate,
      getYear,
      loading,
      error,
      loadGearData,
      getRescueWarning,
      getGliderWarning,
      formatWarningDate,
    };
  },
};
</script>

<style scoped>
.gear-overview {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.gear-overview h1 {
  color: #549f74;
  margin-bottom: 30px;
  text-align: center;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
  position: relative;
}

.header-section h1 {
  margin: 0;
  text-align: center;
  flex: 1;
}

/* Toggle Switch Styles */
.toggle-section {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #495057;
  cursor: pointer;
}

.toggle-switch {
  position: relative;
  width: 50px;
  height: 24px;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

.toggle-input:checked + .toggle-slider {
  background-color: #549f74;
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.toggle-slider:hover {
  background-color: #bbb;
}

.toggle-input:checked + .toggle-slider:hover {
  background-color: #4a8965;
}

.add-gear-btn {
  background: #549f74;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-gear-btn:hover {
  background: #4a8965;
}

.toggle-container {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  color: #333;
  cursor: pointer;
  user-select: none;
}

.toggle-text {
  font-weight: 500;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s ease;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s ease;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-slider {
  background-color: #549f74;
}

.toggle-input:focus + .toggle-slider {
  box-shadow: 0 0 1px #549f74;
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

/* Modal Specific Styles */

.gear-form {
  padding: 24px;
}

/* Select dropdown styling to match Add Flight */
.gear-form select.form-control {
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

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #eee;
  margin-top: 10px;
}

.cancel-btn {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.submit-btn {
  background: #549f74;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover {
  background: #448060;
}

.gear-category {
  margin-bottom: 40px;
}

.gear-category h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.5rem;
  font-weight: 600;
  border-bottom: 2px solid #549f74;
  padding-bottom: 8px;
}

.gear-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.gear-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.gear-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

/* Warning Banner Styles */
.warning-banner {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 8px 12px;
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-icon {
  font-size: 18px;
}

.warning-text {
  color: #856404;
  font-weight: 600;
  font-size: 0.9rem;
}

.gear-image {
  height: 120px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #dee2e6;
}

.gear-placeholder {
  font-size: 3rem;
  opacity: 0.6;
}

.gear-info {
  padding: 20px;
}

.gear-info h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.3;
}

.gear-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.gear-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #666;
  padding: 2px 0;
}

.detail-label {
  font-weight: 500;
  color: #555;
}

.detail-value {
  font-weight: 400;
  color: #777;
}

.purchase-date {
  color: #549f74;
  font-weight: bold;
}

.flight-time {
  color: #549f74;
  font-weight: bold;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
}

.flight-count {
  color: #6c757d;
  font-weight: bold;
}

.gear-status {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.gear-status.active {
  background: #d4edda;
  color: #155724;
}

.gear-status.retired {
  background: #f8d7da;
  color: #721c24;
}

.gear-status.maintenance {
  background: #fff3cd;
  color: #856404;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .gear-overview {
    padding: 10px;
  }

  .header-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: static;
    gap: 15px;
  }

  .header-section h1 {
    text-align: center;
    margin: 0;
    order: 1;
  }

  .add-gear-btn {
    order: 2;
    width: 100%;
    max-width: 200px;
  }

  .toggle-container {
    justify-content: center;
    position: static;
    transform: none;
    order: 3;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
  }

  .gear-form {
    padding: 20px;
  }

  .gear-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .gear-card {
    margin-bottom: 0;
  }

  .gear-info {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .header-section {
    gap: 15px;
  }

  .gear-overview h1 {
    font-size: 1.8rem;
  }

  .gear-category h2 {
    font-size: 1.3rem;
  }

  .gear-image {
    height: 100px;
  }

  .gear-placeholder {
    font-size: 2.5rem;
  }

  .toggle-label {
    font-size: 0.85rem;
  }
}

/* Loading and Error States */
.loading-state,
.error-state {
  text-align: center;
  padding: 40px 20px;
  margin: 20px 0;
}

.loading-state p {
  color: #666;
  font-size: 1.1rem;
}

.error-state p {
  color: #d32f2f;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.retry-btn {
  background: #549f74;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-btn:hover {
  background: #457a5e;
}
</style>
