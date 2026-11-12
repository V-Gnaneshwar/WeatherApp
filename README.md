# Weather Monitoring Application 🌤️

An intermediate-level, vanilla JavaScript web application that fetches real-time weather data for any city worldwide using asynchronous REST API calls, manages a saved search history using browser `LocalStorage` (JSON), and supports instant local filtering and CRUD operations via DOM manipulation.

---

## 📁 Project Architecture & File Structure

```text
WeatherApp/
│
├── index.html       # Semantic UI layout (Search bar, Status banner, Active Weather card, Saved Cities grid)
├── style.css        # Clean, responsive Flexbox/Grid layout (no complex animations)
├── app.js           # Core application logic (State, LocalStorage JSON sync, API fetch, DOM updates)
└── README.md        # Project documentation and learning roadmap
```

---

## 🔄 Data & Control Flow Architecture

```text
+-------------------------------------------------------------------+
|                        USER INTERACTIONS                          |
|  [Search City Form]   [Filter Input]   [View / Delete Buttons]    |
+----------+------------------+--------------------+----------------+
           |                  |                    |
           v                  |                    |
+---------------------+       |                    |
|   API Layer         |       |                    |
|  fetch() + async/   |       |                    |
|  await + try/catch  |       |                    |
+----------+----------+       |                    |
           |                  v                    v
           |        +---------------------------------------+
           +------->|      In-Memory State (JS Array)       |
                    |   `let savedCities = [ { ... } ]`     |
                    +-------------------+-------------------+
                                        |
                       +----------------+----------------+
                       | (Sync via JSON)                 | (Render via forEach/filter)
                       v                                 v
        +-----------------------------+   +-----------------------------+
        |    Browser LocalStorage     |   |        DOM Rendering        |
        |   JSON.stringify() /        |   |   document.createElement()  |
        |   JSON.parse()              |   |   .textContent / .innerHTML |
        +-----------------------------+   +-----------------------------+
```

---

## 🗄️ JSON Data Schema (`LocalStorage`)

Instead of requiring a backend database, the application persists an array of city objects under the `LocalStorage` key `"weather_saved_cities"`:

```json
[
  {
    "id": 1731403800123,
    "name": "Hyderabad",
    "country": "India",
    "temp": 29,
    "humidity": 58,
    "condition": "Partly Cloudy",
    "conditionIcon": "⛅",
    "lastUpdated": "2:30 PM"
  }
]
```

---

## 🌐 External API Integration (Open-Meteo — No API Key Required)

To avoid API key sign-ups or rate-limit delays, this application connects to two free, high-performance endpoints provided by **Open-Meteo**:

1. **Geocoding Endpoint** (converts city name to geographic coordinates):
   ```http
   GET https://geocoding-api.open-meteo.com/v1/search?name={CITY_NAME}&count=1
   ```
2. **Weather Forecast Endpoint** (fetches live temperature, relative humidity, and weather code):
   ```http
   GET https://api.open-meteo.com/v1/forecast?latitude={LAT}&longitude={LON}&current=temperature_2m,relative_humidity_2m,weather_code
   ```

---

## ⚙️ Core Functional Modules (`app.js`)

| Module / Function | Responsibility |
| :--- | :--- |
| `loadFromStorage()` | Reads `"weather_saved_cities"` from `LocalStorage` and deserializes it with `JSON.parse()`. Includes a safe fallback array `[]`. |
| `saveToStorage()` | Serializes the `savedCities` state array using `JSON.stringify()` and saves it to `LocalStorage`. |
| `fetchCityWeather(city)` | `async` function that validates input, toggles loading state, fetches coordinates + weather inside a defensive `try...catch...finally` block, prevents duplicate entries, and updates state. |
| `renderActiveWeather(data)` | Updates the main hero card in the DOM with the selected city's live metrics. |
| `renderSavedCities(list)` | Clears the saved container and uses `.forEach()` to dynamically build and append city cards into the grid. |
| `handleFilter(query)` | Uses `.filter()` on `savedCities` to display matching cities in real time as the user types without mutating state. |
| `deleteCity(id)` | Removes a city from `savedCities` using `.filter()`, syncs `LocalStorage`, and re-renders the list. |
| `viewCity(id)` | Sets any saved city as the active city and displays it in the hero card. |
| `getWeatherCondition(code)`| Translates WMO weather codes into descriptive human text and icons. |

---

## 💡 Key Learning Concepts Covered

Building and exploring this project reinforces five essential JavaScript skills:

### 1. Asynchronous JavaScript (`async` / `await` & `fetch`)
* **Chaining dependent API calls:** Awaiting the Geocoding API to resolve `latitude` and `longitude` before calling the second `fetch()` to the Weather API.
* **Defensive error handling:** Using `try...catch...finally` to catch network failures, check `response.ok`, and throw clear errors when a user inputs a misspelled or non-existent city.
* **UI feedback:** Showing loading banners and spinner indicators before `await` resolves, and restoring UI state inside `finally` regardless of outcome.

### 2. Client-Side Persistence with `LocalStorage` & JSON
* **Serialization:** Converting JavaScript arrays/objects into text using `JSON.stringify()`.
* **Deserialization & Fallbacks:** Safely parsing stored data on startup (`JSON.parse(localStorage.getItem(...)) || []`) so the application never breaks on a clean visit.
* **Duplicate prevention:** Updating an existing city entry in state instead of creating duplicate cards when the user searches for the same city again.

### 3. Functional Array Methods (`forEach` & `filter`)
* **Dynamic list generation (`forEach`):** Iterating through the state array to construct HTML card elements programmatically.
* **Non-destructive search (`filter`):** Filtering the displayed list in real time without mutating the underlying `savedCities` master array.
* **Immutable deletion (`filter`):** Removing an item cleanly by ID (`savedCities = savedCities.filter(c => c.id !== id)`).

### 4. Structured DOM Manipulation & Event Delegation
* **Safe text injection:** Using `.textContent` instead of raw `.innerHTML` for user data to prevent Cross-Site Scripting (XSS).
* **Event Delegation:** Attaching a single `click` event listener to the parent `#saved-cities-list` container and inspecting `e.target.dataset.action` and `e.target.dataset.id` to handle "View" and "Delete" button clicks dynamically.

### 5. Single Source of Truth (State-Driven UI)
* Core frontend pattern: **User Action $\rightarrow$ Update JS Array $\rightarrow$ Sync `LocalStorage` $\rightarrow$ Re-render DOM**. Keeping in-memory state and `LocalStorage` synchronized prevents UI bugs.

---

## 🚀 How to Run the Project Locally

No build tools, bundlers, or Node.js installations are required!

1. **Option 1: Direct File Opening**
   - Double-click `index.html` in your file explorer to open it directly in any modern web browser (Chrome, Edge, Firefox, Safari).
2. **Option 2: Using VS Code Live Server**
   - Open this folder in VS Code.
   - Right-click `index.html` and click **"Open with Live Server"**.
3. **Option 3: Using a Simple Local Server (Python or Node)**
   - PowerShell / Terminal:
     ```bash
     # With Python 3:
     python -m http.server 8000
     # Then visit http://localhost:8000 in your browser
     ```

---

## 🧪 Testing Checklist

Try performing these actions to test every feature:
1. **Search a valid city:** Enter `"Tokyo"` or `"London"` and click Search. Confirm the active hero card displays live temperature and metrics, and the city is added to the "Saved Cities" list.
2. **Search a duplicate:** Search `"London"` again. Confirm it updates the existing card instead of duplicating it.
3. **Search an invalid city:** Enter `"zzzyyyxxx123"`. Confirm the error banner displays: *"City could not be found. Please check spelling."*
4. **Real-time Filter:** In the filter box, type `"tok"`. Confirm only matching cards remain visible. Clear the box to restore all cards.
5. **View City:** Click **"👁️ View"** on any card in the saved list. Confirm that city is promoted into the hero card.
6. **Delete City:** Click **"🗑️ Delete"** on a card. Confirm it is removed from the grid and badge counter updates.
7. **Persistence:** Refresh the browser page (`F5`). Confirm all your saved cities and the last active city remain intact from `LocalStorage`.
