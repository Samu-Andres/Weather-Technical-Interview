import { API_KEY } from './config.js';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const ONECALL_URL = 'https://api.openweathermap.org/data/3.0/onecall';
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

const WEATHER_THEMES = {
  Clear: { start: '#f7b955', end: '#2b3a67' },
  Clouds: { start: '#8b98b8', end: '#2c3350' },
  Rain: { start: '#4f6d8f', end: '#1b2740' },
  Drizzle: { start: '#5b7fa6', end: '#20304a' },
  Thunderstorm: { start: '#4a4266', end: '#151022' },
  Snow: { start: '#cfe3f0', end: '#5b7692' },
  Mist: { start: '#a9b4bf', end: '#454f5c' },
  Fog: { start: '#a9b4bf', end: '#454f5c' },
  Haze: { start: '#b7ab8c', end: '#4c463a' },
  Smoke: { start: '#9b9086', end: '#3a352e' },
  Dust: { start: '#c9a876', end: '#5c4a2e' },
  Sand: { start: '#d9b579', end: '#5c4a2e' },
  Ash: { start: '#8c8c8c', end: '#333333' },
  Squall: { start: '#6c7a91', end: '#232c3d' },
  Tornado: { start: '#6c7a91', end: '#232c3d' }
};
const DEFAULT_THEME = { start: '#7c6bf0', end: '#2a2265' };

const inputBox = document.querySelector('.input-box');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const weatherImg = document.getElementById('weatherImg');
const temperatureEl = document.getElementById('temperature');
const unitLabelEl = document.getElementById('unitLabel');
const descriptionEl = document.getElementById('description');
const feelsLikeEl = document.getElementById('feelsLike');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const visibilityEl = document.getElementById('visibility');
const pressureEl = document.getElementById('pressure');
const uviDetail = document.getElementById('uviDetail');
const uvIndexEl = document.getElementById('uvIndex');
const dewPointDetail = document.getElementById('dewPointDetail');
const dewPointEl = document.getElementById('dewPoint');
const placeNameEl = document.getElementById('placeName');
const unitToggleEl = document.getElementById('unitToggle');
const historyEl = document.getElementById('history');
const forecastEl = document.getElementById('forecast');
const mapCard = document.getElementById('mapCard');
const mapFrame = document.getElementById('mapFrame');

const dayModalOverlay = document.getElementById('dayModalOverlay');
const dayModalClose = document.getElementById('dayModalClose');
const dayModalTitle = document.getElementById('dayModalTitle');
const dayModalIcon = document.getElementById('dayModalIcon');
const dayModalTemp = document.getElementById('dayModalTemp');
const dayModalMinMax = document.getElementById('dayModalMinMax');
const dayModalDesc = document.getElementById('dayModalDesc');
const dayModalStats = document.getElementById('dayModalStats');
const dayModalChart = document.getElementById('dayModalChart');
const dayModalHourly = document.getElementById('dayModalHourly');

const locationNotFound = document.querySelector('.location-not-found');
const weatherBody = document.getElementById('weatherBody');
const loadingState = document.getElementById('loadingState');
const errorBanner = document.getElementById('errorBanner');

let currentUnit = localStorage.getItem(UNIT_KEY) === 'F' ? 'F' : 'C';
let lastMain = null;
let lastDewPointKelvin = null;
let lastForecastDays = [];
let openDayIndex = null;
let todayEntry = null;

function setLoading(isLoading) {
  loadingState.classList.toggle('is-visible', isLoading);
  if (isLoading) {
    locationNotFound.style.display = 'none';
    weatherBody.style.display = 'none';
  }
}

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.classList.add('is-visible');
}

function clearError() {
  errorBanner.classList.remove('is-visible');
  errorBanner.textContent = '';
}

function messageForStatus(status) {
  if (status === 401) return 'La API key no es válida o no está autorizada.';
  if (status === 429) return 'Se alcanzó el límite de solicitudes. Probá de nuevo en un momento.';
  if (status >= 500) return 'El servicio del clima no está disponible ahora mismo. Probá más tarde.';
  return 'No se pudo obtener el clima. Intentá de nuevo.';
}

function kelvinToUnit(kelvin, unit) {
  const celsius = kelvin - 273.15;
  return unit === 'F' ? (celsius * 9) / 5 + 32 : celsius;
}

function applyWeatherTheme(main) {
  const theme = WEATHER_THEMES[main] || DEFAULT_THEME;
  document.body.style.setProperty('--bg-grad-start', theme.start);
  document.body.style.setProperty('--bg-grad-end', theme.end);
}

function updateTemperatureDisplay() {
  if (!lastMain) return;
  temperatureEl.textContent = Math.round(kelvinToUnit(lastMain.temp, currentUnit));
  unitLabelEl.textContent = `°${currentUnit}`;
  feelsLikeEl.textContent = `Sensación térmica ${Math.round(kelvinToUnit(lastMain.feels_like, currentUnit))}°${currentUnit}`;

  if (lastDewPointKelvin !== null) {
    dewPointEl.textContent = `${Math.round(kelvinToUnit(lastDewPointKelvin, currentUnit))}°${currentUnit}`;
  }
}

function buildHourlyChartSVG(entries, unit) {
  if (!entries.length) return '';

  const width = 320;
  const height = 100;
  const padding = 14;
  const temps = entries.map((entry) => kelvinToUnit(entry.main.temp, unit));
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = max - min || 1;
  const stepX = entries.length > 1 ? (width - padding * 2) / (entries.length - 1) : 0;

  const points = temps.map((temp, index) => {
    const x = padding + index * stepX;
    const y = height - padding - ((temp - min) / range) * (height - padding * 2);
    return [x, y];
  });

  const linePoints = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPoints = `${padding.toFixed(1)},${(height - padding).toFixed(1)} ${linePoints} ${(width - padding).toFixed(1)},${(height - padding).toFixed(1)}`;
  const dots = points.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" class="chart-dot" />`).join('');

  return `<svg viewBox="0 0 ${width} ${height}" class="hourly-chart-svg" preserveAspectRatio="none" role="img" aria-label="Temperatura por hora">
    <polygon points="${areaPoints}" class="chart-area"></polygon>
    <polyline points="${linePoints}" class="chart-line"></polyline>
    ${dots}
  </svg>`;
}

function renderForecastDisplay() {
  forecastEl.innerHTML = '';

  if (todayEntry) {
    const todayCard = document.createElement('div');
    todayCard.className = 'forecast-day is-today';

    const label = document.createElement('span');
    label.className = 'day-label';
    label.textContent = 'Hoy';

    const icon = document.createElement('img');
    icon.src = WEATHER_IMAGES[todayEntry.weather[0].main] || './assets/cloud.png';
    icon.alt = todayEntry.weather[0].main;

    const temp = document.createElement('span');
    temp.className = 'day-temp';
    temp.textContent = `${Math.round(kelvinToUnit(todayEntry.main.temp, currentUnit))}°`;

    todayCard.append(label, icon, temp);
    forecastEl.appendChild(todayCard);
  }

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

  dayModalChart.innerHTML = buildHourlyChartSVG(day.entries, currentUnit);

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
  if (!card || card.classList.contains('is-today')) return;
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
    if (!response.ok || String(data.cod) !== '200') {
      lastForecastDays = [];
      todayEntry = null;
      renderForecastDisplay();
      return;
    }
    todayEntry = data.list[0] || null;
    lastForecastDays = groupForecastByDay(data.list);
    renderForecastDisplay();
  } catch (error) {
    lastForecastDays = [];
    todayEntry = null;
    renderForecastDisplay();
    console.error(error);
  }
}

function getMapEmbedUrl(lat, lon) {
  const delta = 0.06;
  const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
}

function renderMap(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    mapCard.hidden = true;
    return;
  }
  mapFrame.src = getMapEmbedUrl(lat, lon);
  mapCard.hidden = false;
}

async function fetchExtraStats(lat, lon) {
  uviDetail.hidden = true;
  dewPointDetail.hidden = true;
  lastDewPointKelvin = null;

  try {
    const response = await fetch(`${ONECALL_URL}?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}&lang=es`);
    if (!response.ok) return;
    const data = await response.json();

    if (typeof data.current?.uvi === 'number') {
      uvIndexEl.textContent = data.current.uvi.toFixed(1);
      uviDetail.hidden = false;
    }

    if (typeof data.current?.dew_point === 'number') {
      lastDewPointKelvin = data.current.dew_point;
      dewPointEl.textContent = `${Math.round(kelvinToUnit(lastDewPointKelvin, currentUnit))}°${currentUnit}`;
      dewPointDetail.hidden = false;
    }
  } catch (error) {
    // El Índice UV y el punto de rocío son datos adicionales (One Call API).
    // Si la key no tiene esa suscripción o falla la request, simplemente se ocultan.
    console.error('No se pudieron obtener UV/punto de rocío:', error);
  }
}

function renderCurrentWeather(data) {
  locationNotFound.style.display = 'none';
  weatherBody.style.display = 'flex';

  applyWeatherTheme(data.weather[0].main);

  placeNameEl.textContent = `${data.name}${data.sys?.country ? `, ${data.sys.country}` : ''}`;
  lastMain = data.main;
  updateTemperatureDisplay();

  descriptionEl.textContent = data.weather[0].description;
  humidityEl.textContent = `${data.main.humidity}%`;
  windSpeedEl.textContent = `${(data.wind.speed * 3.6).toFixed(1)}Km/H`;
  visibilityEl.textContent = typeof data.visibility === 'number' ? `${(data.visibility / 1000).toFixed(1)}km` : '-';
  pressureEl.textContent = `${data.main.pressure}hPa`;

  updateWeatherImage(data.weather[0].main);

  if (data.coord) {
    renderMap(data.coord.lat, data.coord.lon);
    fetchExtraStats(data.coord.lat, data.coord.lon);
  } else {
    mapCard.hidden = true;
  }
}

async function checkWeather(city) {
  clearError();
  setLoading(true);
  try {
    const response = await fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&lang=es&appid=${API_KEY}`);
    const data = await response.json();

    if (!response.ok) {
      setLoading(false);
      if (response.status === 404) {
        locationNotFound.style.display = 'flex';
        weatherBody.style.display = 'none';
        return;
      }
      showError(messageForStatus(response.status));
      return;
    }

    setLoading(false);
    renderCurrentWeather(data);
    addToHistory(data.name);
    fetchForecast(`q=${encodeURIComponent(city)}`);
  } catch (error) {
    setLoading(false);
    showError('No se pudo conectar con el servicio del clima. Revisá tu conexión.');
    console.error(error);
  }
}

async function checkWeatherByCoords(lat, lon) {
  clearError();
  setLoading(true);
  try {
    const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&lang=es&appid=${API_KEY}`);
    const data = await response.json();

    if (!response.ok) {
      setLoading(false);
      if (response.status === 404) {
        locationNotFound.style.display = 'flex';
        weatherBody.style.display = 'none';
        return;
      }
      showError(messageForStatus(response.status));
      return;
    }

    setLoading(false);
    renderCurrentWeather(data);
    inputBox.value = data.name;
    addToHistory(data.name);
    fetchForecast(`lat=${lat}&lon=${lon}`);
  } catch (error) {
    setLoading(false);
    showError('No se pudo conectar con el servicio del clima. Revisá tu conexión.');
    console.error(error);
  }
}

function triggerSearch() {
  const city = inputBox.value.trim();
  if (city === '') {
    showError('Por favor ingresá una ubicación.');
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

function attemptGeolocation({ silent = false } = {}) {
  if (!navigator.geolocation) {
    if (!silent) showError('Tu navegador no soporta geolocalización.');
    return;
  }
  if (!silent) clearError();
  setLoading(true);
  navigator.geolocation.getCurrentPosition(
    (position) => {
      checkWeatherByCoords(position.coords.latitude, position.coords.longitude);
    },
    () => {
      setLoading(false);
      // En el intento automático al cargar la app no mostramos error: si el
      // usuario todavía no decidió o rechazó el permiso, que busque a mano.
      if (!silent) {
        showError('No se pudo obtener tu ubicación. Revisá los permisos del navegador.');
      }
    }
  );
}

locationBtn.addEventListener('click', () => {
  attemptGeolocation();
});

renderHistory();
[...unitToggleEl.querySelectorAll('.unit-btn')].forEach((btn) => {
  btn.classList.toggle('is-active', btn.dataset.unit === currentUnit);
});
unitLabelEl.textContent = `°${currentUnit}`;

// Apenas abre la app, intenta mostrar el clima de la ubicación actual.
// Si el usuario no otorgó el permiso (o el navegador lo rechaza), no
// molesta con un error: simplemente queda la pantalla inicial para
// buscar una ciudad a mano.
attemptGeolocation({ silent: true });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => console.error('SW registration failed', error));
  });
}
