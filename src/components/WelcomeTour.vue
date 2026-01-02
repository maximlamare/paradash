<template>
  <div></div>
</template>

<script setup>
import { onMounted, getCurrentInstance } from "vue";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

onMounted(() => {
  // Check if user has seen the tour before
  const hasSeenTour = localStorage.getItem("hasSeenWelcomeTour");

  if (hasSeenTour) {
    return;
  }

  // Get router instance
  const instance = getCurrentInstance();
  const router = instance.proxy.$router;

  // Small delay to ensure DOM is ready
  setTimeout(() => {
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: {
          enabled: true,
        },
        classes: "shepherd-theme-custom",
        scrollTo: { behavior: "smooth", block: "center" },
      },
    });

    // Step 1: Welcome
    tour.addStep({
      id: "welcome",
      text: "<h3>Welcome to ParaDash!</h3><p>Let's take a quick tour of your new paragliding logbook!</p>",
      buttons: [
        {
          text: "Skip",
          action: tour.cancel,
          classes: "shepherd-button-secondary",
        },
        {
          text: "Start Tour",
          action: tour.next,
        },
      ],
    });

    // Step 2: Menu
    tour.addStep({
      id: "menu",
      text: "<p>This is your navigation menu. Use it to switch between sections.</p>",
      attachTo: {
        element: ".menu-btn",
        on: "bottom",
      },
      buttons: [
        {
          text: "Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        {
          text: "Next",
          action: tour.next,
        },
      ],
    });

    // Step 3: Gear Overview
    tour.addStep({
      id: "gear-intro",
      text: "<h3>Step 1: Add Your Gear</h3><p>First, let's add your paragliding equipment by navigating to the Gear Overview section. You cannot log flights without a glider!</p>",
      beforeShowPromise: function () {
        return new Promise((resolve) => {
          router.push("/gear");
          setTimeout(resolve, 300);
        });
      },
      buttons: [
        {
          text: "Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        {
          text: "Next",
          action: tour.next,
        },
      ],
    });

    // Step 4: Add Flight
    tour.addStep({
      id: "add-flight",
      text: "<h3>Step 2: Log a Flight</h3><p>After adding gear, record your flights here. You can import IGC files or enter details manually.</p>",
      beforeShowPromise: function () {
        return new Promise((resolve) => {
          router.push("/add-flight");
          setTimeout(resolve, 300);
        });
      },
      buttons: [
        {
          text: "Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        {
          text: "Next",
          action: tour.next,
        },
      ],
    });

    // Step 5: Flights List
    tour.addStep({
      id: "flights-list",
      text: "<h3>Step 3: View Your Flights</h3><p>All your logged flights appear here. Tap any flight to see detailed information and maps (if you uploaded an IGC file).</p>",
      beforeShowPromise: function () {
        return new Promise((resolve) => {
          router.push("/");
          setTimeout(resolve, 300);
        });
      },
      buttons: [
        {
          text: "Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        {
          text: "Next",
          action: tour.next,
        },
      ],
    });

    // Step 6: Statistics
    tour.addStep({
      id: "statistics",
      text: "<h3>Step 4: Track Your Progress</h3><p>View your flying statistics, total hours, distances, and more!</p>",
      beforeShowPromise: function () {
        return new Promise((resolve) => {
          router.push("/statistics");
          setTimeout(resolve, 300);
        });
      },
      buttons: [
        {
          text: "Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        {
          text: "Next",
          action: tour.next,
        },
      ],
    });

    // Step 7: Settings
    tour.addStep({
      id: "settings",
      text: "<h3>Step 5: Customize Settings</h3><p>Configure your preferences, units, and app settings here.</p>",
      beforeShowPromise: function () {
        return new Promise((resolve) => {
          router.push("/settings");
          setTimeout(resolve, 300);
        });
      },
      buttons: [
        {
          text: "Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        {
          text: "Next",
          action: tour.next,
        },
      ],
    });

    // Step 8: Finish
    tour.addStep({
      id: "finish",
      text: "<h3>Time to log your flights!</h3><p>After adding your gear, you can track all your wonderful flights.</p>",
      beforeShowPromise: function () {
        return new Promise((resolve) => {
          router.push("/gear");
          setTimeout(resolve, 300);
        });
      },
      buttons: [
        {
          text: "Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        {
          text: "Get Started!",
          action: tour.complete,
        },
      ],
    });

    tour.on("complete", () => {
      localStorage.setItem("hasSeenWelcomeTour", "true");
      router.push("/gear");
    });

    tour.on("cancel", () => {
      localStorage.setItem("hasSeenWelcomeTour", "true");
      router.push("/");
    });

    tour.start();
  }, 500);
});
</script>

<style>
/* Custom Shepherd styling to match app theme */
.shepherd-theme-custom {
  border-radius: 8px;
}

.shepherd-element {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 320px;
}

.shepherd-text {
  padding: 1.5rem;
  color: #333;
  font-size: 0.95rem;
  line-height: 1.5;
}

.shepherd-text h3 {
  margin: 0 0 0.75rem 0;
  color: #549f74;
  font-size: 1.1rem;
}

.shepherd-text p {
  margin: 0;
}

.shepherd-footer {
  padding: 0 1.5rem 1.5rem 1.5rem;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.shepherd-button {
  background: #549f74;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.2s;
}

.shepherd-button:hover {
  background: #467e5f;
}

.shepherd-button-secondary {
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
}

.shepherd-button-secondary:hover {
  background: #f5f5f5;
  color: #333;
}

.shepherd-modal-overlay-container {
  background: rgba(0, 0, 0, 0.5);
}

.shepherd-cancel-icon {
  color: #999;
  font-size: 1.5rem;
}

.shepherd-cancel-icon:hover {
  color: #333;
}
</style>
