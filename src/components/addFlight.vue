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
        <h3 class="page-title3">Start location</h3>
        <div class="mb-4">
          <input
            class="modal-dropdown w-full"
            type="text"
            id="start"
            @input="updateFlightField('takeoffLocation', $event)"
            :value="this.flight.takeoffLocation"
          />
        </div>
        <h3 class="page-title3">Landing location</h3>
        <div class="mb-4">
          <input
            class="modal-dropdown w-full"
            type="text"
            id="landing"
            @input="updateFlightField('landingLocation', $event)"
            :value="this.flight.landingLocation"
          />
        </div>
        <h3 class="page-title3">Flight duration (hh:mm)</h3>
        <div class="mb-4">
          <input
            class="modal-dropdown w-full"
            type="time"
            id="duration"
            @input="updateFlightField('flightTime', $event)"
            :value="flight.flightTime"
          />
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

    <div class="flex justify-center mt-8">
      <div v-if="uploadSuccess">
        <button class="button-green">Flight saved</button>
      </div>
      <div v-else>
        <p v-if="errorMessage" class="text-red-500">{{ errorMessage }}</p>
        <button @click="saveFlight" class="button-blue">Save flight</button>
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

        fetch("http://localhost:3002/uploadFile", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.filePath) {
              this.flight.igcFilePath = data.filePath; // Save the file path to this.flight
              this.processIGCFile(file);
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
    async processIGCFile(file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const igcContent = e.target.result;
        try {
          const response = await axios.get(
            "http://localhost:3000/launch_sites"
          );
          this.sites = response.data; // Assuming response.data contains the array of objects

          const result = await processIGCContent(igcContent, this.sites);
          this.flight.date = result.flightDate;
          this.flight.flightStart = result.flightStartTime;
          this.flight.takeoffLocation = result.flightTakeoff;
          this.flight.takeoffCountryCode = result.flightTakeoffCountryCode;
          this.flight.landingLocation = result.flightLanding;
          this.flight.landingCountryCode = result.flightLandingCountryCode;

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
    },
    fetchSettings() {
      axios
        .get("http://localhost:3002/get-settings")
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
        .get("http://localhost:3000/gear")
        .then((response) => {
          this.gliders = response.data.data.filter(
            (item) => item.gear_type === "glider"
          );
        })
        .catch((error) => {
          console.error("Error fetching gliders:", error);
        });
    },
    addLink() {
      this.flight.links.push("");
    },
    removeLink(index) {
      this.flight.links.splice(index, 1);
    },
    saveFlight() {
      axios
        .post("http://localhost:3000/save-flight", this.flight)
        .then(() => {
          this.uploadSuccess = true;
        })
        .catch((error) => {
          this.uploadSuccess = false;
          console.error("Error saving flight:", error);
        });
    },
  },
  created() {
    this.fetchSettings();
    this.fetchGliders();
  },
};
</script>

<style>
@import "@/assets/pages.css";
</style>
