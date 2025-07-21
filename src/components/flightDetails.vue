<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-container">
      <div class="flex justify-end space-x-2">
        <button @click="showDeleteConfirmation = true" class="button-delete">
          Delete flight
        </button>
        <button @click="closeModal" class="button-close">Close</button>
      </div>
      <div class="flex min-h-[80vh]">
        <div class="w-1/2 p-4">
          <div class="metric-grid">
            <div class="metric-box-grey">
              <p class="metric-label"><i>Category:</i></p>
              <p class="metric-value">{{ formatData(flight.category) }}</p>
            </div>
            <div class="metric-box-grey">
              <p class="metric-label"><i>Type:</i></p>
              <p class="metric-value">{{ formatData(flight.type) }}</p>
            </div>
            <div class="metric-box-blue">
              <p class="metric-label"><i>Date:</i></p>
              <p class="metric-value">{{ formatData(flight.date) }}</p>
            </div>
            <div class="metric-box-blue">
              <p class="metric-label"><i>Flight Duration:</i></p>
              <p class="metric-value">{{ formatData(flight.flightTime) }}</p>
            </div>
            <div class="metric-box-blue">
              <p class="metric-label"><i>Start time:</i></p>
              <p class="metric-value">{{ formatData(flight.flightStart) }}</p>
            </div>
            <div class="metric-box-blue">
              <p class="metric-label"><i>Landing time:</i></p>
              <p class="metric-value">{{ formatData(computedFlightEnd()) }}</p>
            </div>
          </div>
          <p style="margin-top: 2rem"></p>
          <div class="metric-box-green">
            <p class="metric-label"><i>Glider:</i></p>
            <p class="metric-value">
              {{ formatData(glider.brand) }} {{ formatData(glider.model) }}
            </p>
          </div>
          <p style="margin-top: 1rem"></p>
          <div class="metric-box-blue">
            <p class="metric-label"><i>Links:</i></p>
            <p class="metric-link" v-html="formatLinks()"></p>
          </div>
          <p style="margin-top: 1rem"></p>
          <div class="metric-box-grey">
            <p class="metric-label"><i>Comments:</i></p>
            <p class="metric-text">
              {{ formatData(flight.comments) }}
            </p>
          </div>
        </div>
        <div class="justify-center w-1/2 p-4">
          <div v-if="flight.igcFilePath" class="map-container">
            <l-map
              ref="map"
              @ready="onMapReady"
              :zoom="mapZoom"
              :center="mapCenter"
            >
              <l-tile-layer
                :url="url"
                :attribution="attribution"
              ></l-tile-layer>
              <l-marker v-if="startMarker" :lat-lng="startMarker">
                <l-popup>Takeoff Location</l-popup>
              </l-marker>
              <l-marker v-if="endMarker" :lat-lng="endMarker">
                <l-popup>Landing Location</l-popup>
              </l-marker>
              <l-polyline
                v-if="polyline"
                :lat-lngs="[polyline]"
                color="orange"
              />
            </l-map>
          </div>
          <div v-else class="map-empty">
            <p>No IGC file available for this flight.</p>
          </div>
          <p style="margin-top: 2rem"></p>
          <div class="metric-grid">
            <div class="metric-box-grey">
              <p class="metric-label"><i>Takeoff:</i></p>
              <p class="metric-value">
                {{ flight.takeoffLocation }}, {{ flight.takeoffCountryCode }}
              </p>
            </div>
            <div class="metric-box-grey">
              <p class="metric-label"><i>Landing:</i></p>
              <p class="metric-value">
                {{ flight.landingLocation }}, {{ flight.landingCountryCode }}
              </p>
            </div>
            <div class="metric-box-grey">
              <p class="metric-label"><i>Flight Distance direct (km):</i></p>
              <p class="metric-value">
                {{ formatData(this.crowDistance) }}
              </p>
            </div>
            <div class="metric-box-grey">
              <p class="metric-label"><i>Flight Distance track (km):</i></p>
              <p class="metric-value">
                {{ formatData(this.trackDistance) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- Delete Confirmation Modal -->
  <div v-if="showDeleteConfirmation" class="modal-overlay-small">
    <div class="modal-container-small">
      <div class="p-4">
        <p>
          Are you really sure you want to delete this flight? This is
          irreversible!
        </p>
        <div class="flex justify-center space-x-2 mt-4">
          <button @click="showDeleteConfirmation = false" class="button-blue">
            No, don't delete
          </button>
          <button @click="confirmDeleteFlight" class="button-delete">
            Yes, delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import {
  LMap,
  LTileLayer,
  LMarker,
  LPopup,
  LPolyline,
} from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import { getIGCgeoContent } from "@/utils/igcProcessor";
import L from "leaflet";
import { getCrowDistance, getTrackDistance } from "@/utils/geoOperations";
export default {
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup,
    LPolyline,
  },
  props: {
    visible: Boolean,
    flight: Object,
  },
  data() {
    return {
      mapZoom: 5,
      mapCenter: [47.51, 14.55],
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      startMarker: null,
      endMarker: null,
      polyline: null,
      leafletMap: null,
      bounds: null,
      glider: { brand: null, model: null },
      showDeleteConfirmation: false, // Add this data property
      crowDistance: null,
      trackDistance: null,
    };
  },
  methods: {
    closeModal() {
      this.$emit("close");
    },
    deleteFlight() {
      this.showDeleteConfirmation = true;
    },
    async confirmDeleteFlight() {
      try {
        await axios.delete(
          `http://localhost:3001/delete-flight/${this.flight.id}`
        );
        // Delete the associated IGC file if it exists
        if (this.flight.igcFilePath) {
          await axios.delete(`http://localhost:3001/delete-igc-file`, {
            data: { filePath: this.flight.igcFilePath },
          });
        }
        console.log("Flight deleted");
        this.$emit("flight-deleted");

        // Close the delete confirmation modal and the flight details modal
        this.showDeleteConfirmation = false;
        this.closeModal();
      } catch (error) {
        console.error("Error deleting flight:", error);
      }
    },
    onMapReady() {
      // Store the raw Leaflet map instance
      this.leafletMap = this.$refs.map.leafletObject;

      if (this.bounds) {
        this.leafletMap.fitBounds(this.bounds);
      }
    },
    async parseIGCFile() {
      if (this.flight.igcFilePath) {
        try {
          const response = await fetch(
            `http://localhost:3001/read-igc?filePath=${encodeURIComponent(
              this.flight.igcFilePath
            )}`
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          const igcContent = data.content;
          const result = await getIGCgeoContent(igcContent);
          this.crowDistance = (
            getCrowDistance(
              result.startLatitude,
              result.startLongitude,
              result.endLatitude,
              result.endLongitude
            ) / 1000
          ).toFixed(1);
          this.trackDistance = (
            getTrackDistance(result.polyLine) / 1000
          ).toFixed(1);
          this.startMarker = [result.startLatitude, result.startLongitude];
          this.endMarker = [result.endLatitude, result.endLongitude];
          this.polyline = result.polyLine;
          const bbounds = L.latLngBounds(this.polyline);
          this.bounds = [bbounds.getSouthWest(), bbounds.getNorthEast()];
          if (this.leafletMap) {
            this.leafletMap.fitBounds(this.bounds);
          }
        } catch (error) {
          console.error("Error reading IGC file:", error);
        }
      }
    },
    async fetchGlider() {
      await axios
        .get("http://localhost:3001/gear")
        .then((response) => {
          const allGear = response.data.data;
          const matchingGlider = allGear.find(
            (gear) => gear.id === this.flight.glider
          );
          if (matchingGlider.brand) {
            this.glider.brand = matchingGlider.brand;
          }
          if (matchingGlider.model) {
            this.glider.model = matchingGlider.model;
          }
        })
        .catch((error) => {
          console.error("Error fetching gear:", error);
        });
    },
    formatData(data) {
      return data ? data : "N/A";
    },
    computeEnd() {
      const start = new Date(`${this.flight.date}T${this.flight.flightStart}`);
      const duration = this.flight.flightTime.split(":");
      const end = new Date(
        start.getTime() + duration[0] * 60 * 60 * 1000 + duration[1] * 60 * 1000
      );
      return end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },
    computedFlightEnd() {
      return this.flight.flightEnd || this.computeEnd();
    },
    computedcrowDistance() {
      return getCrowDistance(
        this.flight.startLatitude,
        this.flight.startLongitude,
        this.flight.endLatitude,
        this.flight.endLongitude
      );
    },
    computedFlighttrack() {
      return this.flight.flightTrack || "N/A";
    },
    formatLinks() {
      const linksArray = JSON.parse(this.flight.links);
      if (Array.isArray(linksArray) && linksArray.length > 0) {
        return linksArray
          .map((link) => {
            const formattedLink =
              link.startsWith("http://") || link.startsWith("https://")
                ? link
                : `http://${link}`;
            return `<a href="${formattedLink}" target="_blank">${link}</a>`;
          })
          .join("<br>");
      }
      return "N/A";
    },
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.parseIGCFile();
        this.fetchGlider();
      }
    },
  },
};
</script>

<style scoped>
@import "@/assets/modal.css";
@import "@/assets/buttons.css";
@import "@/assets/map.css";
@import "@/assets/metrics.css";
</style>
