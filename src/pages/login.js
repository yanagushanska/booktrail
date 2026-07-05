import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/main.css";
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

	alertBox.className = `alert alert-${type} alert-dismissible fade show`;
	alertBox.innerHTML = "";

	const messageNode = document.createElement("span");
	messageNode.textContent = message;

	const closeButton = document.createElement("button");
	closeButton.type = "button";
	closeButton.className = "btn-close";
	closeButton.setAttribute("data-bs-dismiss", "alert");
	closeButton.setAttribute("aria-label", "Close");

	alertBox.append(messageNode, closeButton);
}

function hideAlert() {
	if (!alertBox) {
		return;
	}

	alertBox.className = "alert d-none";
	alertBox.innerHTML = "";
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