<template>
  <div id="app">
    <header class="header">
      <button class="menu-btn" @click="toggleSidebar" aria-label="Toggle menu">
        <div class="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
      <div class="header-content">
        <div class="logo-title">
          <span class="title-part">para</span>
          <img src="/images/logo.svg" alt="D" class="logo" />
          <span class="title-part">ash</span>
        </div>
      </div>
    </header>

    <!-- Sidebar overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="closeSidebar"></div>

    <!-- Sidebar -->
    <nav class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-header">
        <h2>Menu</h2>
        <button class="close-btn" @click="closeSidebar" aria-label="Close menu">
          ×
        </button>
      </div>
      <ul class="sidebar-menu">
        <li>
          <router-link to="/" @click="closeSidebar" class="menu-link">
            Flights
          </router-link>
        </li>
        <li>
          <router-link to="/add-flight" @click="closeSidebar" class="menu-link">
            Add Flight
          </router-link>
        </li>
        <li>
          <router-link to="/statistics" @click="closeSidebar" class="menu-link">
            Statistics
          </router-link>
        </li>
        <li>
          <router-link to="/gear" @click="closeSidebar" class="menu-link">
            Gear Overview
          </router-link>
        </li>
        <li>
          <router-link to="/settings" @click="closeSidebar" class="menu-link">
            Settings
          </router-link>
        </li>
      </ul>
    </nav>

    <main class="main" :class="{ 'main-shifted': sidebarOpen }">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      sidebarOpen: false,
    };
  },
  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    closeSidebar() {
      this.sidebarOpen = false;
    },
  },
  mounted() {
    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
      if (
        this.sidebarOpen &&
        !e.target.closest(".sidebar") &&
        !e.target.closest(".menu-btn")
      ) {
        this.closeSidebar();
      }
    });
  },
};
</script>

<style scoped>
.header {
  background: #549f74;
  color: white;
  padding: 0.75rem 1rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.menu-btn {
  position: absolute;
  top: 50%;
  left: 2rem;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  z-index: 100;
}

.menu-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hamburger span {
  display: block;
  width: 24px;
  height: 3px;
  background-color: white;
  border-radius: 2px;
  transition: all 0.3s;
}

.header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 300;
}

.header-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.logo-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.title-part {
  font-weight: bold;
  font-size: 1.8rem;
  letter-spacing: -0.02em;
}

.logo {
  height: 48px;
  width: auto;
  margin: 0 4px;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.sidebar {
  position: fixed;
  top: 0;
  left: -300px;
  width: 300px;
  height: 100vh;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 999;
  transition: left 0.3s ease;
  overflow-y: auto;
}

.sidebar-open {
  left: 0;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #eee;
  background: #549f74;
  color: white;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-menu li {
  border-bottom: 1px solid #f0f0f0;
}

.menu-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  text-decoration: none;
  color: #333;
  transition: background-color 0.2s;
  font-weight: 500;
}

.menu-link:hover {
  background-color: #f8f9fa;
}

.menu-link.router-link-active {
  background-color: #e8f5f0;
  color: #549f74;
  border-right: 4px solid #549f74;
}

.menu-icon {
  font-size: 1.2rem;
}

.main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  transition: margin-left 0.3s ease;
}

@media (max-width: 768px) {
  .header {
    padding: 0.5rem 1rem;
  }

  .logo {
    height: 40px;
  }

  .title-part {
    font-size: 1.5rem;
  }

  .menu-btn {
    left: 0.75rem;
  }

  .main {
    padding: 0.75rem;
  }

  .sidebar {
    width: 280px;
    left: -280px;
  }

  .sidebar-open {
    left: 0;
  }
}
</style>
