const element = (id) => document.getElementById(id);

const form = element("form");
const residentStatus = element("resident-status");
form.addEventListener("submit", function(event) {
	if (residentStatus.value === "") {
		residentStatus.focus();
		event.preventDefault();
	}
});