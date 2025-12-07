<template>
  <div class="statistics-container">
    <h1>Statistics</h1>

    <!-- Key Statistics Cards -->
    <div class="key-stats-grid">
      <div class="key-stat-card card">
        <h3 class="stat-title">Longest Flight Time</h3>
        <div class="stat-number">{{ longestFlightTime }}</div>
      </div>

      <div class="key-stat-card card">
        <h3 class="stat-title">Longest Flight Distance</h3>
        <div class="stat-number">{{ longestFlightDistance }}</div>
      </div>

      <div class="key-stat-card card">
        <h3 class="stat-title">Total Distance Recorded</h3>
        <div class="stat-number">{{ totalDistanceFlown }}</div>
      </div>

      <div class="key-stat-card card">
        <h3 class="stat-title">Year with Most Flights</h3>
        <div class="stat-number">{{ yearWithMostFlights }}</div>
      </div>

      <div class="key-stat-card card">
        <h3 class="stat-title">Highest Altitude Recorded</h3>
        <div class="stat-number">{{ highestAltitude }}</div>
      </div>

      <div class="key-stat-card card">
        <h3 class="stat-title">Days Since Last Flight</h3>
        <div class="stat-number">{{ daysSinceLastFlight }}</div>
      </div>
    </div>

    <!-- Histogram: Flights per Year -->
    <div class="histogram-section">
      <div class="card histogram-card">
        <h3 class="stat-title">Flights per Year</h3>
        <div class="histogram-container">
          <div class="histogram">
            <div
              v-for="yearData in histogramData"
              :key="yearData.year"
              class="histogram-bar-wrapper"
            >
              <div class="histogram-bar-container">
                <span class="bar-count">{{ yearData.count }}</span>
                <div
                  class="histogram-bar"
                  :style="{
                    height: yearData.percentage + '%',
                    backgroundColor: '#549f74',
                  }"
                ></div>
              </div>
              <div class="histogram-label">{{ yearData.year }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <!-- Category Distribution Chart -->
      <div class="card stat-card">
        <div class="card-header">
          <h3>Flights by Category</h3>
          <div class="toggle-switch">
            <button
              :class="['toggle-btn', { active: categoryMetric === 'count' }]"
              @click="categoryMetric = 'count'"
            >
              Number of Flights
            </button>
            <button
              :class="['toggle-btn', { active: categoryMetric === 'time' }]"
              @click="categoryMetric = 'time'"
            >
              Time in Flight
            </button>
          </div>
        </div>
        <div class="pie-chart-container">
          <svg viewBox="0 0 200 200" class="pie-chart">
            <g transform="translate(100, 100)">
              <path
                v-for="(segment, index) in categorySegmentsByMetric"
                :key="'cat-' + index"
                :d="segment.path"
                :fill="segment.color"
                :stroke="'white'"
                :stroke-width="2"
              />
              <text
                v-for="(segment, index) in categorySegmentsByMetric"
                :key="'cat-text-' + index"
                :x="segment.labelX"
                :y="segment.labelY"
                text-anchor="middle"
                class="pie-label"
              >
                {{ segment.percentage }}%
              </text>
            </g>
          </svg>
          <div class="pie-center-text">
            <div class="pie-center-value">
              {{ categoryMetric === "count" ? totalFlights : totalFlightTime }}
            </div>
            <div class="pie-center-label">
              {{ categoryMetric === "count" ? "Total Flights" : "Total Time" }}
            </div>
          </div>
        </div>
        <div class="pie-legend">
          <div
            v-for="(segment, index) in categorySegmentsByMetric"
            :key="'cat-legend-' + index"
            class="legend-item"
          >
            <span
              class="legend-color"
              :style="{ backgroundColor: segment.color }"
            ></span>
            <span class="legend-label"
              >{{ segment.label }} ({{
                categoryMetric === "count" ? segment.count : segment.time
              }})</span
            >
          </div>
        </div>
      </div>

      <!-- Flight Type Distribution Chart -->
      <div class="card stat-card">
        <div class="card-header">
          <h3>Flights by Type</h3>
          <div class="toggle-switch">
            <button
              :class="['toggle-btn', { active: typeMetric === 'count' }]"
              @click="typeMetric = 'count'"
            >
              Number of Flights
            </button>
            <button
              :class="['toggle-btn', { active: typeMetric === 'time' }]"
              @click="typeMetric = 'time'"
            >
              Time in Flight
            </button>
          </div>
        </div>
        <div class="pie-chart-container">
          <svg viewBox="0 0 200 200" class="pie-chart">
            <g transform="translate(100, 100)">
              <path
                v-for="(segment, index) in typeSegmentsByMetric"
                :key="'type-' + index"
                :d="segment.path"
                :fill="segment.color"
                :stroke="'white'"
                :stroke-width="2"
              />
              <text
                v-for="(segment, index) in typeSegmentsByMetric"
                :key="'type-text-' + index"
                :x="segment.labelX"
                :y="segment.labelY"
                text-anchor="middle"
                class="pie-label"
              >
                {{ segment.percentage }}%
              </text>
            </g>
          </svg>
          <div class="pie-center-text">
            <div class="pie-center-value">
              {{ typeMetric === "count" ? totalFlights : totalFlightTime }}
            </div>
            <div class="pie-center-label">
              {{ typeMetric === "count" ? "Total Flights" : "Total Time" }}
            </div>
          </div>
        </div>
        <div class="pie-legend">
          <div
            v-for="(segment, index) in typeSegmentsByMetric"
            :key="'type-legend-' + index"
            class="legend-item"
          >
            <span
              class="legend-color"
              :style="{ backgroundColor: segment.color }"
            ></span>
            <span class="legend-label"
              >{{ segment.label }} ({{
                typeMetric === "count" ? segment.count : segment.time
              }})</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Flight Time Over Time Chart -->
    <div class="card flight-time-chart-card line-chart-section">
      <div class="chart-header">
        <h3>Flight Duration over Time</h3>
        <div class="toggle-switch-container">
          <span class="toggle-label">Cumulative</span>
          <div
            class="toggle-switch-track"
            :class="{ active: flightTimeView === 'cumulative' }"
            @click="toggleFlightTimeView"
          >
            <div class="toggle-switch-thumb"></div>
          </div>
        </div>
      </div>
      <div class="flight-time-chart-container">
        <svg class="flight-time-chart area-line-chart" viewBox="0 0 800 380" preserveAspectRatio="xMidYMid meet">
          <!-- Horizontal grid lines (subtle) -->
          <line
            v-for="i in 4"
            :key="'grid-' + i"
            x1="60"
            :y1="60 + (i - 1) * 75"
            x2="780"
            :y2="60 + (i - 1) * 75"
            stroke="#e9ecef"
            stroke-width="1"
            stroke-dasharray="4,4"
          />
          
          <!-- Bottom axis line -->
          <line
            x1="60"
            y1="285"
            x2="780"
            y2="285"
            stroke="#dee2e6"
            stroke-width="1"
          />

          <!-- Y-axis labels (left side) -->
          <text
            v-for="(label, i) in flightTimeChartData.yLabels"
            :key="'y-label-' + i"
            x="55"
            :y="290 - i * 75"
            text-anchor="end"
            class="chart-y-label"
          >
            {{ label }}h
          </text>

          <!-- X-axis labels (horizontal, below chart) -->
          <template v-if="selectedYear !== 'all'">
            <!-- Month abbreviations for single year -->
            <text
              v-for="(month, i) in flightTimeChartData.xMonthLabels"
              :key="'month-label-' + i"
              :x="month.x"
              y="310"
              text-anchor="middle"
              class="chart-x-label"
            >
              {{ month.label }}
            </text>
          </template>
          <template v-else>
            <!-- Month abbreviations for all-time view -->
            <text
              v-for="(yearLabel, i) in flightTimeChartData.xYearLabels"
              :key="'month-label-' + i"
              :x="yearLabel.x"
              y="310"
              text-anchor="middle"
              class="chart-x-label"
            >
              {{ yearLabel.monthLabel }}
            </text>
            <!-- Year labels below months -->
            <text
              v-for="(yearLabel, i) in flightTimeChartData.xYearLabels"
              :key="'year-label-' + i"
              :x="yearLabel.x"
              y="330"
              text-anchor="middle"
              class="chart-x-label-year"
            >
              {{ yearLabel.yearLabel }}
            </text>
          </template>

          <!-- Area fill under line -->
          <polygon
            v-if="flightTimeChartData.points.length > 0"
            :points="flightTimeChartData.areaPoints"
            fill="rgba(84, 159, 116, 0.15)"
          />

          <!-- Line path -->
          <polyline
            v-if="flightTimeChartData.points.length > 0"
            :points="flightTimeChartData.pathPoints"
            fill="none"
            stroke="#549f74"
            stroke-width="2.5"
            stroke-linejoin="round"
            stroke-linecap="round"
          />

          <!-- Data points -->
          <circle
            v-for="(point, i) in flightTimeChartData.points"
            :key="'point-' + i"
            :cx="point.x"
            :cy="point.y"
            r="5"
            fill="white"
            stroke="#549f74"
            stroke-width="2"
            class="data-point"
            @click="openFlightModal(point.flights)"
          >
            <title>{{ point.tooltip }}</title>
          </circle>

          <!-- Year label for single year view -->
          <text
            v-if="selectedYear !== 'all'"
            x="370"
            y="355"
            text-anchor="middle"
            class="chart-year-label"
          >
            {{ selectedYear }}
          </text>
        </svg>
        <div v-if="flightTimeChartData.points.length === 0" class="no-data">
          No flight data available for the selected filters
        </div>
      </div>
    </div>

    <!-- Flight Distance Over Time Chart -->
    <div class="card flight-time-chart-card line-chart-section">
      <div class="chart-header">
        <h3>Flight Distance over Time</h3>
        <div class="toggle-switch-container">
          <span class="toggle-label">Cumulative</span>
          <div
            class="toggle-switch-track"
            :class="{ active: flightDistanceView === 'cumulative' }"
            @click="toggleFlightDistanceView"
          >
            <div class="toggle-switch-thumb"></div>
          </div>
        </div>
      </div>
      <div class="flight-time-chart-container">
        <div v-if="flightDistanceChartData.points.length === 0" class="no-data-message">
          No flight data available for the selected filters
        </div>
        <svg v-else class="flight-time-chart area-line-chart" viewBox="0 0 800 380" preserveAspectRatio="xMidYMid meet">
          <!-- Horizontal grid lines (subtle) -->
          <line
            v-for="i in 4"
            :key="'grid-' + i"
            x1="60"
            :y1="60 + (i - 1) * 75"
            x2="780"
            :y2="60 + (i - 1) * 75"
            stroke="#e9ecef"
            stroke-width="1"
            stroke-dasharray="4,4"
          />
          
          <!-- Bottom axis line -->
          <line
            x1="60"
            y1="285"
            x2="780"
            y2="285"
            stroke="#dee2e6"
            stroke-width="1"
          />

          <!-- Y-axis labels (left side) -->
          <text
            v-for="(label, i) in flightDistanceChartData.yLabels"
            :key="'y-label-' + i"
            x="55"
            :y="290 - i * 75"
            text-anchor="end"
            class="chart-y-label"
          >
            {{ label }}km
          </text>

          <!-- X-axis labels (horizontal, below chart) -->
          <template v-if="selectedYear !== 'all'">
            <!-- Month abbreviations for single year -->
            <text
              v-for="(month, i) in flightDistanceChartData.xMonthLabels"
              :key="'month-label-' + i"
              :x="month.x"
              y="310"
              text-anchor="middle"
              class="chart-x-label"
            >
              {{ month.label }}
            </text>
          </template>
          <template v-else>
            <!-- Month abbreviations for all-time view -->
            <text
              v-for="(yearLabel, i) in flightDistanceChartData.xYearLabels"
              :key="'month-label-' + i"
              :x="yearLabel.x"
              y="310"
              text-anchor="middle"
              class="chart-x-label"
            >
              {{ yearLabel.monthLabel }}
            </text>
            <!-- Year labels below months -->
            <text
              v-for="(yearLabel, i) in flightDistanceChartData.xYearLabels"
              :key="'year-label-' + i"
              :x="yearLabel.x"
              y="330"
              text-anchor="middle"
              class="chart-x-label-year"
            >
              {{ yearLabel.yearLabel }}
            </text>
          </template>

          <!-- Area fill under line -->
          <polygon
            v-if="flightDistanceChartData.points.length > 0"
            :points="flightDistanceChartData.areaPoints"
            fill="rgba(84, 159, 116, 0.15)"
          />

          <!-- Line path -->
          <polyline
            v-if="flightDistanceChartData.points.length > 0"
            :points="flightDistanceChartData.pathPoints"
            fill="none"
            stroke="#549f74"
            stroke-width="2.5"
            stroke-linejoin="round"
            stroke-linecap="round"
          />

          <!-- Data points -->
          <circle
            v-for="(point, i) in flightDistanceChartData.points"
            :key="'point-bg-' + i"
            :cx="point.x"
            :cy="point.y"
            r="5"
            fill="white"
            stroke="#549f74"
            stroke-width="2"
            class="data-point"
            @click="openFlightModal(point.flights)"
          >
            <title>{{ point.tooltip }}</title>
          </circle>

          <!-- Year label for single year view -->
          <text
            v-if="selectedYear !== 'all'"
            x="420"
            y="355"
            text-anchor="middle"
            class="chart-year-label"
          >
            {{ selectedYear }}
          </text>
        </svg>
      </div>
    </div>

    <!-- Flight Activity Grid (GitHub-style) -->
    <div class="card activity-grid-card">
      <h3>Flight Timing</h3>
      <div class="activity-grids-wrapper">
        <div class="activity-grid-container">
          <div v-if="activityGridData.months.length > 0" class="activity-grid">
            <!-- Month labels -->
            <div class="month-labels">
              <div class="day-label-spacer"></div>
              <div
                v-for="(month, index) in activityGridData.months"
                :key="'month-' + index"
                class="month-label"
              >
                {{ month.label }}
              </div>
            </div>

            <!-- Grid with day labels and cells -->
            <div class="grid-container">
              <!-- Day labels column -->
              <div class="day-labels">
                <div class="day-label">Mon</div>
                <div class="day-label">Tue</div>
                <div class="day-label">Wed</div>
                <div class="day-label">Thu</div>
                <div class="day-label">Fri</div>
                <div class="day-label">Sat</div>
                <div class="day-label">Sun</div>
              </div>

              <!-- Grid of days -->
              <div class="grid-wrapper">
                <div
                  v-for="(month, monthIndex) in activityGridData.months"
                  :key="'month-' + monthIndex"
                  class="month-column"
                >
                  <div
                    v-for="(day, dayIndex) in month.days"
                    :key="'day-' + dayIndex"
                    class="day-cell"
                    :class="[
                      day.level,
                      {
                        selected:
                          selectedActivityCell &&
                          selectedActivityCell.monthIndex === monthIndex &&
                          selectedActivityCell.dayIndex === dayIndex,
                      },
                    ]"
                    :title="day.tooltip"
                    @click="
                      selectActivityCell(
                        $event,
                        monthIndex,
                        dayIndex,
                        day,
                        month.label
                      )
                    "
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-data">
            No flight data available for the selected time-frame
          </div>
        </div>

        <!-- Hourly Activity Grid -->
        <div class="activity-grid-container">
          <div
            v-if="activityGridDataHourly.hours.length > 0"
            class="activity-grid"
          >
            <!-- Hour labels -->
            <div class="month-labels">
              <div class="day-label-spacer"></div>
              <div
                v-for="(hour, index) in activityGridDataHourly.hours"
                :key="'hour-' + index"
                class="month-label"
              >
                {{ hour.label }}
              </div>
            </div>

            <!-- Grid with day labels and cells -->
            <div class="grid-container">
              <!-- Day labels column -->
              <div class="day-labels">
                <div class="day-label">Mon</div>
                <div class="day-label">Tue</div>
                <div class="day-label">Wed</div>
                <div class="day-label">Thu</div>
                <div class="day-label">Fri</div>
                <div class="day-label">Sat</div>
                <div class="day-label">Sun</div>
              </div>

              <!-- Grid of days -->
              <div class="grid-wrapper">
                <div
                  v-for="(hour, hourIndex) in activityGridDataHourly.hours"
                  :key="'hour-' + hourIndex"
                  class="month-column"
                >
                  <div
                    v-for="(day, dayIndex) in hour.days"
                    :key="'day-' + dayIndex"
                    class="day-cell"
                    :class="[
                      day.level,
                      {
                        selected:
                          selectedActivityCell &&
                          selectedActivityCell.isHourly &&
                          selectedActivityCell.hourIndex === hourIndex &&
                          selectedActivityCell.dayIndex === dayIndex,
                      },
                    ]"
                    :title="day.tooltip"
                    @click="
                      selectActivityCellHourly(
                        $event,
                        hourIndex,
                        dayIndex,
                        day,
                        hour.label
                      )
                    "
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-data">
            No flight data available for the selected time-frame
          </div>
        </div>
      </div>

      <!-- Floating popup for average flights (outside scrollable container) -->
      <transition name="fade">
        <div
          v-if="selectedActivityCell"
          class="activity-popup"
          :style="{
            top: selectedActivityCell.y + 'px',
            left: selectedActivityCell.x + 'px',
          }"
        >
          <div class="activity-popup-content">
            <button
              class="activity-popup-close"
              @click="selectedActivityCell = null"
            >
              &times;
            </button>
            <div class="activity-popup-title">
              {{ selectedActivityCell.description }}
            </div>
            <div class="activity-popup-value">
              Total flights:
              <strong>{{ selectedActivityCell.avgFlights }}</strong>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Flight Durations Histogram -->
    <div class="card flight-duration-chart-card">
      <h3>Flight Time Statistics</h3>
      <div class="flight-duration-chart-container">
        <svg class="flight-duration-chart" viewBox="0 0 800 400">
          <!-- Y-axis grid lines -->
          <line
            v-for="i in 5"
            :key="'grid-' + i"
            :x1="70"
            :y1="50 + (i - 1) * 70"
            :x2="750"
            :y2="50 + (i - 1) * 70"
            stroke="#e0e0e0"
            stroke-width="1"
          />

          <!-- X-axis -->
          <line
            x1="70"
            y1="330"
            x2="750"
            y2="330"
            stroke="#333"
            stroke-width="2"
          />

          <!-- Y-axis -->
          <line
            x1="70"
            y1="50"
            x2="70"
            y2="330"
            stroke="#333"
            stroke-width="2"
          />

          <!-- Y-axis labels -->
          <text
            v-for="(label, i) in flightDurationHistogramData.yLabels"
            :key="'y-label-' + i"
            x="60"
            :y="330 - i * 70"
            text-anchor="end"
            class="axis-label"
          >
            {{ label }}
          </text>

          <!-- X-axis subticks (every 15 min) -->
          <line
            v-for="(bar, i) in flightDurationHistogramData.bars"
            :key="'subtick-' + i"
            :x1="bar.x"
            y1="330"
            :x2="bar.x"
            y2="335"
            stroke="#999"
            stroke-width="1"
          />

          <!-- X-axis major tick marks and labels (every hour) -->
          <g
            v-for="(xLabel, i) in flightDurationHistogramData.xLabels"
            :key="'x-tick-' + i"
          >
            <line
              :x1="xLabel.x"
              y1="330"
              :x2="xLabel.x"
              y2="340"
              stroke="#333"
              stroke-width="1"
            />
            <text :x="xLabel.x" y="355" text-anchor="middle" class="axis-label">
              {{ xLabel.label }}
            </text>
          </g>

          <!-- Histogram bars -->
          <rect
            v-for="(bar, i) in flightDurationHistogramData.bars"
            :key="'bar-' + i"
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            fill="#549f74"
            class="histogram-bar-svg"
          >
            <title>{{ bar.tooltip }}</title>
          </rect>

          <!-- Y-axis title -->
          <text
            x="20"
            y="190"
            text-anchor="middle"
            transform="rotate(-90, 20, 190)"
            class="axis-title"
          >
            Number of Flights
          </text>

          <!-- X-axis title -->
          <text x="400" y="385" text-anchor="middle" class="axis-title">
            Flight Time
          </text>
        </svg>
        <div
          v-if="flightDurationHistogramData.bars.length === 0"
          class="no-data"
        >
          No flight data available for the selected filters
        </div>
      </div>
    </div>

    <!-- Distance / Time Scatter Plot -->
    <div class="card flight-time-chart-card">
      <h3>Distance / Time</h3>
      <div class="flight-time-chart-container">
        <svg class="flight-time-chart" viewBox="0 0 800 400">
          <!-- Y-axis grid lines -->
          <line
            v-for="i in 5"
            :key="'grid-' + i"
            :x1="70"
            :y1="50 + (i - 1) * 70"
            :x2="750"
            :y2="50 + (i - 1) * 70"
            stroke="#e0e0e0"
            stroke-width="1"
          />

          <!-- X-axis -->
          <line
            x1="70"
            y1="330"
            x2="750"
            y2="330"
            stroke="#333"
            stroke-width="2"
          />

          <!-- Y-axis -->
          <line
            x1="70"
            y1="50"
            x2="70"
            y2="330"
            stroke="#333"
            stroke-width="2"
          />

          <!-- Y-axis labels -->
          <text
            v-for="(label, i) in distanceTimeChartData.yLabels"
            :key="'y-label-' + i"
            x="60"
            :y="330 - i * 70"
            text-anchor="end"
            class="axis-label"
          >
            {{ label }}
          </text>

          <!-- X-axis labels -->
          <text
            v-for="(label, i) in distanceTimeChartData.xLabels"
            :key="'x-label-' + i"
            :x="70 + i * (680 / (distanceTimeChartData.xLabels.length - 1))"
            y="350"
            text-anchor="middle"
            class="axis-label x-axis-label"
          >
            {{ label }}
          </text>

          <!-- Regression line -->
          <line
            v-if="distanceTimeChartData.regressionLine"
            :x1="distanceTimeChartData.regressionLine.x1"
            :y1="distanceTimeChartData.regressionLine.y1"
            :x2="distanceTimeChartData.regressionLine.x2"
            :y2="distanceTimeChartData.regressionLine.y2"
            stroke="#cccccc"
            stroke-width="2"
            stroke-dasharray="4,4"
          />

          <!-- Data points -->
          <circle
            v-for="(point, i) in distanceTimeChartData.points"
            :key="'point-' + i"
            :cx="point.x"
            :cy="point.y"
            r="5"
            fill="#549f74"
            class="data-point"
            @click="openFlightModal(point.flight)"
          >
            <title>{{ point.tooltip }}</title>
          </circle>

          <!-- Y-axis title -->
          <text
            x="20"
            y="190"
            text-anchor="middle"
            transform="rotate(-90, 20, 190)"
            class="axis-title"
          >
            Flight Track Distance (km)
          </text>

          <!-- X-axis title -->
          <text x="400" y="380" text-anchor="middle" class="axis-title">
            Flight Duration (hours)
          </text>
        </svg>
        <div v-if="distanceTimeChartData.points.length === 0" class="no-data">
          No flight data available for the selected filters
        </div>
      </div>
    </div>

    <!-- Wing Usage Chart -->
    <div class="card histogram-card">
      <div class="chart-header">
        <h3>Glider Usage</h3>
        <div class="toggle-group">
          <div class="toggle-switch-container">
            <div
              class="toggle-switch-track"
              :class="{ active: wingUsageMetric === 'duration' }"
              @click="toggleWingUsageMetric"
            >
              <div class="toggle-switch-thumb"></div>
            </div>
            <span class="toggle-label">Duration in Flight</span>
          </div>
          <div class="toggle-switch-container">
            <div
              class="toggle-switch-track"
              :class="{ active: showRetiredWings }"
              @click="showRetiredWings = !showRetiredWings"
            >
              <div class="toggle-switch-thumb"></div>
            </div>
            <span class="toggle-label">Show Retired</span>
          </div>
        </div>
      </div>
      <div class="histogram-container">
        <div class="histogram">
          <div
            v-for="wingData in wingUsageData"
            :key="wingData.wing"
            class="histogram-bar-wrapper"
          >
            <div class="histogram-bar-container">
              <span class="bar-count">{{ wingData.displayValue }}</span>
              <div
                class="histogram-bar"
                :style="{
                  height: wingData.percentage + '%',
                  backgroundColor: wingData.isRetired ? '#999999' : '#549f74',
                }"
              ></div>
            </div>
            <div class="histogram-label">{{ wingData.wing }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Locations -->
    <div class="card top-locations-card">
      <h3>Top Locations</h3>
      <div class="top-locations-table">
        <table>
          <thead>
            <tr>
              <th class="rank-column">#</th>
              <th class="location-column">Launch Site</th>
              <th class="count-column">Flights</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(location, index) in topLocations" :key="index">
              <td class="rank-column">{{ index + 1 }}</td>
              <td class="location-column">{{ location.name }}</td>
              <td class="count-column">{{ location.count }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="topLocations.length === 0" class="no-data">
          No launch site data available
        </div>
      </div>
    </div>

    <!-- Floating Filter Button -->
    <div class="floating-filter">
      <button class="filter-toggle-btn" @click="showFilters = !showFilters">
        <span class="filter-icon">☰</span>
        <span class="filter-text">Filters</span>
      </button>

      <!-- Expanded Filters Panel -->
      <transition name="slide-up">
        <div v-if="showFilters" class="filters-panel">
          <!-- Category Filter -->
          <div class="filter-section" v-if="categories.length > 1">
            <h3>Filter by Category</h3>
            <div class="tabs-container">
              <button
                :class="['tab-btn', { active: selectedCategory === 'All' }]"
                @click="selectedCategory = 'All'"
              >
                All
              </button>
              <button
                v-for="category in categories"
                :key="category"
                :class="['tab-btn', { active: selectedCategory === category }]"
                @click="selectedCategory = category"
              >
                {{ category }}
              </button>
            </div>
          </div>

          <!-- Flight Type Filter -->
          <div class="filter-section" v-if="sportTypes.length > 1">
            <h3>Filter by Flight Type</h3>
            <div class="tabs-container">
              <button
                :class="['tab-btn', { active: selectedType === 'All' }]"
                @click="selectedType = 'All'"
              >
                All
              </button>
              <button
                v-for="type in sportTypes"
                :key="type"
                :class="['tab-btn', { active: selectedType === type }]"
                @click="selectedType = type"
              >
                {{ type }}
              </button>
            </div>
          </div>

          <!-- Time-frame Filter -->
          <div class="filter-section">
            <h3>Filter by time-frame</h3>
            <select v-model="selectedYear" class="year-dropdown">
              <option value="all">All-time</option>
              <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>
        </div>
      </transition>
    </div>

    <!-- Flight Selection Modal -->
    <transition name="fade">
      <div
        v-if="showFlightModal"
        class="modal-overlay"
        @click="closeFlightModal"
      >
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Select Flight</h3>
            <button class="modal-close" @click="closeFlightModal">
              &times;
            </button>
          </div>
          <div class="modal-body">
            <div
              v-for="flight in selectedDateFlights"
              :key="flight.id"
              class="flight-item"
              @click="navigateToFlight(flight.id)"
            >
              <div class="flight-item-header">
                <span class="flight-date">{{ formatDate(flight.date) }}</span>
                <span class="flight-category">{{ flight.type }}</span>
              </div>
              <div class="flight-item-details">
                <span class="flight-time">{{ flight.flightTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { flightOperations, gearOperations } from "../database/database.js";
import { formatDateShort } from "../utils/dateUtils.js";

export default {
  name: "Statistics",
  data() {
    return {
      selectedYear: "all",
      selectedCategory: "All",
      selectedType: "All",
      availableYears: [],
      flights: [],
      categories: [],
      sportTypes: [],
      categoryMetric: "count", // 'count' or 'time'
      typeMetric: "count", // 'count' or 'time'
      showFilters: false, // Controls filter panel visibility
      showFlightModal: false, // Controls flight selection modal
      selectedDateFlights: [], // Flights for the selected date
      flightTimeView: "linear", // 'linear' or 'cumulative'
      flightDistanceView: "linear", // 'linear' or 'cumulative'
      wingUsageMetric: "count", // 'count' or 'duration'
      showRetiredWings: false, // Show retired wings in usage chart
      allGear: [], // All gear items for checking retired status
      selectedActivityCell: null, // Selected cell in activity grid
    };
  },
  computed: {
    selectedYearLabel() {
      return this.selectedYear === "all" ? "All time" : this.selectedYear;
    },
    filteredFlights() {
      let filtered = this.flights;

      // Filter by year
      if (this.selectedYear !== "all") {
        filtered = filtered.filter((flight) => {
          if (!flight.date) return false;
          const flightYear = new Date(flight.date).getFullYear();
          return flightYear === parseInt(this.selectedYear);
        });
      }

      // Filter by category
      if (this.selectedCategory !== "All") {
        filtered = filtered.filter(
          (flight) => flight.category === this.selectedCategory
        );
      }

      // Filter by type
      if (this.selectedType !== "All") {
        filtered = filtered.filter(
          (flight) => flight.type === this.selectedType
        );
      }

      return filtered;
    },
    totalFlights() {
      return this.filteredFlights.length;
    },
    totalFlightTime() {
      let totalMinutes = 0;

      this.filteredFlights.forEach((flight) => {
        if (flight.flightTime) {
          // Parse flightTime which is in format "HH:MM"
          const [hours, minutes] = flight.flightTime.split(":").map(Number);
          totalMinutes += hours * 60 + minutes;
        }
      });

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours === 0 && minutes === 0) {
        return "0h";
      } else if (minutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${minutes}m`;
      }
    },
    longestFlightTime() {
      if (this.flights.length === 0) return "--";

      let maxMinutes = 0;

      this.flights.forEach((flight) => {
        if (flight.flightTime) {
          const [hours, minutes] = flight.flightTime.split(":").map(Number);
          const totalMinutes = hours * 60 + minutes;
          if (totalMinutes > maxMinutes) {
            maxMinutes = totalMinutes;
          }
        }
      });

      if (maxMinutes === 0) return "--";

      const hours = Math.floor(maxMinutes / 60);
      const minutes = maxMinutes % 60;

      if (minutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${minutes}m`;
      }
    },
    yearWithMostFlights() {
      if (this.flights.length === 0) return "--";

      const yearCounts = {};

      this.flights.forEach((flight) => {
        if (flight.date) {
          const year = new Date(flight.date).getFullYear();
          if (!isNaN(year)) {
            yearCounts[year] = (yearCounts[year] || 0) + 1;
          }
        }
      });

      if (Object.keys(yearCounts).length === 0) return "--";

      let maxYear = null;
      let maxCount = 0;

      Object.entries(yearCounts).forEach(([year, count]) => {
        if (count > maxCount) {
          maxCount = count;
          maxYear = year;
        }
      });

      return maxYear || "--";
    },
    daysSinceLastFlight() {
      if (this.flights.length === 0) return "--";

      let latestDate = null;

      this.flights.forEach((flight) => {
        if (flight.date) {
          const flightDate = new Date(flight.date);
          if (!latestDate || flightDate > latestDate) {
            latestDate = flightDate;
          }
        }
      });

      if (!latestDate) return "--";

      const today = new Date();
      const diffTime = Math.abs(today - latestDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    },
    longestFlightDistance() {
      if (this.flights.length === 0) return "--";

      let maxDistance = 0;

      this.flights.forEach((flight) => {
        if (flight.trackDistance && flight.trackDistance > maxDistance) {
          maxDistance = flight.trackDistance;
        }
      });

      if (maxDistance === 0) return "--";

      return `${maxDistance.toFixed(2)} km`;
    },
    totalDistanceFlown() {
      if (this.flights.length === 0) return "--";

      let totalDistance = 0;
      let hasDistance = false;

      this.flights.forEach((flight) => {
        if (flight.trackDistance) {
          totalDistance += flight.trackDistance;
          hasDistance = true;
        }
      });

      if (!hasDistance) return "--";

      return `${totalDistance.toFixed(2)} km`;
    },
    highestAltitude() {
      if (this.flights.length === 0) return "--";

      let maxAlt = 0;

      this.flights.forEach((flight) => {
        if (flight.maxAltitude && flight.maxAltitude > maxAlt) {
          maxAlt = flight.maxAltitude;
        }
      });

      if (maxAlt === 0) return "--";

      return `${maxAlt} m`;
    },
    histogramData() {
      if (this.filteredFlights.length === 0) return [];

      // Get year counts
      const yearCounts = {};
      let minYear = Infinity;
      let maxYear = -Infinity;

      this.filteredFlights.forEach((flight) => {
        if (flight.date) {
          const year = new Date(flight.date).getFullYear();
          if (!isNaN(year)) {
            yearCounts[year] = (yearCounts[year] || 0) + 1;
            if (year < minYear) minYear = year;
            if (year > maxYear) maxYear = year;
          }
        }
      });

      if (minYear === Infinity) return [];

      // Create array with all years in range
      const years = [];
      for (let year = minYear; year <= maxYear; year++) {
        years.push(year);
      }

      // Find max count for percentage calculation
      const maxCount = Math.max(...Object.values(yearCounts));

      // Build histogram data
      return years.map((year) => ({
        year: year,
        count: yearCounts[year] || 0,
        percentage:
          maxCount > 0 ? ((yearCounts[year] || 0) / maxCount) * 100 : 0,
      }));
    },
    categorySegments() {
      const colors = ["#549f74", "#7ec4a5", "#a5d8c4", "#c9e8dd", "#e6f5ef"];
      const categoryData = {};

      this.categories.forEach((category) => {
        categoryData[category] = 0;
      });

      this.filteredFlights.forEach((flight) => {
        if (flight.category && categoryData.hasOwnProperty(flight.category)) {
          categoryData[flight.category]++;
        }
      });

      return this.createPieSegments(categoryData, colors, this.totalFlights);
    },
    categorySegmentsByMetric() {
      const colors = ["#549f74", "#7ec4a5", "#a5d8c4", "#c9e8dd", "#e6f5ef"];

      if (this.categoryMetric === "count") {
        const categoryData = {};
        this.categories.forEach((category) => {
          categoryData[category] = 0;
        });
        this.filteredFlights.forEach((flight) => {
          if (flight.category && categoryData.hasOwnProperty(flight.category)) {
            categoryData[flight.category]++;
          }
        });
        return this.createPieSegments(categoryData, colors, this.totalFlights);
      } else {
        // time metric
        const categoryData = {};
        this.categories.forEach((category) => {
          categoryData[category] = 0;
        });
        this.filteredFlights.forEach((flight) => {
          if (flight.category && categoryData.hasOwnProperty(flight.category)) {
            if (flight.flightTime) {
              const [hours, minutes] = flight.flightTime.split(":").map(Number);
              categoryData[flight.category] += hours * 60 + minutes;
            }
          }
        });

        const categoryDataWithTime = {};
        Object.keys(categoryData).forEach((key) => {
          const totalMinutes = categoryData[key];
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          categoryDataWithTime[key] = {
            value: totalMinutes,
            display: minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`,
          };
        });

        const totalMinutes = Object.values(categoryData).reduce(
          (sum, val) => sum + val,
          0
        );
        return this.createPieSegments(
          categoryData,
          colors,
          totalMinutes,
          categoryDataWithTime
        );
      }
    },
    typeSegments() {
      const colors = ["#4a90e2", "#7eb3e8", "#b0d4f1", "#d9ecf9"];
      const typeData = {};

      this.sportTypes.forEach((type) => {
        typeData[type] = 0;
      });

      this.filteredFlights.forEach((flight) => {
        if (flight.type && typeData.hasOwnProperty(flight.type)) {
          if (flight.flightTime) {
            const [hours, minutes] = flight.flightTime.split(":").map(Number);
            typeData[flight.type] += hours * 60 + minutes;
          }
        }
      });

      // Convert minutes to time strings for display
      const typeDataWithTime = {};
      Object.keys(typeData).forEach((key) => {
        const totalMinutes = typeData[key];
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        typeDataWithTime[key] = {
          value: totalMinutes,
          display: minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`,
        };
      });

      const totalMinutes = Object.values(typeData).reduce(
        (sum, val) => sum + val,
        0
      );
      return this.createPieSegments(
        typeData,
        colors,
        totalMinutes,
        typeDataWithTime
      );
    },
    typeSegmentsByMetric() {
      const colors = ["#4a90e2", "#7eb3e8", "#b0d4f1", "#d9ecf9"];

      if (this.typeMetric === "count") {
        const typeData = {};
        this.sportTypes.forEach((type) => {
          typeData[type] = 0;
        });
        this.filteredFlights.forEach((flight) => {
          if (flight.type && typeData.hasOwnProperty(flight.type)) {
            typeData[flight.type]++;
          }
        });
        return this.createPieSegments(typeData, colors, this.totalFlights);
      } else {
        // time metric
        const typeData = {};
        this.sportTypes.forEach((type) => {
          typeData[type] = 0;
        });
        this.filteredFlights.forEach((flight) => {
          if (flight.type && typeData.hasOwnProperty(flight.type)) {
            if (flight.flightTime) {
              const [hours, minutes] = flight.flightTime.split(":").map(Number);
              typeData[flight.type] += hours * 60 + minutes;
            }
          }
        });

        const typeDataWithTime = {};
        Object.keys(typeData).forEach((key) => {
          const totalMinutes = typeData[key];
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          typeDataWithTime[key] = {
            value: totalMinutes,
            display: minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`,
          };
        });

        const totalMinutes = Object.values(typeData).reduce(
          (sum, val) => sum + val,
          0
        );
        return this.createPieSegments(
          typeData,
          colors,
          totalMinutes,
          typeDataWithTime
        );
      }
    },
    flightTimeChartData() {
      if (this.filteredFlights.length === 0) {
        return { points: [], yLabels: [], pathPoints: "" };
      }

      // Sort flights by date
      const sortedFlights = [...this.filteredFlights]
        .filter((f) => f.date && f.flightTime)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (sortedFlights.length === 0) {
        return { points: [], yLabels: [], pathPoints: "" };
      }

      // Group flights by date and sum flight times
      const flightsByDate = {};
      sortedFlights.forEach((flight) => {
        const dateKey = flight.date; // Use date string as key
        const [hours, minutes] = flight.flightTime.split(":").map(Number);
        const totalHours = hours + minutes / 60;

        if (!flightsByDate[dateKey]) {
          flightsByDate[dateKey] = {
            date: new Date(flight.date),
            hours: 0,
            flightCount: 0,
            originalDate: flight.date,
            flights: [], // Store all flights for this date
          };
        }

        flightsByDate[dateKey].hours += totalHours;
        flightsByDate[dateKey].flightCount++;
        flightsByDate[dateKey].flights.push(flight);
      });

      // Convert grouped data to array and format display time
      let flightData = Object.values(flightsByDate)
        .map((data) => {
          const totalMinutes = Math.round(data.hours * 60);
          const h = Math.floor(totalMinutes / 60);
          const m = totalMinutes % 60;
          const displayTime = m === 0 ? `${h}h` : `${h}h ${m}m`;

          return {
            date: data.date,
            hours: data.hours,
            displayTime: displayTime,
            flightCount: data.flightCount,
            originalDate: data.originalDate,
            flights: data.flights, // Include flights for click handler
          };
        })
        .sort((a, b) => a.date - b.date);

      // Calculate cumulative values if in cumulative mode
      if (this.flightTimeView === "cumulative") {
        let cumulativeHours = 0;
        flightData = flightData.map((data) => {
          cumulativeHours += data.hours;
          const totalMinutes = Math.round(cumulativeHours * 60);
          const h = Math.floor(totalMinutes / 60);
          const m = totalMinutes % 60;
          const cumulativeDisplayTime = m === 0 ? `${h}h` : `${h}h ${m}m`;

          return {
            ...data,
            hours: cumulativeHours,
            displayTime: cumulativeDisplayTime,
          };
        });
      }

      // Find max time for scaling
      const maxHours = Math.max(...flightData.map((f) => f.hours));
      const maxWithPadding = maxHours * 1.1;

      // Round up to nearest quarter hour
      const yMax = Math.ceil(maxWithPadding * 4) / 4;

      // Calculate step size and round to nearest quarter hour
      const rawStep = yMax / 4;
      const step = Math.ceil(rawStep * 4) / 4; // Ensure step is also a quarter hour

      // Recalculate yMax to ensure it's exactly 4 steps
      const adjustedYMax = step * 4;

      // Helper function to format time in quarter-hour increments
      const formatTime = (hours) => {
        const totalMinutes = Math.round(hours * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;

        if (h === 0) {
          return m === 0 ? "0h" : `${m}m`;
        } else if (m === 0) {
          return `${h}h`;
        } else {
          return `${h}h${m}`;
        }
      };

      // Create Y-axis labels (4 labels) with quarter-hour increments
      const yLabels = [];
      for (let i = 0; i <= 3; i++) {
        const value = (adjustedYMax / 3) * i;
        yLabels.push(Math.round(value * 10) / 10);
      }

      // Chart dimensions (Y-axis on left)
      const xStart = 60;
      const xEnd = 780;
      const chartWidth = xEnd - xStart;
      const chartHeight = 225;
      const yStart = 285;
      const yEnd = 60;

      // Calculate points
      const isSingleYear = this.selectedYear !== "all";
      let points = [];

      // For all-time view, calculate date range
      let startDate, endDate, totalDays;
      if (!isSingleYear && flightData.length > 0) {
        const years = flightData.map((f) => f.date.getFullYear());
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        startDate = new Date(minYear, 0, 1); // Jan 1st of earliest year
        endDate = new Date(maxYear, 11, 31); // Dec 31st of latest year
        totalDays =
          Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      }

      if (flightData.length > 0) {
        points = flightData.map((data, index) => {
          let x;
          if (isSingleYear) {
            // Calculate day of year (1-365/366)
            const startOfYear = new Date(data.date.getFullYear(), 0, 1);
            const dayOfYear =
              Math.floor((data.date - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
            const daysInYear =
              new Date(data.date.getFullYear(), 1, 29).getMonth() === 1
                ? 366
                : 365;
            x = xStart + ((dayOfYear - 1) / (daysInYear - 1)) * chartWidth;
          } else {
            // Position based on actual date for all time
            const daysSinceStart = Math.floor(
              (data.date - startDate) / (1000 * 60 * 60 * 24)
            );
            x = xStart + (daysSinceStart / (totalDays - 1)) * chartWidth;
          }
          const y = yStart - (data.hours / adjustedYMax) * chartHeight;

          // Format date label as dd.mm.yyyy
          const day = String(data.date.getDate()).padStart(2, "0");
          const month = String(data.date.getMonth() + 1).padStart(2, "0");
          const year = data.date.getFullYear();
          const dateLabel = `${day}.${month}.${year}`;

          // Create tooltip with flight count if multiple flights
          const tooltip =
            data.flightCount > 1
              ? `${dateLabel}: ${data.displayTime} (${data.flightCount} flights)`
              : `${dateLabel}: ${data.displayTime}`;

          return {
            x: x,
            y: y,
            label: dateLabel,
            tooltip: tooltip,
            flights: data.flights, // Include flights for click handler
          };
        });
      }

      // X-axis month labels (for single year) - 3-letter uppercase abbreviations
      const monthAbbr = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      let xMonthLabels = [];
      if (isSingleYear && flightData.length > 0) {
        const year = flightData[0].date.getFullYear();
        const daysInYear = new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;

        // Add all 12 months of the selected year
        for (let m = 0; m < 12; m++) {
          const firstOfMonth = new Date(year, m, 1);
          const dayOfYear =
            Math.floor(
              (firstOfMonth - new Date(year, 0, 1)) / (1000 * 60 * 60 * 24)
            ) + 1;
          const x = xStart + ((dayOfYear - 1) / (daysInYear - 1)) * chartWidth;
          xMonthLabels.push({ x, label: monthAbbr[m] });
        }
      }

      // X-axis labels (for all-time view) - month abbreviations with years below
      let xYearLabels = [];
      if (!isSingleYear && flightData.length > 0) {
        const numTicks = 8; // Fewer ticks for better readability
        const tickInterval = totalDays / numTicks;

        for (let i = 0; i <= numTicks; i++) {
          const daysFromStart = i * tickInterval;
          const tickDate = new Date(
            startDate.getTime() + daysFromStart * 24 * 60 * 60 * 1000
          );
          let x;
          if (totalDays <= 1) {
            x = xStart + (i / numTicks) * chartWidth;
          } else {
            x = xStart + (daysFromStart / (totalDays - 1)) * chartWidth;
          }

          // Month abbreviation (3-letter uppercase)
          const monthLabel = monthAbbr[tickDate.getMonth()];
          // Year (full 4 digits)
          const yearLabel = tickDate.getFullYear().toString();

          xYearLabels.push({ x, monthLabel, yearLabel });
        }
      }

      // Create path points string
      const pathPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

      // Create area points for polygon fill
      const baseY = 285; // Bottom of chart area
      let areaPoints = "";
      if (points.length > 0) {
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        areaPoints = `${firstPoint.x},${baseY} ${pathPoints} ${lastPoint.x},${baseY}`;
      }

      return {
        points: points,
        yLabels: yLabels,
        pathPoints: pathPoints,
        areaPoints: areaPoints,
        xMonthLabels: xMonthLabels,
        xYearLabels: xYearLabels,
      };
    },
    distanceTimeChartData() {
      // Filter flights that have both distance and time data
      const validFlights = this.filteredFlights.filter(
        (f) => f.trackDistance && f.flightTime
      );

      if (validFlights.length === 0) {
        return { points: [], xLabels: [], yLabels: [] };
      }

      // Convert flight times to hours and extract distances
      const scatterData = validFlights.map((flight) => {
        const [hours, minutes] = flight.flightTime.split(":").map(Number);
        const totalHours = hours + minutes / 60;
        return {
          hours: totalHours,
          distance: flight.trackDistance,
          displayTime: flight.flightTime,
          date: flight.date,
          flight: flight,
        };
      });

      // Find max values for scaling
      const maxHours = Math.max(...scatterData.map((f) => f.hours));
      const maxDistance = Math.max(...scatterData.map((f) => f.distance));
      const xMax = Math.ceil(maxHours * 1.1); // Add 10% padding
      const yMax = Math.ceil(maxDistance * 1.1); // Add 10% padding

      // Create Y-axis labels (distance in km)
      const yLabels = [];
      for (let i = 0; i <= 4; i++) {
        const value = (yMax / 4) * i;
        yLabels.push(value.toFixed(0) + " km");
      }

      // Create X-axis labels (time in hours)
      const xLabels = [];
      for (let i = 0; i <= 4; i++) {
        const value = (xMax / 4) * i;
        xLabels.push(value.toFixed(1) + "h");
      }

      // Chart dimensions
      const chartWidth = 680;
      const chartHeight = 280;
      const xStart = 70;
      const yStart = 330;

      // Calculate points
      const points = scatterData.map((data) => {
        const x = xStart + (data.hours / xMax) * chartWidth;
        const y = yStart - (data.distance / yMax) * chartHeight;

        // Format date label
        const date = new Date(data.date);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const dateLabel = `${day}.${month}.${year}`;

        return {
          x: x,
          y: y,
          tooltip: `${dateLabel}: ${data.displayTime} - ${data.distance.toFixed(
            2
          )} km`,
          flight: [data.flight],
        };
      });

      // Calculate linear regression through origin (0,0)
      // For regression through origin: slope = Σ(xy) / Σ(x²)
      let sumXY = 0;
      let sumXX = 0;
      scatterData.forEach((data) => {
        sumXY += data.hours * data.distance;
        sumXX += data.hours * data.hours;
      });
      const slope = sumXX > 0 ? sumXY / sumXX : 0;

      // Calculate regression line endpoints
      // Line goes through origin (0,0) and extends to the chart bounds
      const regressionStartX = xStart;
      const regressionStartY = yStart; // y=0 in chart coordinates
      const regressionEndX = xStart + chartWidth;
      const regressionEndY = yStart - ((slope * xMax) / yMax) * chartHeight;

      return {
        points: points,
        xLabels: xLabels,
        yLabels: yLabels,
        regressionLine: {
          x1: regressionStartX,
          y1: regressionStartY,
          x2: regressionEndX,
          y2: regressionEndY,
        },
      };
    },
    flightDistanceChartData() {
      if (this.filteredFlights.length === 0) {
        return {
          points: [],
          yLabels: [],
          pathPoints: "",
          xMonthLabels: [],
          xYearLabels: [],
        };
      }

      // Sort flights by date and filter those with distance data
      const sortedFlights = [...this.filteredFlights]
        .filter((f) => f.date && f.trackDistance)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (sortedFlights.length === 0) {
        return {
          points: [],
          yLabels: [],
          pathPoints: "",
          xMonthLabels: [],
          xYearLabels: [],
        };
      }

      // Group flights by date and aggregate
      const flightsByDate = {};
      sortedFlights.forEach((flight) => {
        const dateKey = flight.date;
        if (!flightsByDate[dateKey]) {
          flightsByDate[dateKey] = {
            date: new Date(flight.date),
            distance: 0,
            flightCount: 0,
            flights: [],
          };
        }
        flightsByDate[dateKey].distance += flight.trackDistance;
        flightsByDate[dateKey].flightCount++;
        flightsByDate[dateKey].flights.push(flight);
      });

      // Convert to array and sort
      let flightData = Object.values(flightsByDate).sort(
        (a, b) => a.date - b.date
      );

      // Apply cumulative view if selected
      if (this.flightDistanceView === "cumulative") {
        let cumulativeDistance = 0;
        flightData = flightData.map((data) => {
          cumulativeDistance += data.distance;
          return {
            ...data,
            distance: cumulativeDistance,
          };
        });
      }

      const startDate = flightData[0].date;
      const endDate = flightData[flightData.length - 1].date;
      const totalDays =
        Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      // Find max distance for scaling
      const maxDistance = Math.max(...flightData.map((f) => f.distance));
      const yMax = Math.ceil(maxDistance * 1.1); // Add 10% padding

      // Adjust yMax to ensure we always have at least 5 different non-zero labels
      const adjustedYMax = Math.max(yMax, 5);

      // Create Y-axis labels (4 labels for cleaner look)
      const yLabels = [];
      for (let i = 0; i <= 3; i++) {
        const value = (adjustedYMax / 3) * i;
        yLabels.push(Math.round(value));
      }

      // Chart dimensions (Y-axis on left)
      const chartWidth = 720;
      const chartHeight = 225;
      const xStart = 60;
      const yStart = 285;

      // Calculate points
      const isSingleYear = this.selectedYear !== "all";
      let points = [];
      if (flightData.length > 0) {
        points = flightData.map((data, index) => {
          let x;
          if (isSingleYear) {
            // Calculate day of year (1-365/366)
            const startOfYear = new Date(data.date.getFullYear(), 0, 1);
            const dayOfYear =
              Math.floor((data.date - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
            const daysInYear =
              new Date(data.date.getFullYear(), 1, 29).getMonth() === 1
                ? 366
                : 365;
            x = xStart + ((dayOfYear - 1) / (daysInYear - 1)) * chartWidth;
          } else {
            // Position based on actual date for all time
            const daysSinceStart = Math.floor(
              (data.date - startDate) / (1000 * 60 * 60 * 24)
            );
            if (totalDays <= 1) {
              x = xStart + chartWidth / 2; // Center single point
            } else {
              x = xStart + (daysSinceStart / (totalDays - 1)) * chartWidth;
            }
          }
          const y = yStart - (data.distance / adjustedYMax) * chartHeight;

          // Format date label
          const day = String(data.date.getDate()).padStart(2, "0");
          const month = String(data.date.getMonth() + 1).padStart(2, "0");
          const year = data.date.getFullYear();
          const dateLabel = `${day}.${month}.${year}`;

          // Create tooltip
          const tooltip =
            data.flightCount > 1
              ? `${dateLabel}: ${data.distance.toFixed(2)} km (${
                  data.flightCount
                } flights)`
              : `${dateLabel}: ${data.distance.toFixed(2)} km`;

          return {
            x: x,
            y: y,
            label: dateLabel,
            tooltip: tooltip,
            flights: data.flights,
          };
        });
      }

      // X-axis month labels (for single year) - 3-letter uppercase abbreviations
      const monthAbbr = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      let xMonthLabels = [];
      if (isSingleYear) {
        const year = parseInt(this.selectedYear);
        const daysInYear = new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;

        // Add all 12 months of the selected year
        for (let m = 0; m < 12; m++) {
          const firstOfMonth = new Date(year, m, 1);
          const dayOfYear =
            Math.floor(
              (firstOfMonth - new Date(year, 0, 1)) / (1000 * 60 * 60 * 24)
            ) + 1;
          const x = xStart + ((dayOfYear - 1) / (daysInYear - 1)) * chartWidth;
          xMonthLabels.push({ x, label: monthAbbr[m] });
        }
      }

      // X-axis labels (for all-time view) - month abbreviations with years below
      let xYearLabels = [];
      if (!isSingleYear && flightData.length > 0) {
        const numTicks = 8; // Fewer ticks for better readability
        const tickInterval = totalDays / numTicks;

        for (let i = 0; i <= numTicks; i++) {
          const daysFromStart = i * tickInterval;
          const tickDate = new Date(
            startDate.getTime() + daysFromStart * 24 * 60 * 60 * 1000
          );
          let x;
          if (totalDays <= 1) {
            x = xStart + (i / numTicks) * chartWidth;
          } else {
            x = xStart + (daysFromStart / (totalDays - 1)) * chartWidth;
          }

          // Month abbreviation (3-letter uppercase)
          const monthLabel = monthAbbr[tickDate.getMonth()];
          // Year (full 4 digits)
          const yearLabel = tickDate.getFullYear().toString();

          xYearLabels.push({ x, monthLabel, yearLabel });
        }
      }

      // Create path points string
      const pathPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

      // Create area points for polygon fill
      // Start from bottom-left, go through all points, end at bottom-right
      const baseY = 285; // Bottom of chart area (adjusted for new viewBox)
      let areaPoints = "";
      if (points.length > 0) {
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        areaPoints = `${firstPoint.x},${baseY} ${pathPoints} ${lastPoint.x},${baseY}`;
      }

      return {
        points: points,
        yLabels: yLabels,
        pathPoints: pathPoints,
        areaPoints: areaPoints,
        xMonthLabels: xMonthLabels,
        xYearLabels: xYearLabels,
      };
    },
    topLocations() {
      if (this.filteredFlights.length === 0) {
        return [];
      }

      // Count flights by launch site
      const locationCounts = {};
      const locationDates = {};

      this.filteredFlights.forEach((flight) => {
        const location = flight.takeoffLocation || "Unknown";
        if (!locationCounts[location]) {
          locationCounts[location] = 0;
          locationDates[location] = new Date(0); // Initialize with epoch
        }
        locationCounts[location]++;

        // Track most recent date for each location
        if (flight.date) {
          const flightDate = new Date(flight.date);
          if (flightDate > locationDates[location]) {
            locationDates[location] = flightDate;
          }
        }
      });

      // Convert to array and sort
      const locationArray = Object.entries(locationCounts).map(
        ([name, count]) => ({
          name,
          count,
          lastFlightDate: locationDates[name],
        })
      );

      // Sort by count (descending), then by most recent date (descending)
      locationArray.sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return b.lastFlightDate - a.lastFlightDate;
      });

      // Return top 3
      return locationArray.slice(0, 3);
    },
    wingUsageData() {
      if (this.filteredFlights.length === 0) {
        return [];
      }

      // Count flights or duration by wing
      const wingStats = {};

      this.filteredFlights.forEach((flight) => {
        const wing =
          flight.manufacturer && flight.model
            ? `${flight.manufacturer} ${flight.model}`
            : "Unknown";

        // Skip retired wings if toggle is off
        if (!this.showRetiredWings && flight.manufacturer && flight.model) {
          const gearItem = this.allGear.find(
            (g) =>
              g.type === "gliders" &&
              g.manufacturer?.toLowerCase() ===
                flight.manufacturer?.toLowerCase() &&
              g.model?.toLowerCase() === flight.model?.toLowerCase()
          );
          if (gearItem && gearItem.is_active === 0) {
            return; // Skip this flight
          }
        }

        if (!wingStats[wing]) {
          wingStats[wing] = {
            count: 0,
            totalMinutes: 0,
          };
        }
        wingStats[wing].count++;

        // Calculate flight duration in minutes
        if (flight.flightTime) {
          const [hours, minutes] = flight.flightTime.split(":").map(Number);
          wingStats[wing].totalMinutes += hours * 60 + minutes;
        }
      });

      // Convert to array
      const wingArray = Object.entries(wingStats).map(([wing, stats]) => {
        const hours = Math.floor(stats.totalMinutes / 60);
        const minutes = stats.totalMinutes % 60;
        const durationDisplay =
          minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;

        return {
          wing,
          count: stats.count,
          totalMinutes: stats.totalMinutes,
          durationDisplay,
        };
      });

      // Sort by the selected metric
      wingArray.sort((a, b) => {
        if (this.wingUsageMetric === "count") {
          return b.count - a.count;
        } else {
          return b.totalMinutes - a.totalMinutes;
        }
      });

      // Calculate percentages for bar heights
      const maxValue = Math.max(
        ...wingArray.map((w) =>
          this.wingUsageMetric === "count" ? w.count : w.totalMinutes
        )
      );

      return wingArray.map((wing) => {
        // Check if this wing is retired
        const wingName = wing.wing;
        const [manufacturer, ...modelParts] = wingName.split(" ");
        const model = modelParts.join(" ");
        const gearItem = this.allGear.find(
          (g) =>
            g.type === "gliders" &&
            g.manufacturer?.toLowerCase() === manufacturer?.toLowerCase() &&
            g.model?.toLowerCase() === model?.toLowerCase()
        );
        const isRetired = gearItem ? gearItem.is_active === 0 : false;

        return {
          wing: wing.wing,
          count: wing.count,
          totalMinutes: wing.totalMinutes,
          displayValue:
            this.wingUsageMetric === "count"
              ? wing.count
              : wing.durationDisplay,
          percentage:
            maxValue > 0
              ? ((this.wingUsageMetric === "count"
                  ? wing.count
                  : wing.totalMinutes) /
                  maxValue) *
                100
              : 0,
          isRetired,
        };
      });
    },
    activityGridData() {
      if (this.filteredFlights.length === 0) {
        return { months: [] };
      }

      // Determine if we're aggregating multiple years
      let years = [];
      if (this.selectedYear !== "all") {
        years = [parseInt(this.selectedYear)];
      } else {
        // Get all unique years from filtered flights
        const yearSet = new Set();
        this.filteredFlights.forEach((flight) => {
          if (flight.date) {
            yearSet.add(new Date(flight.date).getFullYear());
          }
        });
        years = Array.from(yearSet).sort();
      }

      if (years.length === 0) {
        return { months: [] };
      }

      // Create a map aggregating flights by month and day-of-week
      // Key: "month-dayOfWeek" (e.g., "1-1" for January Monday), Value: { count, hours }
      const flightsByMonthAndDay = {};

      this.filteredFlights.forEach((flight) => {
        if (flight.date) {
          const date = new Date(flight.date);
          const month = date.getMonth(); // 0-11
          const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
          // Convert to Monday=0, Sunday=6
          const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

          const key = `${month}-${adjustedDay}`;

          if (!flightsByMonthAndDay[key]) {
            flightsByMonthAndDay[key] = {
              count: 0,
              hours: 0,
            };
          }

          flightsByMonthAndDay[key].count++;

          if (flight.flightTime) {
            const [hours, minutes] = flight.flightTime.split(":").map(Number);
            flightsByMonthAndDay[key].hours += hours + minutes / 60;
          }
        }
      });

      // Use sum instead of average for monthly data
      const months = [];
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthData = {
          label: monthNames[monthIndex],
          days: [],
        };

        // Generate 7 days (Mon-Sun)
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
          const key = `${monthIndex}-${dayOfWeek}`;
          const dayData = flightsByMonthAndDay[key];

          let level = "level-0"; // No flights
          let totalCount = 0;
          let totalHours = 0;

          if (dayData) {
            totalCount = dayData.count;
            totalHours = dayData.hours;

            // Determine level based on total flight count
            if (totalCount >= 10) {
              level = "level-4";
            } else if (totalCount >= 5) {
              level = "level-3";
            } else if (totalCount >= 1) {
              level = "level-2";
            }
          }

          // Build tooltip
          const dayNames = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ];
          let tooltip = `${dayNames[dayOfWeek]}s in ${monthNames[monthIndex]}`;

          if (dayData) {
            const totalMinutes = Math.round(totalHours * 60);
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            const timeStr = m === 0 ? `${h}h` : `${h}h ${m}m`;
            tooltip += `: ${totalCount} flight${
              totalCount > 1 ? "s" : ""
            } (${timeStr})`;
          } else {
            tooltip += ": No flights";
          }

          monthData.days.push({
            level: level,
            tooltip: tooltip,
            count: totalCount,
          });
        }

        months.push(monthData);
      }

      return { months };
    },
    activityGridDataHourly() {
      if (this.filteredFlights.length === 0) {
        return { hours: [] };
      }

      // Determine if we're aggregating multiple years
      let years = [];
      if (this.selectedYear !== "all") {
        years = [parseInt(this.selectedYear)];
      } else {
        const yearSet = new Set();
        this.filteredFlights.forEach((flight) => {
          if (flight.date) {
            yearSet.add(new Date(flight.date).getFullYear());
          }
        });
        years = Array.from(yearSet).sort();
      }

      if (years.length === 0) {
        return { hours: [] };
      }

      // Create a map aggregating flights by hour and day-of-week
      // Key: "hour-dayOfWeek" (e.g., "6-1" for 6AM Monday), Value: { count, hours }
      const flightsByHourAndDay = {};

      this.filteredFlights.forEach((flight) => {
        // Check if flight has both date and flightStart
        if (!flight.date || !flight.flightStart) {
          return;
        }

        const date = new Date(flight.date);
        const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
        // Convert to Monday=0, Sunday=6
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        // Extract hour from flightStart (format: "HH:MM")
        const [hourStr] = flight.flightStart.split(":");
        const hour = parseInt(hourStr, 10);

        // Only include flights between 6h and 21h
        if (hour < 6 || hour > 21) {
          return;
        }

        const key = `${hour}-${adjustedDay}`;

        if (!flightsByHourAndDay[key]) {
          flightsByHourAndDay[key] = {
            count: 0,
            hours: 0,
          };
        }

        flightsByHourAndDay[key].count++;

        if (flight.flightTime) {
          const [hours, minutes] = flight.flightTime.split(":").map(Number);
          flightsByHourAndDay[key].hours += hours + minutes / 60;
        }
      });

      // Use sum instead of average for hourly data
      const hours = [];

      for (let hourIndex = 6; hourIndex <= 21; hourIndex++) {
        const hourData = {
          label: `${hourIndex}h`,
          days: [],
        };

        // Generate 7 days (Mon-Sun)
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
          const key = `${hourIndex}-${dayOfWeek}`;
          const dayData = flightsByHourAndDay[key];

          let level = "level-0"; // No flights
          let totalCount = 0;
          let totalHours = 0;

          if (dayData) {
            totalCount = dayData.count;
            totalHours = dayData.hours;

            // Determine level based on total flight count
            if (totalCount >= 10) {
              level = "level-4";
            } else if (totalCount >= 5) {
              level = "level-3";
            } else if (totalCount >= 1) {
              level = "level-2";
            }
          }

          // Build tooltip
          const dayNames = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ];
          let tooltip = `${dayNames[dayOfWeek]}s at ${hourIndex}:00`;

          if (dayData) {
            const totalMinutes = Math.round(totalHours * 60);
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            const timeStr = m === 0 ? `${h}h` : `${h}h ${m}m`;
            tooltip += `: ${totalCount} flight${
              totalCount > 1 ? "s" : ""
            } (${timeStr})`;
          } else {
            tooltip += ": No flights";
          }

          hourData.days.push({
            level: level,
            tooltip: tooltip,
            count: totalCount,
          });
        }

        hours.push(hourData);
      }

      return { hours };
    },
    flightDurationHistogramData() {
      if (this.filteredFlights.length === 0) {
        return { bars: [], yLabels: [], xLabels: [], maxCount: 0 };
      }

      // Define bins: 15-minute intervals from 0 to 10 hours (600 minutes)
      const binSize = 15; // minutes
      const maxDuration = 600; // 10 hours in minutes
      const numBins = maxDuration / binSize; // 40 bins

      // Initialize bins
      const bins = Array(numBins).fill(0);

      // Count flights in each bin
      this.filteredFlights.forEach((flight) => {
        if (flight.flightTime) {
          const [hours, minutes] = flight.flightTime.split(":").map(Number);
          const totalMinutes = hours * 60 + minutes;

          // Determine which bin this flight belongs to
          const binIndex = Math.floor(totalMinutes / binSize);

          // Only count flights up to 10 hours
          if (binIndex < numBins) {
            bins[binIndex]++;
          }
        }
      });

      // Find max count for scaling
      const maxCount = Math.max(...bins, 1);

      // Round up to nearest 5 for better Y-axis labels
      const yMax = Math.ceil(maxCount / 5) * 5;

      // Chart dimensions
      const xStart = 70;
      const xEnd = 750;
      const chartWidth = xEnd - xStart;
      const chartHeight = 280;
      const yStart = 330;
      const yEnd = 50;

      // Bar width
      const barWidth = chartWidth / numBins;

      // Build histogram bars
      const bars = bins.map((count, index) => {
        const startMinutes = index * binSize;
        const endMinutes = (index + 1) * binSize;

        // Format time labels
        const formatTime = (mins) => {
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          if (h === 0) {
            return `${m}m`;
          } else if (m === 0) {
            return `${h}h`;
          } else {
            return `${h}h${m}`;
          }
        };

        const x = xStart + index * barWidth;
        const barHeight = yMax > 0 ? (count / yMax) * chartHeight : 0;
        const y = yStart - barHeight;

        return {
          x: x,
          y: y,
          width: barWidth - 1, // Small gap between bars
          height: barHeight,
          count: count,
          tooltip: `${formatTime(startMinutes)} - ${formatTime(
            endMinutes
          )}: ${count} flight${count !== 1 ? "s" : ""}`,
        };
      });

      // Create Y-axis labels (5 labels: 0 to yMax)
      const yLabels = [];
      const yStep = yMax / 4;
      for (let i = 0; i <= 4; i++) {
        yLabels.push(Math.round(yStep * i));
      }

      // Create X-axis labels (every hour: 0h, 1h, 2h, ..., 10h)
      const xLabels = [];
      for (let hour = 0; hour <= 10; hour++) {
        const minutes = hour * 60;
        const binIndex = minutes / binSize;
        const x = xStart + binIndex * barWidth;
        xLabels.push({
          x: x,
          label: `${hour}h`,
        });
      }

      return {
        bars: bars,
        yLabels: yLabels,
        xLabels: xLabels,
        maxCount: yMax,
      };
    },
  },
  methods: {
    createPieSegments(data, colors, total, displayData = null) {
      const segments = [];
      let currentAngle = -90; // Start at top
      const radius = 80;
      const innerRadius = 45; // Smaller inner radius for thicker donut

      Object.entries(data).forEach(([label, value], index) => {
        if (total === 0) return;

        const percentage = Math.round((value / total) * 100);
        if (percentage === 0) return;

        const angleSize = (value / total) * 360;
        const endAngle = currentAngle + angleSize;

        let path;

        // Handle 100% case (single entry) - draw a full donut circle
        if (angleSize >= 359.9) {
          // Draw complete donut using two semicircles
          path = `
            M 0 ${-radius}
            A ${radius} ${radius} 0 0 1 0 ${radius}
            A ${radius} ${radius} 0 0 1 0 ${-radius}
            M 0 ${-innerRadius}
            A ${innerRadius} ${innerRadius} 0 0 0 0 ${innerRadius}
            A ${innerRadius} ${innerRadius} 0 0 0 0 ${-innerRadius}
            Z
          `;
        } else {
          // Create donut segment path
          const startRad = (currentAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;

          const x1 = radius * Math.cos(startRad);
          const y1 = radius * Math.sin(startRad);
          const x2 = radius * Math.cos(endRad);
          const y2 = radius * Math.sin(endRad);
          const x3 = innerRadius * Math.cos(endRad);
          const y3 = innerRadius * Math.sin(endRad);
          const x4 = innerRadius * Math.cos(startRad);
          const y4 = innerRadius * Math.sin(startRad);

          const largeArcFlag = angleSize > 180 ? 1 : 0;

          path = `
            M ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
            L ${x3} ${y3}
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
            Z
          `;
        }

        // Calculate label position (middle of segment, centered in donut thickness)
        const labelAngle = currentAngle + angleSize / 2;
        const labelRad = (labelAngle * Math.PI) / 180;
        const labelRadius = (radius + innerRadius) / 2; // Center of the donut ring
        const labelX = labelRadius * Math.cos(labelRad);
        const labelY = labelRadius * Math.sin(labelRad);

        segments.push({
          label,
          count: value,
          time: displayData ? displayData[label].display : null,
          percentage,
          path,
          color: colors[index % colors.length],
          labelX,
          labelY,
        });

        currentAngle = endAngle;
      });

      return segments;
    },
    async loadFlights() {
      try {
        this.flights = await flightOperations.getAllFlights();
        this.extractYears();
      } catch (error) {
        console.error("Error loading flights:", error);
      }
    },
    async loadGear() {
      try {
        this.allGear = await gearOperations.getAll();
      } catch (error) {
        console.error("Error loading gear:", error);
      }
    },
    extractYears() {
      const years = new Set();
      this.flights.forEach((flight) => {
        if (flight.date) {
          const year = new Date(flight.date).getFullYear();
          if (!isNaN(year)) {
            years.add(year);
          }
        }
      });
      // Sort years in descending order (most recent first)
      this.availableYears = Array.from(years).sort((a, b) => b - a);
    },
    loadSettings() {
      // Load categories from localStorage
      const savedCategories = localStorage.getItem("flightCategories");
      this.categories = savedCategories
        ? JSON.parse(savedCategories)
        : ["On-site", "XC", "H&F"];

      // Load flight types from localStorage
      const savedFlightTypes = localStorage.getItem("flightTypes");
      this.sportTypes = savedFlightTypes
        ? JSON.parse(savedFlightTypes)
        : ["Paragliding", "Speedflying"];
    },
    openFlightModal(flights) {
      this.selectedDateFlights = flights;
      this.showFlightModal = true;
    },
    closeFlightModal() {
      this.showFlightModal = false;
      this.selectedDateFlights = [];
    },
    navigateToFlight(flightId) {
      this.closeFlightModal();
      this.$router.push(`/flight/${flightId}`);
    },
    formatDate(dateString) {
      return formatDateShort(dateString);
    },
    toggleFlightTimeView() {
      this.flightTimeView =
        this.flightTimeView === "linear" ? "cumulative" : "linear";
    },
    toggleFlightDistanceView() {
      this.flightDistanceView =
        this.flightDistanceView === "linear" ? "cumulative" : "linear";
    },
    toggleWingUsageMetric() {
      this.wingUsageMetric =
        this.wingUsageMetric === "count" ? "duration" : "count";
    },
    selectActivityCell(event, monthIndex, dayIndex, dayData, monthLabel) {
      const dayNames = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const fullMonthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const description = `${dayNames[dayIndex]}s in ${fullMonthNames[monthIndex]}`;

      // For monthly data, show total count (sum)
      const totalFlights = dayData.count.toString();

      // Calculate popup position relative to the card
      const rect = event.target.getBoundingClientRect();
      const card = event.target
        .closest(".activity-grid-card")
        .getBoundingClientRect();

      // Position popup to the right and slightly above the cell
      const x = rect.left - card.left + rect.width + 10;
      const y = rect.top - card.top;

      this.selectedActivityCell = {
        monthIndex,
        dayIndex,
        description,
        avgFlights: totalFlights,
        isAggregated: false,
        isHourly: false,
        x,
        y,
      };
    },
    selectActivityCellHourly(event, hourIndex, dayIndex, dayData, hourLabel) {
      const dayNames = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const description = `${dayNames[dayIndex]}s at ${hourLabel.replace(
        "h",
        ":00"
      )}`;

      // For hourly data, show total count (sum)
      const totalFlights = dayData.count.toString();

      // Calculate popup position relative to the card
      const rect = event.target.getBoundingClientRect();
      const card = event.target
        .closest(".activity-grid-card")
        .getBoundingClientRect();

      // Position popup to the right and slightly above the cell
      const x = rect.left - card.left + rect.width + 10;
      const y = rect.top - card.top;

      this.selectedActivityCell = {
        hourIndex,
        dayIndex,
        description,
        avgFlights: totalFlights,
        isAggregated: false,
        isHourly: true,
        x,
        y,
      };
    },
  },
  mounted() {
    this.loadSettings();
    this.loadFlights();
    this.loadGear();
  },
};
</script>

<style scoped>
.statistics-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background-color: white;
  min-height: 100vh;
}

.statistics-container h1 {
  color: #549f74;
  margin-bottom: 30px;
  text-align: center;
}

.year-dropdown {
  padding: 0.5rem 1rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  background-color: white;
  color: #495057;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

.year-dropdown:hover {
  border-color: #549f74;
}

.year-dropdown:focus {
  outline: none;
  border-color: #549f74;
  box-shadow: 0 0 0 2px rgba(84, 159, 116, 0.25);
}

h1 {
  color: #2c3e50;
  margin-bottom: 0;
  font-size: 2rem;
}

h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

h3 {
  color: #495057;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.card {
  background: white;
  padding: 1rem 0;
  border-radius: 0;
  box-shadow: none;
  border-bottom: 1px solid #f0f0f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
  color: #495057;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toggle-switch {
  display: flex;
  gap: 0;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  overflow: hidden;
}

.toggle-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  background-color: white;
  color: #495057;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  border-right: 1px solid #dee2e6;
}

.toggle-btn:last-child {
  border-right: none;
}

.toggle-btn:hover {
  background-color: #f8f9fa;
}

.toggle-btn.active {
  background-color: #549f74;
  color: white;
}

.filters-container {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.filter-tabs {
  flex: 1;
  margin-bottom: 0;
}

.filter-tabs:last-child {
  text-align: right;
}

.filter-tabs:last-child .dropdown-container {
  justify-content: flex-end;
}

.filter-tabs h3 {
  color: #495057;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
}

.dropdown-container {
  display: flex;
  justify-content: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tabs-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background-color: white;
  color: #495057;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.tab-btn:hover {
  background-color: #f8f9fa;
  border-color: #549f74;
}

.tab-btn.active {
  background-color: #549f74;
  color: white;
  border-color: #549f74;
}

.key-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.key-stat-card {
  text-align: center;
  padding: 2rem 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.key-stat-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.stat-title {
  color: #495057;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #549f74;
  line-height: 1;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  text-align: center;
  padding: 1.5rem 0;
}

.pie-chart-container {
  position: relative;
  width: 100%;
  max-width: 300px;
  margin: 1.5rem auto;
}

.pie-chart {
  width: 100%;
  height: auto;
}

.pie-center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.pie-center-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  line-height: 1;
}

.pie-center-label {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.pie-label {
  font-size: 12px;
  font-weight: 600;
  fill: white;
  pointer-events: none;
}

.pie-legend {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-label {
  color: #495057;
  text-align: left;
  font-weight: 500;
}

/* Floating Filter Button */
.floating-filter {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #549f74;
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.filter-toggle-btn:hover {
  background: #448060;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.filter-icon {
  font-size: 1.3rem;
}

.filter-text {
  font-size: 1rem;
}

.filters-panel {
  position: absolute;
  bottom: 5rem;
  right: 0;
  width: 400px;
  max-width: 90vw;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 1.5rem;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-section h3 {
  color: #495057;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.filter-section .tabs-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-section .tab-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background-color: white;
  color: #495057;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.filter-section .tab-btn:hover {
  background-color: #f8f9fa;
  border-color: #549f74;
}

.filter-section .tab-btn.active {
  background-color: #549f74;
  color: white;
  border-color: #549f74;
}

.filter-section .year-dropdown {
  width: 100%;
  padding: 0.6rem 1rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  background-color: white;
  color: #495057;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-section .year-dropdown:hover {
  border-color: #549f74;
}

.filter-section .year-dropdown:focus {
  outline: none;
  border-color: #549f74;
  box-shadow: 0 0 0 2px rgba(84, 159, 116, 0.25);
}

/* Slide up animation */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Histogram styles */
.histogram-section {
  margin-bottom: 2rem;
}

.histogram-card {
  padding: 1.5rem 0;
}

.histogram-card .chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.histogram-card .chart-subheader {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
}

.histogram-card h3 {
  color: #495057;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
  text-align: left;
}

.histogram-container {
  width: 100%;
  overflow-x: auto;
  padding: 1rem 0;
}

.histogram {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 1rem;
  min-height: 300px;
  padding: 0 1rem;
}

.histogram-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 40px;
  max-width: 80px;
}

.histogram-bar-container {
  width: 100%;
  height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  gap: 4px;
}

.histogram-bar {
  width: 100%;
  min-height: 20px;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
}

.histogram-bar:hover {
  opacity: 0.8;
  transform: translateY(-2px);
}

.bar-count {
  color: #333;
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 2px;
}

.histogram-label {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
  text-align: center;
}

/* Flight Time Chart */
.flight-time-chart-card {
  padding: 1.5rem 0;
  margin-bottom: 0;
}

.flight-time-chart-card .chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.flight-time-chart-card h3 {
  color: #495057;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
  text-align: left;
}

/* Flight Duration Chart */
.flight-duration-chart-card {
  padding: 1.5rem 0;
  margin-bottom: 0;
}

.flight-duration-chart-card h3 {
  color: #495057;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1.5rem;
  text-align: left;
}

.flight-duration-chart-container {
  width: 100%;
  position: relative;
}

.flight-duration-chart {
  width: 100%;
  height: auto;
}

.histogram-bar-svg {
  cursor: pointer;
  transition: all 0.2s;
}

.histogram-bar-svg:hover {
  fill: #3d7a55;
  opacity: 0.9;
}

.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
  width: auto;
}

.toggle-switch-container {
  display: grid;
  grid-template-columns: 48px 1fr;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.toggle-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
  white-space: nowrap;
  text-align: left;
  justify-self: start;
}

.toggle-switch-track {
  position: relative;
  width: 48px;
  height: 24px;
  background-color: #dee2e6;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.toggle-switch-track:hover {
  background-color: #ced4da;
}

.toggle-switch-track.active {
  background-color: #549f74;
}

.toggle-switch-track.active:hover {
  background-color: #448060;
}

.toggle-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch-track.active .toggle-switch-thumb {
  transform: translateX(24px);
}

.flight-time-chart-container {
  width: 100%;
  position: relative;
  overflow: visible;
}

.flight-time-chart {
  width: 100%;
  height: auto;
  display: block;
}

.flight-time-chart {
  width: 100%;
  height: auto;
}

.axis-label {
  font-size: 12px;
  fill: #666;
}

.x-axis-label {
  font-size: 11px;
}

.axis-title {
  font-size: 14px;
  fill: #333;
  font-weight: 600;
}

/* Chart labels */
.chart-y-label {
  font-size: 14px;
  fill: #495057;
  font-weight: 600;
}

.chart-x-label {
  font-size: 13px;
  fill: #495057;
  font-weight: 600;
  text-transform: uppercase;
}

.chart-x-label-year {
  font-size: 11px;
  fill: #868e96;
  font-weight: 500;
}

.chart-year-label {
  font-size: 14px;
  fill: #495057;
  font-weight: 600;
}

.line-chart-section {
  padding: 1rem 0;
}

.line-chart-section .flight-time-chart-container {
  padding: 0;
}

.area-line-chart {
  display: block;
  width: 100%;
  height: auto;
  min-height: 200px;
}

.data-point {
  cursor: pointer;
  transition: all 0.15s ease;
}

.data-point:hover {
  r: 7 !important;
  stroke-width: 3 !important;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #999;
  font-size: 1.1rem;
}

/* Activity Grid (GitHub-style) */
.activity-grid-card {
  position: relative;
  padding: 1.5rem 0;
  margin-bottom: 0;
  overflow: visible;
}

.activity-grid-card h3 {
  color: #495057;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1.5rem;
  text-align: left;
}

.activity-grids-wrapper {
  display: flex;
  gap: 1.5rem;
  width: 100%;
}

.activity-grid-container {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: visible;
  padding: 1rem 0;
}

.activity-grid {
  display: inline-flex;
  flex-direction: column;
  min-width: 100%;
}

.month-labels {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #666;
  align-items: center;
}

.day-label-spacer {
  width: 40px;
}

.month-label {
  width: 24px;
  text-align: center;
  font-weight: 600;
  flex-shrink: 0;
  font-size: 11px;
  overflow: visible;
}

.grid-container {
  display: flex;
  gap: 8px;
}

.day-labels {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #666;
  padding-top: 0;
}

.day-label {
  height: 24px;
  line-height: 24px;
  width: 35px;
  text-align: right;
  font-weight: 500;
}

.grid-wrapper {
  display: flex;
  gap: 4px;
  flex-grow: 1;
}

.month-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-cell {
  width: 24px;
  height: 24px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.day-cell:hover {
  outline: 2px solid rgba(0, 0, 0, 0.4);
  outline-offset: 0px;
  transform: scale(1.1);
}

.day-cell.empty {
  background-color: transparent;
  cursor: default;
}

.day-cell.empty:hover {
  outline: none;
}

.day-cell.level-0 {
  background-color: #ebedf0;
}

.day-cell.level-2 {
  background-color: #9be9a8;
}

.day-cell.level-3 {
  background-color: #40c463;
}

.day-cell.level-4 {
  background-color: #30a14e;
}

.day-cell.selected {
  outline: 3px solid #549f74;
  outline-offset: 0px;
  box-shadow: 0 0 8px rgba(84, 159, 116, 0.4);
}

/* Activity Popup */
.activity-popup {
  position: absolute;
  z-index: 1100;
  pointer-events: all;
}

.activity-popup-content {
  position: relative;
  background: white;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  border: 1px solid #e0e0e0;
  min-width: 220px;
  max-width: 300px;
}

.activity-popup-title {
  font-size: 13px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
  padding-right: 1.5rem;
}

.activity-popup-value {
  font-size: 13px;
  color: #666;
}

.activity-popup-value strong {
  color: #549f74;
  font-size: 18px;
  font-weight: 700;
}

.activity-popup-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.activity-popup-close:hover {
  background: #f5f5f5;
  color: #333;
}

/* Flight Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #666;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 1rem;
  overflow-y: auto;
}

.flight-item {
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.flight-item:hover {
  background: #e9ecef;
  border-color: #549f74;
  transform: translateX(4px);
}

.flight-item:last-child {
  margin-bottom: 0;
}

.flight-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.flight-date {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
}

.flight-time {
  font-size: 1rem;
  font-weight: bold;
  color: #549f74;
}

.flight-category {
  padding: 0.25rem 0.75rem;
  background: #549f74;
  color: white;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.flight-item-details {
  display: flex;
  gap: 1rem;
  color: #549f74;
  font-size: 0.95rem;
}

.flight-item-details span {
  display: flex;
  align-items: center;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .statistics-container {
    padding: 1rem;
    overflow-x: hidden;
    background-color: white;
  }

  h1 {
    font-size: 1.5rem;
  }

  h2 {
    font-size: 1.25rem;
  }

  /* Cards are already full-width with no styling */
  .card {
    margin-left: 0;
    margin-right: 0;
    border-radius: 0;
    padding: 1rem 0;
  }

  .key-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .key-stat-card {
    padding: 1rem 0.75rem;
    border-radius: 8px;
  }

  .stat-title {
    font-size: 0.8rem;
  }

  .stat-number {
    font-size: 1.6rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .stat-card {
    padding: 1rem 0;
  }

  .floating-filter {
    bottom: 1rem;
    right: 1rem;
  }

  .filter-toggle-btn {
    padding: 0.9rem 1.3rem;
    font-size: 1rem;
  }

  .filters-panel {
    width: calc(100vw - 2rem);
    bottom: 4.5rem;
    right: -1rem;
    left: 1rem;
  }

  /* Histogram section full width */
  .histogram-section {
    margin-left: 0;
    margin-right: 0;
  }

  .histogram-card {
    padding: 1rem 0;
  }

  /* Flight Duration/Distance Charts - Mobile optimization */
  .flight-time-chart-card {
    padding: 1rem 0;
  }

  .flight-time-chart-card .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .flight-time-chart-card .chart-header h3 {
    margin-bottom: 0;
    font-size: 1rem;
  }

  .flight-time-chart-card .toggle-switch-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    width: auto;
  }

  .flight-time-chart-card .toggle-label {
    order: -1;
    font-size: 0.85rem;
  }

  .flight-time-chart-container {
    width: 100%;
    padding: 0;
    margin: 0;
  }

  /* Chart sizing */
  .flight-time-chart {
    width: 100%;
    height: auto;
    min-height: 280px;
  }

  /* Simplify axis labels on mobile */
  .flight-time-chart .axis-label {
    font-size: 10px;
  }

  .flight-time-chart .axis-title {
    font-size: 10px;
  }

  .flight-time-chart .x-axis-label {
    font-size: 9px;
  }

  /* Make data points larger and more tappable */
  .flight-time-chart .data-point {
    r: 5;
  }

  /* Flight Duration Chart - make bigger on mobile */
  .flight-duration-chart-card {
    padding: 1rem 0;
  }

  .flight-duration-chart-container {
    width: 100%;
    min-height: 220px;
  }

  .flight-duration-chart {
    width: 100%;
    height: auto;
    min-height: 220px;
  }

  /* Histogram card (Glider Usage) - Mobile optimization */
  .histogram-card .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .histogram-card .toggle-group {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 12px;
  }

  .histogram-card .toggle-switch-container {
    flex: 1;
    min-width: 140px;
  }

  .histogram {
    min-height: 200px;
    gap: 0.5rem;
  }

  .histogram-bar-container {
    height: 180px;
  }

  /* Activity Grid (Flight Timing) - Mobile optimization */
  .activity-grid-card {
    padding: 1rem 0;
  }

  .activity-grids-wrapper {
    flex-direction: column;
    gap: 1.5rem;
  }

  .activity-grid-container {
    padding: 0.5rem 0;
    overflow-x: auto;
  }

  .day-cell {
    width: 14px;
    height: 14px;
  }

  .month-label {
    width: 14px;
    font-size: 8px;
  }

  .day-label {
    font-size: 9px;
  }

  .grid-wrapper {
    gap: 2px;
  }

  .month-column {
    gap: 2px;
  }

  .month-labels {
    gap: 2px;
    margin-bottom: 6px;
  }

  .day-label-spacer {
    width: 28px;
  }

  .grid-container {
    gap: 4px;
  }

  .day-labels {
    gap: 2px;
  }

  .day-label {
    height: 14px;
    line-height: 14px;
    width: 24px;
  }

  /* Activity popup - fix positioning on mobile */
  .activity-popup {
    position: fixed !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    z-index: 1001;
  }

  .activity-popup-content {
    padding: 1rem;
    min-width: 200px;
    max-width: 280px;
  }

  .activity-popup-title {
    font-size: 13px;
  }

  .activity-popup-value {
    font-size: 13px;
  }

  .activity-popup-value strong {
    font-size: 18px;
  }

  /* No data message - centered without graph */
  .flight-time-chart-container .no-data {
    position: relative;
    padding: 40px 20px;
    text-align: center;
    color: #666;
    font-style: italic;
  }

  /* Hide SVG when no data */
  .flight-time-chart-container:has(.no-data) .flight-time-chart {
    display: none;
  }
}

/* No data message */
.no-data-message {
  padding: 40px 20px;
  text-align: center;
  color: #666;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
}

/* Top Locations Table */
.top-locations-card {
  padding: 1.5rem 0;
  margin-bottom: 5rem;
}

.top-locations-card h3 {
  color: #495057;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1.5rem;
  text-align: left;
}

.top-locations-table {
  width: 100%;
}

.top-locations-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.top-locations-table thead {
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.top-locations-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.top-locations-table td {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
  font-size: 1rem;
}

.top-locations-table tbody tr:hover {
  background-color: #f8f9fa;
}

.rank-column {
  width: 60px;
  text-align: center;
  font-weight: 600;
  color: #549f74;
  font-size: 1.1rem;
}

.location-column {
  width: auto;
  font-weight: 500;
}

.count-column {
  width: 120px;
  text-align: right;
  font-weight: 600;
  color: #549f74;
}

.top-locations-table .no-data {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-size: 1rem;
}
</style>
