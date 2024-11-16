import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/HelloWorld.vue'
import NewPage from '../components/dashboard.vue'
import addFlight from '../components/addFlight.vue'
import viewFlights from '../components/viewFlights.vue'
import gearOverview from '../components/gearOverview.vue'

const routes = [
    { path: '/', component: Home },
    { path: '/dashboard', component: NewPage },
    { path: '/add-flight', component: addFlight },
    { path: '/view-flights', component: viewFlights },
    { path: '/gear-overview', component: gearOverview }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router