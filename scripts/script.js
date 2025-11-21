const global = {
	currentSystem: 'metric',
	units: {
		temperature: 'celsius',
		windSpeed: 'km/h',
		precipitation: 'millimeters',
	},
	api: {
		apiUrl: 'https://api.open-meteo.com/v1/forecast?',
		apiEnd:
			'precipitation,wind_speed_10m,relative_humidity_2m,apparent_temperature,weather_code',
	},
	lastCity: '',
	currentLocation: null,
};

const unitSystem = {
	metric: {
		temperature: 'Celsius',
		windSpeed: 'km/h',
		precipitation: 'Millimeters',
	},
	imperial: {
		temperature: 'Fahrenheit',
		windSpeed: 'mph',
		precipitation: 'Inches',
	},
};

const dropdownTemperature = document.querySelector('.temperature');
const dropdownWindSpeed = document.querySelector('.wind-speed');
const dropdownPrecipitation = document.querySelector('.precipitation');
const dropdownBtn = document.querySelector('.btn-dropdown');
const dropdownContent = document.querySelector('.units-dropdown-content');
const searchForm = document.querySelector('.search-form');

const switchUnitsBtn = document.querySelector('.switch-units');
const switchTemperatureBtn = document.querySelector('.unit-temperature');
const switchWindSpeedBtn = document.querySelector('.unit-wind-speed');
const switchPrecipitationBtn = document.querySelector('.unit-precipitation');

const temperatureText = document.querySelector('.temperature-text');
const temperatureIcon = document.querySelector('.temperature-icon');
const locationText = document.querySelector('.location-text');
const dateText = document.querySelector('.date-text');

const feelsLike = document.querySelector('.detail-feels-like');
const humidity = document.querySelector('.detail-humidity');
const wind = document.querySelector('.detail-wind');
const precipitation = document.querySelector('.detail-precipitation');

// Fetch Data
function buildUnitParams(units) {
	const params = [];

	if (units.temperature === 'fahrenheit')
		params.push('temperature_unit=fahrenheit');

	if (units.windSpeed === 'mph') params.push('wind_speed_unit=mph');

	if (units.precipitation === 'inch') params.push('precipitation_unit=inch');

	return params.join('&');
}

const options = {
	enableHighAccuracy: true,
	timeout: 5000,
	maximumAge: 0,
};

function success(pos) {
	const crd = pos.coords;
	initializeWithLocation(crd.latitude, crd.longitude);
}

function error(err) {
	console.warn(`ERROR(${err.code}): ${err.message}`);
}

async function fetchWeatherData(latitude, longitude) {
	const unitParams = buildUnitParams(global.units);

	const weather = await fetch(
		`${
			global.api.apiUrl
		}latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&current=temperature_2m,${
			global.api.apiEnd
		}${unitParams ? `&${unitParams}` : ''}`
	);

	const weatherData = await weather.json();
	return weatherData;
}

async function initializeWithLocation(latitude, longitude) {
	global.currentLocation = { latitude, longitude };

	const weatherData = await fetchWeatherData(latitude, longitude);

	const cityData = {
		name: 'Current Location',
		country: '',
	};

	updateWeatherUI(weatherData, cityData);
}

async function getCityFromCoordinates(latitude, longitude) {
	const response = await fetch(
		`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
	);

	const data = await response.json();

	return {
		name: data.city || data.locality,
		country: data.countryCode,
	};
}

async function getWeatherByCity(cityName) {
	const cityData = await getCityInfo(cityName);

	const weatherData = await fetchWeatherData(
		cityData.latitude,
		cityData.longitude
	);

	return { weatherData, cityData };
}

async function searchByCity(cityName) {
	const cityData = await getCityInfo(cityName);
	const weatherData = await fetchWeatherData(
		cityData.latitude,
		cityData.longitude
	);

	global.lastCity = cityName;
	updateWeatherUI(weatherData, cityData);
}

async function getCityInfo(city) {
	const geo = await fetch(
		`https://geocoding-api.open-meteo.com/v1/search?name=${city}`
	);
	const geoData = await geo.json();
	const place = geoData.results[0];

	return place;
}

async function getWeatherInformation(e) {
	if (e) e.preventDefault();
	const input = document.querySelector('input').value;

	const { weatherData, cityData } = await getWeatherByCity(input);

	global.lastCity = input;
	global.currentLocation = null;

	updateWeatherUI(weatherData, cityData);
}

// Units Dropdown Menu

function openUnitsDropdown(e) {
	e.stopPropagation();
	dropdownContent.classList.toggle('show');
}

function closeUnitsDropdown(e) {
	if (!dropdownContent.contains(e.target) && e.target !== dropdownBtn) {
		dropdownContent.classList.remove('show');
	}
}

async function refetchLastCity() {
	if (!global.lastCity && !global.currentLocation) return;

	let weatherData, cityData;

	if (global.lastCity) {
		const result = await getWeatherByCity(global.lastCity);
		weatherData = result.weatherData;
		cityData = result.cityData;
	} else if (global.currentLocation) {
		weatherData = await fetchWeatherData(
			global.currentLocation.latitude,
			global.currentLocation.longitude
		);
		cityData = {
			name: 'Curent Location',
			country: '',
		};
	}

	updateWeatherUI(weatherData, cityData);
}

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

		refetchLastCity();
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

		refetchLastCity();
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

		refetchLastCity();
	}
}

function switchUnits() {
	const targetSystem =
		global.currentSystem === 'metric' ? 'imperial' : 'metric';

	if (targetSystem === 'imperial') {
		switchUnitsBtn.textContent = `Switch to Metric`;
	} else {
		switchUnitsBtn.textContent = `Switch to Imperial`;
	}

	const tempBtns = document.querySelectorAll('.unit-temperature');
	tempBtns.forEach((btn) => {
		const btnText = btn.textContent.trim();
		if (btnText.includes(unitSystem[targetSystem].temperature)) btn.click();
	});

	const windSpeedBtns = document.querySelectorAll('.unit-wind-speed');
	windSpeedBtns.forEach((btn) => {
		const btnText = btn.textContent.trim();
		if (btnText.includes(unitSystem[targetSystem].windSpeed)) btn.click();
	});

	const precipitationBtns = document.querySelectorAll('.unit-precipitation');
	precipitationBtns.forEach((btn) => {
		const btnText = btn.textContent.trim();
		if (btnText.includes(unitSystem[targetSystem].precipitation)) btn.click();
	});

	global.currentSystem = targetSystem;
}

function updateWeatherUI(weatherData, cityData) {
	buildMainForecastInformation(weatherData, cityData);
	buildDailyForecastInformation(weatherData);
	buildHourlyForecastInformation(weatherData);
}

function getNext7Days() {
	const days = [];
	const options = { weekday: 'short' }; // Mon, Tue, Wed

	const today = new Date();

	for (let i = 0; i < 7; i++) {
		const date = new Date(today);
		date.setDate(today.getDate() + i);

		days.push(date.toLocaleDateString('en-US', options));
	}

	return days;
}

function getNext8Hours() {}

function buildHourlyForecastInformation(weatherData) {
	const { hourly } = weatherData;
}

function buildDailyForecastInformation(weatherData) {
	const days = getNext7Days();
	const { daily } = weatherData;
	document.querySelector('.daily-forecast').innerHTML = ``;

	for (let i = 0; i < 7; i++) {
		const divCard = document.createElement('div');
		divCard.classList.add('card');

		const spanDay = createDailyForecastSpan(days[i], ['day']);
		const img = createDailyForecastIcon(daily.weather_code[i]);
		const divRange = document.createElement('div');
		divRange.classList.add('temperature-range');
		const spanMin = createDailyForecastSpan(
			`${Math.round(daily.temperature_2m_min[i])} \u00B0`,
			'temperature min'
		);
		const spanMax = createDailyForecastSpan(
			`${Math.round(daily.temperature_2m_max[i])} \u00B0`,
			'temperature max'
		);
		divRange.append(spanMax, spanMin);
		divCard.append(spanDay, img, divRange);
		document.querySelector('.daily-forecast').appendChild(divCard);
	}
}

function createDailyForecastIcon(code) {
	const img = document.createElement('img');
	img.classList.add('weather-icon');
	img.src = setWeatherIcon(code);

	return img;
}

function createDailyForecastSpan(content, classes) {
	const spanDay = document.createElement('span');
	spanDay.className = classes;
	spanDay.textContent = content;

	return spanDay;
}

function buildMainForecastInformation(weatherData, cityData) {
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

	wind.textContent = `${Math.round(weatherData.current.wind_speed_10m)} ${
		global.units.windSpeed === 'km/h' ? 'km/h' : 'mph'
	}`;

	precipitation.textContent = `${weatherData.current.precipitation} ${
		global.units.precipitation === 'millimeters' ? 'mm' : 'inch'
	}`;
}

// Daily Forecast Information

function setWeatherIcon(code) {
	const iconMap = {
		sunny: [0, 1],
		partlyCloudy: [2],
		overcast: [3],
		fog: [45, 48],
		drizzle: [51, 53, 55, 56, 57],
		rain: [61, 63, 65, 67, 80, 81, 82],
		snow: [71, 73, 75, 77, 85, 86],
		storm: [95, 96, 99],
	};

	const icons = {
		sunny: './assets/images/icon-sunny.webp',
		partlyCloudy: './assets/images/icon-partly-cloudy.webp',
		overcast: './assets/images/icon-overcast.webp',
		fog: './assets/images/icon-fog.webp',
		drizzle: './assets/images/icon-drizzle.webp',
		rain: './assets/images/icon-rain.webp',
		snow: './assets/images/icon-snow.webp',
		storm: './assets/images/icon-storm.webp',
	};

	for (const [key, codes] of Object.entries(iconMap)) {
		if (codes.includes(code)) {
			return icons[key];
		}
	}

	return icons.sunny;
}

dropdownTemperature.addEventListener('click', changeTemperatureUnits);
dropdownWindSpeed.addEventListener('click', changeWindSpeedUnits);
dropdownPrecipitation.addEventListener('click', changePrecipitationUnits);
dropdownBtn.addEventListener('click', openUnitsDropdown);
searchForm.addEventListener('submit', getWeatherInformation);
switchUnitsBtn.addEventListener('click', switchUnits);

window.addEventListener('click', closeUnitsDropdown);
navigator.geolocation.getCurrentPosition(success, error, options);
