import "bootstrap/dist/css/bootstrap.min.css";
import { mountNavbar } from "../components/navbar.js";
import { signUp } from "../services/authService.js";

const navbarMount = document.querySelector("#navbar-mount");
const form = document.querySelector("#register-form");
const emailInput = document.querySelector("#register-email");
const passwordInput = document.querySelector("#register-password");
const submitButton = document.querySelector("#register-submit");
const alertBox = document.querySelector("#register-alert");

mountNavbar(navbarMount);

function showAlert(message, type = "danger") {
	if (!alertBox) {
		return;
	}

	alertBox.className = `alert alert-${type}`;
	alertBox.textContent = message;
}

function hideAlert() {
	if (!alertBox) {
		return;
	}

	alertBox.className = "alert d-none";
	alertBox.textContent = "";
}

if (form && emailInput && passwordInput && submitButton) {
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		hideAlert();

		const email = emailInput.value.trim();
		const password = passwordInput.value;

		if (!email || !password) {
			showAlert("Please enter both email and password.");
			return;
		}

		submitButton.disabled = true;

		try {
			await signUp(email, password);
			window.location.href = "./login.html";
		} catch (error) {
			showAlert(error.message || "Sign up failed. Please try again.");
		} finally {
			submitButton.disabled = false;
		}
	});
}