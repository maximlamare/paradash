<template>
  <div class="page-bg-grey">
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
    <div class="flex justify-center mt-8">
      <apexchart
        type="donut"
        :options="chartOptionsCategories"
        :series="chartCategories"
      ></apexchart>
      <apexchart
        type="donut"
        :options="chartOptionsTypes"
        :series="chartTypes"
      ></apexchart>
    </div>
    <div class="flex justify-around mt-8">
      <div class="metric-box-grey w-1/4">
        <p class="metric-label"><i>Total number of flights: </i></p>
        <p class="metric-value">{{ this.flightCount }}</p>
      </div>
      <div class="metric-box-grey w-1/4">
        <p class="metric-label"><i>Total flying time:</i></p>
        <p class="metric-value">{{ this.flightTime }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import VueApexCharts from "vue3-apexcharts";

export default {
  name: "DashboardView",
  components: {
    apexchart: VueApexCharts,
  },
  created() {
    this.fetchFilters();
    this.fetchAllFlights();
    this.fetchFlightStats();
  },
  data() {
    return {
      categories: [],
      flightTypes: [],
      selectedCategories: [],
      selectedFlightTypes: [],
      flights: [],
      filteredFlights: [],
      flightCount: 0,
      flightTime: 0,
      chartOptionsCategories: {
        chart: {
          type: "donut",
          width: "100%",
        },
        labels: [],
      },
      chartOptionsTypes: {
        chart: {
          type: "donut",
          width: "100%",
        },
        labels: [],
      },
      chartCategories: [],
      chartTypes: [],
    };
  },
  methods: {
    fetchFilters() {
      axios
        .get("http://localhost:3001/get-settings")
        .then((response) => {
          this.categories = response.data.categories;
          this.selectedCategories = this.categories.slice();
          this.flightTypes = response.data.types;
          this.selectedFlightTypes = this.flightTypes.slice();
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
      this.fetchFlightStats();
    },
    toggleFlightType(flightType) {
      const index = this.selectedFlightTypes.indexOf(flightType);
      if (index > -1) {
        this.selectedFlightTypes.splice(index, 1);
      } else {
        this.selectedFlightTypes.push(flightType);
      }
      this.filterFlights();
      this.fetchFlightStats();
    },
    fetchAllFlights() {
      return axios
        .get("http://localhost:3001/items")
        .then((response) => {
          this.flights = response.data.data;
        })
        .catch((error) => {
          console.error("Error fetching flights:", error);
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
    async fetchFlightStats() {
      // Number of Flights
      await this.fetchAllFlights();
      this.filterFlights();
      this.flightCount = this.filteredFlights.length;

      // Total flying time
      let totalMinutes = 0;
      this.filteredFlights.forEach((flight) => {
        const [hours, minutes] = flight.flightTime.split(":").map(Number);
        totalMinutes += hours * 60 + minutes;
      });
      const totalHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      this.flightTime = `${totalHours}h ${remainingMinutes}m`;

      // Donut chart Categories
      const categoryCounts = this.flights.reduce((acc, flight) => {
        acc[flight.category] = (acc[flight.category] || 0) + 1;
        return acc;
      }, {});
      console.log(categoryCounts);

      this.chartOptionsCategories = {
        ...this.chartOptionsCategories,
        labels: Object.keys(categoryCounts),
      };
      this.chartCategories = Object.values(categoryCounts);
      console.log(this.chartOptionsCategories);
      // Donut chart Types
      const typeCounts = this.filteredFlights.reduce((acc, flight) => {
        acc[flight.type] = (acc[flight.type] || 0) + 1;
        return acc;
      }, {});
      this.chartOptionsTypes.labels = Object.keys(typeCounts);
      this.chartTypes = Object.values(typeCounts);
    },
  },
};
</script>

<style scoped>
@import "@/assets/flights.css";
@import "@/assets/buttons.css";
@import "@/assets/pages.css";
@import "@/assets/metrics.css";
</style>
