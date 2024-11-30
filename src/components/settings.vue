<template>
  <div class="page-bg-grey">
    <div class="flex justify-between items-center mb-8">
      <h1 class="page-title1">Gear Overview</h1>
    </div>
    <div class="flex justify-end mb-8">
      <button @click="saveSettings" class="button-blue">Save settings</button>
    </div>
    <div class="mt-12 mb-12">
      <label for="categories" class="page-title2">Categories</label>

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
      <label for="types" class="page-title2">Types</label>
      <div
        v-for="(type, index) in types"
        :key="index"
        class="flex items-center mt-4 mb-2"
      >
        <input
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
      <label for="warningDuration" class="page-title2"
        >Glider Warning Duration (months)</label
      >
      <div>Set the reminder time for your glider check</div>
      <div>
        <input
          type="number"
          v-model="gliderWarningDuration"
          class="modal-dropdown w-1/4 mt-2"
        />
      </div>
    </div>
    <div class="mt-12 mb-12">
      <label for="warningDuration" class="page-title2"
        >Rescue Warning Duration (months)</label
      >
      <div>Set the reminder time for your rescue check</div>
      <div>
        <input
          type="number"
          v-model="rescueWarningDuration"
          class="modal-dropdown w-1/4 mt-2"
        />
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
    };
  },
  computed: {},
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
  },
  created() {
    this.fetchSettings();
  },
};
</script>

<style scoped>
@import "@/assets/pages.css";
</style>
