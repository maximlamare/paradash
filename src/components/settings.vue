<template>
  <div class="page-bg-grey">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mx-auto">
      Settings
    </h1>
    <div class="mb-4">
      <label for="categories" class="modal-text">Categories</label>
      <textarea
        id="categories"
        v-model="categoriesInput"
        class="modal-dropdown w-full"
        placeholder="Enter categories separated by commas"
      ></textarea>
    </div>
    <button @click="saveCategories" class="button-blue">Save</button>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  name: "SettingsPage",
  data() {
    return {
      categoriesInput: "",
    };
  },
  computed: {
    ...mapGetters(["getCategories"]),
  },
  methods: {
    ...mapActions(["updateCategories"]),
    saveCategories() {
      const categories = this.categoriesInput
        .split(",")
        .map((cat) => cat.trim());
      this.updateCategories(categories);
    },
  },
  created() {
    this.categoriesInput = this.getCategories.join(", ");
  },
};
</script>

<style scoped>
@import "@/assets/pages.css";
</style>
