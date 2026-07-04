import "bootstrap/dist/css/bootstrap.min.css";
import { mountNavbar } from "../components/navbar.js";
import { signIn } from "../services/authService.js";

const navbarMount = document.querySelector("#navbar-mount");
const form = document.querySelector("#login-form");
const emailInput = document.querySelector("#login-email");
const passwordInput = document.querySelector("#login-password");
const submitButton = document.querySelector("#login-submit");
const alertBox = document.querySelector("#login-alert");

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
			await signIn(email, password);
			window.location.href = "/index.html";
		} catch (error) {
			showAlert(error.message || "Sign in failed. Please try again.");
		} finally {
			submitButton.disabled = false;
		}
	});
}