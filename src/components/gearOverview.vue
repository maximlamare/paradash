<template>
  <div class="page-bg-grey">
    <div class="flex justify-between items-center mb-8">
      <button @click="openAddModal" class="button-blue">Add Gear</button>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mx-auto">
        Gear Overview
      </h1>
    </div>
    <div class="w-full flex flex-wrap -mx-2">
      <div
        v-for="category in groupedEquipment"
        :key="category.name"
        class="w-full sm:w-1/2 lg:w-1/3 px-2 mb-4"
      >
        <h2 class="page-title2">
          {{ category.name }}
        </h2>
        <div
          v-for="item in category.items"
          :key="item.id"
          :class="[
            'bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border dark:border-gray-700 mb-4',
            { 'archived-item': item.archived == 1 },
          ]"
          @click="openGearDetailsModal(item)"
        >
          <div class="p-4">
            <div class="flex justify-between items-center">
              <h3
                class="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100"
              >
                {{ item.brand }} {{ item.model
                }}<span v-if="item.manufacturing_date">
                  ({{ new Date(item.manufacturing_date).getFullYear() }})</span
                >
              </h3>
              <div class="flex space-x-2">
                <button @click.stop="editEntry(item)" class="logo-button">
                  <img
                    src="@/assets/logos/spanner.png"
                    alt="Edit"
                    class="h-6 w-6"
                  />
                </button>
              </div>
            </div>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Purchase Date:
              <span
                v-if="item.purchase_date"
                class="font-bold text-indigo-600 dark:text-indigo-400"
                >{{ item.purchase_date }}</span
              >
              <span v-else>?</span>
            </p>
            <p
              v-if="item.gear_type === 'glider'"
              class="text-gray-700 dark:text-gray-300"
            >
              <strong>Total Flight Time:</strong>
              {{ item.total_flight_time }} hours
            </p>
            <p
              v-if="item.gear_type === 'glider'"
              class="text-gray-700 dark:text-gray-300"
            >
              <strong>Number of Flights:</strong> {{ item.number_of_flights }}
            </p>
            <p
              v-if="
                isMaintenanceOverdue(item) &&
                (item.gear_type === 'glider' || item.gear_type === 'rescue')
              "
              class="text-red-500"
            >
              <strong>Yearly check overdue!</strong>
            </p>
          </div>
        </div>
      </div>
    </div>

    <Modal v-if="showAddModal" @close="showAddModal = false" title="Add Gear">
      <form @submit.prevent="addGear">
        <div class="mb-4">
          <label for="gear_type" class="modal-text">Gear type</label>
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
          <label for="brand" class="modal-text">Brand</label>
          <select
            v-model="newGear.brand"
            id="brand"
            class="modal-dropdown"
            @change="checkNewBrand"
          >
            <option v-for="brand in brands" :key="brand" :value="brand">
              {{ brand }}
            </option>
            <option value="new">Add new brand</option>
          </select>
          <div v-if="newBrand" class="mt-2">
            <input
              ref="newBrandInput"
              v-model="newBrandName"
              placeholder="Enter new gear brand"
              class="modal-dropdown mt-2"
            />
            <button
              @click="addNewBrand"
              type="button"
              class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-2"
            >
              Add Brand
            </button>
          </div>
        </div>
        <div class="mb-4">
          <label for="model" class="modal-text">Model</label>
          <select
            v-model="newGear.model"
            id="model"
            class="modal-dropdown"
            @change="checkNewModel"
          >
            <option v-for="model in models" :key="model" :value="model">
              {{ model }}
            </option>
            <option value="new">Add new model</option>
          </select>
          <div v-if="newModel" class="mt-2">
            <input
              ref="newModelInput"
              v-model="newModelName"
              placeholder="Enter new gear model"
              class="modal-dropdown mt-2"
            />
            <button
              @click="addNewModel"
              type="button"
              class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-2"
            >
              Add Model
            </button>
          </div>
        </div>
        <div class="mb-4">
          <label for="manufacturing_date" class="modal-text"
            >Manufacturing Date</label
          >
          <input
            v-model="newGear.manufacturing_date"
            id="manufacturing_date"
            type="date"
            class="modal-dropdown"
          />
        </div>
        <div class="mb-4">
          <label for="purchase_date" class="modal-text">Purchase Date</label>
          <input
            v-model="newGear.purchase_date"
            id="purchase_date"
            type="date"
            class="modal-dropdown"
          />
        </div>
        <div class="flex justify-center">
          <button type="submit" class="button-blue">Add</button>
        </div>
      </form>
    </Modal>

    <Modal
      v-if="showEditModal && !editGear.archived"
      @close="showEditModal = false"
      title="Edit Gear"
    >
      <form @submit.prevent="updateGear">
        <div class="mb-4">
          <label for="edit_type" class="modal-text">Type</label>
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
          <label for="edit_brand" class="modal-text">Brand</label>
          <select
            v-model="editGear.brand"
            id="edit_brand"
            class="modal-dropdown"
            @change="checkNewBrand"
          >
            <option v-for="brand in brands" :key="brand" :value="brand">
              {{ brand }}
            </option>
            <option value="new">Add new brand</option>
          </select>
          <div v-if="newBrand" class="mt-2">
            <input
              ref="newBrandInput"
              v-model="newBrandName"
              placeholder="Enter new gear brand"
              class="modal-dropdown mt-2"
            />
            <button
              @click="addNewBrand"
              type="button"
              class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-2"
            >
              Add Brand
            </button>
          </div>
        </div>
        <div class="mb-4">
          <label for="edit_model" class="modal-text">Model</label>
          <select
            v-model="editGear.model"
            id="edit_model"
            class="modal-dropdown"
            @change="checkNewModel"
          >
            <option v-for="model in models" :key="model" :value="model">
              {{ model }}
            </option>
            <option value="new">Add new model</option>
          </select>
          <div v-if="newModel" class="mt-2">
            <input
              ref="newModelInput"
              v-model="newModelName"
              placeholder="Enter new gear model"
              class="modal-dropdown mt-2"
            />
            <button
              @click="addNewModel"
              type="button"
              class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-2"
            >
              Add Model
            </button>
          </div>
        </div>
        <div class="mb-4">
          <label for="edit_manufacturing_date" class="modal-text"
            >Manufacturing Date</label
          >
          <input
            v-model="editGear.manufacturing_date"
            id="edit_manufacturing_date"
            type="date"
            class="modal-dropdown"
          />
        </div>
        <div class="mb-4">
          <label for="edit_purchase_date" class="modal-text"
            >Purchase Date</label
          >
          <input
            v-model="editGear.purchase_date"
            id="edit_purchase_date"
            type="date"
            class="modal-dropdown"
          />
        </div>
        <div class="flex justify-center space-x-4">
          <button
            @click="archiveGear(editGear.id)"
            type="button"
            class="button-delete"
          >
            Archive
          </button>
          <button
            type="button"
            @click="deleteGear(editGear.id)"
            class="button-delete"
          >
            Delete
          </button>
          <button type="submit" class="button-blue">Save</button>
        </div>
      </form>
    </Modal>
    <Modal
      v-if="showEditModal && editGear.archived"
      @close="showEditModal = false"
      title="Edit Archived Gear"
    >
      <div class="flex justify-center space-x-4">
        <button
          @click="unarchiveGear(editGear.id)"
          type="button"
          class="button-blue"
        >
          Unarchive
        </button>
        <button
          type="button"
          @click="deleteGear(editGear.id)"
          class="button-delete"
        >
          Delete
        </button>
      </div>
    </Modal>
    <Modal
      v-if="showArchiveModal"
      @close="showArchiveModal = false"
      title="Archive Gear"
    >
      <div class="mb-4">
        <label for="archive_date" class="modal-text"
          >Retirement/Sale Date</label
        >
        <input
          v-model="archiveDate"
          id="archive_date"
          type="date"
          class="modal-dropdown"
        />
      </div>
      <div class="flex justify-center space-x-4">
        <button
          @click="confirmArchiveGear(editGear.id)"
          type="button"
          class="button-blue"
        >
          OK
        </button>
        <button
          @click="showArchiveModal = false"
          type="button"
          class="button-delete"
        >
          Cancel
        </button>
      </div>
    </Modal>
    <Modal
      v-if="showDeleteModal"
      @close="showDeleteModal = false"
      title="Delete Gear"
    >
      <div class="mb-4">
        <p>Are you sure you want to delete this gear?</p>
      </div>
      <div class="flex justify-center space-x-4">
        <button
          @click="confirmDeleteGear(editGear.id)"
          type="button"
          class="button-blue"
        >
          Yes
        </button>
        <button
          @click="showDeleteModal = false"
          type="button"
          class="button-delete"
        >
          No
        </button>
      </div>
    </Modal>
    <GearDetailsModal
      v-if="showGearDetailsModal"
      @close="closeGearDetailsModal"
      @maintenance-saved="refreshMaintenanceRecords"
      :gear="selectedGear"
      :maintenanceRecords="maintenanceRecords"
    />
  </div>
</template>

<script>
import axios from "axios";
import { nextTick } from "vue";
import Modal from "./Modal.vue";
import GearDetailsModal from "./gearDetailsModal.vue";

export default {
  components: {
    Modal,
    GearDetailsModal,
  },
  data() {
    return {
      equipment: [],
      brands: [],
      models: [],
      showAddModal: false,
      showEditModal: false,
      showArchiveModal: false,
      showMaintenanceModal: false,
      showGearDetailsModal: false,
      newBrand: false,
      newBrandName: "",
      newModel: false,
      newModelName: "",
      archiveDate: "",
      gearToArchive: null,
      showDeleteModal: false,
      gearToDelete: null,
      newGear: {
        gear_type: "glider", // Default type
        brand: "",
        model: "",
        manufacturing_date: "",
        purchase_date: "",
        archived: 0,
      },
      editGear: {
        id: null,
        gear_type: "", // Default type
        brand: "",
        model: "",
        manufacturing_date: "",
        purchase_date: "",
        archived: 0,
      },
      selectedGear: null,
      maintenanceRecords: [],
    };
  },
  created() {
    this.fetchSettings().then(() => {
      this.fetchEquipment();
    });
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
          // Fetch maintenance records for each gear
          gear.forEach((item) => {
            axios
              .get(`http://localhost:3000/maintenance?gear_id=${item.id}`)
              .then((response) => {
                this.maintenanceRecords = [
                  ...this.maintenanceRecords,
                  ...response.data.data,
                ];
              })
              .catch((error) => {
                console.error("Error fetching maintenance records:", error);
              });
          });
          // Fetch the flight data for wings
          // Fetch flight data for each glider
          gear.forEach((item) => {
            if (item.gear_type === "glider") {
              this.fetchFlightData(item.id);
            }
          });
        })
        .catch((error) => {
          console.error("Error fetching gear:", error);
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
    fetchFlightData(gliderId) {
      axios
        .get(`http://localhost:3000/items`)
        .then((response) => {
          const flights = response.data.data;
          const relatedFlights = flights.filter(
            (flight) => flight.glider === gliderId
          );
          const totalFlightTime =
            relatedFlights.reduce((sum, flight) => {
              const [hours, minutes] = flight.flightTime.split(":").map(Number);
              return sum + hours * 60 + minutes;
            }, 0) / 60; // Convert total minutes to hours

          const numberOfFlights = relatedFlights.length;

          // Update the corresponding glider in the equipment array
          const glider = this.equipment.find((item) => item.id === gliderId);
          if (glider) {
            glider.total_flight_time = totalFlightTime.toFixed(2);
            glider.number_of_flights = numberOfFlights;
          }
        })
        .catch((error) => {
          console.error("Error fetching flight data:", error);
        });
    },
    fetchSettings() {
      return axios
        .get("http://localhost:3002/get-settings")
        .then((response) => {
          this.gliderWarningDuration = response.data.gliderWarningDuration;
          this.rescueWarningDuration = response.data.rescueWarningDuration;
        })
        .catch((error) => {
          console.error("Error fetching settings:", error);
        });
    },
    refreshMaintenanceRecords() {
      if (this.selectedGear) {
        axios
          .get(
            `http://localhost:3000/maintenance?gear_id=${this.selectedGear.id}`
          )
          .then((response) => {
            this.maintenanceRecords = response.data.data.filter(
              (record) => record.gear_id === this.selectedGear.id
            );
          })
          .catch((error) => {
            console.error("Error fetching maintenance records:", error);
          });
      }
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
    archiveGear(id) {
      this.gearToArchive = id;
      this.showArchiveModal = true;
    },
    confirmArchiveGear(id) {
      axios
        .patch(`http://localhost:3000/gear/${id}`, { archived: 1 })
        .then(() => {
          // Update the archived status in the equipment array
          const gear = this.equipment.find((item) => item.id === id);
          if (gear) {
            gear.archived = 1;
          }
          this.showEditModal = false;
          this.showArchiveModal = false;
        });
    },
    unarchiveGear(id) {
      axios
        .patch(`http://localhost:3000/gear/${id}`, { archived: 0 })
        .then(() => {
          // Update the archived status in the equipment array
          const gear = this.equipment.find((item) => item.id === id);
          if (gear) {
            gear.archived = 0;
          }
          this.showEditModal = false;
        })
        .catch((error) => {
          console.error("Error unarchiving gear:", error);
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
      this.gearToDelete = id;
      this.showDeleteModal = true;
    },
    confirmDeleteGear(id) {
      axios
        .delete(`http://localhost:3000/gear/${id}`)
        .then(() => {
          // Remove the deleted item from the equipment array
          this.equipment = this.equipment.filter((item) => item.id !== id);
          this.showEditModal = false;
          this.showDeleteModal = false;
        })
        .catch((error) => {
          console.error("Error deleting gear:", error);
        });
    },
    openGearDetailsModal(item) {
      this.selectedGear = item;
      axios
        .get(`http://localhost:3000/maintenance?gear_id=${item.id}`)
        .then((response) => {
          this.maintenanceRecords = response.data.data.filter(
            (record) => record.gear_id === item.id
          );
          this.showGearDetailsModal = true;
        })
        .catch((error) => {
          console.error("Error fetching maintenance records:", error);
        });
    },
    closeGearDetailsModal() {
      this.showGearDetailsModal = false;
      this.selectedGear = null;
      this.maintenanceRecords = [];
      this.fetchEquipment();
    },
    isMaintenanceOverdue(item) {
      let warningDuration = null;

      this.fetchSettings();

      if (item.gear_type === "glider") {
        warningDuration = this.gliderWarningDuration;
      } else if (item.gear_type === "rescue") {
        warningDuration = this.rescueWarningDuration;
      }

      if (!warningDuration) return false;

      const lastMaintenance = this.maintenanceRecords
        .filter(
          (record) =>
            record.gear_id === item.id && record.maintenance_type === "Check"
        )
        .sort(
          (a, b) => new Date(b.maintenance_date) - new Date(a.maintenance_date)
        )[0];

      const compareDate = lastMaintenance
        ? new Date(lastMaintenance.maintenance_date)
        : new Date(item.manufacturing_date);

      if (compareDate) {
        const warningDate = new Date(compareDate);
        warningDate.setMonth(
          warningDate.getMonth() + parseInt(warningDuration)
        );
        return new Date() > warningDate;
      }
      return false;
    },
  },
  computed: {
    groupedEquipment() {
      const typeNames = {
        glider: "Gliders",
        harness: "Harnesses",
        rescue: "Rescues",
        archived: "Archived",
      };
      const categories = {};
      const archivedItems = [];

      this.equipment.forEach((item) => {
        if (item.archived == 1) {
          archivedItems.push(item);
        } else {
          if (!categories[item.gear_type]) {
            categories[item.gear_type] = {
              name: typeNames[item.gear_type],
              items: [],
            };
          }

          categories[item.gear_type].items.push(item);
        }
      });
      // Add archived items as a separate category at the end
      if (archivedItems.length > 0) {
        categories["archived"] = {
          name: typeNames["archived"],
          items: archivedItems,
        };
      }
      return Object.values(categories);
    },
  },
};
</script>

<style scoped>
@import "@/assets/modal.css";
@import "@/assets/buttons.css";
@import "@/assets/pages.css";
.archived-item {
  opacity: 0.5;
}
</style>
