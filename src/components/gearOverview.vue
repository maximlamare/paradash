<template>
  <div class="bg-gray-100 dark:bg-gray-900 min-h-screen p-8 w-full">
    <div class="flex justify-between items-center mb-8">
      <button
        @click="openAddModal"
        class="button-blue"
      >
        Add Gear
      </button>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mx-auto">Gear Overview</h1>
    </div>
    <div class="w-full flex flex-wrap -mx-2">
      <div
        v-for="category in groupedEquipment"
        :key="category.name"
        class="w-full sm:w-1/2 lg:w-1/3 px-2 mb-4"
      >
        <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{{ category.name }}</h2>
        <div
          v-for="item in category.items"
          :key="item.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border dark:border-gray-700 mb-4"
        >
          <div class="p-4">
            <div class="flex justify-between items-center">
              <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {{ item.brand }} {{ item.model }}<span v-if="item.manufacturing_date"> ({{ new Date(item.manufacturing_date).getFullYear() }})</span>
              </h3>
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
              Purchase Date: <span
                v-if="item.purchase_date"
                class="font-bold text-indigo-600 dark:text-indigo-400"
              >{{ item.purchase_date }}</span>
              <span v-else>?</span>
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              <strong>Total Flight Time:</strong> {{ item.total_flight_time }} hours
            </p>
            <p class="text-gray-700 dark:text-gray-300">
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
      <form @submit.prevent="addGear">
        <div class="mb-4">
          <label
            for="gear_type"
            class="modal-text"
          >Gear type</label>
          <select
            v-model="newGear.gear_type"
            id="gear_type"
            class="modal-dropdown"
          >
            <option value="glider">Glider</option>
            <option value="harness">Harness</option>
            <option value="rescue">Rescue</option>
          </select>
        </div>

        <div class="mb-4">
          <label
            for="brand"
            class="modal-text"
          >Brand</label>
          <select
            v-model="newGear.brand"
            id="brand"
            class="modal-dropdown"
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
              placeholder="Enter new gear brand"
              class="modal-dropdown mt-2"
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
            v-model="newGear.model"
            id="model"
            class="modal-dropdown"
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
              placeholder="Enter new gear model"
              class="modal-dropdown mt-2"
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
            for="manufacturing_date"
            class="modal-text"
          >Manufacturing Date</label>
          <input
            v-model="newGear.manufacturing_date"
            id="manufacturing_date"
            type="date"
            class="modal-dropdown"
          >
        </div>
        <div class="mb-4">
          <label
            for="purchase_date"
            class="modal-text"
          >Purchase Date</label>
          <input
            v-model="newGear.purchase_date"
            id="purchase_date"
            type="date"
            class="modal-dropdown"
          >
        </div>
        <div class="flex justify-center">
          <button
            type="submit"
            class="button-blue"
          >Add</button>
        </div>
      </form>
    </Modal>

    <Modal
      v-if="showEditModal"
      @close="showEditModal = false"
      title="Edit Gear"
    >
      <form @submit.prevent="updateGear">
        <div class="mb-4">
          <label
            for="edit_type"
            class="modal-text"
          >Type</label>
          <select
            v-model="editGear.gear_type"
            id="edit_type"
            class="modal-dropdown"
          >
            <option value="glider">Glider</option>
            <option value="harness">Harness</option>
            <option value="rescue">Rescue</option>
          </select>
        </div>
        <div class="mb-4">
          <label
            for="edit_brand"
            class="modal-text"
          >Brand</label>
          <select
            v-model="editGear.brand"
            id="edit_brand"
            class="modal-dropdown"
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
              placeholder="Enter new gear brand"
              class="modal-dropdown mt-2"
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
            v-model="editGear.model"
            id="edit_model"
            class="modal-dropdown"
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
              placeholder="Enter new gear model"
              class="modal-dropdown mt-2"
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
            for="edit_manufacturing_date"
            class="modal-text"
          >Manufacturing Date</label>
          <input
            v-model="editGear.manufacturing_date"
            id="edit_manufacturing_date"
            type="date"
            class="modal-dropdown"
          >
        </div>
        <div class="mb-4">
          <label
            for="edit_purchase_date"
            class="modal-text"
          >Purchase Date</label>
          <input
            v-model="editGear.purchase_date"
            id="edit_purchase_date"
            type="date"
            class="modal-dropdown"
          >
        </div>
        <div class="flex justify-center space-x-4">
          <button
            type="button"
            @click="deleteGear(editGear.id)"
            class="button-delete"
          >Delete</button>
          <button
            type="submit"
            class="button-blue"
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
      newGear: {
        gear_type: "glider", // Default type
        brand: "",
        model: "",
        manufacturing_date: "",
        purchase_date: "",
        total_flight_time: 0,
        number_of_flights: 0,
      },
      editGear: {
        id: null,
        gear_type: "", // Default type
        brand: "",
        model: "",
        manufacturing_date: "",
        purchase_date: "",
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
        .get("http://localhost:3000/gear")
        .then((response) => {
          const gear = response.data.data.map((item) => ({
            ...item,
            category: "Gear",
          }));
          this.equipment = gear; // Reset the equipment array before appending new data
        })
        .catch((error) => {
          console.error("Error fetching gear:", error);
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
        .get("http://localhost:3000/gear")
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
        if (this.showAddModal) {
          this.newGear.brand = "";
        } else if (this.showEditModal) {
          this.editGear.brand = "";
        }
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
        if (this.showAddModal) {
          this.newGear.brand = this.newBrandName;
        } else if (this.showEditModal) {
          this.editGear.brand = this.newBrandName;
        }
        this.newBrand = false;
        this.newBrandName = "";
      }
    },
    checkNewModel(event) {
      if (event.target.value === "new") {
        this.newModel = true;
        if (this.showAddModal) {
          this.newGear.model = "";
        } else if (this.showEditModal) {
          this.editGear.model = "";
        }
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
        if (this.showAddModal) {
          this.newGear.model = this.newModelName;
        } else if (this.showEditModal) {
          this.editGear.model = this.newModelName;
        }
        this.newModel = false;
        this.newModelName = "";
      }
    },

    addGear() {
      axios
        .post("http://localhost:3000/gear", this.newGear)
        .then(() => {
          this.fetchEquipment(); // Refetch equipment to update the UI
          this.showAddModal = false;
          this.newGear = {
            gear_type: "glider",
            brand: "",
            model: "",
            manufacturing_date: "",
            purchase_date: "",
            total_flight_time: 0,
            number_of_flights: 0,
          };
        })
        .catch((error) => {
          console.error("Error adding gear:", error);
        });
    },
    editEntry(item) {
      this.editGear = { ...item };
      this.fetchBrandsAndModels(); // Fetch brands and models to ensure dropdowns are populated
      this.showEditModal = true;
    },
    updateGear() {
      axios
        .put(`http://localhost:3000/gear/${this.editGear.id}`, this.editGear)
        .then(() => {
          this.fetchEquipment(); // Refetch equipment to update the UI
          this.showEditModal = false;
        })
        .catch((error) => {
          console.error("Error updating gear:", error);
        });
    },
    deleteGear(id) {
      axios
        .delete(`http://localhost:3000/gear/${id}`)
        .then(() => {
          // Remove the deleted item from the equipment array
          this.equipment = this.equipment.filter((item) => item.id !== id);
          this.showEditModal = false;
        })
        .catch((error) => {
          console.error("Error deleting gear:", error);
        });
    },
  },
  computed: {
    groupedEquipment() {
      const typeNames = {
        glider: "Gliders",
        harness: "Harnesses",
        rescue: "Rescues",
      };
      const categories = {};
      this.equipment.forEach((item) => {
        if (!categories[item.gear_type]) {
          categories[item.gear_type] = {
            name: typeNames[item.gear_type],
            items: [],
          };
        }
        categories[item.gear_type].items.push(item);
      });
      return Object.values(categories);
    },
  },
};
</script>

<style scoped>
@import "@/assets/modal.css";
@import "@/assets/buttons.css";
</style>