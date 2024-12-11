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
    <h3 class="page-title3">Date</h3>
    <div>
      <div class="mb-4">
        <input
          class="modal-dropdown w-1/4"
          type="date"
          id="date"
          @input="updateFlightField('date', $event)"
          :value="flight.date"
        />
      </div>
      <h3 class="page-title3">Category</h3>
      <div class="mb-4">
        <select
          class="modal-dropdown w-1/4"
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
          class="modal-dropdown w-1/4"
          id="category"
          @change="updateFlightField('type', $event)"
          :value="flight.type"
        >
          <option v-for="type in types" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>
      <h3 class="page-title3">Start location</h3>
      <div class="mb-4">
        <input
          class="modal-dropdown w-1/4"
          type="text"
          id="start"
          @input="updateFlightField('start', $event)"
          :value="flight.start"
        />
      </div>
      <h3 class="page-title3">Landing location</h3>
      <div class="mb-4">
        <input
          class="modal-dropdown w-1/4"
          type="text"
          id="landing"
          @input="updateFlightField('landing', $event)"
          :value="flight.landing"
        />
      </div>
      <h3 class="page-title3">Flight duration (hh:mm)</h3>
      <div class="mb-4">
        <input
          class="modal-dropdown w-1/4"
          type="text"
          id="duration"
          @input="updateFlightField('duration', $event)"
          :value="flight.duration"
        />
      </div>
      <h3 class="page-title3">Glider</h3>
      <div class="mb-4">
        <select
          class="modal-dropdown w-1/4"
          id="glider"
          @change="updateFlightField('glider', $event)"
          :value="flight.glider"
        >
          <option
            v-for="glider in gliders"
            :key="glider.id"
            :value="glider.model"
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
            class="modal-dropdown w-1/4"
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
          class="modal-dropdown w-1/4"
          id="comments"
          @input="updateFlightField('comments', $event)"
          :value="flight.comments"
          rows="4"
        ></textarea>
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
        start: "",
        landing: "",
        duration: "",
        glider: "",
        links: [""],
      },
      categories: [],
      types: [],
      gliders: [],
      errorMessage: "",
    };
  },
  computed: {},
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
          .then((response) => response.text())
          .then(() => {
            this.processIGCFile(file);
          })
          .catch((error) => {
            console.error("Error uploading file:", error);
          });
      }
    },
    async processIGCFile(file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const igcContent = e.target.result;
        const response = await axios
          .get("http://localhost:3000/launch_sites")
          .catch((error) => {
            console.error("Error fetching launch sites:", error);
          });
        this.sites = response.data; // Assuming response.data contains the array of objects
        try {
          const result = await processIGCContent(igcContent, this.sites);
          this.flight.date = result.flightDate;
          this.flight.start = result.flightTakeoff;
          this.flight.landing = result.flightLanding;
          this.flight.duration = result.flightDuration;
        } catch (error) {
          console.error("Error processing IGC file:", error);
          this.errorMessage = "Error processing IGC file: enter data manually.";
        }
      };
      reader.readAsText(file);
    },
    updateFlightField(field, event, index = null) {
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
  },
  created() {
    this.fetchSettings();
    this.fetchGliders(); // Add this line
  },
};
</script>

<style>
@import "@/assets/pages.css";
</style>
