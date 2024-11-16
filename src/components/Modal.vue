<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
      <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{{ title }}</h2>
      <slot></slot>
      <div class="flex justify-end mt-4">
        <button
          @click="$emit('close')"
          class="button-close"
        >Close</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "GearModal",
  props: {
    title: {
      type: String,
      required: true,
    },
  },
};
</script>

<style scoped>
@import "@/assets/buttons.css";
</style>