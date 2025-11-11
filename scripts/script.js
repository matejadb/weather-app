const global = {
	units: {
		temperature: 'celsius',
		windSpeed: 'km/h',
		precipitation: 'millimeters',
	},
};

const dropdownTemperature = document.querySelector('.temperature');
const dropdownWindSpeed = document.querySelector('.wind-speed');
const dropdownPrecipitation = document.querySelector('.precipitation');
const dropdownBtn = document.querySelector('.btn-dropdown');
const dropdownContent = document.querySelector('.units-dropdown-content');
const searchForm = document.querySelector('.search-form');

const temperatureText = document.querySelector('.temperature-text');
const temperatureIcon = document.querySelector('.temperature-icon');
const locationText = document.querySelector('.location-text');
const dateText = document.querySelector('.date-text');

const feelsLike = document.querySelector('.detail-feels-like');
const humidity = document.querySelector('.detail-humidity');
const wind = document.querySelector('.detail-wind');
const precipitation = document.querySelector('.detail-precipitation');

function changeTemperatureUnits(e) {
	if (e.target.classList.contains('units-dropdown-item')) {
		dropdownTemperature.querySelectorAll('a').forEach((unit) => {
			unit.classList.remove('checked');
			unit.children[1].classList.add('hidden');
		});
		e.target.classList.add('checked');
		e.target.children[1].classList.remove('hidden');
		global.units.temperature = e.target.textContent
			.trim()
			.split(' ')[0]
			.toLowerCase();
	}
}

function changeWindSpeedUnits(e) {
	if (e.target.classList.contains('units-dropdown-item')) {
		dropdownWindSpeed.querySelectorAll('a').forEach((unit) => {
			unit.classList.remove('checked');
			unit.children[1].classList.add('hidden');
		});

		e.target.classList.add('checked');
		e.target.children[1].classList.remove('hidden');
		global.units.windSpeed = e.target.textContent
			.trim()
			.split(' ')[0]
			.toLowerCase();
	}
}

function changePrecipitationUnits(e) {
	if (e.target.classList.contains('units-dropdown-item')) {
		dropdownPrecipitation.querySelectorAll('a').forEach((unit) => {
			unit.classList.remove('checked');
			unit.children[1].classList.add('hidden');
		});

		e.target.classList.add('checked');
		e.target.children[1].classList.remove('hidden');
		global.units.precipitation = e.target.textContent
			.trim()
			.split(' ')[0]
			.toLowerCase();
	}
}

function openUnitsDropdown(e) {
	e.stopPropagation();
	dropdownContent.classList.toggle('show');
}

function closeUnitsDropdown(e) {
	if (!dropdownContent.contains(e.target) && e.target !== dropdownBtn) {
		dropdownContent.classList.remove('show');
	}
}

async function getWeatherInformation(e) {
	e.preventDefault();
	const input = document.querySelector('input').value;

	const weatherData = await getWeatherByCity(input);
	const cityData = await getCityInfo(input);

	temperatureText.textContent = `${Math.round(
		weatherData.current.temperature_2m
	)} \u00B0`;
	temperatureIcon.src = setWeatherIcon(weatherData.current.weather_code);
	locationText.textContent = `${cityData.name}, ${cityData.country}`;

	const today = new Date();

	const options = {
		weekday: 'long',
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	};

	dateText.textContent = today.toLocaleDateString('en-US', options);

	feelsLike.textContent = `${Math.round(
		weatherData.current.apparent_temperature
	)} \u00B0`;
	humidity.textContent = `${weatherData.current.relative_humidity_2m}%`;
	wind.textContent = `${Math.round(weatherData.current.wind_speed_10m)} km/h`;
	precipitation.textContent = `${weatherData.current.precipitation} mm`;
	// console.log(weatherData);
	// console.log(cityData);
}

function setWeatherIcon(code) {
	switch (code) {
		case 0:
		case 1:
			return './assets/images/icon-sunny.webp';
		case 2:
			return './assets/images/icon-partly-cloudy.webp';
		case 3:
			return './assets/images/icon-overcast.webp';
		case 45:
		case 48:
			return './assets/images/icon-fog.webp';
		case 51:
		case 53:
		case 55:
		case 56:
		case 57:
			return './assets/images/icon-drizzle.webp';
		case 61:
		case 63:
		case 65:
		case 66:
		case 67:
		case 80:
		case 81:
		case 82:
			return './assets/images/icon-rain.webp';
		case 71:
		case 73:
		case 75:
		case 77:
		case 85:
		case 86:
			return './assets/images/icon-snow.webp';
		case 95:
		case 96:
		case 99:
			return './assets/images/icon-storm.webp';
		default:
			return './assets/images/icon-sunny.webp';
	}
}

dropdownTemperature.addEventListener('click', changeTemperatureUnits);
dropdownWindSpeed.addEventListener('click', changeWindSpeedUnits);
dropdownPrecipitation.addEventListener('click', changePrecipitationUnits);
dropdownBtn.addEventListener('click', openUnitsDropdown);
searchForm.addEventListener('submit', getWeatherInformation);

window.addEventListener('click', closeUnitsDropdown);

async function getCityInfo(city) {
	const geo = await fetch(
		`https://geocoding-api.open-meteo.com/v1/search?name=${city}`
	);
	const geoData = await geo.json();
	const place = geoData.results[0];

	return place;
}

async function getWeatherByCity(cityName) {
	const place = await getCityInfo(cityName);

	// console.log(place);
	const weather = await fetch(
		`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m,apparent_temperature,weather_code`
	);

	const weatherData = await weather.json();
	// console.log(weatherData);
	return weatherData;
}
