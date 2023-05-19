function getWeather() {
    var city = document.getElementById('cityInput').value;
    /*var apiKey = '514f2f606e3bd56b7ab9bd449e843c5d'; */

  
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=514f2f606e3bd56b7ab9bd449e843c5d`)
      .then(function(response) {
        return response.json();
      })
      .then(function (data) {
        showWeather(data);
        saveLastLocation(city, data);
      })
      .catch(function(error) {
        console.log(error);
      });
}

function showWeather(data) {
    var weatherInfo = document.getElementById('weatherInfo');
    weatherInfo.innerHTML = ' ';

    var cityName = document.createElement('h2');
    cityName.textContent = data.name;
    weatherInfo.appendChild(cityName);

    var temperature = document.createElement('p');
    temperature.textContent = 'Temperature: ' + (data.main.temp - 273.15).toFixed(2) + '°C';
    weatherInfo.appendChild(temperature);

    var maxTemperature = document.createElement('p');
    maxTemperature.textContent = 'Max Temperature: ' + (data.main.temp_max - 273.15).toFixed(2) + '°C';
    weatherInfo.appendChild(maxTemperature);

    var minTemperature = document.createElement('p');
    minTemperature.textContent = 'Min Temperature: ' + (data.main.temp_min - 273.15).toFixed(2) + '°C';
    weatherInfo.appendChild(minTemperature);

    var humidity = document.createElement('p');
    humidity.textContent = 'Humidity: ' + data.main.humidity + '%';
    weatherInfo.appendChild(humidity);

    var description = document.createElement('p');
    description.textContent = 'Description: ' + data.weather[0].description;
    weatherInfo.appendChild(description);

    var icon = document.createElement('img');
    icon.src = 'http://openweathermap.org/img/w/' + data.weather[0].icon + '.png';
    weatherInfo.appendChild(icon);

    var wind = document.createElement('p');
    wind.textContent = 'Wind: ' + data.wind.speed + 'km/h';
    weatherInfo.appendChild(wind);

    var thermalSensation = document.createElement('p');
    thermalSensation.textContent = 'Thermal Sensation: ' + (data.main.feels_like - 273.15).toFixed(2) + '°C';
    weatherInfo.appendChild(thermalSensation);

    var pressure = document.createElement('p');
    pressure.textContent = 'Pressure: ' + data.main.pressure + ' hPa';
}

function saveLastLocation(city, data) {
  var lastLocation = {
    city: city,
    data: data
  };

  localStorage.setItem('last location', JSON.stringify(lastLocation));
}
window.onload = function() {
  var lastLocationJson = localStorage.getItem('last location');
  if (lastLocationJson) {
    var lastLocation = JSON.parse(lastLocationJson);
    document.getElementById('cityInput').value = lastLocation.city;
    showWeather(lastLocation.data);
  }
};