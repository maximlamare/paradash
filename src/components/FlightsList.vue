<template>
  <div class="flights-container">
    <h1>Flights</h1>

    <!-- Filters Container -->
    <div class="filters-container">
      <!-- Category Filter Tabs -->
      <div class="filter-tabs" v-if="flightCategories.length > 1">
        <h3>Filter by Category</h3>
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
        <h3>Filter by Flight Type</h3>
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
      <div class="filter-tabs">
        <h3>Filter by Glider</h3>
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

    <div class="card">
      <div v-if="loading" class="loading">Loading flights...</div>

      <div v-else-if="filteredFlights.length === 0" class="no-flights">
        <span v-if="hasActiveFilters"
          >No flights found matching the selected filters.</span
        >
        <span v-else>No flights recorded yet.</span>
      </div>

      <table v-else class="flights-table">
        <thead>
          <tr>
            <th>Flight #</th>
            <th>Date</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Flight Time</th>
            <th>Takeoff</th>
            <th>Landing</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(flight, index) in filteredFlights"
            :key="flight.id"
            @click="goToFlightDetail(flight.id)"
            class="flight-row"
          >
            <td>{{ getRelativeFlightNumber(index) }}</td>
            <td>{{ formatDate(flight.date) }}</td>
            <td>{{ flight.flightStart }}</td>
            <td>{{ flight.flightEnd }}</td>
            <td>{{ flight.flightTime }}</td>
            <td>
              <div class="location">
                <span class="location-name">{{ flight.takeoffLocation }}</span>
                <span class="country-code">{{
                  flight.takeoffCountryCode
                }}</span>
              </div>
            </td>
            <td>
              <div class="location">
                <span class="location-name">{{ flight.landingLocation }}</span>
                <span class="country-code">{{
                  flight.landingCountryCode
                }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Floating Add Flight Button -->
    <div class="floating-add-flight">
      <button class="add-flight-btn" @click="goToAddFlight">
        <span class="add-icon">+</span>
        <span class="add-text">Add Flight</span>
      </button>
    </div>
  </div>
</template>

<script>
import { formatDateShort } from "../utils/dateUtils.js";

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
        const response = await fetch("http://localhost:3001/api/flights");
        if (!response.ok) {
          throw new Error("Failed to fetch flights");
        }
        const data = await response.json();
        this.flights = data.data || [];
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
}

.flights-container h1 {
  color: #549f74;
  margin-bottom: 30px;
  text-align: center;
}

.flights-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
}

.flights-header h2 {
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.header-actions .btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* Component-specific button styles */

.btn-large {
  padding: 25px 30px;
  font-size: 20px;
  font-weight: 800;
}

.filters-container {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .filters-container {
    flex-direction: column;
    gap: 1rem;
  }
}

.filter-tabs {
  flex: 1;
  margin-bottom: 0;
}

.filter-tabs:last-child {
  text-align: right;
}

.filter-tabs:last-child .tabs-container {
  justify-content: flex-end;
}

.filter-tabs h3 {
  color: #495057;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
}

.tabs-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #dee2e6;
  background-color: white;
  color: #495057;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
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
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.glider-filter-dropdown {
  padding: 0.5rem 1rem;
  border: 2px solid #dee2e6;
  background-color: white;
  color: #495057;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  min-width: 200px;
  transition: all 0.3s ease;
}

.glider-filter-dropdown:hover {
  border-color: #549f74;
}

.glider-filter-dropdown:focus {
  outline: none;
  border-color: #549f74;
  box-shadow: 0 0 0 2px rgba(84, 159, 116, 0.25);
}

.flights-table {
  width: 100%;
  margin-top: 1rem;
}

.flights-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  padding: 1rem 0.75rem;
}

.flights-table td {
  padding: 0.75rem;
}

.flight-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.flight-row:hover {
  background-color: #f8f9fa;
}

/* Loading styles inherited from global */

.no-flights {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.weather-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.weather-badge.excellent {
  background-color: #d4edda;
  color: #155724;
}

.weather-badge.good {
  background-color: #d1ecf1;
  color: #0c5460;
}

.weather-badge.fair {
  background-color: #fff3cd;
  color: #856404;
}

.weather-badge.poor {
  background-color: #f8d7da;
  color: #721c24;
}

.location {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.location-name {
  font-weight: 500;
}

.country-code {
  font-size: 0.8rem;
  color: #666;
  font-weight: normal;
  background-color: #f8f9fa;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.stats-summary {
  display: flex;
  gap: 2rem;
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stat {
  color: #495057;
}

/* Floating Add Flight Button */
.floating-add-flight {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
}

.add-flight-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #549f74;
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.add-flight-btn:hover {
  background: #448060;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.add-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.add-text {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .flights-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .filter-tabs {
    margin-bottom: 1rem;
  }

  .filter-tabs:last-child {
    text-align: left;
  }

  .filter-tabs:last-child .tabs-container {
    justify-content: flex-start;
  }

  .tabs-container {
    gap: 0.25rem;
  }

  .tab-btn {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }

  .glider-filter-dropdown {
    font-size: 0.8rem;
    min-width: 150px;
    width: 100%;
  }

  .stats-summary {
    flex-direction: column;
    gap: 0.5rem;
  }

  .flights-table {
    font-size: 0.9rem;
  }

  .flights-table th,
  .flights-table td {
    padding: 0.5rem;
  }

  .floating-add-flight {
    bottom: 1rem;
    right: 1rem;
  }

  .add-flight-btn {
    padding: 0.9rem 1.3rem;
    font-size: 1rem;
  }
}
</style>
