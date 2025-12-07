<template>
  <div class="flights-container">
    <h1>Flights</h1>

    <div class="card">
      <div v-if="loading" class="loading">Loading flights...</div>

      <div v-else-if="filteredFlights.length === 0" class="no-flights">
        <span v-if="hasActiveFilters"
          >No flights found matching the selected filters.</span
        >
        <span v-else>No flights recorded yet.</span>
      </div>

      <div v-else class="table-wrapper">
        <table class="flights-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Time</th>
              <th>Takeoff</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(flight, index) in filteredFlights"
              :key="flight.id"
              @click="goToFlightDetail(flight.id)"
              class="flight-row"
            >
              <td class="flight-num">{{ getRelativeFlightNumber(index) }}</td>
              <td class="flight-date">{{ formatDate(flight.date) }}</td>
              <td class="flight-time">{{ flight.flightTime }}</td>
              <td class="flight-takeoff">
                <span class="location-name">{{ flight.takeoffLocation }}</span>
                <span class="country-code">{{ flight.takeoffCountryCode }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Filters Container - Now below the table -->
    <div class="filters-container" v-if="flightCategories.length > 1 || flightTypes.length > 1 || availableGliders.length > 0">
      <button 
        class="filters-toggle" 
        @click="showFilters = !showFilters"
        :class="{ active: hasActiveFilters }"
      >
        <span>Filters</span>
        <span v-if="hasActiveFilters" class="filter-badge">Active</span>
        <span class="toggle-icon">{{ showFilters ? '▲' : '▼' }}</span>
      </button>
      
      <div v-if="showFilters" class="filters-panel">
        <!-- Category Filter Tabs -->
        <div class="filter-tabs" v-if="flightCategories.length > 1">
          <h4>Category</h4>
          <div class="tabs-container">
            <button
              @click="selectedCategory = 'All'"
              class="tab-btn"
              :class="{ active: selectedCategory === 'All' }"
            >
              All
            </button>
            <button
              v-for="category in flightCategories"
              :key="category"
              @click="selectedCategory = category"
              class="tab-btn"
              :class="{ active: selectedCategory === category }"
            >
              {{ category }}
            </button>
          </div>
        </div>

        <!-- Flight Type Filter Tabs -->
        <div class="filter-tabs" v-if="flightTypes.length > 1">
          <h4>Type</h4>
          <div class="tabs-container">
            <button
              @click="selectedFlightType = 'All'"
              class="tab-btn"
              :class="{ active: selectedFlightType === 'All' }"
            >
              All
            </button>
            <button
              v-for="flightType in flightTypes"
              :key="flightType"
              @click="selectedFlightType = flightType"
              class="tab-btn"
              :class="{ active: selectedFlightType === flightType }"
            >
              {{ flightType }}
            </button>
          </div>
        </div>

        <!-- Glider Filter Dropdown -->
        <div class="filter-tabs" v-if="availableGliders.length > 0">
          <h4>Glider</h4>
          <div class="dropdown-container">
            <select v-model="selectedGlider" class="glider-filter-dropdown">
              <option value="All">All Gliders</option>
              <option
                v-for="glider in availableGliders"
                :key="glider.id"
                :value="glider.id"
              >
                {{ glider.manufacturer }} {{ glider.model }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Add Flight Button -->
    <div class="floating-add-flight">
      <button class="add-flight-btn" @click="goToAddFlight">
        <span class="add-icon">+</span>
      </button>
    </div>
  </div>
</template>

<script>
import { formatDateShort } from "../utils/dateUtils.js";
import { flightOperations } from "../database/database.js";

export default {
  name: "FlightsList",
  data() {
    return {
      flights: [],
      loading: false,
      selectedCategory: "All",
      selectedFlightType: "All",
      selectedGlider: "All",
      flightCategories: ["On-site", "XC", "H&F"],
      flightTypes: ["Paragliding", "Speedflying"],
      showFilters: false,
    };
  },
  computed: {
    availableGliders() {
      // Get unique gliders from flights that have glider information
      const gliderMap = new Map();

      this.flights.forEach((flight) => {
        if (flight.glider && flight.manufacturer && flight.model) {
          const key = `${flight.manufacturer}-${flight.model}`;
          if (!gliderMap.has(key)) {
            gliderMap.set(key, {
              id: flight.glider,
              manufacturer: flight.manufacturer,
              model: flight.model,
            });
          }
        }
      });

      return Array.from(gliderMap.values()).sort((a, b) =>
        `${a.manufacturer} ${a.model}`.localeCompare(
          `${b.manufacturer} ${b.model}`
        )
      );
    },
    filteredFlights() {
      let filtered = this.flights;

      // Filter by category
      if (this.selectedCategory !== "All") {
        filtered = filtered.filter(
          (flight) => flight.category === this.selectedCategory
        );
      }

      // Filter by flight type
      if (this.selectedFlightType !== "All") {
        filtered = filtered.filter(
          (flight) => flight.type === this.selectedFlightType
        );
      }

      // Filter by glider
      if (this.selectedGlider !== "All") {
        filtered = filtered.filter(
          (flight) => flight.glider === parseInt(this.selectedGlider)
        );
      }

      return filtered;
    },
    hasActiveFilters() {
      return (
        this.selectedCategory !== "All" ||
        this.selectedFlightType !== "All" ||
        this.selectedGlider !== "All"
      );
    },
    totalFlightTime() {
      const totalMinutes = this.filteredFlights.reduce((total, flight) => {
        if (!flight.flightTime || typeof flight.flightTime !== "string") {
          return total;
        }

        const parts = flight.flightTime.split(":");
        if (parts.length !== 2) {
          return total;
        }

        const [hoursRaw, minutesRaw] = parts;
        const hours = Number.parseInt(hoursRaw, 10);
        const minutes = Number.parseInt(minutesRaw, 10);

        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
          return total;
        }

        return total + hours * 60 + minutes;
      }, 0);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    },
    recreationFlights() {
      return this.filteredFlights.filter(
        (flight) =>
          flight.category === "Recreation" || flight.category === "On-site"
      ).length;
    },
    crossCountryFlights() {
      return this.filteredFlights.filter(
        (flight) =>
          flight.category === "Cross Country" || flight.category === "XC"
      ).length;
    },
  },
  mounted() {
    this.loadFlights();
    this.loadSettings();
  },
  methods: {
    loadSettings() {
      // Load settings from localStorage or use defaults
      const savedCategories = localStorage.getItem("flightCategories");
      const savedFlightTypes = localStorage.getItem("flightTypes");

      if (savedCategories) {
        this.flightCategories = JSON.parse(savedCategories);
      }

      if (savedFlightTypes) {
        this.flightTypes = JSON.parse(savedFlightTypes);
      }
    },
    async loadFlights() {
      this.loading = true;

      try {
        this.flights = await flightOperations.getAllFlights();
      } catch (error) {
        console.error("Error loading flights:", error);
        this.flights = [];
      } finally {
        this.loading = false;
      }
    },
    goToAddFlight() {
      this.$router.push("/add-flight");
    },
    goToFlightDetail(flightId) {
      this.$router.push(`/flight/${flightId}`);
    },
    getRelativeFlightNumber(index) {
      // Return relative numbering based on filtered results (descending order)
      return this.filteredFlights.length - index;
    },
    formatDate(dateString) {
      return formatDateShort(dateString);
    },
  },
};
</script>

<style scoped>
.flights-container {
  max-width: 100%;
  padding-bottom: 80px; /* Space for floating button */
}

.flights-container h1 {
  color: #549f74;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.5rem;
}

.card {
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.flights-table {
  width: 100%;
  min-width: 320px;
  border-collapse: collapse;
}

.flights-table th {
  background-color: #549f74;
  font-weight: 600;
  color: white;
  padding: 0.75rem 0.5rem;
  font-size: 0.85rem;
  text-align: left;
  white-space: nowrap;
}

.flights-table td {
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}

.flight-num {
  font-weight: 600;
  color: #549f74;
  width: 40px;
}

.flight-date {
  white-space: nowrap;
  width: 90px;
}

.flight-time {
  font-weight: 500;
  width: 55px;
}

.flight-takeoff {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.flight-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.flight-row:hover {
  background-color: #f0f7f3;
}

.flight-row:active {
  background-color: #e0f0e8;
}

.no-flights {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.location-name {
  font-weight: 500;
  color: #333;
}

.country-code {
  font-size: 0.75rem;
  color: #888;
  font-weight: normal;
}

/* Filters Container - Collapsible */
.filters-container {
  margin-top: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.filters-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
}

.filters-toggle.active {
  color: #549f74;
}

.filter-badge {
  background: #549f74;
  color: white;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
}

.toggle-icon {
  font-size: 0.7rem;
  color: #888;
}

.filters-panel {
  padding: 1rem;
  border-top: 1px solid #e9ecef;
}

.filter-tabs {
  margin-bottom: 1rem;
}

.filter-tabs:last-child {
  margin-bottom: 0;
}

.filter-tabs h4 {
  color: #495057;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.tabs-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tab-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid #dee2e6;
  background-color: white;
  color: #495057;
  border-radius: 16px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  border-color: #549f74;
  color: #549f74;
}

.tab-btn.active {
  background-color: #549f74;
  border-color: #549f74;
  color: white;
}

.dropdown-container {
  display: flex;
}

.glider-filter-dropdown {
  padding: 0.4rem 0.8rem;
  border: 1px solid #dee2e6;
  background-color: white;
  color: #495057;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  width: 100%;
  max-width: 250px;
}

.glider-filter-dropdown:focus {
  outline: none;
  border-color: #549f74;
}

/* Floating Add Flight Button */
.floating-add-flight {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
}

.add-flight-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: #549f74;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.8rem;
  font-weight: 400;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(84, 159, 116, 0.4);
  transition: all 0.3s ease;
}

.add-flight-btn:hover {
  background: #448060;
  box-shadow: 0 6px 16px rgba(84, 159, 116, 0.5);
  transform: scale(1.05);
}

.add-flight-btn:active {
  transform: scale(0.95);
}

.add-icon {
  line-height: 1;
  margin-top: -2px;
}

@media (max-width: 768px) {
  .flights-container {
    padding-bottom: 100px;
  }

  .flights-container h1 {
    font-size: 1.3rem;
    margin-bottom: 0.75rem;
  }

  .flights-table th {
    padding: 0.6rem 0.4rem;
    font-size: 0.8rem;
  }

  .flights-table td {
    padding: 0.5rem 0.4rem;
    font-size: 0.85rem;
  }

  .flight-num {
    width: 35px;
  }

  .flight-date {
    width: 75px;
    font-size: 0.8rem;
  }

  .flight-time {
    width: 50px;
  }

  .location-name {
    font-size: 0.85rem;
  }

  .country-code {
    font-size: 0.7rem;
  }

  .floating-add-flight {
    bottom: 1rem;
    right: 1rem;
  }

  .add-flight-btn {
    width: 52px;
    height: 52px;
    font-size: 1.6rem;
  }
}

@media (max-width: 400px) {
  .flights-table th,
  .flights-table td {
    padding: 0.4rem 0.3rem;
  }

  .flight-date {
    font-size: 0.75rem;
  }
}
</style>
