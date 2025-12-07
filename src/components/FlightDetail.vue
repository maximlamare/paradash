<template>
  <div class="flight-detail">
    <div v-if="loading" class="loading">Loading flight details...</div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="flight" class="flight-content">
      <!-- Header with back button -->
      <div class="flight-header">
        <div class="flight-nav">
          <button
            @click="goBack"
            class="nav-btn back-btn"
            aria-label="Back to flights list"
          >
            ←
          </button>
          <button
            @click="goToPreviousFlight"
            class="nav-btn prev-btn"
            :disabled="!previousFlight"
            aria-label="Previous flight"
            title="Previous flight"
          >
            ‹
          </button>
          <button
            @click="goToNextFlight"
            class="nav-btn next-btn"
            :disabled="!nextFlight"
            aria-label="Next flight"
            title="Next flight"
          >
            ›
          </button>
        </div>
        <h1>Flight Details</h1>
        <div class="header-actions">
          <button @click="editFlight" class="action-btn edit-btn">
            Edit Flight
          </button>
          <button
            @click="deleteFlight"
            class="action-btn delete-btn"
            :disabled="deleting"
          >
            {{ deleting ? "Deleting..." : "Delete Flight" }}
          </button>
        </div>
      </div>

      <!-- Flight Info Cards -->
      <div class="info-grid">
        <!-- Flight Overview Card -->
        <div class="info-card">
          <h3>Flight Overview</h3>
          <div class="info-row">
            <span class="label">Date:</span>
            <span class="value">{{ formatDate(flight.date) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Category:</span>
            <span class="value">{{ flight.category }}</span>
          </div>
          <div class="info-row">
            <span class="label">Type:</span>
            <span class="value">{{ flight.type }}</span>
          </div>
        </div>

        <!-- Time Details Card -->
        <div class="info-card">
          <h3>Time</h3>
          <div class="info-row">
            <span class="label">Start Time:</span>
            <span class="value">{{ flight.flightStart }}</span>
          </div>
          <div class="info-row">
            <span class="label">End Time:</span>
            <span class="value">{{ flight.flightEnd }}</span>
          </div>
          <div class="info-row">
            <span class="label">Duration:</span>
            <span class="value duration">{{ flight.flightTime }}</span>
          </div>
        </div>

        <!-- Location Details Card -->
        <div class="info-card">
          <h3>Location</h3>
          <div class="location-detail">
            <h4>Takeoff</h4>
            <div class="location-info">
              <span class="location-name">{{
                formatLocationWithCountry(
                  flight.takeoffLocation,
                  flight.takeoffCountryCode
                )
              }}</span>
            </div>
          </div>
          <div class="location-detail">
            <h4>Landing</h4>
            <div class="location-info">
              <span class="location-name">{{
                formatLocationWithCountry(
                  flight.landingLocation,
                  flight.landingCountryCode
                )
              }}</span>
            </div>
          </div>
        </div>

        <!-- Equipment Card -->
        <div class="info-card" v-if="flight.manufacturer || flight.model">
          <h3>Equipment</h3>
          <div class="info-row">
            <span class="label">Glider:</span>
            <span class="value">
              {{ flight.manufacturer }} {{ flight.model }}
            </span>
          </div>
        </div>

        <!-- IGC File Card -->
        <div class="info-card" v-if="flight.igcFilePath">
          <h3>IGC File</h3>
          <div class="info-row">
            <span class="label">File:</span>
            <span class="value">{{ flight.igcFilePath }}</span>
          </div>
          <div class="info-row" v-if="flight.igcSerial">
            <span class="label">Serial:</span>
            <span class="value">{{ flight.igcSerial }}</span>
          </div>
          <div class="igc-actions">
            <button @click="downloadIGC" class="btn-download">
              📥 Download IGC
            </button>
          </div>
        </div>

        <!-- Distance Card -->
        <div
          class="info-card"
          v-if="flight.trackDistance || flight.straightDistance"
        >
          <h3>Distance</h3>
          <div class="info-row" v-if="flight.trackDistance">
            <span class="label">Track Distance:</span>
            <span class="value">{{
              formatDistance(flight.trackDistance)
            }}</span>
          </div>
          <div class="info-row" v-if="flight.straightDistance">
            <span class="label">Straight Line:</span>
            <span class="value">{{
              formatDistance(flight.straightDistance)
            }}</span>
          </div>
        </div>

        <!-- Links Card -->
        <div class="info-card" v-if="flight.links && flight.links.trim()">
          <h3>Links</h3>
          <div class="links-content">
            <a
              v-for="(link, index) in getFlightLinks(flight.links)"
              :key="index"
              :href="link"
              target="_blank"
              rel="noopener noreferrer"
              class="flight-link"
            >
              🔗 {{ link }}
            </a>
          </div>
        </div>

        <!-- Comments Card -->
        <div
          class="info-card full-width"
          v-if="flight.comments && flight.comments.trim()"
        >
          <h3>Comments</h3>
          <div class="comments-content">
            {{ flight.comments }}
          </div>
        </div>
      </div>

      <!-- IGC Flight Track Map -->
      <div v-if="flight.igcFilePath" class="map-section">
        <div class="info-card full-width">
          <h3>Flight Track</h3>
          <div v-if="loadingTrack" class="loading-track">
            Loading flight track...
          </div>
          <div v-else-if="trackError" class="track-error">
            {{ trackError }}
          </div>
          <div
            v-else-if="trackData && trackData.trackPoints"
            class="map-container"
          >
            <div id="flight-map" class="flight-map"></div>
          </div>
          <div v-else class="no-track-data">No flight track data available</div>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>

    <!-- Edit Flight Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content edit-modal" @click.stop>
        <div class="modal-header">
          <h2>Edit Flight</h2>
          <button @click="closeEditModal" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="updateFlight" class="flight-form">
          <div class="form-grid">
            <!-- Flight Category -->
            <div class="form-group">
              <label for="editCategory">Category</label>
              <select id="editCategory" v-model="editForm.category" required>
                <option value="">Select category</option>
                <option value="On-site">On-site</option>
                <option value="XC">XC</option>
                <option value="H&F">H&F</option>
                <option value="Competition">Competition</option>
                <option value="Training">Training</option>
              </select>
            </div>

            <!-- Flight Type -->
            <div class="form-group">
              <label for="editType">Type</label>
              <select id="editType" v-model="editForm.type" required>
                <option value="">Select type</option>
                <option value="Paragliding">Paragliding</option>
                <option value="Hang gliding">Hang gliding</option>
              </select>
            </div>

            <!-- Date -->
            <div class="form-group">
              <label for="editDate">Date</label>
              <input
                type="date"
                id="editDate"
                v-model="editForm.date"
                required
              />
            </div>

            <!-- Glider -->
            <div class="form-group">
              <label for="editGlider">Glider</label>
              <select id="editGlider" v-model="editForm.glider" required>
                <option value="">Select glider</option>
                <option
                  v-for="glider in gear.filter(
                    (g) => g.type === 'gliders' && g.is_active
                  )"
                  :key="glider.id"
                  :value="glider.id"
                >
                  {{ glider.manufacturer }} {{ glider.model }}
                </option>
              </select>
            </div>

            <!-- Start Time -->
            <div class="form-group">
              <label for="editStartTime">Start Time</label>
              <input
                type="time"
                id="editStartTime"
                v-model="editForm.flightStart"
              />
            </div>

            <!-- Flight Duration -->
            <div class="form-group">
              <label for="editDuration">Flight Duration</label>
              <input
                type="text"
                id="editDuration"
                v-model="editForm.flightTime"
                placeholder="HH:MM"
                pattern="[0-9]{2}:[0-9]{2}"
              />
            </div>

            <!-- Takeoff Location -->
            <div class="form-group">
              <label for="editTakeoffLocation">Takeoff Location</label>
              <input
                type="text"
                id="editTakeoffLocation"
                v-model="editForm.takeoffLocation"
                placeholder="e.g., Monte Grappa"
              />
            </div>

            <!-- Takeoff Country -->
            <div class="form-group">
              <label for="editTakeoffCountry">Takeoff Country</label>
              <input
                type="text"
                id="editTakeoffCountry"
                v-model="editForm.takeoffCountryCode"
                placeholder="e.g., IT"
                maxlength="2"
              />
            </div>

            <!-- Landing Location -->
            <div class="form-group">
              <label for="editLandingLocation">Landing Location</label>
              <input
                type="text"
                id="editLandingLocation"
                v-model="editForm.landingLocation"
                placeholder="e.g., Bassano del Grappa"
              />
            </div>

            <!-- Landing Country -->
            <div class="form-group">
              <label for="editLandingCountry">Landing Country</label>
              <input
                type="text"
                id="editLandingCountry"
                v-model="editForm.landingCountryCode"
                placeholder="e.g., IT"
                maxlength="2"
              />
            </div>

            <!-- Links -->
            <div class="form-group full-width">
              <label for="editLinks">Links</label>
              <input
                type="text"
                id="editLinks"
                v-model="editForm.links"
                placeholder="Comma-separated links (optional)"
              />
            </div>
          </div>

          <!-- Comments -->
          <div class="form-group">
            <label for="editComments">Comments</label>
            <textarea
              id="editComments"
              v-model="editForm.comments"
              placeholder="Flight notes, conditions, etc..."
              rows="3"
            ></textarea>
          </div>

          <!-- IGC File Management -->
          <div class="form-group">
            <label>IGC Flight Log</label>
            <div class="igc-management">
              <!-- Current IGC File -->
              <div
                v-if="editForm.igcFilePath && !newIgcFile"
                class="current-igc"
              >
                <div class="igc-info">
                  <span>Current: {{ editForm.igcFilePath }}</span>
                  <button
                    type="button"
                    @click="removeIgcFile"
                    class="remove-igc-btn"
                  >
                    Remove IGC File
                  </button>
                </div>
              </div>

              <!-- New IGC File Upload -->
              <div
                v-if="!editForm.igcFilePath || newIgcFile"
                class="igc-upload"
              >
                <input
                  type="file"
                  accept=".igc"
                  @change="handleIgcFileSelect"
                  class="file-input"
                />
                <p class="upload-hint">Upload a new IGC file (optional)</p>
              </div>

              <!-- New file selected -->
              <div v-if="newIgcFile" class="new-igc">
                <span>New file: {{ newIgcFile.name }}</span>
                <button
                  type="button"
                  @click="newIgcFile = null"
                  class="cancel-new-igc"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeEditModal" class="cancel-btn">
              Cancel
            </button>
            <button type="submit" class="submit-btn" :disabled="uploadingIgc">
              {{ uploadingIgc ? "Updating..." : "Update Flight" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { flightOperations } from "../database/database.js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatLocationWithCountry as formatLocationWithCountryUtil } from "../utils/countryUtils.js";
import { formatDateWithWeekday } from "../utils/dateUtils.js";

// Fix for default markers in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default {
  name: "FlightDetail",
  data() {
    return {
      flight: null,
      loading: false,
      error: "",
      deleting: false,
      trackData: null,
      loadingTrack: false,
      trackError: "",
      map: null,
      showEditModal: false,
      flightsList: [],
      flightsListLoading: false,
      currentFlightIndex: -1,
      editForm: {
        category: "",
        type: "",
        date: "",
        glider: "",
        flightStart: "",
        flightEnd: "",
        takeoffLocation: "",
        takeoffCountryCode: "",
        landingLocation: "",
        landingCountryCode: "",
        flightTime: "",
        links: "",
        comments: "",
        igcFilePath: "",
        igcSerial: "",
      },
      gear: [],
      newIgcFile: null,
      uploadingIgc: false,
      successMessage: "",
      errorMessage: "",
    };
  },
  async mounted() {
    await this.loadFlightsList();
    await this.loadFlight();
  },
  beforeUnmount() {
    if (this.map) {
      this.map.remove();
    }
  },
  computed: {
    previousFlight() {
      if (this.currentFlightIndex > 0) {
        return this.flightsList[this.currentFlightIndex - 1] || null;
      }
      return null;
    },
    nextFlight() {
      if (
        this.currentFlightIndex > -1 &&
        this.currentFlightIndex < this.flightsList.length - 1
      ) {
        return this.flightsList[this.currentFlightIndex + 1] || null;
      }
      return null;
    },
  },
  watch: {
    async "$route.params.id"(newId, oldId) {
      if (newId !== oldId) {
        if (!this.flightsList.length) {
          await this.loadFlightsList();
        }
        await this.loadFlight();
      }
    },
  },
  methods: {
    async loadFlightsList() {
      if (this.flightsList.length) {
        this.updateCurrentFlightIndex();
        return;
      }

      this.flightsListLoading = true;

      try {
        const response = await fetch("http://localhost:3001/api/flights");

        if (!response.ok) {
          throw new Error("Failed to fetch flights list");
        }

        const data = await response.json();
        const flights = Array.isArray(data.data) ? [...data.data] : [];

        flights.sort((a, b) => {
          const dateA = a?.date ? new Date(a.date).getTime() : 0;
          const dateB = b?.date ? new Date(b.date).getTime() : 0;

          if (dateA !== dateB) {
            return dateB - dateA;
          }

          return Number(b.id || 0) - Number(a.id || 0);
        });

        this.flightsList = flights;
      } catch (error) {
        console.error("Error loading flights list:", error);
        this.flightsList = [];
      } finally {
        this.flightsListLoading = false;
        if (this.flight) {
          this.updateCurrentFlightIndex();
        }
      }
    },

    async loadFlight() {
      this.loading = true;
      this.error = "";

      try {
        const flightId = this.$route.params.id;

        if (this.map) {
          this.map.remove();
          this.map = null;
        }
        this.trackData = null;
        this.trackError = "";

        const response = await fetch(
          `http://localhost:3001/api/flights/${flightId}`
        );

        if (!response.ok) {
          throw new Error("Flight not found");
        }

        const data = await response.json();
        this.flight = data.data;
        this.updateCurrentFlightIndex();

        // Load track data if IGC file exists
        if (this.flight.igcFilePath) {
          await this.loadTrackData();
        }
      } catch (error) {
        console.error("Error loading flight:", error);
        this.error = "Failed to load flight details";
      } finally {
        this.loading = false;
      }
    },

    updateCurrentFlightIndex() {
      if (!this.flight || !this.flightsList.length) {
        this.currentFlightIndex = -1;
        return;
      }

      const index = this.flightsList.findIndex(
        (item) => String(item.id) === String(this.flight.id)
      );

      this.currentFlightIndex = index;
    },

    navigateToFlight(flightId) {
      if (!flightId) {
        return;
      }

      if (String(flightId) === String(this.$route.params.id)) {
        return;
      }

      this.$router.push({ path: `/flight/${flightId}` });
    },

    goToPreviousFlight() {
      const previous = this.flightsList[this.currentFlightIndex - 1];
      if (previous) {
        this.navigateToFlight(previous.id);
      }
    },

    goToNextFlight() {
      const next = this.flightsList[this.currentFlightIndex + 1];
      if (next) {
        this.navigateToFlight(next.id);
      }
    },

    async loadTrackData() {
      this.loadingTrack = true;
      this.trackError = "";

      try {
        console.log("Loading track data for:", this.flight.igcFilePath);
        const response = await fetch(
          `http://localhost:3001/api/igc/track/${this.flight.igcFilePath}`
        );

        if (!response.ok) {
          throw new Error("Failed to load track data");
        }

        this.trackData = await response.json();
        console.log("Track data loaded:", this.trackData);

        // Initialize map after data is loaded with a small delay
        this.$nextTick(() => {
          setTimeout(() => {
            this.initializeMap();
          }, 100);
        });
      } catch (error) {
        console.error("Error loading track data:", error);
        this.trackError = "Failed to load flight track";
      } finally {
        this.loadingTrack = false;
      }
    },

    initializeMap() {
      console.log("Initializing map with track data:", this.trackData);
      if (!this.trackData || !this.trackData.trackPoints) {
        console.error("No track data available for map initialization");
        return;
      }

      // Wait for the map container to be available
      const mapContainer = document.getElementById("flight-map");
      if (!mapContainer) {
        console.error("Map container not found");
        return;
      }

      console.log("Map container found, creating map...");

      // Initialize Leaflet map
      this.map = L.map("flight-map").setView(
        [this.trackData.center.latitude, this.trackData.center.longitude],
        12
      );

      // Add OpenTopoMap tiles
      L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution:
          "Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)",
        maxZoom: 17,
      }).addTo(this.map);

      // Create polyline from track points
      const trackLine = this.trackData.trackPoints.map((point) => [
        point.latitude,
        point.longitude,
      ]);

      console.log("Track line points:", trackLine.length);

      // Add flight track to map
      const flightPath = L.polyline(trackLine, {
        color: "#FF6B35",
        weight: 3,
        opacity: 0.8,
      }).addTo(this.map);

      // Add start marker (green pin)
      const startPoint = this.trackData.trackPoints[0];
      const startIcon = L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.marker([startPoint.latitude, startPoint.longitude], {
        icon: startIcon,
      })
        .addTo(this.map)
        .bindPopup("Takeoff");

      // Add end marker (red pin)
      const endPoint =
        this.trackData.trackPoints[this.trackData.trackPoints.length - 1];
      const endIcon = L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.marker([endPoint.latitude, endPoint.longitude], {
        icon: endIcon,
      })
        .addTo(this.map)
        .bindPopup("Landing");

      // Fit map to track bounds
      this.map.fitBounds(flightPath.getBounds(), { padding: [20, 20] });

      console.log("Map initialized successfully");
    },

    goBack() {
      this.$router.push("/flights");
    },

    formatDate(dateString) {
      return formatDateWithWeekday(dateString);
    },

    formatLocationWithCountry(location, countryCode) {
      return formatLocationWithCountryUtil(location, countryCode);
    },

    formatDistance(distanceKm) {
      if (!distanceKm) return "--";
      return `${distanceKm.toFixed(2)} km`;
    },

    getCategoryClass(category) {
      const classMap = {
        "On-site": "on-site",
        XC: "xc",
        "H&F": "hf",
        Recreation: "recreation",
        "Cross Country": "cross-country",
        Competition: "competition",
        Training: "training",
      };
      return classMap[category] || "other";
    },

    getFlightLinks(linksString) {
      if (!linksString || !linksString.trim()) return [];
      return linksString
        .split(",")
        .map((link) => link.trim())
        .filter((link) => link);
    },

    async downloadIGC() {
      if (!this.flight.igcFilePath) return;

      try {
        const response = await fetch(
          `http://localhost:3001/api/igc/download/${this.flight.igcFilePath}`
        );
        if (!response.ok) throw new Error("Failed to download IGC file");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = this.flight.igcFilePath;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading IGC file:", error);
        alert("Failed to download IGC file");
      }
    },

    async editFlight() {
      await this.loadGear();
      this.editForm = {
        category: this.flight.category || "",
        type: this.flight.type || "",
        date: this.flight.date || "",
        glider: this.flight.glider || "",
        flightStart: this.flight.flightStart || "",
        flightEnd: this.flight.flightEnd || "",
        takeoffLocation: this.flight.takeoffLocation || "",
        takeoffCountryCode: this.flight.takeoffCountryCode || "",
        landingLocation: this.flight.landingLocation || "",
        landingCountryCode: this.flight.landingCountryCode || "",
        flightTime: this.flight.flightTime || "",
        links: this.flight.links || "",
        comments: this.flight.comments || "",
        igcFilePath: this.flight.igcFilePath || "",
        igcSerial: this.flight.igcSerial || "",
      };
      this.showEditModal = true;
    },

    async deleteFlight() {
      if (
        !confirm(
          "Are you sure you want to delete this flight? This action cannot be undone."
        )
      ) {
        return;
      }

      this.deleting = true;

      try {
        await flightOperations.deleteFlight(this.flight.id);
        this.$router.push("/");
      } catch (error) {
        console.error("Error deleting flight:", error);
        alert("Failed to delete flight");
      } finally {
        this.deleting = false;
      }
    },

    async loadGear() {
      try {
        const response = await fetch("http://localhost:3001/api/gear");
        const data = await response.json();
        this.gear = data.data || [];
      } catch (error) {
        console.error("Error loading gear:", error);
      }
    },

    async updateFlight() {
      try {
        // Calculate end time from start time and duration
        this.calculateAndSetEndTime();

        // Handle IGC file upload if new file selected
        let igcData = null;
        if (this.newIgcFile) {
          igcData = await this.uploadNewIgcFile();
          if (igcData) {
            this.editForm.igcFilePath = igcData.filename;
            this.editForm.igcSerial = igcData.igcSerial || "";
          }
        }

        await flightOperations.updateFlight(this.flight.id, this.editForm);

        // Update local flight object
        Object.assign(this.flight, this.editForm);

        this.showEditModal = false;
        this.successMessage = "Flight updated successfully";
        setTimeout(() => (this.successMessage = ""), 3000);

        // Reload track data if IGC file changed
        if (this.newIgcFile && this.flight.igcFilePath) {
          await this.loadTrackData();
        }
      } catch (error) {
        this.errorMessage = "Failed to update flight";
        console.error("Error updating flight:", error);
        setTimeout(() => (this.errorMessage = ""), 3000);
      }
    },

    async uploadNewIgcFile() {
      if (!this.newIgcFile) return null;

      this.uploadingIgc = true;
      try {
        const formData = new FormData();
        formData.append("igcFile", this.newIgcFile);

        const response = await fetch("http://localhost:3001/api/igc/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload IGC file");
        }

        const result = await response.json();
        return result.igcData;
      } catch (error) {
        throw error;
      } finally {
        this.uploadingIgc = false;
      }
    },

    closeEditModal() {
      this.showEditModal = false;
      this.newIgcFile = null;
      // Reset form to current flight values
      this.editForm = {
        category: this.flight.category || "",
        type: this.flight.type || "",
        date: this.flight.date || "",
        glider: this.flight.glider || "",
        flightStart: this.flight.flightStart || "",
        flightEnd: this.flight.flightEnd || "",
        takeoffLocation: this.flight.takeoffLocation || "",
        takeoffCountryCode: this.flight.takeoffCountryCode || "",
        landingLocation: this.flight.landingLocation || "",
        landingCountryCode: this.flight.landingCountryCode || "",
        flightTime: this.flight.flightTime || "",
        links: this.flight.links || "",
        comments: this.flight.comments || "",
        igcFilePath: this.flight.igcFilePath || "",
        igcSerial: this.flight.igcSerial || "",
      };
    },

    handleIgcFileSelect(event) {
      const file = event.target.files[0];
      if (file && file.name.toLowerCase().endsWith(".igc")) {
        this.newIgcFile = file;
      } else {
        alert("Please select a valid IGC file");
        event.target.value = "";
      }
    },

    removeIgcFile() {
      this.editForm.igcFilePath = "";
      this.editForm.igcSerial = "";
    },

    getGliderName(gliderId) {
      const glider = this.gear.find((g) => g.id === parseInt(gliderId));
      return glider
        ? `${glider.manufacturer} ${glider.model}`
        : "Unknown Glider";
    },

    calculateAndSetEndTime() {
      if (this.editForm.flightStart && this.editForm.flightTime) {
        try {
          // Parse start time
          const [startHours, startMinutes] = this.editForm.flightStart
            .split(":")
            .map(Number);

          // Parse duration (HH:MM format)
          const [durationHours, durationMinutes] = this.editForm.flightTime
            .split(":")
            .map(Number);

          // Calculate total minutes
          const startTotalMinutes = startHours * 60 + startMinutes;
          const durationTotalMinutes = durationHours * 60 + durationMinutes;
          const endTotalMinutes = startTotalMinutes + durationTotalMinutes;

          // Convert back to hours and minutes
          const endHours = Math.floor(endTotalMinutes / 60) % 24; // Handle day overflow
          const endMinutes = endTotalMinutes % 60;

          // Format as HH:MM
          this.editForm.flightEnd = `${String(endHours).padStart(
            2,
            "0"
          )}:${String(endMinutes).padStart(2, "0")}`;
        } catch (error) {
          console.error("Error calculating end time:", error);
          // Don't update end time if calculation fails
        }
      }
    },
  },
};
</script>

<style scoped>
.flight-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.error {
  text-align: center;
  padding: 40px;
  font-size: 1.1rem;
  color: #dc3545;
}

.flight-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #eee;
  position: relative;
}

.flight-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.nav-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #adb5bd;
}

.nav-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  background: #f1f3f5;
  border-color: #dee2e6;
}

.prev-btn,
.next-btn {
  padding: 8px 12px;
  font-size: 18px;
}

.flight-header h1 {
  margin: 0;
  color: #549f74;
  text-align: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.info-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.info-card.full-width {
  grid-column: 1 / -1;
}

.info-card h3 {
  color: #549f74;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px 0;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 600;
  color: #6c757d;
  min-width: 100px;
}

.value {
  color: #333;
  font-weight: 500;
}

.duration {
  font-family: "Courier New", monospace;
  font-weight: bold;
  color: #549f74;
}

.category-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
}

.category-badge.on-site {
  background-color: #e8f5f0;
  color: #2d7a52;
}

.category-badge.xc {
  background-color: #f0f9f4;
  color: #53b889;
}

.category-badge.hf {
  background-color: #e6f7ed;
  color: #3a9b63;
}

.location-detail {
  margin-bottom: 15px;
}

.location-detail:last-child {
  margin-bottom: 0;
}

.location-detail h4 {
  color: #6c757d;
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.location-name {
  font-weight: 500;
  color: #333;
}

.country-code {
  background-color: #f8f9fa;
  color: #6c757d;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.igc-actions {
  margin-top: 15px;
}

.btn-download {
  background: #549f74;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-download:hover {
  background: #448060;
}

.links-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flight-link {
  color: #549f74;
  text-decoration: none;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.flight-link:hover {
  background: #e9ecef;
}

.comments-content {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  line-height: 1.6;
  color: #333;
  border-left: 4px solid #549f74;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding: 20px;
  border-top: 2px solid #e9ecef;
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
}

.delete-btn:hover:not(:disabled) {
  background: #ffcdd2;
}

.delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .flight-detail {
    padding: 15px;
  }

  .flight-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .flight-header h1 {
    font-size: 1.5rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .info-card {
    padding: 15px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}

/* Map Styles */
.map-section {
  margin-bottom: 30px;
}

.map-container {
  margin-top: 15px;
}

.flight-map {
  height: 400px;
  width: 100%;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.loading-track {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

.track-error,
.no-track-data {
  text-align: center;
  padding: 20px;
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
}

.track-info {
  margin-top: 15px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.track-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.track-stats .stat {
  font-size: 14px;
  color: #495057;
}

.track-stats .stat strong {
  color: #549f74;
  margin-right: 4px;
}

/* Leaflet marker styles - keeping for backward compatibility */
.start-marker,
.end-marker {
  font-size: 16px;
  text-align: center;
  line-height: 20px;
}

/* Success/Error Messages - using global styles with minor adjustments */
.success-message,
.error-message {
  margin: 20px 0;
  border-radius: 6px;
  padding: 12px;
}

/* Edit Modal Specific Styles */
.edit-modal {
  max-width: 900px;
}

.modal-header {
  padding: 24px 24px 0 24px;
  margin-bottom: 24px;
}

.modal-header h2 {
  color: #333;
  font-size: 1.5rem;
}

.flight-form {
  padding: 0 24px 24px 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  font-size: 0.95rem;
}

/* IGC Management Styles */
.igc-management {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 16px;
  background-color: #f9f9f9;
}

.current-igc {
  margin-bottom: 12px;
}

.igc-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.remove-igc-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.remove-igc-btn:hover {
  background: #c82333;
}

.igc-upload {
  margin-bottom: 12px;
}

.file-input {
  margin-bottom: 8px;
}

.upload-hint {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}

.new-igc {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #e8f5f0;
  border-radius: 4px;
  border: 1px solid #549f74;
  color: #2d7a52;
  font-weight: 500;
}

.cancel-new-igc {
  background: #6c757d;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.cancel-new-igc:hover {
  background: #5a6268;
}

.form-actions {
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.cancel-btn,
.submit-btn {
  padding: 10px 20px;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .flight-map {
    height: 300px;
  }

  .track-stats {
    flex-direction: column;
    gap: 8px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }

  .form-actions {
    flex-direction: column-reverse;
  }
}
</style>
