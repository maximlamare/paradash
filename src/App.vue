<template>
  <nav>
    <router-link to="/">Home</router-link>
    <router-link to="/dashboard">New Page</router-link>
    <router-link to="/add-flight">Add Flight</router-link>
    <router-link to="/view-flights">View Flights</router-link>
    <router-link to="/gear-overview">Gear</router-link>
    <router-link to="/settings">Settings</router-link>
  </nav>

  <!-- Router View -->
  <router-view></router-view>
</template>

<style scoped>
nav {
  margin-top: 20px;
}
nav a {
  margin-right: 10px;
}
</style>
