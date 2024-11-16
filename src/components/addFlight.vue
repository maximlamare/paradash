<template>
  <div>
    <h1>Add Flight</h1>
    <div class="input-group">
      <label for="category">Category:</label>
      <select id="category" v-model="newItem.category">
        <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
      </select>
    </div>
    <div class="input-group">
      <label for="type">Type:</label>
      <select id="type" v-model="newItem.type">
        <option v-for="type in types" :key="type" :value="type">{{ type }}</option>
      </select>
    </div>
    <div class="input-group">
      <label for="date">Date:</label>
      <date-picker id="date" v-model="newItem.date" placeholder="Select Date"></date-picker>
    </div>
    <div class="input-group">
      <label for="glider">Glider:</label>
      <input id="glider" v-model="newItem.glider" placeholder="Glider" />
    </div>
    <div class="input-group">
      <label for="takeoff_location">Takeoff Location:</label>
      <input id="takeoff_location" v-model="newItem.takeoff_location" placeholder="Takeoff Location" />
    </div>
    <div class="input-group">
      <label for="landing_location">Landing Location:</label>
      <input id="landing_location" v-model="newItem.landing_location" placeholder="Landing Location" />
    </div>
    <div class="input-group">
      <label for="flight_time">Flight Time:</label>
      <input id="flight_time" v-model="newItem.flight_time" placeholder="Flight Time" />
    </div>
    <div class="input-group">
      <label for="links">Links:</label>
      <input id="links" v-model="newItem.links" placeholder="Links" />
    </div>
    <div class="input-group">
      <label for="comments">Comments:</label>
      <input id="comments" v-model="newItem.comments" placeholder="Comments" />
    </div>
    <div class="input-group">
      <label for="igc_file_path">IGC File Path:</label>
      <input id="igc_file_path" v-model="newItem.igc_file_path" placeholder="IGC File Path" />
    </div>
    <button @click="addItem">Add</button>
    <button @click="clearItems">Clear All</button>
  </div>
</template>

<script>
import axios from 'axios';
import DatePicker from 'vue3-datepicker';

export default {
  components: {
    DatePicker
  },
  data() {
    return {
      items: [],
      newItem: {
        category: '',
        type: '',
        date: '',
        glider: '',
        takeoff_location: '',
        landing_location: '',
        flight_time: '',
        links: '',
        comments: '',
        igc_file_path: ''
      },
      categories: ['Category 1', 'Category 2', 'Category 3'], // Add your categories here
      types: ['Type 1', 'Type 2', 'Type 3'] // Add your types here
    };
  },
  created() {
    this.setDefaultValues();
    this.fetchItems();
  },
  methods: {
    setDefaultValues() {
      if (this.categories.length > 0) {
        this.newItem.category = this.categories[0];
      }
      if (this.types.length > 0) {
        this.newItem.type = this.types[0];
      }
    },
    fetchItems() {
      axios.get('http://localhost:3000/items')
        .then(response => {
          this.items = response.data.data;
        })
        .catch(error => {
          console.error('Error fetching items:', error);
        });
    },
    addItem() {
      // Format the date to only include day, month, and year
      const formattedDate = new Date(this.newItem.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const newItemWithFormattedDate = { ...this.newItem, date: formattedDate };

      axios.post('http://localhost:3000/items', newItemWithFormattedDate)
        .then(response => {
          this.items.push({ ...newItemWithFormattedDate, id: response.data.id });
          this.newItem = {
            category: this.categories.length > 0 ? this.categories[0] : '',
            type: this.types.length > 0 ? this.types[0] : '',
            date: '',
            glider: '',
            takeoff_location: '',
            landing_location: '',
            flight_time: '',
            links: '',
            comments: '',
            igc_file_path: ''
          };
        })
        .catch(error => {
          console.error('Error adding item:', error);
        });
    },
    clearItems() {
      axios.delete('http://localhost:3000/items')
        .then(() => {
          this.items = [];
        })
        .catch(error => {
          console.error('Error clearing items:', error);
        });
    }
  }
};
</script>

<style scoped>
.input-group {
  margin-bottom: 10px;
}
.input-group label {
  display: block;
  margin-bottom: 5px;
}
.input-group input,
.input-group select,
.input-group date-picker {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
</style>