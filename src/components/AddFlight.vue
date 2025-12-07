<template>
  <div class="add-flight">
    <h1>Add Flight</h1>
    <form @submit.prevent="submitFlight" class="flight-form">
      <!-- IGC File Upload Section - Moved to top -->
      <div class="form-group">
        <label>IGC Flight Log (Optional)</label>
        <div class="igc-upload-area">
          <div v-if="!uploadedIGC.file" class="upload-input-section">
            <label class="file-input-label">
              <input
                ref="fileInput"
                type="file"
                accept=".igc"
                @change="handleFileSelect"
                class="file-input-hidden"
              />
              <span class="file-input-btn">Choose IGC File</span>
            </label>
            <p class="upload-hint">Select an IGC file to auto-fill flight data</p>
          </div>

          <div v-else class="igc-file-confirmation">
            <div class="file-success">
              <div class="file-icon">✅</div>
              <div class="file-info">
                <h4>{{ uploadedIGC.originalName }}</h4>
                <p class="file-details">
                  {{ uploadedIGC.totalFixes }} GPS fixes • Duration:
                  {{ uploadedIGC.duration }} • Start:
                  {{ uploadedIGC.startTime }}
                </p>
              </div>
              <button
                type="button"
                @click="removeIGCFile"
                class="btn-remove-igc"
              >
                Remove
              </button>
            </div>

            <div v-if="uploadedIGC.fileExists" class="file-conflict-warning">
              <div class="warning-icon">⚠️</div>
              <div class="warning-text">
                <p><strong>Similar IGC file already exists!</strong></p>
                <div class="conflict-actions">
                  <button
                    type="button"
                    @click="overwriteExisting"
                    class="btn-overwrite"
                  >
                    Overwrite Existing
                  </button>
                  <button type="button" @click="keepBoth" class="btn-keep-both">
                    Keep Both Files
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="igcUploadError" class="error-message">
            {{ igcUploadError }}
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="category">Category</label>
          <select
            id="category"
            v-model="flight.category"
            required
            class="form-control"
          >
            <option value="">Select category</option>
            <option
              v-for="category in categories"
              :key="category"
              :value="category"
            >
              {{ category }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="type">Type</label>
          <select id="type" v-model="flight.type" required class="form-control">
            <option value="">Select type</option>
            <option v-for="type in sportTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="date">Date</label>
        <input
          type="date"
          id="date"
          v-model="flight.date"
          required
          class="form-control"
        />
        <small v-if="igcData.date" class="igc-info">
          Auto-filled from IGC file (editable)
        </small>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="startTime">Start Time</label>
          <input
            type="time"
            id="startTime"
            v-model="flight.startTime"
            required
            class="form-control"
          />
          <small v-if="igcData.startTime" class="igc-info">
            Auto-filled from IGC file (editable)
          </small>
        </div>

        <div class="form-group">
          <label for="flightDuration">Flight Duration</label>
          <div class="duration-inputs">
            <div class="duration-field">
              <input
                type="number"
                id="durationHours"
                v-model="durationHoursInput"
                min="0"
                max="23"
                class="form-control duration-input"
                placeholder="0"
                @focus="clearIfZero('hours')"
                @blur="restoreIfEmpty('hours')"
              />
              <label class="duration-label">hours</label>
            </div>
            <div class="duration-field">
              <input
                type="number"
                id="durationMinutes"
                v-model="durationMinutesInput"
                min="0"
                max="59"
                class="form-control duration-input"
                placeholder="0"
                @focus="clearIfZero('minutes')"
                @blur="restoreIfEmpty('minutes')"
              />
              <label class="duration-label">minutes</label>
            </div>
          </div>
          <small v-if="igcData.duration" class="igc-info">
            Auto-filled from IGC file (editable)
          </small>
        </div>
      </div>

      <div class="form-group">
        <label for="glider">Glider</label>
        <select
          id="glider"
          v-model="flight.gliderId"
          required
          class="form-control"
        >
          <option value="" v-if="gliders.length > 0">Select glider</option>
          <option
            value=""
            disabled
            style="font-style: italic"
            v-if="gliders.length === 0"
          >
            Add glider in the Gear page first!
          </option>
          <option v-for="glider in gliders" :key="glider.id" :value="glider.id">
            {{ glider.manufacturer }} {{ glider.model }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="startLocation">Start Location</label>
          <input
            type="text"
            id="startLocation"
            v-model="flight.startLocation"
            required
            class="form-control"
            placeholder="Location name"
          />
        </div>

        <div class="form-group">
          <label for="startCountry">Start Country</label>
          <select
            id="startCountry"
            v-model="flight.startCountry"
            required
            class="form-control"
          >
            <option value="">Select country</option>
            <optgroup v-if="usedCountries.length > 0" label="Already Used">
              <option
                v-for="country in sortedCountries.slice(
                  0,
                  usedCountries.length
                )"
                :key="'used-' + country.code"
                :value="country.code"
              >
                {{ country.name }}
              </option>
            </optgroup>
            <optgroup label="All Countries">
              <option
                v-for="country in sortedCountries.slice(usedCountries.length)"
                :key="'all-' + country.code"
                :value="country.code"
              >
                {{ country.name }}
              </option>
            </optgroup>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="endLocation">End Location</label>
          <input
            type="text"
            id="endLocation"
            v-model="flight.endLocation"
            required
            class="form-control"
            placeholder="Location name"
          />
        </div>

        <div class="form-group">
          <label for="endCountry">End Country</label>
          <select
            id="endCountry"
            v-model="flight.endCountry"
            required
            class="form-control"
          >
            <option value="">Select country</option>
            <optgroup v-if="usedCountries.length > 0" label="Already Used">
              <option
                v-for="country in sortedCountries.slice(
                  0,
                  usedCountries.length
                )"
                :key="'used-' + country.code"
                :value="country.code"
              >
                {{ country.name }}
              </option>
            </optgroup>
            <optgroup label="All Countries">
              <option
                v-for="country in sortedCountries.slice(usedCountries.length)"
                :key="'all-' + country.code"
                :value="country.code"
              >
                {{ country.name }}
              </option>
            </optgroup>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Links</label>
        <div class="links-section">
          <div
            v-for="(link, index) in flight.links"
            :key="index"
            class="link-input"
          >
            <input
              type="text"
              v-model="flight.links[index]"
              class="form-control"
              placeholder="https://example.com"
            />
            <button
              type="button"
              @click="removeLink(index)"
              class="btn-remove"
              v-if="flight.links.length > 1"
            >
              ×
            </button>
          </div>
          <button type="button" @click="addLink" class="btn-add-link">
            + Add Link
          </button>
        </div>
      </div>

      <div class="form-group">
        <label for="comments">Comments</label>
        <textarea
          id="comments"
          v-model="flight.comments"
          class="form-control"
          rows="4"
          placeholder="Flight notes, observations, conditions..."
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? "Adding Flight..." : "Add Flight" }}
        </button>
        <button type="button" @click="resetForm" class="btn btn-secondary">
          Reset Form
        </button>
      </div>

      </form>

    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import IGCParser from "igc-parser";
import { flightOperations, gearOperations } from "../database/database.js";
import countries from "../data/countries.json";
import { formatDateWithWeekday as formatDate } from "../utils/dateUtils.js";

export default {
  name: "AddFlight",
  setup() {
    const router = useRouter();

    const flight = ref({
      date: new Date().toISOString().split("T")[0], // Today's date as default
      category: "",
      type: "",
      startTime: "",
      gliderId: "",
      startLocation: "",
      startCountry: "",
      endLocation: "",
      endCountry: "",
      links: [""],
      comments: "",
    });

    const durationHours = ref(0);
    const durationMinutes = ref(0);
    const durationHoursInput = ref("");
    const durationMinutesInput = ref("");

    // Check if running on native platform
    const isNativePlatform = computed(() => {
      const platform = Capacitor.getPlatform();
      return platform === "android" || platform === "ios";
    });

    // Duration input handlers for better UX
    const clearIfZero = (field) => {
      if (field === "hours" && durationHoursInput.value === "0") {
        durationHoursInput.value = "";
      } else if (field === "minutes" && durationMinutesInput.value === "0") {
        durationMinutesInput.value = "";
      }
    };

    const restoreIfEmpty = (field) => {
      if (field === "hours") {
        const val = parseInt(durationHoursInput.value) || 0;
        durationHours.value = val;
        durationHoursInput.value = val.toString();
      } else if (field === "minutes") {
        const val = parseInt(durationMinutesInput.value) || 0;
        durationMinutes.value = val;
        durationMinutesInput.value = val.toString();
      }
    };

    // IGC file upload state
    const uploadedIGC = ref({
      file: null,
      originalName: "",
      filePath: "",
      startTime: "",
      duration: "",
      date: "",
      pilotName: "",
      gliderType: "",
      gliderSerial: "",
      totalFixes: 0,
      fileExists: false,
      existingFiles: [],
    });

    const igcData = computed(() => uploadedIGC.value);
    const igcUploadError = ref("");
    const fileInput = ref(null);

    // IGC file upload functions
    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        uploadIGCFile(file);
      }
    };

    const uploadIGCFile = async (file) => {
      try {
        console.log("Starting IGC file upload:", file.name, "Size:", file.size);
        igcUploadError.value = "";
        const formData = new FormData();
        formData.append("igcFile", file);

        console.log(
          "Sending request to:",
          "http://localhost:3001/api/igc/upload"
        );
        const response = await fetch("http://localhost:3001/api/igc/upload", {
          method: "POST",
          body: formData,
        });

        console.log("Response status:", response.status, response.statusText);
        const result = await response.json();
        console.log("Upload result:", result);

        if (!response.ok) {
          throw new Error(result.error || "Failed to upload IGC file");
        }

        console.log("IGC file uploaded successfully:", result.filePath);

        // Store IGC data
        uploadedIGC.value = {
          file: file,
          originalName: result.originalName,
          filePath: result.filePath,
          startTime: result.igcData.startTime,
          duration: result.igcData.duration,
          date: result.igcData.date,
          pilotName: result.igcData.pilotName,
          gliderType: result.igcData.gliderType,
          gliderSerial: result.igcData.gliderSerial,
          totalFixes: result.igcData.totalFixes,
          fileExists: result.fileExists,
          existingFiles: result.existingFiles || [],
        };

        // Auto-populate form fields
        if (result.igcData.date) {
          flight.value.date = result.igcData.date;
        }

        if (result.igcData.startTime) {
          flight.value.startTime = result.igcData.startTime;
        }

        if (result.igcData.duration) {
          const [hours, minutes] = result.igcData.duration
            .split(":")
            .map(Number);
          durationHours.value = hours;
          durationMinutes.value = minutes;
          durationHoursInput.value = hours.toString();
          durationMinutesInput.value = minutes.toString();
        }
      } catch (error) {
        console.error("IGC upload error:", error);
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
        igcUploadError.value = `Upload failed: ${error.message}`;
        uploadedIGC.value = {
          file: null,
          originalName: "",
          filePath: "",
          startTime: "",
          duration: "",
          date: "",
          pilotName: "",
          gliderType: "",
          gliderSerial: "",
          totalFixes: 0,
          fileExists: false,
          existingFiles: [],
        };
      }
    };

    const removeIGCFile = async () => {
      try {
        if (uploadedIGC.value.filePath) {
          await fetch(
            `http://localhost:3001/api/igc/${uploadedIGC.value.filePath}`,
            {
              method: "DELETE",
            }
          );
        }
      } catch (error) {
        console.error("Error removing IGC file:", error);
      }

      // Reset IGC data
      uploadedIGC.value = {
        file: null,
        originalName: "",
        filePath: "",
        startTime: "",
        duration: "",
        date: "",
        pilotName: "",
        gliderType: "",
        gliderSerial: "",
        totalFixes: 0,
        fileExists: false,
        existingFiles: [],
      };

      // Clear file input
      if (fileInput.value) {
        fileInput.value.value = "";
      }

      igcUploadError.value = "";
    };

    const overwriteExisting = async () => {
      try {
        if (
          uploadedIGC.value.existingFiles &&
          uploadedIGC.value.existingFiles.length > 0
        ) {
          const oldFilename = uploadedIGC.value.existingFiles[0];
          const formData = new FormData();
          formData.append("igcFile", uploadedIGC.value.file);

          const response = await fetch(
            `http://localhost:3001/api/igc/replace/${oldFilename}`,
            {
              method: "POST",
              body: formData,
            }
          );

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || "Failed to replace IGC file");
          }

          uploadedIGC.value.filePath = result.filePath;
          uploadedIGC.value.fileExists = false;
          uploadedIGC.value.existingFiles = [];
        }
      } catch (error) {
        console.error("Error overwriting IGC file:", error);
        igcUploadError.value = error.message;
      }
    };

    const keepBoth = () => {
      // Just clear the conflict warning - the new file is already uploaded with a unique name
      uploadedIGC.value.fileExists = false;
      uploadedIGC.value.existingFiles = [];
    };

    // Computed property to format duration as HH:MM
    const flightDuration = computed(() => {
      const hours = String(durationHours.value || 0).padStart(2, "0");
      const minutes = String(durationMinutes.value || 0).padStart(2, "0");
      return `${hours}:${minutes}`;
    });

    // Computed property to get used countries from existing flights
    const usedCountries = computed(() => {
      const used = new Set();
      existingFlights.value.forEach((flight) => {
        if (flight.takeoffCountryCode) used.add(flight.takeoffCountryCode);
        if (flight.landingCountryCode) used.add(flight.landingCountryCode);
      });
      return Array.from(used);
    });

    // Computed property to sort countries with used ones at the top
    const sortedCountries = computed(() => {
      const used = usedCountries.value;
      const usedCountryObjects = countries.filter((country) =>
        used.includes(country.code)
      );
      const unusedCountryObjects = countries.filter(
        (country) => !used.includes(country.code)
      );

      return [
        ...usedCountryObjects.sort((a, b) => a.name.localeCompare(b.name)),
        ...unusedCountryObjects.sort((a, b) => a.name.localeCompare(b.name)),
      ];
    });

    const categories = ref([]);
    const sportTypes = ref([]);
    const gear = ref([]);
    const existingFlights = ref([]);
    const isSubmitting = ref(false);
    const successMessage = ref("");
    const errorMessage = ref("");

    // Computed property to filter only active gliders
    const gliders = computed(() => {
      return gear.value.filter(
        (item) => item.type === "gliders" && item.is_active
      );
    });

    // Load settings from localStorage
    const loadSettings = () => {
      const savedCategories = localStorage.getItem("flightCategories");

      categories.value = savedCategories
        ? JSON.parse(savedCategories)
        : ["On-site", "XC", "H&F"];

      const savedFlightTypes = localStorage.getItem("flightTypes");
      sportTypes.value = savedFlightTypes
        ? JSON.parse(savedFlightTypes)
        : ["Paragliding", "Speedflying"];
    };

    // Load gear from database
    const loadGear = async () => {
      try {
        gear.value = await gearOperations.getAll();
      } catch (error) {
        console.error("Error loading gear:", error);
        errorMessage.value = "Error loading gear list";
      }
    };

    // Load existing flights to get used countries
    const loadFlights = async () => {
      try {
        existingFlights.value = await flightOperations.getAllFlights();
      } catch (error) {
        console.error("Error loading flights:", error);
        // Don't show error to user, just use empty array
        existingFlights.value = [];
      }
    };

    // Add a new link input
    const addLink = () => {
      flight.value.links.push("");
    };

    // Remove a link input
    const removeLink = (index) => {
      flight.value.links.splice(index, 1);
    };

    // Calculate end time based on start time and duration
    const calculateEndTime = (startTime, duration) => {
      if (!startTime || !duration) return "";

      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [durationHours, durationMinutes] = duration.split(":").map(Number);

      const startTotalMinutes = startHours * 60 + startMinutes;
      const durationTotalMinutes = durationHours * 60 + durationMinutes;
      const endTotalMinutes = startTotalMinutes + durationTotalMinutes;

      const endHours = Math.floor(endTotalMinutes / 60) % 24;
      const endMinutes = endTotalMinutes % 60;

      return `${String(endHours).padStart(2, "0")}:${String(
        endMinutes
      ).padStart(2, "0")}`;
    };

    // Submit the flight form directly
    const submitFlight = async () => {
      // Parse duration inputs
      durationHours.value = parseInt(durationHoursInput.value) || 0;
      durationMinutes.value = parseInt(durationMinutesInput.value) || 0;

      // Validate duration
      if (durationHours.value === 0 && durationMinutes.value === 0) {
        errorMessage.value = "Flight duration must be greater than 0";
        return;
      }

      try {
        isSubmitting.value = true;
        errorMessage.value = "";
        successMessage.value = "";

        // Filter out empty links and normalize URLs
        const validLinks = flight.value.links
          .filter((link) => link.trim() !== "")
          .map((link) => {
            const trimmedLink = link.trim();
            // Add https:// if no protocol is specified
            if (trimmedLink && !trimmedLink.match(/^https?:\/\//i)) {
              return `https://${trimmedLink}`;
            }
            return trimmedLink;
          });

        // Prepare flight data
        const flightData = {
          category: flight.value.category,
          type: flight.value.type,
          date: flight.value.date,
          glider: parseInt(flight.value.gliderId),
          flightStart: flight.value.startTime,
          flightEnd: calculateEndTime(
            flight.value.startTime,
            flightDuration.value
          ),
          takeoffLocation: flight.value.startLocation,
          takeoffCountryCode: flight.value.startCountry,
          landingLocation: flight.value.endLocation,
          landingCountryCode: flight.value.endCountry,
          flightTime: flightDuration.value,
          links: validLinks.join(", "),
          comments: flight.value.comments || "",
          igcFilePath: uploadedIGC.value.filePath || null,
          igcSerial: uploadedIGC.value.gliderSerial || null,
        };

        await flightOperations.add(flightData);

        successMessage.value = "Flight added successfully!";
        resetForm();

        // Redirect to flights list after a short delay
        setTimeout(() => {
          router.push("/flights");
        }, 1500);
      } catch (error) {
        console.error("Error adding flight:", error);
        errorMessage.value = "Error adding flight. Please try again.";
      } finally {
        isSubmitting.value = false;
      }
    };

    // formatDate imported from utils

    // Helper function to get glider name
    const getGliderName = (gliderId) => {
      const glider = gliders.value.find((g) => g.id === parseInt(gliderId));
      return glider ? `${glider.manufacturer} ${glider.model}` : "Unknown";
    };

    // Helper function to get valid links for confirmation
    const getValidLinks = () => {
      return flight.value.links
        .filter((link) => link.trim() !== "")
        .map((link) => {
          const trimmedLink = link.trim();
          // Add https:// if no protocol is specified
          if (trimmedLink && !trimmedLink.match(/^https?:\/\//i)) {
            return `https://${trimmedLink}`;
          }
          return trimmedLink;
        });
    };

    // Reset the form
    const resetForm = () => {
      flight.value = {
        date: new Date().toISOString().split("T")[0],
        category: "",
        type: "",
        startTime: "",
        gliderId: "",
        startLocation: "",
        startCountry: "",
        endLocation: "",
        endCountry: "",
        links: [""],
        comments: "",
      };
      durationHours.value = 0;
      durationMinutes.value = 0;
      durationHoursInput.value = "";
      durationMinutesInput.value = "";
      errorMessage.value = "";
      successMessage.value = "";

      // Reset IGC data
      uploadedIGC.value = {
        file: null,
        originalName: "",
        filePath: "",
        startTime: "",
        duration: "",
        date: "",
        pilotName: "",
        gliderType: "",
        gliderSerial: "",
        totalFixes: 0,
        fileExists: false,
        existingFiles: [],
      };

      // Clear IGC upload error
      igcUploadError.value = "";

      // Clear file input
      if (fileInput.value) {
        fileInput.value.value = "";
      }
    };

    onMounted(() => {
      loadSettings();
      loadGear();
      loadFlights();
    });

    return {
      flight,
      durationHours,
      durationMinutes,
      durationHoursInput,
      durationMinutesInput,
      flightDuration,
      categories,
      sportTypes,
      gear,
      gliders,
      countries,
      sortedCountries,
      usedCountries,
      isSubmitting,
      successMessage,
      errorMessage,
      addLink,
      removeLink,
      submitFlight,
      resetForm,
      formatDate,
      getGliderName,
      getValidLinks,
      // Platform check
      isNativePlatform,
      // Duration input handlers
      clearIfZero,
      restoreIfEmpty,
      // IGC upload functionality
      uploadedIGC,
      igcData,
      igcUploadError,
      fileInput,
      handleFileSelect,
      uploadIGCFile,
      removeIGCFile,
      overwriteExisting,
      keepBoth,
    };
  },
};
</script>

<style scoped>
.add-flight {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.add-flight h1 {
  color: #549f74;
  margin-bottom: 30px;
  text-align: center;
}

.flight-form {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.duration-inputs {
  display: flex;
  gap: 15px;
  align-items: end;
}

.duration-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.duration-input {
  width: 80px;
  text-align: center;
}

.duration-input::placeholder {
  color: #adb5bd;
}

.duration-label {
  font-size: 12px;
  color: #666;
  font-weight: normal;
  margin: 0;
}

.links-section {
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  background: white;
}

.link-input {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.link-input:last-child {
  margin-bottom: 0;
}

.link-input .form-control {
  margin-right: 10px;
  margin-bottom: 0;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-remove:hover {
  background: #c82333;
}

.btn-add-link {
  background: #549f74;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
}

.btn-add-link:hover {
  background: #448060;
}

/* Specific button styles for this component - using global btn classes */
.form-actions .btn {
  padding: 12px 30px;
  font-size: 16px;
}

/* IGC Upload Styles */
.igc-upload-area {
  min-height: 60px;
}

.native-igc-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 15px;
  background: #f0f7f3;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  color: #549f74;
  font-size: 0.9rem;
}

.notice-icon {
  font-size: 1rem;
}

.upload-input-section {
  text-align: center;
  padding: 15px;
}

.file-input-hidden {
  display: none;
}

.file-input-label {
  display: inline-block;
  cursor: pointer;
}

.file-input-btn {
  display: inline-block;
  padding: 10px 20px;
  background: #549f74;
  color: white;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.file-input-btn:hover {
  background: #448060;
}

.file-input-btn:active {
  background: #3a7055;
}

.upload-hint {
  font-size: 0.85rem;
  color: #666;
  margin: 10px 0 0 0;
  text-align: center;
}

.igc-file-confirmation {
  background: white;
  border-radius: 8px;
  padding: 15px;
  border: 2px solid #549f74;
}

.file-success {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.file-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
}

.file-info h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1rem;
  font-weight: 600;
}

.file-details {
  margin: 0;
  color: #666;
  font-size: 0.85rem;
}

.btn-remove-igc {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn-remove-igc:hover {
  background: #c82333;
}

.file-conflict-warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 15px;
  margin: 15px 0;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.warning-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.warning-text p {
  margin: 0 0 10px 0;
}

.warning-text p:last-child {
  margin-bottom: 0;
}

.conflict-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.btn-overwrite {
  background: #fd7e14;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-overwrite:hover {
  background: #e8590c;
}

.btn-keep-both {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-keep-both:hover {
  background: #218838;
}

.igc-info {
  color: #549f74;
  font-size: 0.8rem;
  font-style: italic;
  margin-top: 5px;
  display: block;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .add-flight {
    padding: 10px;
  }

  .flight-form {
    padding: 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
  }

  .upload-input-section {
    padding: 10px;
  }

  .file-success {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .btn-remove-igc {
    align-self: flex-end;
  }

  .conflict-actions {
    flex-direction: column;
  }

  .btn-overwrite,
  .btn-keep-both {
    width: 100%;
    padding: 12px;
  }
}

</style>
