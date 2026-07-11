import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";
import "./style.css";
import "./styles/main.css";
import { mountNavbar } from "./components/navbar.js";
import { renderBookCard } from "./components/bookCard.js";
import { createBook, getAllBooks } from "./services/booksService.js";
import { getCurrentUserRole } from "./services/authService.js";
import { uploadBookCover } from "./services/storageService.js";

const navbarMount = document.querySelector("#navbar-mount");
const searchInput = document.querySelector("#book-search");
const booksAlert = document.querySelector("#books-alert");
const bookGrid = document.querySelector("#book-grid");
const addBookSection = document.querySelector("#home-add-book-section");
const addBookAlert = document.querySelector("#home-add-book-alert");
const addBookForm = document.querySelector("#home-add-book-form");
const addBookTitle = document.querySelector("#home-book-title");
const addBookAuthor = document.querySelector("#home-book-author");
const addBookGenre = document.querySelector("#home-book-genre");
const addBookDescription = document.querySelector("#home-book-description");
const addBookCoverFile = document.querySelector("#home-book-cover-file");
const addBookCoverPreview = document.querySelector("#home-book-cover-preview");
const addBookSubmit = document.querySelector("#home-add-book-submit");

let books = [];
let selectedCoverFile = null;

mountNavbar(navbarMount);

function showAlert(message, type = "danger") {
	if (!booksAlert) {
		return;
	}

	booksAlert.className = `alert alert-${type} alert-dismissible fade show`;
	booksAlert.innerHTML = "";

	const messageNode = document.createElement("span");
	messageNode.textContent = message;

	const closeButton = document.createElement("button");
	closeButton.type = "button";
	closeButton.className = "btn-close";
	closeButton.setAttribute("data-bs-dismiss", "alert");
	closeButton.setAttribute("aria-label", "Close");

	booksAlert.append(messageNode, closeButton);
}

function hideAlert() {
	if (!booksAlert) {
		return;
	}

	booksAlert.className = "alert d-none";
	booksAlert.textContent = "";
}

function showAddBookAlert(message, type = "danger") {
	if (!addBookAlert) {
		return;
	}

	addBookAlert.className = `alert alert-${type} alert-dismissible fade show`;
	addBookAlert.innerHTML = "";

	const messageNode = document.createElement("span");
	messageNode.textContent = message;

	const closeButton = document.createElement("button");
	closeButton.type = "button";
	closeButton.className = "btn-close";
	closeButton.setAttribute("data-bs-dismiss", "alert");
	closeButton.setAttribute("aria-label", "Close");

	addBookAlert.append(messageNode, closeButton);
}

function hideAddBookAlert() {
	if (!addBookAlert) {
		return;
	}

	addBookAlert.className = "alert d-none";
	addBookAlert.textContent = "";
}

function setCoverPreview(file) {
	if (!addBookCoverPreview || !file) {
		return;
	}

	addBookCoverPreview.src = URL.createObjectURL(file);
}

function getSearchableText(book) {
	const title = book?.title ?? "";
	const author = book?.author ?? "";
	return `${title} ${author}`.toLowerCase();
}

function renderBooks(items) {
	if (!bookGrid) {
		return;
	}

	if (!items.length) {
		bookGrid.innerHTML =
			'<div class="col-12"><div class="alert empty-state-box mb-0 d-flex align-items-center gap-2"><i class="bi bi-inbox empty-state-icon" aria-hidden="true"></i><span>No books found.</span></div></div>';
		return;
	}

	bookGrid.innerHTML = items.map((book) => renderBookCard(book)).join("");
}

async function loadBooks() {
	if (!bookGrid) {
		return;
	}

	hideAlert();
	bookGrid.innerHTML =
		'<div class="col-12"><div class="alert alert-info mb-0 d-flex align-items-center gap-2"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span>Loading books...</span></div></div>';

	try {
		books = await getAllBooks();
		renderBooks(books);
	} catch (error) {
		showAlert(error.message || "Unable to load books right now.");
		bookGrid.innerHTML = "";
	}
}

if (searchInput) {
	searchInput.addEventListener("input", () => {
		const query = searchInput.value.trim().toLowerCase();

		if (!query) {
			renderBooks(books);
			return;
		}

		const filtered = books.filter((book) => getSearchableText(book).includes(query));
		renderBooks(filtered);
	});
}

if (addBookCoverFile) {
	addBookCoverFile.addEventListener("change", () => {
		hideAddBookAlert();

		const [file] = addBookCoverFile.files || [];
		selectedCoverFile = file || null;

		if (!selectedCoverFile) {
			return;
		}

		if (!selectedCoverFile.type.startsWith("image/")) {
			selectedCoverFile = null;
			addBookCoverFile.value = "";
			showAddBookAlert("Please choose an image file for the cover.");
			return;
		}

		setCoverPreview(selectedCoverFile);
	});
}

if (addBookForm && addBookTitle && addBookAuthor && addBookSubmit) {
	addBookForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		hideAddBookAlert();

		const title = addBookTitle.value.trim();
		const author = addBookAuthor.value.trim();
		const genre = addBookGenre?.value?.trim() || "";
		const description = addBookDescription?.value?.trim() || "";

		if (!title || !author) {
			showAddBookAlert("Title and author are required.");
			return;
		}

		if (!selectedCoverFile) {
			showAddBookAlert("Please choose a cover image before submitting.");
			return;
		}

		addBookSubmit.disabled = true;

		try {
			const createdBook = await createBook({ title, author, genre, description });
			await uploadBookCover(selectedCoverFile, createdBook.id);

			addBookForm.reset();
			selectedCoverFile = null;

			if (addBookCoverPreview) {
				addBookCoverPreview.src = "https://placehold.co/240x320?text=Cover+Preview";
			}

			showAddBookAlert(`Book added: ${createdBook.title}`, "success");
			await loadBooks();
		} catch (error) {
			showAddBookAlert(error.message || "Failed to add book.");
		} finally {
			addBookSubmit.disabled = false;
		}
	});
}

async function initHomeAddBookAccess() {
	if (!addBookSection) {
		return;
	}

	try {
		const { userId, role } = await getCurrentUserRole();

		console.log("[Add Book Admin Check]", { userId, role });

		if (role === "admin") {
			addBookSection.classList.remove("d-none");
			return;
		}

		addBookSection.classList.add("d-none");
	} catch (error) {
		addBookSection.classList.add("d-none");
		showAddBookAlert(error.message || "Unable to verify admin access.");
	}
}

initHomeAddBookAccess();
loadBooks();
