<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <h2 class="modal-title">{{ title }}</h2>
      <form @submit.prevent="saveMaintenance">
        <div class="mb-4">
          <label
            for="maintenance_date"
            class="modal-text"
          >Maintenance Date</label>
          <input
            v-model="localMaintenance.maintenance_date"
            id="maintenance_date"
            type="date"
            class="modal-input"
          >
        </div>
        <div class="mb-4">
          <label
            for="description"
            class="modal-text"
          >Description</label>
          <textarea
            v-model="localMaintenance.description"
            id="description"
            class="modal-input"
          ></textarea>
        </div>
        <div class="mb-4">
          <label
            for="cost"
            class="modal-text"
          >Cost</label>
          <input
            v-model="localMaintenance.cost"
            id="cost"
            type="number"
            class="modal-input"
          >
        </div>
        <div class="flex justify-end">
          <button
            type="submit"
            class="button-blue"
          >Save</button>
        </div>
      </form>
    </div>
  </div>
</template>
  
  <script>
export default {
  props: {
    title: {
      type: String,
      required: true,
    },
    maintenance: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      localMaintenance: { ...this.maintenance },
    };
  },
  methods: {
    saveMaintenance() {
      this.$emit("save", this.localMaintenance);
    },
  },
};
</script>
  
  <style scoped>
@import "@/assets/modal.css";
</style>