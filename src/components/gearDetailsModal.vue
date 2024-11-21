<template>
  <div class="modal-overlay">
    <div class="modal-container max-w-full h-full overflow-auto">
      <h2 class="modal-title">{{ gear.brand }} {{ gear.model }}</h2>
      <div class="mb-4">
        <p><strong>Manufacturing Date:</strong> {{ gear.manufacturing_date }}</p>
        <p><strong>Purchase Date:</strong> {{ gear.purchase_date }}</p>
        <p><strong>Total Flight Time:</strong> {{ gear.total_flight_time }} hours</p>
        <p><strong>Number of Flights:</strong> {{ gear.number_of_flights }}</p>
      </div>
      <h3 class="text-2xl font-semibold mb-4">Maintenance Records</h3>
      <div v-if="maintenanceRecords.length">
        <table class="min-w-full bg-white">
          <thead>
            <tr>
              <th class="py-2">Date</th>
              <th class="py-2">Type</th>
              <th class="py-2">By Whom</th>
              <th class="py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="record in maintenanceRecords"
              :key="record.id"
            >
              <td class="py-2">{{ record.maintenance_date }}</td>
              <td class="py-2">{{ record.maintenance_type }}</td>
              <td class="py-2">{{ record.by_whom }}</td>
              <td class="py-2">{{ record.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
        <p>No maintenance records found.</p>
      </div>
      <div class="flex justify-end mt-4">
        <button
          @click="$emit('close')"
          class="button-close"
        >Close</button>
      </div>
    </div>
  </div>
</template>

<script>
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
};
</script>

<style scoped>
@import "@/assets/modal.css";
@import "@/assets/buttons.css";

.modal-overlay {
  @apply fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50;
}

.modal-container {
  @apply bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-full h-full overflow-auto;
}

.modal-title {
  @apply text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100;
}
</style>