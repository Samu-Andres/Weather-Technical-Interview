import { API_KEY } from './config.js';

const inputBox = document.querySelector('.input-box');
const searchBtn = document.getElementById('searchBtn');
const weather_img = document.querySelector('.weather-img');
const temperature = document.querySelector('.temperature');
const description = document.querySelector('.description');
const humidity = document.getElementById('humidity');
const wind_speed = document.getElementById('wind-speed');

const location_not_found = document.querySelector('.location-not-found');

const weather_body = document.querySelector('.weather-body');

searchBtn.addEventListener('click', ()=>{
    const city = inputBox.value.trim();
    if(city === ''){
        alert('Por favor ingresa una ubicación');
        return;
    }
    checkWeather(city);
});

async function checkWeather(city){
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`;

        const weather_data = await fetch(`${url}`).then(response => response.json());

        if(weather_data.cod === `404`){
            location_not_found.style.display = "flex";
            weather_body.style.display = "none";
            return;
        }

        location_not_found.style.display = "none";
        weather_body.style.display = "flex";
        temperature.innerHTML = `${Math.round(weather_data.main.temp - 273.15)}°C`;
        description.innerHTML = `${weather_data.weather[0].description}`;
        humidity.innerHTML = `${weather_data.main.humidity}%`;
        wind_speed.innerHTML = `${weather_data.wind.speed}Km/H`;

        updateWeatherImage(weather_data.weather[0].main);
    } catch(error) {
        alert('Error al obtener datos del clima');
        console.error(error);
    }
}

function updateWeatherImage(weatherType) {
    const weatherImages = {
        'Clouds': './assets/cloud.png',
        'Clear': './assets/clear.png',
        'Rain': './assets/rain.png',
        'Mist': './assets/mist.png',
        'Snow': './assets/snow.png'
    };
    weather_img.src = weatherImages[weatherType] || './assets/cloud.png';
}