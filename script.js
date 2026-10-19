const searchForm = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const statusMessage = document.querySelector("#status");
const weatherPanel = document.querySelector("#weather-panel");
const searchButton = searchForm.querySelector("button");

const weatherDescriptions = {
  0: { text: "Clear sky", icon: "☀️" },
  1: { text: "Mainly clear", icon: "🌤️" },
  2: { text: "Partly cloudy", icon: "⛅" },
  3: { text: "Overcast", icon: "☁️" },
  45: { text: "Foggy", icon: "🌫️" },
  48: { text: "Rime fog", icon: "🌫️" },
  51: { text: "Light drizzle", icon: "🌦️" },
  53: { text: "Drizzle", icon: "🌦️" },
  55: { text: "Heavy drizzle", icon: "🌧️" },
  56: { text: "Freezing drizzle", icon: "🌧️" },
  57: { text: "Heavy freezing drizzle", icon: "🌧️" },
  61: { text: "Light rain", icon: "🌦️" },
  63: { text: "Rain", icon: "🌧️" },
  65: { text: "Heavy rain", icon: "🌧️" },
  66: { text: "Freezing rain", icon: "🌧️" },
  67: { text: "Heavy freezing rain", icon: "🌧️" },
  71: { text: "Light snow", icon: "🌨️" },
  73: { text: "Snow", icon: "❄️" },
  75: { text: "Heavy snow", icon: "❄️" },
  77: { text: "Snow grains", icon: "🌨️" },
  80: { text: "Light rain showers", icon: "🌦️" },
  81: { text: "Rain showers", icon: "🌧️" },
  82: { text: "Heavy rain showers", icon: "⛈️" },
  85: { text: "Snow showers", icon: "🌨️" },
  86: { text: "Heavy snow showers", icon: "❄️" },
  95: { text: "Thunderstorm", icon: "⛈️" },
  96: { text: "Thunderstorm with hail", icon: "⛈️" },
  99: { text: "Heavy thunderstorm with hail", icon: "⛈️" }
};

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();
  if (!city) return;

  setLoading(true);
  showStatus(`Looking up the weather for ${city}…`);
  weatherPanel.hidden = true;

  try {
    const place = await findCity(city);
    const forecast = await getForecast(place.latitude, place.longitude);

    showCurrentWeather(place, forecast);
    showForecast(forecast);
    showStatus("");
    weatherPanel.hidden = false;
  } catch (error) {
    showStatus(error.message, true);
  } finally {
    setLoading(false);
  }
});

async function findCity(city) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({
    name: city,
    count: "1",
    language: "en",
    format: "json"
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not search for that city. Please try again.");
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("City not found. Check the spelling and try again.");
  }

  return data.results[0];
}

async function getForecast(latitude, longitude) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: "5"
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not load the forecast. Please try again.");
  }

  return response.json();
}

function showCurrentWeather(place, forecast) {
  const current = forecast.current;
  const condition = getWeatherDescription(current.weather_code);
  const locationParts = [place.name, place.admin1, place.country].filter(Boolean);

  document.querySelector("#location-name").textContent = locationParts.join(", ");
  document.querySelector("#current-description").textContent = condition.text;
  document.querySelector("#current-details").textContent =
    `Feels like ${Math.round(current.apparent_temperature)}°C · ` +
    `Humidity ${current.relative_humidity_2m}% · ` +
    `Wind ${Math.round(current.wind_speed_10m)} km/h`;

  document.querySelector("#weather-icon").textContent = condition.icon;
  document.querySelector("#current-temp").textContent =
    Math.round(current.temperature_2m);
}

function showForecast(forecast) {
  const forecastList = document.querySelector("#forecast-list");
  forecastList.replaceChildren();

  forecast.daily.time.forEach((date, index) => {
    const condition = getWeatherDescription(forecast.daily.weather_code[index]);
    const dayCard = document.createElement("article");
    dayCard.className = "forecast-day";

    const dayName = document.createElement("p");
    dayName.className = "forecast-name";
    dayName.textContent = formatDay(date);

    const icon = document.createElement("p");
    icon.className = "forecast-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = condition.icon;

    const temperature = document.createElement("p");
    temperature.className = "forecast-temperature";
    temperature.textContent =
      `${Math.round(forecast.daily.temperature_2m_max[index])}° / ` +
      `${Math.round(forecast.daily.temperature_2m_min[index])}°`;

    dayCard.append(dayName, icon, temperature);
    forecastList.append(dayCard);
  });
}

function getWeatherDescription(code) {
  return weatherDescriptions[code] || {
    text: "Weather conditions",
    icon: "🌡️"
  };
}

function formatDay(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  searchButton.textContent = isLoading ? "Searching…" : "Search";
}