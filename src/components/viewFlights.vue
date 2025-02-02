<template>
  <div class="page-bg-grey">
    <div class="flex justify-between items-center mb-8">
      <h1 class="page-title1">Flight log</h1>
    </div>
    <div class="page-filter-list">
      <button
        v-for="category in categories"
        :key="category"
        @click="toggleCategory(category)"
        :class="[
          'filter-button',
          { active: selectedCategories.includes(category) },
        ]"
      >
        {{ category }}
      </button>
    </div>
    <div class="page-filter-list mt-4">
      <button
        v-for="flightType in flightTypes"
        :key="flightType"
        @click="toggleFlightType(flightType)"
        :class="[
          'filter-button',
          { active: selectedFlightTypes.includes(flightType) },
        ]"
      >
        {{ flightType }}
      </button>
    </div>
    <div class="flex justify-end mb-8"></div>

    <div v-if="filteredFlights.length">
      <div
        v-for="(flight, index) in filteredFlights"
        :key="flight.id"
        class="flight-entry"
      >
        <div class="flight-details">
          <div class="flight-index">{{ filteredFlights.length - index }}</div>

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
            <p>
              {{ displayValue(flight.takeoffLocation) }},
              {{ displayValue(flight.takeoffCountryCode) }}
            </p>
          </div>
          <div class="flight-detail">
            <p><i>Landing:</i></p>
            <p>
              {{ displayValue(flight.landingLocation) }},
              {{ displayValue(flight.landingCountryCode) }}
            </p>
          </div>
          <div class="flight-detail">
            <button
              @click="openFlight(flight)"
              class="button-blue flight-button"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <p>No flights available for this combination of filters.</p>
    </div>
    <flightDetails
      :visible="isModalVisible"
      :flight="selectedFlight"
      @close="isModalVisible = false"
      @flight-deleted="fetchAllFlights"
    />
  </div>
</template>

<script>
import axios from "axios";
import flightDetails from "@/components/flightDetails.vue";

export default {
  components: {
    flightDetails,
  },
  data() {
    return {
      flights: [],
      categories: [],
      flightTypes: [],
      selectedCategories: [],
      selectedFlightTypes: [],
      filteredFlights: [],
      isModalVisible: false,
      selectedFlight: null,
    };
  },
  created() {
    this.fetchAllFlights();
    this.fetchFilters();
  },
  methods: {
    fetchAllFlights() {
      axios
        .get("http://localhost:3000/items")
        .then((response) => {
          this.flights = response.data.data;
          // Sort flights by date in descending order
          this.flights.sort((a, b) => {
            const dateTimeA = new Date(`${a.date}T${a.flightStart}`);
            const dateTimeB = new Date(`${b.date}T${b.flightStart}`);
            return dateTimeB - dateTimeA;
          });
          console.log("Fetched flights:", this.flights);
          this.filterFlights();
        })
        .catch((error) => {
          console.error("Error fetching flights:", error);
        });
    },
    displayValue(value) {
      return value ? value : "?";
    },
    fetchFilters() {
      axios
        .get("http://localhost:3002/get-settings")
        .then((response) => {
          this.categories = response.data.categories;
          this.selectedCategories = this.categories.slice();
          this.flightTypes = response.data.types;
          this.selectedFlightTypes = this.flightTypes.slice();
          this.filterFlights();
        })
        .catch((error) => {
          console.error("Error fetching settings:", error);
        });
    },
    filterFlights() {
      if (
        this.selectedCategories.length === 0 ||
        this.selectedFlightTypes.length === 0
      ) {
        this.filteredFlights = [];
      } else {
        this.filteredFlights = this.flights.filter((flight) => {
          return (
            this.selectedCategories.includes(flight.category) &&
            this.selectedFlightTypes.includes(flight.type)
          );
        });
      }
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
    toggleFlightType(flightType) {
      const index = this.selectedFlightTypes.indexOf(flightType);
      if (index > -1) {
        this.selectedFlightTypes.splice(index, 1);
      } else {
        this.selectedFlightTypes.push(flightType);
      }
      this.filterFlights();
    },
    openFlight(flight) {
      this.selectedFlight = flight;
      this.isModalVisible = true;
    },
  },
};
</script>

<style scoped>
@import "@/assets/flights.css";
@import "@/assets/buttons.css";
@import "@/assets/pages.css";
</style>
