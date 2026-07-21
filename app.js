import { API_KEY } from './config.js';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const HISTORY_KEY = 'weather_history';
const UNIT_KEY = 'weather_unit';
const MAX_HISTORY = 5;

const WEATHER_IMAGES = {
  Clear: './assets/clear.png',
  Clouds: './assets/cloud.png',
  Rain: './assets/rain.png',
  Drizzle: './assets/rain.png',
  Thunderstorm: './assets/rain.png',
  Snow: './assets/snow.png',
  Mist: './assets/mist.png',
  Fog: './assets/mist.png',
  Haze: './assets/mist.png',
  Smoke: './assets/mist.png',
  Dust: './assets/mist.png',
  Sand: './assets/mist.png',
  Ash: './assets/mist.png',
  Squall: './assets/cloud.png',
  Tornado: './assets/cloud.png'
};

const inputBox = document.querySelector('.input-box');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const weatherImg = document.getElementById('weatherImg');
const temperatureEl = document.getElementById('temperature');
const unitLabelEl = document.getElementById('unitLabel');
const descriptionEl = document.getElementById('description');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const placeNameEl = document.getElementById('placeName');
const unitToggleEl = document.getElementById('unitToggle');
const historyEl = document.getElementById('history');
const forecastEl = document.getElementById('forecast');

const dayModalOverlay = document.getElementById('dayModalOverlay');
const dayModalClose = document.getElementById('dayModalClose');
const dayModalTitle = document.getElementById('dayModalTitle');
const dayModalIcon = document.getElementById('dayModalIcon');
const dayModalTemp = document.getElementById('dayModalTemp');
const dayModalMinMax = document.getElementById('dayModalMinMax');
const dayModalDesc = document.getElementById('dayModalDesc');
const dayModalStats = document.getElementById('dayModalStats');
const dayModalHourly = document.getElementById('dayModalHourly');

const locationNotFound = document.querySelector('.location-not-found');
const weatherBody = document.querySelector('.weather-body');

let currentUnit = localStorage.getItem(UNIT_KEY) === 'F' ? 'F' : 'C';
let lastMain = null;
let lastForecastDays = [];
let openDayIndex = null;

function kelvinToUnit(kelvin, unit) {
  const celsius = kelvin - 273.15;
  return unit === 'F' ? (celsius * 9) / 5 + 32 : celsius;
}

function updateTemperatureDisplay() {
  if (!lastMain) return;
  temperatureEl.textContent = Math.round(kelvinToUnit(lastMain.temp, currentUnit));
  unitLabelEl.textContent = `°${currentUnit}`;
}

function renderForecastDisplay() {
  forecastEl.innerHTML = '';
  lastForecastDays.forEach((day, index) => {
    const card = document.createElement('div');
    card.className = 'forecast-day';
    card.dataset.index = String(index);

    const label = document.createElement('span');
    label.className = 'day-label';
    label.textContent = new Intl.DateTimeFormat('es', { weekday: 'short' }).format(day.date);

    const icon = document.createElement('img');
    icon.src = WEATHER_IMAGES[day.representative.weather[0].main] || './assets/cloud.png';
    icon.alt = day.representative.weather[0].main;

    const temp = document.createElement('span');
    temp.className = 'day-temp';
    temp.textContent = `${Math.round(kelvinToUnit(day.representative.main.temp, currentUnit))}°`;

    card.append(label, icon, temp);
    forecastEl.appendChild(card);
  });

  if (openDayIndex !== null && lastForecastDays[openDayIndex]) {
    renderDayModal(lastForecastDays[openDayIndex]);
  }
}

function renderDayModal(day) {
  dayModalTitle.textContent = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(day.date);

  const weatherMain = day.representative.weather[0].main;
  dayModalIcon.src = WEATHER_IMAGES[weatherMain] || './assets/cloud.png';
  dayModalIcon.alt = weatherMain;
  dayModalDesc.textContent = day.representative.weather[0].description;

  dayModalTemp.textContent = `${Math.round(kelvinToUnit(day.representative.main.temp, currentUnit))}°${currentUnit}`;
  dayModalMinMax.textContent = `Máx ${Math.round(kelvinToUnit(day.maxTemp, currentUnit))}° / Mín ${Math.round(kelvinToUnit(day.minTemp, currentUnit))}°`;

  dayModalStats.innerHTML = '';
  const stats = [
    { label: 'Sensación térmica', value: `${Math.round(kelvinToUnit(day.representative.main.feels_like, currentUnit))}°${currentUnit}` },
    { label: 'Humedad', value: `${day.representative.main.humidity}%` },
    { label: 'Viento', value: `${(day.representative.wind.speed * 3.6).toFixed(1)}Km/H` },
    { label: 'Presión', value: `${day.representative.main.pressure}hPa` }
  ];
  stats.forEach((stat) => {
    const el = document.createElement('div');
    el.className = 'modal-stat';
    el.innerHTML = `<span class="stat-label">${stat.label}</span><span class="stat-value">${stat.value}</span>`;
    dayModalStats.appendChild(el);
  });

  dayModalHourly.innerHTML = '';
  day.entries.forEach((entry) => {
    const hour = document.createElement('div');
    hour.className = 'modal-hour';

    const time = document.createElement('span');
    time.textContent = entry.dt_txt.split(' ')[1].slice(0, 5);

    const icon = document.createElement('img');
    icon.src = WEATHER_IMAGES[entry.weather[0].main] || './assets/cloud.png';
    icon.alt = entry.weather[0].main;

    const temp = document.createElement('span');
    temp.className = 'hour-temp';
    temp.textContent = `${Math.round(kelvinToUnit(entry.main.temp, currentUnit))}°`;

    hour.append(time, icon, temp);
    dayModalHourly.appendChild(hour);
  });
}

function openDayModal(index) {
  openDayIndex = index;
  renderDayModal(lastForecastDays[index]);
  dayModalOverlay.classList.add('is-open');
}

function closeDayModal() {
  openDayIndex = null;
  dayModalOverlay.classList.remove('is-open');
}

forecastEl.addEventListener('click', (event) => {
  const card = event.target.closest('.forecast-day');
  if (!card) return;
  openDayModal(Number(card.dataset.index));
});

dayModalClose.addEventListener('click', closeDayModal);

dayModalOverlay.addEventListener('click', (event) => {
  if (event.target === dayModalOverlay) closeDayModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && dayModalOverlay.classList.contains('is-open')) {
    closeDayModal();
  }
});

function setUnit(unit) {
  currentUnit = unit;
  localStorage.setItem(UNIT_KEY, unit);
  [...unitToggleEl.querySelectorAll('.unit-btn')].forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.unit === unit);
  });
  updateTemperatureDisplay();
  renderForecastDisplay();
}

unitToggleEl.addEventListener('click', (event) => {
  const btn = event.target.closest('.unit-btn');
  if (!btn) return;
  setUnit(btn.dataset.unit);
});

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function addToHistory(city) {
  const history = getHistory().filter((c) => c.toLowerCase() !== city.toLowerCase());
  history.unshift(city);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  renderHistory();
}

function renderHistory() {
  historyEl.innerHTML = '';
  getHistory().forEach((city) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'history-chip';
    chip.textContent = city;
    chip.addEventListener('click', () => {
      inputBox.value = city;
      checkWeather(city);
    });
    historyEl.appendChild(chip);
  });
}

function updateWeatherImage(weatherType) {
  weatherImg.src = WEATHER_IMAGES[weatherType] || './assets/cloud.png';
}

function groupForecastByDay(list) {
  const todayStr = new Date().toISOString().split('T')[0];
  const byDate = new Map();

  list.forEach((entry) => {
    const dateStr = entry.dt_txt.split(' ')[0];
    if (dateStr === todayStr) return;
    if (!byDate.has(dateStr)) byDate.set(dateStr, []);
    byDate.get(dateStr).push(entry);
  });

  return [...byDate.entries()].slice(0, 5).map(([, entries]) => {
    const representative = entries.reduce((best, entry) => {
      const time = entry.dt_txt.split(' ')[1];
      const bestTime = best.dt_txt.split(' ')[1];
      return Math.abs(time.localeCompare('12:00:00')) < Math.abs(bestTime.localeCompare('12:00:00')) ? entry : best;
    }, entries[0]);

    const temps = entries.map((entry) => entry.main.temp);

    return {
      date: new Date(representative.dt * 1000),
      representative,
      entries,
      minTemp: Math.min(...temps),
      maxTemp: Math.max(...temps)
    };
  });
}

async function fetchForecast(query) {
  closeDayModal();
  try {
    const response = await fetch(`${BASE_URL}/forecast?${query}&lang=es&appid=${API_KEY}`);
    const data = await response.json();
    if (String(data.cod) !== '200') {
      lastForecastDays = [];
      renderForecastDisplay();
      return;
    }
    lastForecastDays = groupForecastByDay(data.list);
    renderForecastDisplay();
  } catch (error) {
    lastForecastDays = [];
    renderForecastDisplay();
    console.error(error);
  }
}

function renderCurrentWeather(data) {
  locationNotFound.style.display = 'none';
  weatherBody.style.display = 'flex';

  placeNameEl.textContent = `${data.name}${data.sys?.country ? `, ${data.sys.country}` : ''}`;
  lastMain = data.main;
  updateTemperatureDisplay();

  descriptionEl.textContent = data.weather[0].description;
  humidityEl.textContent = `${data.main.humidity}%`;
  windSpeedEl.textContent = `${(data.wind.speed * 3.6).toFixed(1)}Km/H`;

  updateWeatherImage(data.weather[0].main);
}

async function checkWeather(city) {
  try {
    const response = await fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&lang=es&appid=${API_KEY}`);
    const data = await response.json();

    if (String(data.cod) === '404') {
      locationNotFound.style.display = 'flex';
      weatherBody.style.display = 'none';
      return;
    }

    renderCurrentWeather(data);
    addToHistory(data.name);
    fetchForecast(`q=${encodeURIComponent(city)}`);
  } catch (error) {
    alert('Error al obtener datos del clima');
    console.error(error);
  }
}

async function checkWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&lang=es&appid=${API_KEY}`);
    const data = await response.json();

    if (String(data.cod) === '404') {
      locationNotFound.style.display = 'flex';
      weatherBody.style.display = 'none';
      return;
    }

    renderCurrentWeather(data);
    inputBox.value = data.name;
    addToHistory(data.name);
    fetchForecast(`lat=${lat}&lon=${lon}`);
  } catch (error) {
    alert('Error al obtener datos del clima');
    console.error(error);
  }
}

function triggerSearch() {
  const city = inputBox.value.trim();
  if (city === '') {
    alert('Por favor ingresa una ubicación');
    return;
  }
  checkWeather(city);
}

searchBtn.addEventListener('click', triggerSearch);

inputBox.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    triggerSearch();
  }
});

locationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Tu navegador no soporta geolocalización');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      checkWeatherByCoords(position.coords.latitude, position.coords.longitude);
    },
    () => {
      alert('No se pudo obtener tu ubicación. Revisá los permisos del navegador.');
    }
  );
});

renderHistory();
[...unitToggleEl.querySelectorAll('.unit-btn')].forEach((btn) => {
  btn.classList.toggle('is-active', btn.dataset.unit === currentUnit);
});
unitLabelEl.textContent = `°${currentUnit}`;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => console.error('SW registration failed', error));
  });
}
