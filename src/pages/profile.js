import "bootstrap/dist/css/bootstrap.min.css";
import { mountNavbar } from "../components/navbar.js";
import { supabase } from "../services/supabaseClient.js";
import { uploadAvatar } from "../services/storageService.js";

const navbarMount = document.querySelector("#navbar-mount");
mountNavbar(navbarMount);
const form = document.querySelector("#avatar-form");
const fileInput = document.querySelector("#avatar-file");
const previewImage = document.querySelector("#avatar-preview");
const submitButton = document.querySelector("#avatar-submit");
const alertBox = document.querySelector("#avatar-alert");

let selectedFile = null;

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

	alertBox.className = "alert d-none mb-0";
	alertBox.textContent = "";
}

function updatePreviewFromFile(file) {
	if (!previewImage || !file) {
		return;
	}

	const objectUrl = URL.createObjectURL(file);
	previewImage.src = objectUrl;
}

async function loadExistingAvatar(userId) {
	if (!previewImage || !userId) {
		return;
	}

	const { data, error } = await supabase
		.from("profiles")
		.select("avatar_url")
		.eq("id", userId)
		.single();

	if (error) {
		return;
	}

	if (data?.avatar_url) {
		previewImage.src = data.avatar_url;
	}
}

async function initProfileAvatar() {
	if (!form || !fileInput || !submitButton) {
		return;
	}

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError) {
		showAlert(userError.message || "Could not load your profile.");
		form.classList.add("d-none");
		return;
	}

	if (!user?.id) {
		showAlert("Please sign in to upload an avatar.", "warning");
		form.classList.add("d-none");
		return;
	}

	await loadExistingAvatar(user.id);

	fileInput.addEventListener("change", () => {
		hideAlert();

		const [file] = fileInput.files || [];
		selectedFile = file || null;

		if (!selectedFile) {
			return;
		}

		if (!selectedFile.type.startsWith("image/")) {
			selectedFile = null;
			fileInput.value = "";
			showAlert("Please choose an image file.");
			return;
		}

		updatePreviewFromFile(selectedFile);
	});

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		hideAlert();

		if (!selectedFile) {
			showAlert("Please choose an image before uploading.");
			return;
		}

		submitButton.disabled = true;

		try {
			const publicUrl = await uploadAvatar(selectedFile, user.id);
			previewImage.src = publicUrl;
			showAlert("Avatar uploaded successfully.", "success");
		} catch (error) {
			showAlert(error.message || "Avatar upload failed. Please try again.");
		} finally {
			submitButton.disabled = false;
		}
	});
}

initProfileAvatar();