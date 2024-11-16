<template>
  <div class="bg-gray-100 dark:bg-gray-900 min-h-screen p-8">
    <div class="flex justify-between items-center mb-8">
      <button
        @click="openAddModal"
        class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
      >
        Add Gear
      </button>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mx-auto">Gear Overview</h1>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="category in groupedEquipment"
        :key="category.name"
        class="col-span-1"
      >
        <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{{ category.name }}</h2>
        <div
          v-for="item in category.items"
          :key="item.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border dark:border-gray-700 mb-4"
        >
          <div class="p-4">
            <div class="flex justify-between items-center">
              <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{{ item.brand }} {{ item.model }}</h3>
              <button
                @click="editEntry(item)"
                class="hover:bg-blue-600 rounded-lg"
              >
                <img
                  src="@/assets/logos/edit24.png"
                  alt="Edit"
                  class="h-6 w-6"
                >
              </button>
            </div>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Purchase Date: <span class="font-bold text-indigo-600 dark:text-indigo-400">{{ item.purchase_date }}</span>
            </p>
            <p
              v-if="item.total_flight_time"
              class="text-gray-700 dark:text-gray-300"
            >
              <strong>Total Flight Time:</strong> {{ item.total_flight_time }} hours
            </p>
            <p
              v-if="item.number_of_flights"
              class="text-gray-700 dark:text-gray-300"
            >
              <strong>Number of Flights:</strong> {{ item.number_of_flights }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <Modal
      v-if="showAddModal"
      @close="showAddModal = false"
      title="Add Gear"
    >
      <form @submit.prevent="addGlider">
        <div class="mb-4">
          <label
            for="brand"
            class="modal-text"
          >Brand</label>
          <select
            v-model="newGlider.brand"
            id="brand"
            class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300"
            @change="checkNewBrand"
          >
            <option
              v-for="brand in brands"
              :key="brand"
              :value="brand"
            >{{ brand }}</option>
            <option value="new">Add new brand</option>
          </select>
          <div
            v-if="newBrand"
            class="mt-2"
          >
            <input
              ref="newBrandInput"
              v-model="newBrandName"
              placeholder="Enter new glider brand"
              class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300 mt-2"
            >
            <button
              @click="addNewBrand"
              type="button"
              class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-2"
            >Add Brand</button>
          </div>
        </div>
        <div class="mb-4">
          <label
            for="model"
            class="modal-text"
          >Model</label>
          <select
            v-model="newGlider.model"
            id="model"
            class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300"
            @change="checkNewModel"
          >
            <option
              v-for="model in models"
              :key="model"
              :value="model"
            >{{ model }}</option>
            <option value="new">Add new model</option>
          </select>
          <div
            v-if="newModel"
            class="mt-2"
          >
            <input
              ref="newModelInput"
              v-model="newModelName"
              placeholder="Enter new glider model"
              class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300 mt-2"
            >
            <button
              @click="addNewModel"
              type="button"
              class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-2"
            >Add Model</button>
          </div>
        </div>
        <div class="mb-4">
          <label
            for="purchase_date"
            class="modal-text"
          >Purchase Date</label>
          <input
            v-model="newGlider.purchase_date"
            id="purchase_date"
            type="date"
            class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300"
          >
        </div>
        <div class="mb-4">
          <label
            for="logo_path"
            class="modal-text"
          >Logo Path</label>
          <input
            v-model="newGlider.logo_path"
            id="logo_path"
            type="text"
            class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300"
          >
        </div>
        <div class="mb-4">
          <label
            for="total_flight_time"
            class="modal-text"
          >Total Flight Time</label>
          <input
            v-model="newGlider.total_flight_time"
            id="total_flight_time"
            type="number"
            class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300"
          >
        </div>
        <div class="mb-4">
          <label
            for="number_of_flights"
            class="modal-text"
          >Number of Flights</label>
          <input
            v-model="newGlider.number_of_flights"
            id="number_of_flights"
            type="number"
            class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300"
          >
        </div>
        <div class="flex justify-end">
          <button
            type="submit"
            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >Add</button>
        </div>
      </form>
    </Modal>

    <Modal
      v-if="showEditModal"
      @close="showEditModal = false"
      title="Edit Gear"
    >
      <form @submit.prevent="updateGlider">
        <div class="mb-4">
          <label
            for="edit_brand"
            class="modal-text"
          >Brand</label>
          <select
            v-model="editGlider.brand"
            id="edit_brand"
            class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300"
            @change="checkNewBrand"
          >
            <option
              v-for="brand in brands"
              :key="brand"
              :value="brand"
            >{{ brand }}</option>
            <option value="new">Add new brand</option>
          </select>
          <div
            v-if="newBrand"
            class="mt-2"
          >
            <input
              ref="newBrandInput"
              v-model="newBrandName"
              placeholder="Enter new glider brand"
              class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300 mt-2"
            >
            <button
              @click="addNewBrand"
              type="button"
              class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-2"
            >Add Brand</button>
          </div>
        </div>
        <div class="mb-4">
          <label
            for="edit_model"
            class="modal-text"
          >Model</label>
          <select
            v-model="editGlider.model"
            id="edit_model"
            class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300"
            @change="checkNewModel"
          >
            <option
              v-for="model in models"
              :key="model"
              :value="model"
            >{{ model }}</option>
            <option value="new">Add new model</option>
          </select>
          <div
            v-if="newModel"
            class="mt-2"
          >
            <input
              ref="newModelInput"
              v-model="newModelName"
              placeholder="Enter new glider model"
              class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300 mt-2"
            >
            <button
              @click="addNewModel"
              type="button"
              class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-2"
            >Add Model</button>
          </div>
        </div>
        <div class="mb-4">
          <label
            for="edit_purchase_date"
            class="modal-text"
          >Purchase Date</label>
          <input
            v-model="editGlider.purchase_date"
            id="edit_purchase_date"
            type="date"
            class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300"
          >
        </div>
        <div class="mb-4">
          <label
            for="edit_logo_path"
            class="modal-text"
          >Logo Path</label>
          <input
            v-model="editGlider.logo_path"
            id="edit_logo_path"
            type="text"
            class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300"
          >
        </div>
        <div class="mb-4">
          <label
            for="edit_total_flight_time"
            class="modal-text"
          >Total Flight Time</label>
          <input
            v-model="editGlider.total_flight_time"
            id="edit_total_flight_time"
            type="number"
            class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300"
          >
        </div>
        <div class="mb-4">
          <label
            for="edit_number_of_flights"
            class="modal-text"
          >Number of Flights</label>
          <input
            v-model="editGlider.number_of_flights"
            id="edit_number_of_flights"
            type="number"
            class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-300"
          >
        </div>
        <div class="flex justify-center space-x-4">
          <button
            type="button"
            @click="deleteGlider(editGlider.id)"
            class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >Delete</button>
          <button
            type="submit"
            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >Save</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script>
import axios from "axios";
import { nextTick } from "vue";
import Modal from "./Modal.vue";

export default {
  components: {
    Modal,
  },
  data() {
    return {
      equipment: [],
      brands: [],
      models: [],
      showAddModal: false,
      showEditModal: false,
      newBrand: false,
      newBrandName: "",
      newModel: false,
      newModelName: "",
      newGlider: {
        brand: "",
        model: "",
        purchase_date: "",
        logo_path: "",
        total_flight_time: 0,
        number_of_flights: 0,
      },
      editGlider: {
        id: null,
        brand: "",
        model: "",
        purchase_date: "",
        logo_path: "",
        total_flight_time: 0,
        number_of_flights: 0,
      },
    };
  },
  created() {
    this.fetchEquipment();
  },
  methods: {
    fetchEquipment() {
      axios
        .get("http://localhost:3000/gliders")
        .then((response) => {
          const gliders = response.data.data.map((item) => ({
            ...item,
            category: "Gliders",
          }));
          this.equipment = gliders; // Reset the equipment array before appending new data
        })
        .catch((error) => {
          console.error("Error fetching gliders:", error);
        });

      axios
        .get("http://localhost:3000/harnesses")
        .then((response) => {
          const harnesses = response.data.data.map((item) => ({
            ...item,
            category: "Harnesses",
          }));
          this.equipment = [...this.equipment, ...harnesses];
        })
        .catch((error) => {
          console.error("Error fetching harnesses:", error);
        });

      axios
        .get("http://localhost:3000/rescue_parachutes")
        .then((response) => {
          const parachutes = response.data.data.map((item) => ({
            ...item,
            category: "Rescue Parachutes",
          }));
          this.equipment = [...this.equipment, ...parachutes];
        })
        .catch((error) => {
          console.error("Error fetching rescue parachutes:", error);
        });
    },
    fetchBrandsAndModels() {
      axios
        .get("http://localhost:3000/gliders")
        .then((response) => {
          const brands = [
            ...new Set(response.data.data.map((item) => item.brand)),
          ];
          const models = [
            ...new Set(response.data.data.map((item) => item.model)),
          ];
          this.brands = brands;
          this.models = models;
        })
        .catch((error) => {
          console.error("Error fetching brands and models:", error);
        });
    },
    openAddModal() {
      this.fetchBrandsAndModels();
      this.showAddModal = true;
    },
    checkNewBrand(event) {
      if (event.target.value === "new") {
        this.newBrand = true;
        this.newGlider.brand = "";
        nextTick(() => {
          this.$refs.newBrandInput.focus();
        });
      } else {
        this.newBrand = false;
      }
    },
    addNewBrand() {
      if (this.newBrandName.trim() !== "") {
        this.brands.push(this.newBrandName);
        this.newGlider.brand = this.newBrandName;
        this.newBrand = false;
        this.newBrandName = "";
      }
    },
    checkNewModel(event) {
      if (event.target.value === "new") {
        this.newModel = true;
        this.newGlider.model = "";
        nextTick(() => {
          this.$refs.newModelInput.focus();
        });
      } else {
        this.newModel = false;
      }
    },
    addNewModel() {
      if (this.newModelName.trim() !== "") {
        this.models.push(this.newModelName);
        this.newGlider.model = this.newModelName;
        this.newModel = false;
        this.newModelName = "";
      }
    },
    addGlider() {
      axios
        .post("http://localhost:3000/gliders", this.newGlider)
        .then(() => {
          this.fetchEquipment(); // Refetch equipment to update the UI
          this.showAddModal = false;
          this.newGlider = {
            brand: "",
            model: "",
            purchase_date: "",
            logo_path: "",
            total_flight_time: 0,
            number_of_flights: 0,
          };
        })
        .catch((error) => {
          console.error("Error adding glider:", error);
        });
    },
    editEntry(item) {
      this.editGlider = { ...item };
      this.showEditModal = true;
    },
    updateGlider() {
      axios
        .put(
          `http://localhost:3000/gliders/${this.editGlider.id}`,
          this.editGlider
        )
        .then(() => {
          this.fetchEquipment(); // Refetch equipment to update the UI
          this.showEditModal = false;
        })
        .catch((error) => {
          console.error("Error updating glider:", error);
        });
    },
    deleteGlider(id) {
      axios
        .delete(`http://localhost:3000/gliders/${id}`)
        .then(() => {
          // Remove the deleted item from the equipment array
          this.equipment = this.equipment.filter((item) => item.id !== id);
          this.showEditModal = false;
        })
        .catch((error) => {
          console.error("Error deleting glider:", error);
        });
    },
  },
  computed: {
    groupedEquipment() {
      const categories = {};
      this.equipment.forEach((item) => {
        if (!categories[item.category]) {
          categories[item.category] = {
            name: item.category,
            items: [],
          };
        }
        categories[item.category].items.push(item);
      });
      return Object.values(categories);
    },
  },
};
</script>

<style scoped>
@import "@/assets/modal.css";
</style>