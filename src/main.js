import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import { mountNavbar } from "./components/navbar.js";
import { renderBookCard } from "./components/bookCard.js";
import { getAllBooks } from "./services/booksService.js";

const navbarMount = document.querySelector("#navbar-mount");
const searchInput = document.querySelector("#book-search");
const booksAlert = document.querySelector("#books-alert");
const bookGrid = document.querySelector("#book-grid");

let books = [];

mountNavbar(navbarMount);

function showAlert(message, type = "danger") {
	if (!booksAlert) {
		return;
	}

	booksAlert.className = `alert alert-${type}`;
	booksAlert.textContent = message;
}

function hideAlert() {
	if (!booksAlert) {
		return;
	}

	booksAlert.className = "alert d-none";
	booksAlert.textContent = "";
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
			'<div class="col-12"><div class="alert alert-secondary mb-0">No books found.</div></div>';
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
		'<div class="col-12"><div class="alert alert-info mb-0">Loading books...</div></div>';

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

loadBooks();
