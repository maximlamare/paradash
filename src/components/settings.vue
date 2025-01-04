<template>
  <div class="page-bg-grey">
    <div class="flex justify-between items-center mb-8">
      <h1 class="page-title1">Settings</h1>
    </div>
    <div class="flex justify-end mb-8">
      <button @click="saveSettings" class="button-blue">Save settings</button>
    </div>
    <div class="mt-12 mb-12">
      <label class="page-title2">Categories</label>

      <div
        v-for="(category, index) in categories"
        :key="index"
        class="flex items-center mt-4 mb-2"
      >
        <input
          type="text"
          v-model="categories[index]"
          class="modal-dropdown w-1/4"
        />
        <button @click="removeCategory(index)" class="button-delete ml-2">
          Remove
        </button>
      </div>
      <div>
        <button @click="addCategory" class="button-blue mt-2">
          Add Category
        </button>
      </div>
    </div>
    <div class="mt-12 mb-12">
      <label class="page-title2">Types</label>
      <div
        v-for="(type, index) in types"
        :key="index"
        class="flex items-center mt-4 mb-2"
      >
        <input
          name="type"
          type="text"
          v-model="types[index]"
          class="modal-dropdown w-1/4"
        />
        <button @click="removeType(index)" class="button-delete ml-2">
          Remove
        </button>
      </div>
      <div>
        <button @click="addType" class="button-blue mt-2">Add Type</button>
      </div>
    </div>
    <div class="mt-12 mb-12">
      <label class="page-title2">Glider Warning Duration (months)</label>
      <div>Set the reminder time for your glider check</div>
      <div>
        <input
          name="gliderWarningDuration"
          type="number"
          v-model="gliderWarningDuration"
          class="modal-dropdown w-1/4 mt-2"
        />
      </div>
    </div>
    <div class="mt-12 mb-12">
      <label class="page-title2">Rescue Warning Duration (months)</label>
      <div>Set the reminder time for your rescue check</div>
      <div>
        <input
          name="rescueWarningDuration"
          type="number"
          v-model="rescueWarningDuration"
          class="modal-dropdown w-1/4 mt-2"
        />
      </div>
    </div>
    <div class="mt-12 mb-12">
      <label class="page-title2">Export database</label>
      <div>
        <select
          name="exportDb"
          v-model="selectedTable"
          class="modal-dropdown w-1/4 mt-2"
        >
          <option v-for="table in tables" :key="table" :value="table">
            {{ table }}
          </option>
        </select>
      </div>
      <div>
        <button @click="exportCsv" class="button-blue mt-2 mr-2">
          Export .csv
        </button>
        <button @click="exportDb" class="button-blue mt-2">
          Export entire database as .db
        </button>
      </div>
    </div>
    <div class="mt-12 mb-12">
      <label class="page-title2">Import database</label>
      <div class="mt-4">
        <button @click="uploadDb" class="button-delete">
          Upload .db file (danger)
        </button>
        <p v-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "SettingsPage",
  data() {
    return {
      categories: [],
      types: [],
      gliderWarningDuration: 12,
      rescueWarningDuration: 12,
      tables: [],
      selectedTable: "",
      errorMessage: "",
    };
  },
  computed: {},
  created() {
    this.fetchSettings();
    this.fetchTables();
  },
  methods: {
    saveSettings() {
      axios
        .post("http://localhost:3002/save-settings", {
          categories: this.categories,
          types: this.types,
          gliderWarningDuration: this.gliderWarningDuration,
          rescueWarningDuration: this.rescueWarningDuration,
        })
        .then(() => {
          this.fetchSettings();
        })
        .catch((error) => {
          console.error("Error saving categories:", error);
        });
    },
    addCategory() {
      this.categories.push("");
      this.updateSettings(this.categories, this.types);
    },
    removeCategory(index) {
      this.categories.splice(index, 1);
    },
    addType() {
      this.types.push("");
      this.updateSettings(this.categories, this.types);
    },
    removeType(index) {
      this.types.splice(index, 1);
    },
    fetchSettings() {
      axios
        .get("http://localhost:3002/get-settings")
        .then((response) => {
          this.categories = response.data.categories;
          this.types = response.data.types;
          this.gliderWarningDuration = response.data.gliderWarningDuration;
          this.rescueWarningDuration = response.data.rescueWarningDuration;
        })
        .catch((error) => {
          console.error("Error fetching settings:", error);
        });
    },
    fetchTables() {
      axios
        .get("http://localhost:3000/get-tables")
        .then((response) => {
          this.tables = response.data.tables;
          if (this.tables.length > 0) {
            this.selectedTable = this.tables[0];
          }
        })
        .catch((error) => {
          console.error("Error fetching tables:", error);
        });
    },
    exportDb() {
      console.log("Exporting database");
      axios
        .get("http://localhost:3000/export-database", {
          responseType: "blob",
        })
        .then((response) => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", "database.db");
          document.body.appendChild(link);
          link.click();
          link.remove();
        })
        .catch((error) => {
          console.error("Error exporting database:", error);
        });
    },
    exportCsv() {
      axios
        .get("http://localhost:3000/export-csv", {
          params: { table: this.selectedTable },
          responseType: "blob",
        })
        .then((response) => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `${this.selectedTable}.csv`);
          document.body.appendChild(link);
          link.click();
          link.remove();
        })
        .catch((error) => {
          console.error("Error exporting table to CSV:", error);
        });
    },
    uploadDb() {
      if (
        confirm(
          "Are you sure you want to upload a new database? Your current data will be lost."
        )
      ) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".db";
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file) {
            const formData = new FormData();
            formData.append("dbFile", file);

            axios
              .post("http://localhost:3000/upload-db", formData, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              })
              .then(() => {
                this.errorMessage = ""; // Clear error message on success
              })
              .catch((error) => {
                console.error("Error uploading database:", error);
                this.errorMessage =
                  "Error uploading database: " + error.message; // Set error message
              });
          }
        };
        input.click();
      }
    },
  },
};
</script>

<style scoped>
@import "@/assets/pages.css";
@import "@/assets/buttons.css";
</style>
