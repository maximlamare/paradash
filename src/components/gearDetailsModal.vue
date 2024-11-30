<template>
  <div class="modal-overlay">
    <div class="modal-container max-w-full h-full overflow-auto">
      <div class="flex justify-end">
        <button @click="$emit('close')" class="button-close">Close</button>
      </div>
      <h2 class="modal-title">{{ gear.brand }} {{ gear.model }}</h2>
      <div class="mb-4">
        <p>
          <strong>Manufacturing Date:</strong> {{ gear.manufacturing_date }}
        </p>
        <p><strong>Purchase Date:</strong> {{ gear.purchase_date }}</p>
        <p>
          <strong>Total Flight Time:</strong> {{ gear.total_flight_time }} hours
        </p>
        <p><strong>Number of Flights:</strong> {{ gear.number_of_flights }}</p>
      </div>
      <div class="mb-4">
        <h3 class="text-2xl font-semibold mb-4">Maintenance Records</h3>
        <div v-if="maintenanceRecords.length">
          <table class="min-w-full bg-white dark:bg-gray-800">
            <thead>
              <tr>
                <th v-if="isEditMode" class="modal-grid"></th>
                <th class="modal-grid">Date</th>
                <th class="modal-grid">Type</th>
                <th class="modal-grid">By</th>
                <th class="modal-grid">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(record, index) in editableRecords"
                :key="record.id"
                class="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <td v-if="isEditMode" class="modal-grid text-center">
                  <button @click="deleteRecord(index)" class="text-red-500">
                    ✖
                  </button>
                </td>
                <td class="modal-grid text-center">
                  {{ record.maintenance_date }}
                </td>
                <td class="modal-grid text-center">
                  {{ record.maintenance_type }}
                </td>
                <td class="modal-grid text-center">{{ record.by_whom }}</td>
                <td class="modal-grid text-center">{{ record.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else>
          <p>No maintenance records found.</p>
        </div>
        <div class="flex justify-end mt-4">
          <div class="flex justify-end mt-4">
            <button
              v-if="!isEditMode"
              @click="openMaintenanceModal(gear)"
              class="button-blue mr-2"
            >
              Add Maintenance record
            </button>
            <button
              v-if="isEditMode"
              @click="saveChanges"
              class="button-blue mr-2"
            >
              Save
            </button>
            <button @click="toggleEditMode" class="button-delete mr-2">
              {{ isEditMode ? "Cancel" : "Delete Maintance Records" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Modal
    v-if="showMaintenanceModal"
    @click="closeModal"
    title="Add Maintenance"
    :style="{ zIndex: 1050 }"
  >
    <div @click.stop>
      <form @submit.prevent="saveMaintenance">
        <div class="mb-4">
          <label for="maintenance_date" class="modal-text"
            >Maintenance Date</label
          >
          <input
            v-model="maintenance.maintenance_date"
            id="maintenance_date"
            type="date"
            class="modal-dropdown"
          />
        </div>
        <div class="mb-4">
          <label for="maintenance_type" class="modal-text"
            >Maintenance Type</label
          >
          <select
            v-model="maintenance.maintenance_type"
            id="maintenance_type"
            class="modal-dropdown"
          >
            <option value="Check">Check</option>
            <option value="Repair">Repair</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="mb-4">
          <label for="by_whom" class="modal-text">Workshop</label>
          <input
            v-model="maintenance.by_whom"
            id="by_whom"
            type="text"
            class="modal-dropdown"
            placeholder="Enter workshop name"
          />
        </div>
        <div class="mb-4">
          <label for="description" class="modal-text">Description</label>
          <textarea
            v-model="maintenance.description"
            id="description"
            class="modal-dropdown"
          ></textarea>
        </div>
        <div class="flex justify-center">
          <button type="submit" class="button-blue">Save</button>
        </div>
      </form>
    </div>
  </Modal>
</template>

<script>
import axios from "axios";
import Modal from "./Modal.vue";

export default {
  components: {
    Modal,
  },
  props: {
    gear: {
      type: Object,
      required: true,
    },
    maintenanceRecords: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      isEditMode: false,
      editableRecords: JSON.parse(JSON.stringify(this.maintenanceRecords)),
      recordsToDelete: [],
      showMaintenanceModal: false,
    };
  },
  methods: {
    toggleEditMode() {
      axios
        .get(`http://localhost:3000/maintenance?gear_id=${this.gear.id}`)
        .then((response) => {
          this.editableRecords = response.data.data.filter(
            (record) => record.gear_id === this.gear.id
          );
        });
      this.isEditMode = !this.isEditMode;
    },

    deleteRecord(index) {
      const recordToDelete = this.editableRecords[index];
      this.recordsToDelete.push(recordToDelete);
      this.editableRecords.splice(index, 1);
    },
    saveChanges() {
      this.recordsToDelete.forEach((record) => {
        // Delete the record from the database (or trigger parent component action)
        axios
          .delete(`http://localhost:3000/maintenance/${record.id}`)
          .then(() => {
            this.$emit("update-records", record.id);
          })
          .catch((error) => {
            console.error("Error deleting maintenance record:", error);
          });
      });
      this.recordsToDelete = []; // Clear the deletion list
      this.isEditMode = false;
    },
    // MAINTENANCE RECORDS
    // Open the modal to add a new maintenance record
    openMaintenanceModal(item) {
      this.resetMaintenanceForm();
      this.maintenance.gear_id = item.id;
      this.showMaintenanceModal = true;
    },
    // Reset the maintenance form
    resetMaintenanceForm() {
      this.maintenance = {
        id: null,
        gear_id: null,
        maintenance_date: "",
        maintenance_type: "",
        by_whom: "",
        description: "",
      };
    },
    saveMaintenance() {
      // Add new maintenance record
      axios
        .post("http://localhost:3000/maintenance", this.maintenance)
        .then(() => {
          this.showMaintenanceModal = false; // Close the modal
          this.resetMaintenanceForm(); // Clear the form
          this.$emit("maintenance-saved");
        })
        .catch((error) => {
          console.error("Error adding maintenance record:", error);
        });
    },
    closeModal() {
      this.showMaintenanceModal = false;
    },
  },
  watch: {
    maintenanceRecords: {
      handler(newRecords) {
        this.editableRecords = JSON.parse(JSON.stringify(newRecords));
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
@import "@/assets/modal.css";
@import "@/assets/buttons.css";
</style>
