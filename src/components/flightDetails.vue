<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-container">
      <div class="flex justify-end">
        <button @click="closeModal" class="button-close">Close</button>
      </div>
      <h2 class="modal-title-center">Flight detail</h2>
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
              <p class="metric-value">{{ formatData(flight.flightEnd) }}</p>
            </div>
          </div>
          <p style="margin-top: 2rem"></p>
          <div class="metric-box-green">
            <p class="metric-label"><i>Glider:</i></p>
            <p class="metric-value">
              {{ formatData(glider.brand) }} {{ formatData(glider.model) }}
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
              <p class="metric-label"><i>Flight Distance direct:</i></p>
              <p class="metric-value">
                {{ formatData(flight.flightDistance) }}
              </p>
            </div>
            <div class="metric-box-grey">
              <p class="metric-label"><i>Flight Distance track:</i></p>
              <p class="metric-value">
                {{ formatData(flight.flighttrack) }}
              </p>
            </div>
          </div>
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
    };
  },
  methods: {
    closeModal() {
      this.$emit("close");
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
        console.log("IGC flight path exists");
        try {
          const response = await fetch(
            `http://localhost:3002/read-igc?filePath=${encodeURIComponent(
              this.flight.igcFilePath
            )}`
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          const igcContent = data.content;
          const result = await getIGCgeoContent(igcContent);
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
      } else {
        console.log("ICGflight path does not exist");
      }
    },
    async fetchGlider() {
      await axios
        .get("http://localhost:3000/gear")
        .then((response) => {
          console.log("flight", this.flight);
          const allGear = response.data.data;
          const toto = allGear.find((gear) => gear.id === this.flight.glider);
          this.glider = { brand: toto.brand, model: toto.model };
          console.log("Glider:", this.glider);
        })
        .catch((error) => {
          console.error("Error fetching gear:", error);
        });
    },
    formatData(data) {
      return data ? data : "N/A";
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
