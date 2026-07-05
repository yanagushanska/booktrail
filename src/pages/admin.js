import "bootstrap/dist/css/bootstrap.min.css";
import { mountNavbar } from "../components/navbar.js";
import { getCurrentUser, isCurrentUserAdmin } from "../services/authService.js";
import { createBook } from "../services/booksService.js";
import { uploadBookCover } from "../services/storageService.js";

const navbarMount = document.querySelector("#navbar-mount");
const alertBox = document.querySelector("#admin-alert");
const section = document.querySelector("#add-book-section");
const form = document.querySelector("#add-book-form");
const titleInput = document.querySelector("#book-title");
const authorInput = document.querySelector("#book-author");
const genreInput = document.querySelector("#book-genre");
const descriptionInput = document.querySelector("#book-description");
const coverFileInput = document.querySelector("#book-cover-file");
const coverPreview = document.querySelector("#book-cover-preview");
const submitButton = document.querySelector("#add-book-submit");

let selectedCoverFile = null;

mountNavbar(navbarMount);

function showAlert(message, type = "danger") {
	if (!alertBox) {
		return;
	}

	alertBox.className = `alert alert-${type}`;
	alertBox.textContent = message;
}

function showForm() {
	if (!section) {
		return;
	}

	section.classList.remove("d-none");
}

function updateCoverPreview(file) {
	if (!coverPreview || !file) {
		return;
	}

	const objectUrl = URL.createObjectURL(file);
	coverPreview.src = objectUrl;
}

async function initAdminAccess() {
	if (!form) {
		return;
	}

	try {
		const user = await getCurrentUser();

		if (!user?.id) {
			showAlert("Please sign in to access admin tools.", "warning");
			return;
		}

		const isAdmin = await isCurrentUserAdmin();

		if (!isAdmin) {
			showAlert("You do not have admin access.", "warning");
			return;
		}

		showAlert("Admin access granted.", "success");
		showForm();
	} catch (error) {
		showAlert(error.message || "Failed to verify admin access.");
	}
}

if (coverFileInput) {
	coverFileInput.addEventListener("change", () => {
		const [file] = coverFileInput.files || [];
		selectedCoverFile = file || null;

		if (!selectedCoverFile) {
			return;
		}

		if (!selectedCoverFile.type.startsWith("image/")) {
			selectedCoverFile = null;
			coverFileInput.value = "";
			showAlert("Please choose an image file for the cover.");
			return;
		}

		updateCoverPreview(selectedCoverFile);
	});
}

if (form && titleInput && authorInput && submitButton) {
	form.addEventListener("submit", async (event) => {
		event.preventDefault();

		const title = titleInput.value.trim();
		const author = authorInput.value.trim();
		const genre = genreInput?.value?.trim() || "";
		const description = descriptionInput?.value?.trim() || "";

		if (!title || !author) {
			showAlert("Title and author are required.");
			return;
		}

		if (!selectedCoverFile) {
			showAlert("Please choose a cover image before submitting.");
			return;
		}

		submitButton.disabled = true;

		try {
			const createdBook = await createBook({ title, author, genre, description });
			await uploadBookCover(selectedCoverFile, createdBook.id);

			form.reset();
			selectedCoverFile = null;

			if (coverPreview) {
				coverPreview.src = "https://placehold.co/240x320?text=Cover+Preview";
			}

			showAlert(`Book added: ${createdBook.title}`, "success");
		} catch (error) {
			showAlert(error.message || "Failed to add book.");
		} finally {
			submitButton.disabled = false;
		}
	});
}

initAdminAccess();