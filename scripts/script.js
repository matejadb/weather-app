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

dropdownTemperature.addEventListener('click', changeTemperatureUnits);
dropdownWindSpeed.addEventListener('click', changeWindSpeedUnits);
dropdownPrecipitation.addEventListener('click', changePrecipitationUnits);
dropdownBtn.addEventListener('click', openUnitsDropdown);
window.addEventListener('click', closeUnitsDropdown);
