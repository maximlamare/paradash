<template>
  <div class="page-bg-grey">
    <div class="flex justify-between items-center mb-8">
      <h1 class="page-title1">Add Flight</h1>
    </div>
    <input
      type="file"
      ref="igcFileInput"
      @change="handleFileUpload"
      accept=".igc"
      class="hidden"
    />
    <button @click="openIGC" class="button-blue">Upload .igc file</button>
    <p v-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</p>
    <h2 class="page-title2 mt-8">Enter flight details</h2>
    <div class="flex flex-wrap">
      <div class="w-1/2 md:w-1/2 pr-4">
        <h3 class="page-title3">Date</h3>
        <div class="mb-4">
          <input
            class="modal-dropdown w-full"
            type="date"
            id="date"
            @input="updateFlightField('date', $event)"
            :value="flight.date"
          />
        </div>
        <h3 class="page-title3">Start time (hh:mm)</h3>
        <div class="mb-4">
          <input
            class="modal-dropdown w-full"
            type="time"
            id="flightStart"
            @input="updateFlightField('flightStart', $event)"
            :value="flight.flightStart"
          />
        </div>
        <h3 class="page-title3">Flight duration (hh:mm)</h3>
        <div class="mb-4">
          <input
            class="modal-dropdown w-1/4"
            type="time"
            id="duration"
            @input="updateFlightField('flightTime', $event)"
            :value="flight.flightTime"
          />
        </div>
        <h3 class="page-title3">Start location</h3>
        <div class="mb-4 flex gap-4">
          <label for="start" class="w-1/2 italic">Location</label>
        </div>
        <div class="mb-4 flex gap-4">
          <select
            v-model="flight.startLocations"
            @change="updateFlightField('takeoffLocation', $event)"
            id="startLocation"
            class="modal-dropdown w-1/2"
          >
            <option v-for="location in startLocations" :key="location" :value="location">
              {{ location }}
            </option>
            <option value="add-new">Add new location</option>
          </select>
          <input
            v-if="flight.startLocations === 'add-new'"
            v-model="flight.newStartLocation"
            type="text"
            placeholder="Enter new start location"
            class="modal-dropdown w-1/2"
            @input="updateFlightField('takeoffLocation', $event)"
          />
        </div>
        <div class="mb-4 flex gap-4">
          <label for="startCountry" class="w-1/2 italic">Country</label>
        </div>
        <div class="mb-4 flex gap-4">
          <select
            class="modal-dropdown w-1/2"
            id="startCountry"
            @input="updateFlightField('takeoffCountryCode', $event)"
            :value="this.flight.takeoffCountryCode"
          >
            <option
              v-for="country in countryCodes"
              :key="country.code"
              :value="country.code"
            >
              {{ country.code }} ({{ country.country }})
            </option>
          </select>
        </div>
        <h3 class="page-title3">Landing location</h3>
        <div class="mb-4 flex gap-4">
          <label for="landing" class="w-1/2 italic">Location</label>
        </div>
        <div class="mb-4 flex gap-4">
          <select
            v-model="flight.landLocations"
            @change="updateFlightField('landingLocation', $event)"
            id="landLocations"
            class="modal-dropdown w-1/2"
          >
            <option v-for="location in landLocations" :key="location" :value="location">
              {{ location }}
            </option>
            <option value="add-new">Add new location</option>
          </select>
          <input
            v-if="flight.landLocations === 'add-new'"
            v-model="flight.newLandLocation"
            type="text"
            placeholder="Enter new landing location"
            class="modal-dropdown w-1/2"
            @input="updateFlightField('landingLocation', $event)"
          />
        </div>
        <div class="mb-4 flex gap-4">
          <label for="landingCountry" class="w-1/2 italic">Country</label>
        </div>
        <div class="mb-4 flex gap-4">
          <select
            class="modal-dropdown w-1/2"
            id="landingCountry"
            @input="updateFlightField('landingCountryCode', $event)"
            :value="this.flight.landingCountryCode"
          >
            <option
              v-for="country in countryCodes"
              :key="country.code"
              :value="country.code"
            >
              {{ country.code }} ({{ country.country }})
            </option>
          </select>
        </div>
      </div>
      <div class="w-1/2 md:w-1/2 pl-4">
        <h3 class="page-title3">Category</h3>
        <div class="mb-4">
          <select
            class="modal-dropdown w-full"
            id="category"
            @change="updateFlightField('category', $event)"
            :value="flight.category"
          >
            <option
              v-for="category in categories"
              :key="category"
              :value="category"
            >
              {{ category }}
            </option>
          </select>
        </div>
        <h3 class="page-title3">Type</h3>
        <div class="mb-4">
          <select
            class="modal-dropdown w-full"
            id="type"
            @change="updateFlightField('type', $event)"
            :value="flight.type"
          >
            <option v-for="type in types" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>
        <h3 class="page-title3">Glider</h3>
        <div class="mb-4">
          <select
            class="modal-dropdown w-full"
            id="glider"
            v-model="flight.glider_id"
            @change="updateFlightField('glider', $event)"
            :value="flight.glider_id"
          >
            <option
              v-for="glider in gliders"
              :key="glider.id"
              :value="glider.id"
            >
              {{ glider.brand + " " + glider.model }}
            </option>
          </select>
        </div>
        <h3 class="page-title3">Links (Strava, XContest...)</h3>
        <div class="mb-4">
          <div
            v-for="(link, index) in flight.links"
            :key="index"
            class="flex items-center mb-2"
          >
            <input
              class="modal-dropdown w-full"
              type="text"
              :id="'link-' + index"
              @input="updateFlightField('links', $event, index)"
              :value="link"
            />
            <button
              v-if="index === flight.links.length - 1"
              @click="addLink"
              class="button-blue ml-2"
            >
              +
            </button>
            <button
              v-if="index !== 0"
              @click="removeLink(index)"
              class="button-delete ml-2"
            >
              -
            </button>
          </div>
        </div>
        <h3 class="page-title3">Comments</h3>
        <div class="mb-4">
          <textarea
            class="modal-dropdown w-full"
            id="comments"
            @input="updateFlightField('comments', $event)"
            :value="flight.comments"
            rows="4"
          ></textarea>
        </div>
      </div>
    </div>

    <div class="flex flex-col items-center mt-8">
      <div v-if="uploadSuccess">
        <button class="button-green">Flight saved</button>
      </div>
      <div v-else>
        <button
          @click="saveFlight"
          :class="{
            'button-blue': !isFlightEmpty,
            'button-close': isFlightEmpty,
          }"
          :disabled="isFlightEmpty"
        >
          Save flight
        </button>
        <p v-if="errorMessage" class="text-red-500 text-center mt-2">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { processIGCContent } from "@/utils/igcProcessor";
import axios from "axios";

export default {
  data() {
    return {
      flight: {
        date: "",
        flightStart: "",
        flightEnd: "",
        takeoffLocation: "",
        takeoffCountryCode: "",
        landingLocation: "",
        landingCountryCode: "",
        flightTime: "",
        category: "",
        type: "",
        glider_id: "",
        links: [""],
        comments: "",
        igcFilePath: "",
      },
      categories: [],
      types: [],
      gliders: [],
      countryCodes: [],
      startLocations: [],
      landLocations: [],
      errorMessage: "",
      uploadSuccess: false, // State variable to track upload status
    };
  },
  methods: {
    openIGC() {
      this.$refs.igcFileInput.click();
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("igcFile", file);

        fetch("http://localhost:3001/uploadFile", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.filePath) {
              this.flight.igcFilePath = data.filePath; // Save the file path to this.flight
              this.processIGCFile(file, data.filePath);
            } else {
              this.errorMessage = "Error uploading file.";
            }
          })
          .catch((error) => {
            console.error("Error uploading file:", error);
            this.errorMessage = "Error uploading file.";
          });
      }
    },
    async processIGCFile(file, filePath) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const igcContent = e.target.result;
        try {
          const response = await axios.get(
            "http://localhost:3001/launch_sites"
          );
          this.sites = response.data; // Assuming response.data contains the array of objects

          const result = await processIGCContent(igcContent, this.sites);
          this.flight.date = result.flightDate;
          this.flight.flightStart = result.flightStartTime;
          this.flight.flightEnd = result.flightEndTime;
          this.flight.takeoffLocation = result.flightTakeoff;
          this.flight.takeoffCountryCode = result.flightTakeoffCountryCode;
          this.flight.landingLocation = result.flightLanding;
          this.flight.landingCountryCode = result.flightLandingCountryCode;
          this.flight.igcSerial = result.security;

          // Check if file already exists in the database
          axios.get("http://localhost:3001/items").then((response) => {
            const existingSerials = [];
            response.data.data.forEach((item) => {
              existingSerials.push(item.igcSerial);
            });
            if (existingSerials.includes(result.security)) {
              this.deleteFile(filePath);
              Object.keys(this.flight).forEach((key) => {
                if (Array.isArray(this.flight[key])) {
                  this.flight[key] = [""];
                } else {
                  this.flight[key] = "";
                }
              });
              console.error("Existing flight:");
              this.errorMessage = "This flight already exists in the database.";
            }
          });

          // Automatically select the dropdown options based on the detected country codes
          this.$nextTick(() => {
            this.updateFlightField("takeoffCountryCode", {
              target: { value: result.flightTakeoffCountryCode },
            });
            this.updateFlightField("landingCountryCode", {
              target: { value: result.flightLandingCountryCode },
            });
            // Check if the start location exists in the dropdown
            if (this.startLocations.includes(result.flightTakeoff)) {
              this.updateFlightField("startLocations", {
                target: { value: result.flightTakeoff },
              });
            } else {
              this.updateFlightField("startLocations", {
                target: { value: "add-new" },
              });
              this.updateFlightField("newStartLocation", {
                target: { value: result.flightTakeoff },
              });
            }
            // Check if the end location exists in the dropdown
            if (this.landLocations.includes(result.flightLanding)) {
              this.updateFlightField("landLocations", {
                target: { value: result.flightLanding },
              });
            } else {
              this.updateFlightField("landLocations", {
                target: { value: "add-new" },
              });
              this.updateFlightField("newLandLocation", {
                target: { value: result.flightLanding },
              });
            }
          });
          this.flight.flightTime = result.flightDuration;
          this.errorMessage = ""; // Clear error message if processing is successful
        } catch (error) {
          console.error("Error processing IGC file:", error);
          this.errorMessage = "Error processing IGC file.";
        }
      };
      reader.readAsText(file);
    },
    updateFlightField(field, event, index = null) {
      this.uploadSuccess = false;
      if (field === "links" && index !== null) {
        this.flight.links[index] = event.target.value;
      } else {
        this.flight[field] = event.target.value;
      }
      this.clearErrorMessage();
    },
    clearErrorMessage() {
      this.errorMessage = "";
    },
    fetchSettings() {
      axios
        .get("http://localhost:3001/get-settings")
        .then((response) => {
          this.categories = response.data.categories;
          this.types = response.data.types;
          if (this.categories.length > 0) {
            this.flight.category = this.categories[0];
          }
          if (this.types.length > 0) {
            this.flight.type = this.types[0];
          }
        })
        .catch((error) => {
          console.error("Error fetching settings:", error);
        });
    },
    fetchGliders() {
      axios
        .get("http://localhost:3001/gear")
        .then((response) => {
          this.gliders = response.data.data.filter(
            (item) => item.gear_type === "glider" && item.archived === 0
          );
        })
        .catch((error) => {
          console.error("Error fetching gliders:", error);
        });
    },
    fetchFlightsInfo() {
      axios.get("http://localhost:3001/items").then((response) => {
        // Fetch starting locations from the database
        const allStarts = [];
        response.data.data.forEach((item) => {
          allStarts.push(item.takeoffLocation);
        });
        this.startLocations = [...new Set(allStarts)];
        // Fetch landing locations from the database
        const allLands = [];
        response.data.data.forEach((item) => {
          allLands.push(item.landingLocation);
        });
        this.landLocations = [...new Set(allLands)];
        const takeoffCountryCodes = response.data.data.map(
          (item) => item.takeoffCountryCode
        );
        const landingCountryCodes = response.data.data.map(
          (item) => item.landingCountryCode
        );
        const uniqueCountries = new Set([
          ...takeoffCountryCodes,
          ...landingCountryCodes,
        ]);
        const usedCountryCodes = Array.from(uniqueCountries).sort();
        axios
          .get("http://localhost:3001/fetchCountryCodes")
          .then((response) => {
            const filteredCountryCodes = response.data.data.filter((item) =>
              usedCountryCodes.includes(item.Code)
            );
            this.countryCodes = filteredCountryCodes.map((item) => ({
              country: item.Name,
              code: item.Code,
            }));
            const newCountryCodes = response.data.data.filter(
              (item) =>
                !this.countryCodes.some((code) => code.code === item.Code)
            );
            this.countryCodes.push(
              ...newCountryCodes.map((item) => ({
                country: item.Name,
                code: item.Code,
              }))
            );
          });
      });
    },
    addLink() {
      this.flight.links.push("");
    },
    removeLink(index) {
      this.flight.links.splice(index, 1);
    },
    saveFlight() {
      const flightToSave = {
        ...this.flight,
        links: JSON.stringify(this.flight.links),
      };

      // Check if a flight with the same date and start time already exists
      axios
        .get("http://localhost:3001/items")
        .then((response) => {
          const existingFlights = response.data.data;
          const duplicateFlight = existingFlights.find(
            (flight) =>
              flight.date === this.flight.date &&
              flight.flightStart === this.flight.flightStart
          );

          if (duplicateFlight) {
            this.errorMessage =
              "A flight with the same date and start time already exists.";
            this.uploadSuccess = false;
            return;
          }

          // If no duplicate flight, proceed to save the flight
          axios
            .post("http://localhost:3001/save-flight", flightToSave)
            .then(() => {
              this.uploadSuccess = true;
            })
            .catch((error) => {
              this.uploadSuccess = false;
              console.error("Error saving flight:", error);
            });
        })
        .catch((error) => {
          console.error("Error checking existing flights:", error);
        });
    },
    async deleteFile(currentFilePath) {
      try {
        await axios.delete(`http://localhost:3001/delete-igc-file`, {
          data: { filePath: currentFilePath },
        });
      } catch (error) {
        console.error("Error deleting flight:", error);
      }
    },
  },
  created() {
    this.fetchSettings();
    this.fetchGliders();
    this.fetchFlightsInfo();
  },
  computed: {
    isFlightEmpty() {
      return this.flight.date === "";
    },
  },
};
</script>

<style>
@import "@/assets/pages.css";
</style>
