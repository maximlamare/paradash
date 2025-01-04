<template>
  <div class="page-bg-grey">
    <div class="flex justify-between items-center mb-8">
      <h1 class="page-title1">Flight log</h1>
    </div>
    <div class="categories-list">
      <button
        v-for="category in categories"
        :key="category"
        @click="toggleCategory(category)"
        :class="[
          'category-button',
          { active: selectedCategories.includes(category) },
        ]"
      >
        {{ category }}
      </button>
    </div>
    <div class="flex justify-end mb-8"></div>

    <div v-if="flights.length">
      <div
        v-for="(flight, index) in flights"
        :key="flight.id"
        class="flight-entry"
      >
        <div class="flight-details">
          <div class="flight-index">{{ flights.length - index }}</div>

          <div class="flight-detail">
            <p>{{ flight.date }}</p>
            <p>
              <i>{{ displayValue(flight.flightStart) }}</i>
            </p>
          </div>
          <div class="flight-detail">
            <p><i>Duration:</i></p>
            <p>{{ displayValue(flight.flightTime) }}</p>
          </div>
          <div class="flight-detail">
            <p><i>Takeoff:</i></p>
            <p>{{ displayValue(flight.takeoffLocation) }}</p>
          </div>
          <div class="flight-detail">
            <p><i>Landing:</i></p>
            <p>{{ displayValue(flight.landingLocation) }}</p>
          </div>
          <div class="flight-detail">
            <button @click="openFlight" class="button-blue flight-button">
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <p>No flights available.</p>
    </div>
  </div>
</template>
<script>
import axios from "axios";

export default {
  data() {
    return {
      flights: [],
      categories: [],
      selectedCategories: [],
      filteredFlights: [],
    };
  },
  created() {
    this.fetchAllFlights();
    this.fetchCategories();
  },
  methods: {
    fetchAllFlights() {
      axios
        .get("http://localhost:3000/items")
        .then((response) => {
          this.flights = response.data.data;
          // Sort flights by date in descending order
          this.flights.sort((a, b) => {
            const dateTimeA = new Date(`${a.date}T${a.flight_start}`);
            const dateTimeB = new Date(`${b.date}T${b.flight_start}`);
            return dateTimeB - dateTimeA;
          });
        })
        .catch((error) => {
          console.error("Error fetching flights:", error);
        });
    },
    displayValue(value) {
      return value ? value : "?";
    },
    fetchCategories() {
      axios
        .get("http://localhost:3002/get-settings")
        .then((response) => {
          this.categories = response.data.categories;
        })
        .catch((error) => {
          console.error("Error fetching settings:", error);
        });
    },
    toggleCategory(category) {
      const index = this.selectedCategories.indexOf(category);
      if (index > -1) {
        this.selectedCategories.splice(index, 1);
      } else {
        this.selectedCategories.push(category);
      }
      this.filterFlights();
    },
  },
};
</script>

<style scoped>
@import "@/assets/flights.css";
@import "@/assets/buttons.css";

.categories-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-button {
  background-color: white;
  border: 1px solid #007bff;
  border-radius: 12px;
  color: #007bff;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.category-button.active {
  background-color: #007bff;
  color: white;
}
</style>
