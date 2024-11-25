<template>
  <div class="page-bg-grey">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mx-auto">
        Add Flight
      </h1>
    </div>
    <input
      type="file"
      ref="igcFileInput"
      @change="handleFileUpload"
      accept=".igc"
      class="hidden"
    />
    <button @click="openIGC" class="button-blue">Upload .igc file</button>
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
        <input
          class="modal-dropdown w-1/4"
          type="text"
          id="start"
          @input="updateFlightField('start', $event)"
          :value="flight.start"
        />
      </div>
      <h3 class="page-title3">Type</h3>
      <div class="mb-4">
        <input
          class="modal-dropdown w-1/4"
          type="text"
          id="start"
          @input="updateFlightField('start', $event)"
          :value="flight.start"
        />
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
        <input
          class="modal-dropdown w-1/4"
          type="text"
          id="duration"
          @input="updateFlightField('duration', $event)"
          :value="flight.duration"
        />
      </div>
      <h3 class="page-title3">Links (Strava, XContest...)</h3>
      <div class="mb-4">
        <input
          class="modal-dropdown w-1/4"
          type="text"
          id="duration"
          @input="updateFlightField('duration', $event)"
          :value="flight.duration"
        />
      </div>
      <h3 class="page-title3">Comments</h3>
      <div class="mb-4">
        <input
          class="modal-dropdown w-1/4"
          type="text"
          id="duration"
          @input="updateFlightField('duration', $event)"
          :value="flight.duration"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { processIGCContent } from "@/utils/igcProcessor";

export default {
  data() {
    return {
      flight: {
        date: "",
        start: "",
        landing: "",
        duration: "",
      },
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

        fetch("http://localhost:3000/upload", {
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
        const result = await processIGCContent(igcContent);
        this.flight.date = result.flightDate;
        this.flight.start = result.flightTakeoff;
        this.flight.landing = result.flightLanding;
        this.flight.duration = result.flightDuration;
      };
      reader.readAsText(file);
    },
    updateFlightField(field, event) {
      this.flight[field] = event.target.value;
    },
  },
};
</script>

<style>
@import "@/assets/pages.css";
</style>
