import "bootstrap/dist/css/bootstrap.min.css";
import { mountNavbar } from "../components/navbar.js";
import { getBookById } from "../services/booksService.js";
import { addToLibrary } from "../services/libraryService.js";
import { addReview, getReviewsByBookId } from "../services/reviewsService.js";
import { supabase } from "../services/supabaseClient.js";

const navbarMount = document.querySelector("#navbar-mount");
const alertBox = document.querySelector("#book-alert");
const detailsMount = document.querySelector("#book-details");
const reviewSectionMount = document.querySelector("#book-review-section");

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
						<p class="mb-4">${description}</p>
						<button id="add-to-library-button" type="button" class="btn btn-primary">Add to Library</button>
					</div>
				</div>
			</div>
		</article>
	`;
}

function wireAddToLibrary(bookId) {
	if (!detailsMount) {
		return;
	}

	const addButton = detailsMount.querySelector("#add-to-library-button");

	if (!addButton) {
		return;
	}

	addButton.addEventListener("click", async () => {
		hideAlert();
		addButton.disabled = true;

		try {
			await addToLibrary(bookId);
			showAlert("Book added to your library.", "success");
		} catch (error) {
			showAlert(error.message || "Could not add this book to your library.");
		} finally {
			addButton.disabled = false;
		}
	});
}

function renderReviewSection(content) {
	if (!reviewSectionMount) {
		console.error("Review form mount container #book-review-section not found in book.html");
		return;
	}

	reviewSectionMount.innerHTML = content;
}

function renderReviewItems(container, reviews) {
	if (!container) {
		return;
	}

	if (!reviews.length) {
		container.innerHTML =
			'<div class="alert alert-secondary mb-0">No reviews yet. Be the first to leave one.</div>';
		return;
	}

	container.innerHTML = reviews
		.map((review) => {
			const text = escapeHtml(review.review_text || "No written review provided.");
			const rating = escapeHtml(review.rating);
			const createdAt = review.created_at
				? new Date(review.created_at).toLocaleString()
				: "Unknown date";

			return `
				<article class="card mb-2 shadow-sm">
					<div class="card-body py-3">
						<div class="d-flex justify-content-between align-items-center mb-2">
							<strong>Rating: ${rating}/5</strong>
							<small class="text-body-secondary">${escapeHtml(createdAt)}</small>
						</div>
						<p class="mb-0">${text}</p>
					</div>
				</article>
			`;
		})
		.join("");
}

async function refreshReviewList(bookId) {
	if (!reviewSectionMount) {
		return;
	}

	const listMount = reviewSectionMount.querySelector("#review-list");

	if (!listMount) {
		return;
	}

	listMount.innerHTML = '<div class="alert alert-info mb-0">Loading reviews...</div>';

	try {
		const reviews = await getReviewsByBookId(bookId);
		renderReviewItems(listMount, reviews);
	} catch (error) {
		listMount.innerHTML = `<div class="alert alert-warning mb-0">${escapeHtml(error.message || "Unable to load reviews.")}</div>`;
	}
}

function wireReviewForm(bookId) {
	if (!reviewSectionMount) {
		return;
	}

	const form = reviewSectionMount.querySelector("#review-form");
	const ratingInput = reviewSectionMount.querySelector("#review-rating");
	const textInput = reviewSectionMount.querySelector("#review-text");
	const submitButton = reviewSectionMount.querySelector("#review-submit-button");
	const submitAlert = reviewSectionMount.querySelector("#review-submit-alert");

	if (!form || !ratingInput || !textInput || !submitButton || !submitAlert) {
		return;
	}

	const defaultButtonHtml = submitButton.innerHTML;

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		submitAlert.className = "alert d-none";
		submitAlert.textContent = "";

		submitButton.disabled = true;
		submitButton.innerHTML =
			'<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...';

		try {
			await addReview(bookId, textInput.value, ratingInput.value);
			form.reset();
			await refreshReviewList(bookId);
		} catch (error) {
			submitAlert.className = "alert alert-danger";
			submitAlert.textContent = error.message || "Failed to submit review.";
		} finally {
			submitButton.disabled = false;
			submitButton.innerHTML = defaultButtonHtml;
		}
	});
}

async function renderReviewForm(bookId) {
	if (!reviewSectionMount) {
		console.error("Review form mount container #book-review-section not found in book.html");
		return;
	}

	renderReviewSection('<div class="alert alert-info mb-0">Loading review form...</div>');

	const {
		data: { session },
		error,
	} = await supabase.auth.getSession();

	if (error) {
		renderReviewSection(
			`<div class="alert alert-warning mb-0">Unable to check session for reviews: ${escapeHtml(error.message)}</div>`,
		);
		return;
	}

	console.log("Book page session before review form check:", session);

	if (session) {
		renderReviewSection(`
			<section class="card shadow-sm mb-3">
				<div class="card-body">
					<h2 class="h5 mb-3">Leave a Review</h2>
					<form id="review-form" data-book-id="${escapeHtml(bookId)}" novalidate>
						<div id="review-submit-alert" class="alert d-none" role="alert"></div>
						<div class="mb-3">
							<label for="review-rating" class="form-label">Rating</label>
							<select id="review-rating" class="form-select" required>
								<option value="">Select rating</option>
								<option value="1">1</option>
								<option value="2">2</option>
								<option value="3">3</option>
								<option value="4">4</option>
								<option value="5">5</option>
							</select>
						</div>
						<div class="mb-3">
							<label for="review-text" class="form-label">Review</label>
							<textarea id="review-text" class="form-control" rows="4" placeholder="Share your thoughts"></textarea>
						</div>
						<button id="review-submit-button" type="submit" class="btn btn-primary">Submit Review</button>
					</form>
				</div>
			</section>
			<section>
				<h2 class="h5 mb-3">Reviews</h2>
				<div id="review-list"></div>
			</section>
		`);
		wireReviewForm(bookId);
		await refreshReviewList(bookId);
		return;
	}

	renderReviewSection(`
		<section class="mb-3">
			<div class="alert alert-secondary mb-0">
				Log in to leave a review.
				<a href="/pages/login.html" class="alert-link">Go to login</a>.
			</div>
		</section>
		<section>
			<h2 class="h5 mb-3">Reviews</h2>
			<div id="review-list"></div>
		</section>
	`);
	await refreshReviewList(bookId);
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
		wireAddToLibrary(book.id);
		await renderReviewForm(book.id);
	} catch (error) {
		showAlert(error.message || "Failed to load book details.");
		detailsMount.innerHTML = "";
		renderReviewSection("");
	}
}

loadBook();