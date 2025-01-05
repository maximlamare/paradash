<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-container">
      <div class="flex justify-end">
        <button @click="closeModal" class="button-close">Close</button>
      </div>
      <h2 class="modal-title-center">Flight detail</h2>
      <div class="flex min-h-[80vh]">
        <div class="w-1/2 p-4">
          <p><strong>Date:</strong> {{ flight.date }}</p>
          <p><strong>Start:</strong> {{ flight.flightStart }}</p>
          <p><strong>Duration:</strong> {{ flight.flightTime }}</p>
          <p>
            <strong>Takeoff:</strong> {{ flight.takeoffLocation }},
            {{ flight.takeoffCountryCode }}
          </p>
          <p>
            <strong>Landing:</strong> {{ flight.landingLocation }},
            {{ flight.landingCountryCode }}
          </p>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      startMarker: null,
      endMarker: null,
      polyline: null,
      leafletMap: null,
      bounds: null,
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
      console.log(this.flight);
      if (this.flight.igcFilePath) {
        console.log("IGC flight path exists");
        try {
          const response = await fetch(
            `http://localhost:3002/read-igc?filePath=${encodeURIComponent(this.flight.igcFilePath)}`
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
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.parseIGCFile();
      }
    },
  },
};
</script>

<style scoped>
@import "@/assets/modal.css";
@import "@/assets/buttons.css";
@import "@/assets/map.css";
</style>
