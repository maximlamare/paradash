<template>
  <div class="modal-overlay">
    <div class="modal-container max-w-full h-full overflow-auto">
      <div class="flex justify-end">
        <button
          @click="$emit('close')"
          class="button-close"
        >Close</button>
      </div>
      <h2 class="modal-title">{{ gear.brand }} {{ gear.model }}</h2>
      <div class="mb-4">
        <p><strong>Manufacturing Date:</strong> {{ gear.manufacturing_date }}</p>
        <p><strong>Purchase Date:</strong> {{ gear.purchase_date }}</p>
        <p><strong>Total Flight Time:</strong> {{ gear.total_flight_time }} hours</p>
        <p><strong>Number of Flights:</strong> {{ gear.number_of_flights }}</p>
      </div>
      <div class="mb-4">
        <h3 class="text-2xl font-semibold mb-4">Maintenance Records</h3>
        <div v-if="maintenanceRecords.length">
          <table class="min-w-full bg-white dark:bg-gray-800">
            <thead>
              <tr>
                <th
                  v-if="isEditMode"
                  class="modal-grid"
                ></th>
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
                <td
                  v-if="isEditMode"
                  class="modal-grid text-center"
                >
                  <button
                    @click="deleteRecord(index)"
                    class="text-red-500"
                  >✖</button>
                </td>
                <td class="modal-grid text-center">{{ record.maintenance_date }}</td>
                <td class="modal-grid text-center">{{ record.maintenance_type }}</td>
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
              v-if="isEditMode"
              @click="saveChanges"
              class="button-blue mr-2"
            >Save</button>
            <button
              @click="toggleEditMode"
              class="button-delete mr-2"
            >{{ isEditMode ? 'Cancel' : 'Delete Maintance Records' }}</button>

          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
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