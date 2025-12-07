import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import FlightsList from "./components/FlightsList.vue";
import FlightDetail from "./components/FlightDetail.vue";
import AddFlight from "./components/AddFlight.vue";
import Statistics from "./components/Statistics.vue";
import GearOverview from "./components/GearOverview.vue";
import GearDetail from "./components/GearDetail.vue";
import Settings from "./components/Settings.vue";
import "./style.css";

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

createApp(App).use(router).mount("#app");
