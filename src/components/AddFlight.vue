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
        <div class="form-group location-autocomplete">
          <label for="startLocation">Start Location</label>
          <input
            type="text"
            id="startLocation"
            v-model="flight.startLocation"
            required
            class="form-control"
            placeholder="Location name"
            @input="onStartLocationInput"
            @focus="showStartSuggestions = true"
            @blur="hideStartSuggestionsDelayed"
            autocomplete="off"
          />
          <ul v-if="showStartSuggestions && filteredStartLocations.length > 0" class="location-suggestions">
            <li
              v-for="location in filteredStartLocations"
              :key="location.name + '-' + location.countryCode"
              @mousedown.prevent="selectStartLocation(location)"
              class="suggestion-item"
            >
              <span class="suggestion-name">{{ location.name }}</span>
              <span class="suggestion-country" v-if="location.countryCode">{{ location.countryCode }}</span>
            </li>
          </ul>
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
        <div class="form-group location-autocomplete">
          <label for="endLocation">End Location</label>
          <input
            type="text"
            id="endLocation"
            v-model="flight.endLocation"
            required
            class="form-control"
            placeholder="Location name"
            @input="onEndLocationInput"
            @focus="showEndSuggestions = true"
            @blur="hideEndSuggestionsDelayed"
            autocomplete="off"
          />
          <ul v-if="showEndSuggestions && filteredEndLocations.length > 0" class="location-suggestions">
            <li
              v-for="location in filteredEndLocations"
              :key="location.name + '-' + location.countryCode"
              @mousedown.prevent="selectEndLocation(location)"
              class="suggestion-item"
            >
              <span class="suggestion-name">{{ location.name }}</span>
              <span class="suggestion-country" v-if="location.countryCode">{{ location.countryCode }}</span>
            </li>
          </ul>
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
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import IGCParser from "igc-parser";
import { flightOperations, gearOperations } from "../database/database.js";
import { calculateIGCDistances } from "../utils/igcUtils.js";
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

    // Parse IGC content and extract flight data (client-side)
    const parseIGCContent = (igcContent, originalName) => {
      try {
        const flight = IGCParser.parse(igcContent);

        if (!flight || !flight.fixes || flight.fixes.length === 0) {
          throw new Error("Invalid IGC file or no GPS fixes found");
        }

        const firstFix = flight.fixes[0];
        const lastFix = flight.fixes[flight.fixes.length - 1];

        let startTime, endTime, flightDate, duration;

        if (firstFix.timestamp) {
          const startDate = new Date(firstFix.timestamp);
          const endDate = new Date(lastFix.timestamp);

          startTime = `${String(startDate.getHours()).padStart(2, "0")}:${String(
            startDate.getMinutes()
          ).padStart(2, "0")}`;
          endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(
            endDate.getMinutes()
          ).padStart(2, "0")}`;
          flightDate = startDate.toISOString().split("T")[0];

          const durationMs = endDate.getTime() - startDate.getTime();
          const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
          const durationMins = Math.floor(
            (durationMs % (1000 * 60 * 60)) / (1000 * 60)
          );
          duration = `${String(durationHours).padStart(2, "0")}:${String(
            durationMins
          ).padStart(2, "0")}`;
        } else if (firstFix.time) {
          const timeToString = (timeObj) => {
            const hours = timeObj.hours || timeObj.hour || 0;
            const minutes = timeObj.minutes || timeObj.minute || 0;
            return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
              2,
              "0"
            )}`;
          };

          startTime = timeToString(firstFix.time);
          endTime = timeToString(lastFix.time);

          const startMinutes =
            (firstFix.time.hours || 0) * 60 + (firstFix.time.minutes || 0);
          const endMinutes =
            (lastFix.time.hours || 0) * 60 + (lastFix.time.minutes || 0);
          const durationTotalMinutes = Math.max(0, endMinutes - startMinutes);
          const durationHrs = Math.floor(durationTotalMinutes / 60);
          const durationMins = durationTotalMinutes % 60;
          duration = `${String(durationHrs).padStart(2, "0")}:${String(
            durationMins
          ).padStart(2, "0")}`;

          flightDate = flight.date || new Date().toISOString().split("T")[0];
        } else {
          throw new Error("Unable to parse time information from IGC file");
        }

        // Calculate max altitude
        let maxAltitude = 0;
        for (const fix of flight.fixes) {
          if (fix.gpsAltitude && fix.gpsAltitude > maxAltitude) {
            maxAltitude = fix.gpsAltitude;
          }
        }

        return {
          startTime,
          endTime,
          duration,
          date: flightDate,
          pilotName: flight.pilot || "",
          gliderType: flight.gliderType || "",
          gliderSerial: flight.gliderSerial || "",
          totalFixes: flight.fixes.length,
          fixes: flight.fixes, // Include fixes for distance calculation
          maxAltitude,
          valid: true,
        };
      } catch (error) {
        console.error("Error parsing IGC file:", error);
        throw new Error(`Failed to parse IGC file: ${error.message}`);
      }
    };

    const uploadIGCFile = async (file) => {
      try {
        igcUploadError.value = "";

        // Parse locally and store with Filesystem
        const fileContent = await readFileAsText(file);
        const igcData = parseIGCContent(fileContent, file.name);
        
        // Calculate distances from IGC content
        const distances = calculateIGCDistances(fileContent);

        // Store IGC file in app's documents directory (use original filename)
        const fileName = file.name;
        await Filesystem.writeFile({
          path: `igc/${fileName}`,
          data: fileContent,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
          recursive: true,
        });

        // Store IGC data
        uploadedIGC.value = {
          file: file,
          originalName: file.name,
          filePath: fileName,
          startTime: igcData.startTime,
          duration: igcData.duration,
          date: igcData.date,
          pilotName: igcData.pilotName,
          gliderType: igcData.gliderType,
          gliderSerial: igcData.gliderSerial,
          totalFixes: igcData.totalFixes,
          trackDistance: distances.trackDistance,
          straightDistance: distances.straightDistance,
          maxAltitude: distances.maxAltitude || igcData.maxAltitude,
          igcContent: fileContent,
        };

        // Auto-populate form fields
        if (igcData.date) {
          flight.value.date = igcData.date;
        }
        if (igcData.startTime) {
          flight.value.startTime = igcData.startTime;
        }
        if (igcData.duration) {
          const [hours, minutes] = igcData.duration.split(":").map(Number);
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
        };
      }
    };

    // Helper function to read file as text
    const readFileAsText = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      });
    };

    const removeIGCFile = async () => {
      try {
        if (uploadedIGC.value.filePath) {
          // Delete from local filesystem
          try {
            await Filesystem.deleteFile({
              path: `igc/${uploadedIGC.value.filePath}`,
              directory: Directory.Documents,
            });
          } catch (e) {
            // File may not exist, ignore
          }
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
      };

      // Clear file input
      if (fileInput.value) {
        fileInput.value.value = "";
      }

      igcUploadError.value = "";
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
    
    // Location autocomplete state
    const showStartSuggestions = ref(false);
    const showEndSuggestions = ref(false);

    // Computed property to filter only active gliders
    const gliders = computed(() => {
      return gear.value.filter(
        (item) => item.type === "gliders" && item.is_active
      );
    });

    // Computed property to get unique takeoff locations from existing flights
    const uniqueTakeoffLocations = computed(() => {
      const locationMap = new Map();
      
      existingFlights.value.forEach((f) => {
        if (f.takeoffLocation) {
          const key = `${f.takeoffLocation}-${f.takeoffCountryCode || ''}`;
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              name: f.takeoffLocation,
              countryCode: f.takeoffCountryCode || '',
            });
          }
        }
      });
      
      return Array.from(locationMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );
    });

    // Computed property to get unique landing locations from existing flights
    const uniqueLandingLocations = computed(() => {
      const locationMap = new Map();
      
      existingFlights.value.forEach((f) => {
        if (f.landingLocation) {
          const key = `${f.landingLocation}-${f.landingCountryCode || ''}`;
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              name: f.landingLocation,
              countryCode: f.landingCountryCode || '',
            });
          }
        }
      });
      
      return Array.from(locationMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );
    });

    // Filtered locations for start field (only takeoff locations)
    const filteredStartLocations = computed(() => {
      const search = flight.value.startLocation?.toLowerCase() || '';
      if (!search) return uniqueTakeoffLocations.value.slice(0, 10);
      return uniqueTakeoffLocations.value
        .filter((loc) => loc.name.toLowerCase().includes(search))
        .slice(0, 10);
    });

    // Filtered locations for end field (only landing locations)
    const filteredEndLocations = computed(() => {
      const search = flight.value.endLocation?.toLowerCase() || '';
      if (!search) return uniqueLandingLocations.value.slice(0, 10);
      return uniqueLandingLocations.value
        .filter((loc) => loc.name.toLowerCase().includes(search))
        .slice(0, 10);
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
          trackDistance: uploadedIGC.value.trackDistance || null,
          straightDistance: uploadedIGC.value.straightDistance || null,
          maxAltitude: uploadedIGC.value.maxAltitude || null,
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

    // Location autocomplete handlers
    const onStartLocationInput = () => {
      showStartSuggestions.value = true;
    };

    const onEndLocationInput = () => {
      showEndSuggestions.value = true;
    };

    const selectStartLocation = (location) => {
      flight.value.startLocation = location.name;
      if (location.countryCode) {
        flight.value.startCountry = location.countryCode;
      }
      showStartSuggestions.value = false;
    };

    const selectEndLocation = (location) => {
      flight.value.endLocation = location.name;
      if (location.countryCode) {
        flight.value.endCountry = location.countryCode;
      }
      showEndSuggestions.value = false;
    };

    const hideStartSuggestionsDelayed = () => {
      setTimeout(() => {
        showStartSuggestions.value = false;
      }, 150);
    };

    const hideEndSuggestionsDelayed = () => {
      setTimeout(() => {
        showEndSuggestions.value = false;
      }, 150);
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
      // Location autocomplete
      showStartSuggestions,
      showEndSuggestions,
      filteredStartLocations,
      filteredEndLocations,
      onStartLocationInput,
      onEndLocationInput,
      selectStartLocation,
      selectEndLocation,
      hideStartSuggestionsDelayed,
      hideEndSuggestionsDelayed,
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

/* Location Autocomplete Styles */
.location-autocomplete {
  position: relative;
}

.location-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  list-style: none;
  margin: 0;
  padding: 0;
}

.suggestion-item {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.15s ease;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background-color: #e8f5f0;
}

.suggestion-name {
  font-weight: 500;
  color: #333;
}

.suggestion-country {
  font-size: 0.8rem;
  color: #666;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

</style>
