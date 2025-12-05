// GLOBAL
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

// INITIALIZATION
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

const retryBtn = document.querySelector('.btn-retry');

const errorContainer = document.querySelector('.search-server-error');
const contentContainer = document.querySelector('.content-container');
const weatherInfoContainer = document.querySelector('.weather-info');
const locationInfo = weatherInfoContainer.querySelector('.location-info');
const temperatureContainer = weatherInfoContainer.querySelector(
	'.temperature-container'
);
const loadingContainer = document.querySelector('.loading-container');
const searchNotFoundContainer = document.querySelector('.search-not-found');
const searchInput = document.querySelector('input[type="text"]');
const cityDropdown = document.querySelector('.city-dropdown');

// FUNCTIONS

// Data Fetching
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
	showLoading();

	try {
		const unitParams = buildUnitParams(global.units);

		const response = await fetch(
			`${
				global.api.apiUrl
			}latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&current=temperature_2m,${
				global.api.apiEnd
			}${unitParams ? `&${unitParams}` : ''}`
		);

		checkServerError(response.status);

		const weatherData = await response.json();
		return weatherData;
	} catch (err) {
		console.error('Failed to fetch data.', err.message);
		throw err;
	}
}

async function initializeWithLocation(latitude, longitude) {
	global.currentLocation = { latitude, longitude };

	const weatherData = await fetchWeatherData(latitude, longitude);

	const cityData = await getCityFromCoordinates(latitude, longitude);

	// console.log(cityData);
	updateWeatherUI(weatherData, cityData);
}

async function getCityFromCoordinates(latitude, longitude) {
	const response = await fetch(
		`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
	);
	checkServerError(response.status);
	const data = await response.json();
	// console.log(data);
	const { address } = data;

	return { country: address.country, name: address.city };
}

async function getWeatherByCity(cityName) {
	const cityData = await getCityInfo(cityName);

	const weatherData = await fetchWeatherData(
		cityData.latitude,
		cityData.longitude
	);

	return { weatherData, cityData };
}

async function getCityInfo(city) {
	const response = await fetch(
		`https://geocoding-api.open-meteo.com/v1/search?name=${city}`
	);

	checkServerError(response.status);
	const geoData = await response.json();
	if (!geoData.results || geoData.results.length === 0) {
		showSearchNotFound();
		throw new Error('City not found');
	}

	const place = geoData.results[0];

	return place;
}

async function getWeatherInformation(e) {
	if (e) e.preventDefault();
	if (contentContainer.classList.contains('hidden')) hideSearchNotFound();

	const input = document.querySelector('input').value;

	const { weatherData, cityData } = await getWeatherByCity(input);

	global.lastCity = input;
	global.currentLocation = null;

	searchInput.value = '';
	hideCityDropdown();
	updateWeatherUI(weatherData, cityData);
}

// Loading States

function showLoading() {
	weatherInfoContainer.classList.add('weather-info-loading');
	locationInfo.classList.add('hidden');
	temperatureContainer.classList.add('hidden');
	loadingContainer.classList.remove('hidden');
}

function hideLoading() {
	weatherInfoContainer.classList.remove('weather-info-loading');
	locationInfo.classList.remove('hidden');
	temperatureContainer.classList.remove('hidden');
	loadingContainer.classList.add('hidden');
}

// Error Handling

function showServerError() {
	errorContainer.classList.remove('hidden');
	contentContainer.classList.add('hidden');
}
function hideServerError() {
	errorContainer.classList.add('hidden');
	contentContainer.classList.remove('hidden');
}

function showSearchNotFound() {
	searchNotFoundContainer.classList.remove('hidden');
	contentContainer.classList.add('hidden');
}
function hideSearchNotFound() {
	searchNotFoundContainer.classList.add('hidden');
	contentContainer.classList.remove('hidden');
}

function checkServerError(status) {
	if (status === 500) {
		showServerError();
		throw new Error(`Problem fetching data.`);
	}
}

function retrySearch() {
	document.querySelector('input').value = '';
	hideServerError();
	window.location.reload();
}

// City Search Dropdown
let debounceTimer;

function handleCitySearch(e) {
	const query = e.target.value.trim();
	clearTimeout(debounceTimer);

	if (query.length < 3) {
		hideCityDropdown();
		return;
	}

	debounceTimer = setTimeout(() => {
		fetchCitySuggestion(query);
	}, 300);
}

async function fetchCitySuggestion(cityName) {
	try {
		const response = await fetch(
			`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=4`
		);
		const data = await response.json();

		if (data.results) {
			showCityDropdown(data.results);
		}

		return data.results;
	} catch (error) {
		throw new Error(error);
	}
}

function selectDropdownCity(city) {
	hideCityDropdown();
	initializeWithLocation(city.latitude, city.longitude);
}

function showCityDropdown(cities) {
	cityDropdown.innerHTML = ``;

	cities.forEach((city) => {
		const cityOption = document.createElement('a');
		cityOption.classList.add('city-option');
		cityOption.href = '#';
		cityOption.textContent = `${city.name}, ${city.admin1}, ${city.country}`;

		cityOption.addEventListener('click', (e) => {
			e.preventDefault();
			selectDropdownCity(city);
		});

		cityDropdown.appendChild(cityOption);
	});

	cityDropdown.classList.remove('hidden');
}

function hideCityDropdown() {
	cityDropdown.classList.add('hidden');
}

// Units Dropdown Menu

function openUnitsDropdown(e) {
	e.stopPropagation();
	dropdownContent.classList.toggle('show');
}

function closeDropdown(e) {
	if (!dropdownContent.contains(e.target) && e.target !== dropdownBtn) {
		dropdownContent.classList.remove('show');
	}
	if (!cityDropdown.contains(e.target) && e.target !== searchInput) {
		hideCityDropdown();
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

function getNext8Hours(hourlyData) {
	const now = new Date();
	const currentHour = now.getHours();
	const hoursToShow = 8;
	const hourlyForecast = [];

	for (let i = 0; i < hoursToShow; i++) {
		const index = currentHour + i;

		// Make sure we don't go beyond the 168 hours
		if (index < hourlyData.time.length) {
			hourlyForecast.push({
				time: hourlyData.time[index],
				temperature: hourlyData.temperature_2m[index],
				weatherCode: hourlyData.weather_code[index],
			});
		}
	}

	return hourlyForecast;
}

function buildHourlyForecastInformation(weatherData) {
	const { hourly } = weatherData;
	const container = document.querySelector('.hourly-forecast-container');

	const today = new Date();
	const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

	container.innerHTML = `<div class="hourly-forecast-header">
                            <span class="hourly-forecast-title">Hourly forecast</span>
                             <div class="day-selector">
                                    <button class="day-selector-btn">
                                        <span class="selected-day">${currentDayName}</span>
                                        <img 
                                            src="./assets/images/icon-dropdown.svg"
                                            class="icon-dropdown"
                                            alt=""
                                        />
                                    </button>
                                    <div  class="day-selector-dropdown hidden">
                                        ${generateDayOptions()}
                                    </div>
                            </div> 
                        </div>`;

	const todayHours = getHoursForDay(hourly, today.getDay());
	appendHourlyCards(container, todayHours);
	setupDaySelector(container, hourly);
}

function generateDayOptions() {
	const days = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	];

	return days
		.map(
			(day, index) => `
		<button class="day-option" data-day="${index}">
			${day}
		</button>
	`
		)
		.join('');
}

function getHoursForDay(hourlyData, dayIndex) {
	const now = new Date();
	const currentHour = now.getHours();
	const currentDay = now.getDay();

	const hourlyForecast = [];

	for (let i = 0; i < hourlyData.time.length; i++) {
		const date = new Date(hourlyData.time[i]);

		if (date.getDay() === dayIndex) {
			// If it's today, only include hours from current hour onwards
			if (dayIndex === currentDay) {
				const hour = date.getHours();
				if (hour >= currentHour && hourlyForecast.length < 8) {
					hourlyForecast.push({
						time: hourlyData.time[i],
						temperature: hourlyData.temperature_2m[i],
						weatherCode: hourlyData.weather_code[i],
					});
				}
			} else if (hourlyForecast.length < 8) {
				// For other days, take first 8 hours
				hourlyForecast.push({
					time: hourlyData.time[i],
					temperature: hourlyData.temperature_2m[i],
					weatherCode: hourlyData.weather_code[i],
				});
			}
		}

		// Stop early if we already have 8 hours
		if (hourlyForecast.length >= 8) break;
	}

	return hourlyForecast;
}

function appendHourlyCards(container, hours) {
	const existingCards = container.querySelectorAll('.hourly-weather-card');
	existingCards.forEach((card) => card.remove());

	hours.forEach((hour) => {
		const card = createHourlyCard(hour);
		container.appendChild(card);
	});
}

function createHourlyCard(hourData) {
	const card = document.createElement('div');
	card.classList.add('hourly-weather-card');

	const timeDiv = document.createElement('div');
	timeDiv.classList.add('hourly-forecast-time');
	const icon = document.createElement('img');
	icon.classList.add('forecast-weather-icon');
	icon.src = setWeatherIcon(hourData.weatherCode);

	const time = document.createElement('span');
	time.classList.add('forecast-time');
	time.textContent = formatHourlyTime(hourData.time);

	timeDiv.append(icon, time);

	const temp = document.createElement('span');
	temp.classList.add('temperature');
	temp.textContent = `${Math.round(hourData.temperature)}\u00B0`;

	card.append(timeDiv, temp);

	return card;
}
function setupDaySelector(container, hourlyData) {
	const daySelectorBtn = container.querySelector('.day-selector-btn');
	const dropdown = container.querySelector('.day-selector-dropdown');
	const dayOptions = container.querySelectorAll('.day-option');
	const today = new Date().getDay();

	// Toggle dropdown
	daySelectorBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		dropdown.classList.toggle('hidden');
	});

	// Handle day selection
	dayOptions.forEach((option) => {
		option.addEventListener('click', () => {
			const selectedDay = parseInt(option.dataset.day);
			const dayName = option.textContent.trim();

			// Update button text
			container.querySelector('.selected-day').textContent = dayName;

			// Update hourly cards
			const hoursForDay = getHoursForDay(hourlyData, selectedDay);
			appendHourlyCards(container, hoursForDay);

			// Close dropdown
			dropdown.classList.add('hidden');
		});
	});

	// Close dropdown when clicking outside
	document.addEventListener('click', (e) => {
		if (!container.querySelector('.day-selector').contains(e.target)) {
			dropdown.classList.add('hidden');
		}
	});
}

function formatHourlyTime(timeString) {
	const date = new Date(timeString);
	const hours = date.getHours();

	// Convert 24-hour to 12-hour format
	const period = hours >= 12 ? 'PM' : 'AM';
	const displayHour = hours % 12 || 12; // 0 becomes 12

	return `${displayHour} ${period}`;
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

function updateWeatherUI(weatherData, cityData) {
	buildMainForecastInformation(weatherData, cityData);
	buildDailyForecastInformation(weatherData);
	buildHourlyForecastInformation(weatherData);

	setTimeout(hideLoading, 50);
}

function init() {
	dropdownWindSpeed.addEventListener('click', changeWindSpeedUnits);
	dropdownPrecipitation.addEventListener('click', changePrecipitationUnits);
	dropdownTemperature.addEventListener('click', changeTemperatureUnits);
	dropdownBtn.addEventListener('click', openUnitsDropdown);
	searchForm.addEventListener('submit', getWeatherInformation);
	switchUnitsBtn.addEventListener('click', switchUnits);
	retryBtn.addEventListener('click', retrySearch);
	searchInput.addEventListener('input', handleCitySearch);
	window.addEventListener('click', closeDropdown);
	navigator.geolocation.getCurrentPosition(success, error, options);
}

init();
