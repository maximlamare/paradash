<template>
    <div class="kpi-dashboard">
      <h1>KPI Dashboard</h1>
      <div class="kpi-cards">
        <div v-for="item in items" :key="item.name" class="kpi-card">
          <h2>{{ item.name }}</h2>
          <p class="value">{{ formatValue(item.value) }}</p>
          <p v-if="item.timePeriod" class="time-period">TIME PERIOD: {{ item.timePeriod }}</p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'KPIDashboard',
    data() {
      return {
        items: []
      };
    },
    created() {
      this.fetchData();
    },
    methods: {
      fetchData() {
        axios.get('http://localhost:3000/items')
          .then(response => {
            this.items = response.data.data;
          })
          .catch(error => {
            console.error('Error fetching data:', error);
          });
      },
      formatValue(value) {
        // Format large numbers (e.g., 68500000 as 68.5M)
        if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
        if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
        return value;
      }
    }
  };
  </script>
  
  <style scoped>
  .kpi-dashboard {
    text-align: center;
  }
  
  .kpi-cards {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    gap: 20px;
    padding: 20px;
  }
  
  .kpi-card {
    background-color: #f5f5f5;
    border-radius: 8px;
    padding: 20px;
    width: 250px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .kpi-card h2 {
    font-size: 1.2em;
    color: #555;
  }
  
  .kpi-card .value {
    font-size: 2em;
    font-weight: bold;
    color: #003366;
  }
  
  .kpi-card .time-period {
    font-size: 0.9em;
    color: #888;
    margin-top: 10px;
  }
  </style>