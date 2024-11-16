<template>
  <div>
    <h1>Paragliding Records</h1>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Type</th>
          <th>Date</th>
          <th>Glider</th>
          <th>Takeoff Location</th>
          <th>Landing Location</th>
          <th>Flight Time</th>
          <th>Links</th>
          <th>Comments</th>
          <th>IGC File Path</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>{{ item.category }}</td>
          <td>{{ item.type }}</td>
          <td>{{ item.date }}</td>
          <td>{{ item.glider }}</td>
          <td>{{ item.takeoff_location }}</td>
          <td>{{ item.landing_location }}</td>
          <td>{{ item.flight_time }}</td>
          <td>{{ item.links }}</td>
          <td>{{ item.comments }}</td>
          <td>{{ item.igc_file_path }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      items: []
    };
  },
  created() {
    this.fetchItems();
  },
  methods: {
    fetchItems() {
      axios.get('http://localhost:3000/items')
        .then(response => {
          this.items = response.data.data;
        })
        .catch(error => {
          console.error('Error fetching items:', error);
        });
    }
  }
};
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
}

th {
  background-color: #f2f2f2;
  text-align: left;
}
</style>