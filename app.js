/**
 * ============================================================================
 * Weather Monitoring Application - app.js
 * ============================================================================
 * An intermediate-level vanilla JavaScript project demonstrating:
 * 1. Asynchronous JavaScript (async / await, fetch, error handling)
 * 2. Browser LocalStorage persistence with JSON serialization
 * 3. Functional array methods (.forEach, .filter, .find, .findIndex)
 * 4. DOM manipulation & Event Delegation
 * 5. Single Source of Truth (State-driven UI)
 * ============================================================================
 */

// ============================================================================
// 1. APPLICATION STATE & STORAGE CONFIG
// ============================================================================

/**
 * LocalStorage key used to persist our saved cities array.
 */
const STORAGE_KEY = "weather_saved_cities";

/**
 * In-Memory State: Single source of truth for all saved cities.
 * Each city object adheres to the schema:
 * {
 *   id: number,
 *   name: string,
 *   country: string,
 *   temp: number,
 *   humidity: number,
 *   condition: string,
 *   conditionIcon: string,
 *   lastUpdated: string
 * }
 */
let savedCities = [];

/**
 * Tracks the currently active/displayed city in the hero card.
 */
let activeCity = null;

// ============================================================================
// 2. DOM ELEMENT REFERENCES
// ============================================================================

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const statusBanner = document.getElementById("status-banner");
const statusIcon = document.getElementById("status-icon");
const statusText = document.getElementById("status-text");
const activeWeatherCard = document.getElementById("active-weather-card");
const savedCitiesList = document.getElementById("saved-cities-list");
const savedCountBadge = document.getElementById("saved-count-badge");
const filterInput = document.getElementById("filter-input");

// Timer ID for clearing status messages automatically
let statusTimeoutId = null;

// ============================================================================
// 3. STORAGE FUNCTIONS (LocalStorage & JSON Sync)
// ============================================================================

/**
 * Reads saved cities from browser LocalStorage.
 * Deserializes JSON string back into a JavaScript array.
 * Includes defensive fallback so corrupted data never crashes the app.
 */
function loadFromStorage() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    // If null/undefined, initialize with an empty array
    if (!rawData) {
      savedCities = [];
      return;
    }
    const parsed = JSON.parse(rawData);
    // Ensure the parsed data is strictly an Array
    savedCities = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse saved cities from LocalStorage:", error);
    savedCities = [];
  }
}

/**
 * Serializes the in-memory `savedCities` array to JSON
 * and saves it into browser LocalStorage.
 */
function saveToStorage() {
  try {
    const serialized = JSON.stringify(savedCities);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error("Failed to save to LocalStorage:", error);
    showStatus("Could not save to LocalStorage (quota exceeded or disabled).", "error");
  }
}

// ============================================================================
// 4. WEATHER CODE TRANSLATION (WMO Weather Interpretation)
// ============================================================================

/**
 * Converts Open-Meteo WMO weather codes into human-readable text and emojis.
 * @param {number} code - WMO weather code from Open-Meteo
 * @returns {{ text: string, icon: string }}
 */
function getWeatherCondition(code) {
  const weatherMap = {
    0: { text: "Clear Sky", icon: "☀️" },
    1: { text: "Mainly Clear", icon: "🌤️" },
    2: { text: "Partly Cloudy", icon: "⛅" },
    3: { text: "Overcast", icon: "☁️" },
    45: { text: "Foggy", icon: "🌫️" },
    48: { text: "Depositing Rime Fog", icon: "🌫️" },
    51: { text: "Light Drizzle", icon: "🌦️" },
    53: { text: "Moderate Drizzle", icon: "🌦️" },
    55: { text: "Dense Drizzle", icon: "🌧️" },
    56: { text: "Freezing Drizzle", icon: "🌧️" },
    57: { text: "Heavy Freezing Drizzle", icon: "🌧️" },
    61: { text: "Slight Rain", icon: "🌧️" },
    63: { text: "Moderate Rain", icon: "🌧️" },
    65: { text: "Heavy Rain", icon: "🌧️" },
    66: { text: "Light Freezing Rain", icon: "🌧️" },
    67: { text: "Heavy Freezing Rain", icon: "🌧️" },
    71: { text: "Slight Snow Fall", icon: "🌨️" },
    73: { text: "Moderate Snow Fall", icon: "🌨️" },
    75: { text: "Heavy Snow Fall", icon: "❄️" },
    77: { text: "Snow Grains", icon: "❄️" },
    80: { text: "Slight Rain Showers", icon: "🌦️" },
    81: { text: "Moderate Rain Showers", icon: "🌧️" },
    82: { text: "Violent Rain Showers", icon: "⛈️" },
    85: { text: "Slight Snow Showers", icon: "🌨️" },
    86: { text: "Heavy Snow Showers", icon: "❄️" },
    95: { text: "Thunderstorm", icon: "⛈️" },
    96: { text: "Thunderstorm with Hail", icon: "⛈️" },
    99: { text: "Heavy Thunderstorm with Hail", icon: "⛈️" },
  };

  return weatherMap[code] || { text: "Fair / Variable", icon: "🌡️" };
}

// ============================================================================
// 5. STATUS BANNER & UI FEEDBACK
// ============================================================================

/**
 * Displays user feedback (loading, success, or error) in the status banner.
 * @param {string} message - Message to display
 * @param {'loading' | 'success' | 'error'} type - Style modifier
 * @param {number} autoHideMs - Time in ms before auto-clearing (0 = persistent)
 */
function showStatus(message, type = "info", autoHideMs = 4000) {
  if (statusTimeoutId) {
    clearTimeout(statusTimeoutId);
    statusTimeoutId = null;
  }

  // Set message text
  statusText.textContent = message;

  // Reset classes
  statusBanner.className = "status-banner";

  if (type === "loading") {
    statusBanner.classList.add("status-loading");
    statusIcon.textContent = "⏳";
  } else if (type === "success") {
    statusBanner.classList.add("status-success");
    statusIcon.textContent = "✅";
  } else if (type === "error") {
    statusBanner.classList.add("status-error");
    statusIcon.textContent = "⚠️";
  }

  statusBanner.classList.remove("hidden");

  // Auto-hide success or error after a delay if specified
  if (autoHideMs > 0 && type !== "loading") {
    statusTimeoutId = setTimeout(() => {
      clearStatus();
    }, autoHideMs);
  }
}

/**
 * Hides the feedback banner.
 */
function clearStatus() {
  statusBanner.classList.add("hidden");
  statusText.textContent = "";
}

// ============================================================================
// 6. ASYNCHRONOUS API LAYER (Open-Meteo REST API)
// ============================================================================

/**
 * Fetches coordinates and real-time weather metrics for a given city name.
 * Chained Dependent Calls:
 * 1. Geocoding API: converts city name -> { latitude, longitude, country }
 * 2. Weather Forecast API: coordinates -> live { temperature, humidity, weather_code }
 *
 * @param {string} cityName - City name entered by user
 */
async function fetchCityWeather(cityName) {
  const trimmedCity = cityName.trim();

  // Basic validation
  if (!trimmedCity) {
    showStatus("Please enter a valid city name.", "error");
    cityInput.focus();
    return;
  }

  // Toggle UI loading states
  showStatus(`Searching coordinates and weather for "${trimmedCity}"...`, "loading", 0);
  searchBtn.classList.add("loading");
  searchBtn.disabled = true;
  cityInput.disabled = true;

  try {
    // -------------------------------------------------------------
    // Step 1: Geocoding API Call (Name -> Coordinates)
    // -------------------------------------------------------------
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmedCity)}&count=1`;
    const geoResponse = await fetch(geoUrl);

    if (!geoResponse.ok) {
      throw new Error(`Geocoding service error (${geoResponse.status}). Please try again.`);
    }

    const geoData = await geoResponse.json();

    // Verify if any location was returned
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`City "${trimmedCity}" could not be found. Please check spelling.`);
    }

    const location = geoData.results[0];
    const resolvedName = location.name;
    const countryName = location.country || location.country_code || "Unknown Region";
    const latitude = location.latitude;
    const longitude = location.longitude;

    // -------------------------------------------------------------
    // Step 2: Weather Forecast API Call (Coordinates -> Weather)
    // -------------------------------------------------------------
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code`;
    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error(`Weather service error (${weatherResponse.status}). Please try again.`);
    }

    const weatherData = await weatherResponse.json();

    if (!weatherData.current) {
      throw new Error("Received incomplete weather data from server.");
    }

    const currentMetrics = weatherData.current;
    const conditionInfo = getWeatherCondition(currentMetrics.weather_code);

    // Format current local timestamp (e.g., "2:30 PM")
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    // -------------------------------------------------------------
    // Step 3: Update State & Prevent Duplicates
    // -------------------------------------------------------------
    // Check if the city already exists in our saved list (case-insensitive check)
    const existingIndex = savedCities.findIndex(
      (c) =>
        c.name.toLowerCase() === resolvedName.toLowerCase() &&
        c.country.toLowerCase() === countryName.toLowerCase()
    );

    let cityRecord;

    if (existingIndex !== -1) {
      // City already exists: update metrics and reuse existing ID
      cityRecord = {
        ...savedCities[existingIndex],
        temp: Math.round(currentMetrics.temperature_2m),
        humidity: currentMetrics.relative_humidity_2m,
        condition: conditionInfo.text,
        conditionIcon: conditionInfo.icon,
        lastUpdated: formattedTime,
      };

      // Remove from previous position and unshift to the front
      savedCities.splice(existingIndex, 1);
      savedCities.unshift(cityRecord);
    } else {
      // Brand new city entry
      cityRecord = {
        id: Date.now(),
        name: resolvedName,
        country: countryName,
        temp: Math.round(currentMetrics.temperature_2m),
        humidity: currentMetrics.relative_humidity_2m,
        condition: conditionInfo.text,
        conditionIcon: conditionInfo.icon,
        lastUpdated: formattedTime,
      };

      // Add to front of the array
      savedCities.unshift(cityRecord);
    }

    // Set as the currently active city
    activeCity = cityRecord;

    // -------------------------------------------------------------
    // Step 4: Sync to LocalStorage & Re-render DOM
    // -------------------------------------------------------------
    saveToStorage();
    renderActiveWeather(activeCity);

    // If user has an active filter typed, re-apply it; otherwise show all
    if (filterInput.value.trim() !== "") {
      handleFilter(filterInput.value);
    } else {
      renderSavedCities(savedCities);
    }

    // Clear the search input and show success notification
    cityInput.value = "";
    showStatus(`Weather updated for ${resolvedName}, ${countryName}!`, "success");
  } catch (error) {
    console.error("fetchCityWeather error:", error);
    showStatus(error.message || "An unexpected error occurred while fetching weather.", "error");
  } finally {
    // Reset UI states regardless of success or failure
    searchBtn.classList.remove("loading");
    searchBtn.disabled = false;
    cityInput.disabled = false;
    cityInput.focus();
  }
}

// ============================================================================
// 7. DOM RENDERING MODULES
// ============================================================================

/**
 * Updates the main hero card in the DOM with the active city's weather data.
 * Safe DOM text injection is used to prevent any XSS issues.
 * @param {object} city - City data object
 */
function renderActiveWeather(city) {
  if (!city) {
    activeWeatherCard.innerHTML = `
      <div class="empty-placeholder">
        <span class="placeholder-icon">🌍</span>
        <p>Search for a city above to see live weather metrics.</p>
      </div>
    `;
    return;
  }

  // Create markup structure
  activeWeatherCard.innerHTML = `
    <div class="hero-weather-content">
      <div class="hero-header">
        <div class="hero-location">
          <h3 id="active-city-name"></h3>
          <p id="active-city-country" class="hero-country"></p>
        </div>
        <div class="hero-badge">
          <span class="hero-condition-icon">${city.conditionIcon || "🌡️"}</span>
          <span id="active-city-condition"></span>
        </div>
      </div>

      <div class="hero-main-stats">
        <div class="hero-temp">
          <span id="active-city-temp"></span><span class="hero-temp-unit">°C</span>
        </div>
      </div>

      <div class="hero-details-grid">
        <div class="detail-item">
          <span class="detail-label">Humidity</span>
          <span id="active-city-humidity" class="detail-value"></span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Condition</span>
          <span id="active-city-cond-desc" class="detail-value"></span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Last Updated</span>
          <span id="active-city-updated" class="detail-value"></span>
        </div>
      </div>
    </div>
  `;

  // Safely inject text values using .textContent
  document.getElementById("active-city-name").textContent = city.name;
  document.getElementById("active-city-country").textContent = city.country;
  document.getElementById("active-city-condition").textContent = city.condition;
  document.getElementById("active-city-cond-desc").textContent = city.condition;
  document.getElementById("active-city-temp").textContent = city.temp;
  document.getElementById("active-city-humidity").textContent = `${city.humidity}%`;
  document.getElementById("active-city-updated").textContent = city.lastUpdated;
}

/**
 * Clears the saved cities container and renders cards using `.forEach()`.
 * Demonstrates programmatic DOM creation and safe text population.
 * @param {Array<object>} list - List of city objects to render
 */
function renderSavedCities(list) {
  // Update the saved count badge
  savedCountBadge.textContent = savedCities.length;

  // Clear existing items in the container
  savedCitiesList.innerHTML = "";

  // 1. If no cities are saved at all
  if (savedCities.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-saved-state";
    emptyState.innerHTML = `
      <span style="font-size: 2rem;">📌</span>
      <p><strong>No saved cities yet.</strong></p>
      <p>Search for any city above to automatically monitor and save it here.</p>
    `;
    savedCitiesList.appendChild(emptyState);
    return;
  }

  // 2. If a search filter is applied and no matching cities were found
  if (list.length === 0) {
    const noResults = document.createElement("div");
    noResults.className = "empty-saved-state";
    noResults.innerHTML = `
      <span style="font-size: 2rem;">🔍</span>
      <p><strong>No matches found.</strong></p>
      <p>No saved cities match the filter query.</p>
    `;
    savedCitiesList.appendChild(noResults);
    return;
  }

  // 3. Render each city card using Array.prototype.forEach
  list.forEach((city) => {
    const card = document.createElement("article");
    card.className = "city-card";
    card.setAttribute("data-id", city.id);

    // Build the card shell
    card.innerHTML = `
      <div class="city-card-header">
        <div>
          <h4 class="city-card-name"></h4>
          <span class="city-card-country"></span>
        </div>
        <div class="city-card-temp">${city.temp}°C</div>
      </div>

      <div class="city-card-stats">
        <span>Condition: <strong>${city.conditionIcon || "🌡️"} <span class="card-condition-text"></span></strong></span>
        <span>Humidity: <strong>${city.humidity}%</strong></span>
        <span>Updated: <strong><span class="card-updated-text"></span></strong></span>
      </div>

      <div class="city-card-actions">
        <button
          type="button"
          class="btn btn-card-view"
          data-action="view"
          data-id="${city.id}"
          title="View full weather in hero card"
        >
          👁️ View
        </button>
        <button
          type="button"
          class="btn btn-card-delete"
          data-action="delete"
          data-id="${city.id}"
          title="Delete from saved list"
        >
          🗑️ Delete
        </button>
      </div>
    `;

    // Safely assign text content
    card.querySelector(".city-card-name").textContent = city.name;
    card.querySelector(".city-card-country").textContent = city.country;
    card.querySelector(".card-condition-text").textContent = city.condition;
    card.querySelector(".card-updated-text").textContent = city.lastUpdated;

    savedCitiesList.appendChild(card);
  });
}

// ============================================================================
// 8. CRUD & FILTER OPERATIONS
// ============================================================================

/**
 * Filters the displayed list in real time using Array.prototype.filter().
 * Does NOT mutate the master `savedCities` array.
 * @param {string} query - Text query from filter input
 */
function handleFilter(query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery === "") {
    renderSavedCities(savedCities);
    return;
  }

  const filtered = savedCities.filter((city) => {
    const nameMatch = city.name.toLowerCase().includes(normalizedQuery);
    const countryMatch = city.country.toLowerCase().includes(normalizedQuery);
    const conditionMatch = city.condition.toLowerCase().includes(normalizedQuery);
    return nameMatch || countryMatch || conditionMatch;
  });

  renderSavedCities(filtered);
}

/**
 * Removes a city from state by its ID using Array.prototype.filter().
 * Syncs the change to LocalStorage and re-renders the list.
 * @param {number} id - Unique numeric ID of the city to delete
 */
function deleteCity(id) {
  const cityToDelete = savedCities.find((c) => c.id === id);
  const cityName = cityToDelete ? cityToDelete.name : "City";

  // Filter out the selected city (immutable removal)
  savedCities = savedCities.filter((city) => city.id !== id);

  // Sync state to LocalStorage
  saveToStorage();

  // If the deleted city is currently active, switch to the first remaining city or clear
  if (activeCity && activeCity.id === id) {
    activeCity = savedCities.length > 0 ? savedCities[0] : null;
    renderActiveWeather(activeCity);
  }

  // Re-render considering current filter text
  if (filterInput.value.trim() !== "") {
    handleFilter(filterInput.value);
  } else {
    renderSavedCities(savedCities);
  }

  showStatus(`Removed ${cityName} from saved cities.`, "info", 3000);
}

/**
 * Sets a saved city as active and displays it in the hero weather card.
 * @param {number} id - Unique numeric ID of the city to view
 */
function viewCity(id) {
  const targetCity = savedCities.find((c) => c.id === id);
  if (!targetCity) return;

  activeCity = targetCity;
  renderActiveWeather(activeCity);

  // Smoothly scroll up to the hero card if on mobile
  activeWeatherCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  showStatus(`Displaying weather for ${targetCity.name}.`, "info", 2000);
}

// ============================================================================
// 9. EVENT LISTENERS & INITIALIZATION
// ============================================================================

/**
 * Handle Search Form Submit
 */
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = cityInput.value.trim();
  if (query) {
    fetchCityWeather(query);
  } else {
    showStatus("Please enter a city name to search.", "error");
    cityInput.focus();
  }
});

/**
 * Handle Filter Input in Real-Time
 */
filterInput.addEventListener("input", (e) => {
  handleFilter(e.target.value);
});

/**
 * Event Delegation for Saved Cities List
 * Uses a single event listener on the parent container (#saved-cities-list)
 * and determines whether "View" or "Delete" was clicked using data attributes.
 */
savedCitiesList.addEventListener("click", (e) => {
  const targetBtn = e.target.closest("button[data-action]");
  if (!targetBtn) return;

  const action = targetBtn.dataset.action;
  const id = Number(targetBtn.dataset.id);

  if (action === "view") {
    viewCity(id);
  } else if (action === "delete") {
    deleteCity(id);
  }
});

/**
 * Application Entry Point (Runs on Page Load)
 */
function init() {
  // 1. Load data from LocalStorage
  loadFromStorage();

  // 2. Render initial saved cities list
  renderSavedCities(savedCities);

  // 3. If cities exist in history, display the most recent one in the hero card
  if (savedCities.length > 0) {
    activeCity = savedCities[0];
    renderActiveWeather(activeCity);
  } else {
    renderActiveWeather(null);
  }
}

// Kick off initialization once DOM is ready
document.addEventListener("DOMContentLoaded", init);
