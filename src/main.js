import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { Capacitor } from "@capacitor/core";
import App from "./App.vue";
import FlightsList from "./components/FlightsList.vue";
import FlightDetail from "./components/FlightDetail.vue";
import AddFlight from "./components/AddFlight.vue";
import Statistics from "./components/Statistics.vue";
import GearOverview from "./components/GearOverview.vue";
import GearDetail from "./components/GearDetail.vue";
import Settings from "./components/Settings.vue";
import "./style.css";

// Import database initialization
import { initializeDatabase } from "./database/database.js";

const routes = [
  { path: "/", component: FlightsList },
  { path: "/flights", component: FlightsList },
  { path: "/flight/:id", component: FlightDetail, props: true },
  { path: "/add-flight", component: AddFlight },
  { path: "/statistics", component: Statistics },
  { path: "/gear", component: GearOverview },
  { path: "/gear/:id", component: GearDetail },
  { path: "/settings", component: Settings },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Initialize the app
async function initApp() {
  const platform = Capacitor.getPlatform();
  const isNative = platform === 'android' || platform === 'ios';
  
  console.log(`🚀 ParaDash starting on platform: ${platform}`);
  console.log(`📱 Is native platform: ${isNative}`);
  
  // Initialize database for native platforms
  if (isNative) {
    try {
      console.log("📊 Initializing native SQLite database...");
      await initializeDatabase();
      console.log("✅ Native database initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize native database:", error);
      // Continue anyway - the app may still work with degraded functionality
    }
  } else {
    console.log("🌐 Running on web - using API backend");
  }
  
  // Create and mount Vue app
  const app = createApp(App);
  app.use(router);
  app.mount("#app");
  
  console.log("✅ Vue app mounted");
}

// Start the app
initApp();
