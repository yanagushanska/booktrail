import "bootstrap/dist/css/bootstrap.min.css";
import { mountNavbar } from "../components/navbar.js";
import { getBookById } from "../services/booksService.js";

const navbarMount = document.querySelector("#navbar-mount");
const alertBox = document.querySelector("#book-alert");
const detailsMount = document.querySelector("#book-details");

mountNavbar(navbarMount);

function escapeHtml(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

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

function renderBookDetails(book) {
	if (!detailsMount) {
		return;
	}

	const title = escapeHtml(book?.title || "Untitled");
	const author = escapeHtml(book?.author || "Unknown author");
	const genre = escapeHtml(book?.genre || "Not specified");
	const year =
		book?.published_year === null || book?.published_year === undefined
			? "Unknown"
			: escapeHtml(book.published_year);
	const description = escapeHtml(book?.description || "No description available.");
	const coverUrl = book?.cover_url ? escapeHtml(book.cover_url) : "";

	detailsMount.innerHTML = `
		<article class="card shadow-sm">
			<div class="card-body">
				<div class="d-flex flex-column flex-lg-row gap-4">
					<div class="flex-shrink-0">
						${
							coverUrl
								? `<img src="${coverUrl}" alt="Cover for ${title}" class="img-fluid rounded border" style="max-width: 220px;" />`
								: '<div class="border rounded d-flex align-items-center justify-content-center text-body-secondary" style="width: 220px; height: 320px;">No cover</div>'
						}
					</div>
					<div class="flex-grow-1">
						<h1 class="h3 mb-2">${title}</h1>
						<p class="text-body-secondary mb-3">by ${author}</p>
						<div class="d-flex flex-wrap gap-2 mb-3">
							<span class="badge text-bg-secondary">Genre: ${genre}</span>
							<span class="badge text-bg-secondary">Published: ${year}</span>
						</div>
						<p class="mb-0">${description}</p>
					</div>
				</div>
			</div>
		</article>
	`;
}

async function loadBook() {
	if (!detailsMount) {
		return;
	}

	hideAlert();

	const params = new URLSearchParams(window.location.search);
	const id = params.get("id");

	if (!id) {
		showAlert("Missing book id in URL. Open this page as book.html?id=<book-id>.");
		detailsMount.innerHTML = "";
		return;
	}

	detailsMount.innerHTML = '<div class="alert alert-info mb-0">Loading book details...</div>';

	try {
		const book = await getBookById(id);

		if (!book) {
			showAlert("Book not found.", "warning");
			detailsMount.innerHTML = "";
			return;
		}

		renderBookDetails(book);
	} catch (error) {
		showAlert(error.message || "Failed to load book details.");
		detailsMount.innerHTML = "";
	}
}

loadBook();