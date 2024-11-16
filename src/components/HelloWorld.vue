<template>
  <div>
    <h1>Welcome to the Paragliding App</h1>
    <nav>
      <ul>
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/dashboard">Dashboard</router-link></li>
        <li><router-link to="/add-glider">Add Glider</router-link></li>
        <li><router-link to="/view-flights">View Flights</router-link></li>
        <li><router-link to="/gear-overview">Gear</router-link></li>
      </ul>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld'
};
</script>

<style scoped>
h1 {
  text-align: center;
  margin-top: 20px;
}

nav ul {
  list-style-type: none;
  padding: 0;
  text-align: center;
}

nav li {
  display: inline;
  margin-right: 10px;
}

nav a {
  text-decoration: none;
  color: #42b983;
}

nav a:hover {
  text-decoration: underline;
}
</style>