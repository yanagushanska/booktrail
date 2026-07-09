import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/main.css";
import { mountNavbar } from "../components/navbar.js";
import { getBookById } from "../services/booksService.js";
import {
	addToLibrary,
	getUserBookForBook,
	markAsFinished,
} from "../services/libraryService.js";
import {
	addReview,
	getAverageRatingForBook,
	getReviewsByBookId,
} from "../services/reviewsService.js";
import { supabase } from "../services/supabaseClient.js";

const navbarMount = document.querySelector("#navbar-mount");
const alertBox = document.querySelector("#book-alert");
const detailsMount = document.querySelector("#book-details");
const reviewSectionMount = document.querySelector("#book-review-section");

mountNavbar(navbarMount);

const LIBRARY_STATUS_LABELS = {
	want_to_read: "Want to Read",
	reading: "Reading",
	finished: "Finished",
};

function getLibraryStatusBadgeClass(status) {
	if (status === "reading") {
		return "status-badge--reading";
	}

	if (status === "finished") {
		return "status-badge--finished";
	}

	return "status-badge--want";
}

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

function renderStaticStars(rating) {
	const normalizedRating = Number(rating) || 0;

	return Array.from({ length: 5 }, (_unused, index) => {
		const isFilled = index < normalizedRating;
		const iconClass = isFilled ? "bi-star-fill text-warning" : "bi-star text-warning";
		return `<i class="bi ${iconClass}" aria-hidden="true"></i>`;
	}).join("");
}

function renderRatingSummary(summary) {
	if (!reviewSectionMount) {
		return;
	}

	const summaryMount = reviewSectionMount.querySelector("#review-summary");

	if (!summaryMount) {
		return;
	}

	if (!summary || summary.count === 0 || summary.average === null) {
		summaryMount.innerHTML = '<div class="text-body-secondary">No ratings yet</div>';
		return;
	}

	summaryMount.innerHTML = `
		<div class="d-flex align-items-center gap-2 flex-wrap">
			<div class="d-flex align-items-center gap-1" aria-label="Average rating ${summary.average} out of 5">${renderStaticStars(
				Math.round(summary.average),
			)}</div>
			<span class="fw-semibold">${summary.average.toFixed(1)} ★</span>
			<span class="text-body-secondary">(${summary.count} review${summary.count === 1 ? "" : "s"})</span>
		</div>
	`;
}

function renderLibraryStatus(entry) {
	if (!detailsMount) {
		return;
	}

	const statusMount = detailsMount.querySelector("#book-library-status");

	if (!statusMount) {
		return;
	}

	if (!entry) {
		statusMount.innerHTML = '<span class="text-body-secondary">Not in your library yet</span>';
		return;
	}

	const statusLabel = escapeHtml(LIBRARY_STATUS_LABELS[entry.status] || "Want to Read");
	const statusBadgeClass = getLibraryStatusBadgeClass(entry.status);

	statusMount.innerHTML = `
		<div class="d-flex align-items-center gap-2 flex-wrap">
			<span class="text-body-secondary">Your library status:</span>
			<span class="badge ${statusBadgeClass}">${statusLabel}</span>
		</div>
	`;
}

async function refreshLibraryStatus(bookId) {
	if (!detailsMount) {
		return;
	}

	const statusMount = detailsMount.querySelector("#book-library-status");

	if (!statusMount) {
		return;
	}

	statusMount.innerHTML = '<span class="text-body-secondary">Loading your library status...</span>';

	try {
		const entry = await getUserBookForBook(bookId);
		renderLibraryStatus(entry);
	} catch (error) {
		statusMount.innerHTML = `<span class="text-warning">${escapeHtml(
			error.message || "Unable to load your library status.",
		)}</span>`;
	}
}

async function refreshRatingSummary(bookId) {
	if (!reviewSectionMount) {
		return;
	}

	const summaryMount = reviewSectionMount.querySelector("#review-summary");

	if (!summaryMount) {
		return;
	}

	summaryMount.innerHTML = '<div class="text-body-secondary">Loading ratings...</div>';

	try {
		const summary = await getAverageRatingForBook(bookId);
		renderRatingSummary(summary);
	} catch (error) {
		summaryMount.innerHTML = `<div class="text-warning">${escapeHtml(
			error.message || "Unable to load rating summary.",
		)}</div>`;
	}
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
					<div class="flex-shrink-0 book-detail-cover-frame rounded border bg-body-tertiary">
						${
							coverUrl
								? `<img src="${coverUrl}" alt="Cover for ${title}" class="book-detail-cover" />`
								: '<div class="d-flex align-items-center justify-content-center text-body-secondary h-100 w-100">No cover</div>'
						}
					</div>
					<div class="flex-grow-1">
						<h1 class="h3 mb-2">${title}</h1>
						<p class="text-body-secondary mb-3">by ${author}</p>
						<div class="d-flex flex-wrap gap-2 mb-3">
							<span class="badge badge-oxblood-soft">Genre: ${genre}</span>
							<span class="badge badge-oxblood-soft">Published: ${year}</span>
						</div>
						<div id="book-library-status" class="mb-3"></div>
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
			'<div class="alert empty-state-box mb-0 d-flex align-items-center gap-2"><i class="bi bi-chat-left-dots empty-state-icon" aria-hidden="true"></i><span>No reviews yet. Be the first to leave one.</span></div>';
		return;
	}

	container.innerHTML = reviews
		.map((review) => {
			const text = escapeHtml(review.review_text || "No written review provided.");
			const rating = Number(review.rating) || 0;
			const createdAt = review.created_at
				? new Date(review.created_at).toLocaleString()
				: "Unknown date";

			return `
				<article class="card mb-2 shadow-sm">
					<div class="card-body py-3">
						<div class="d-flex justify-content-between align-items-center mb-2">
							<div class="d-flex align-items-center gap-1" aria-label="Rating ${rating} out of 5">${renderStaticStars(rating)}</div>
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

	listMount.innerHTML = '<div class="alert alert-info mb-0 d-flex align-items-center gap-2"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span>Loading reviews...</span></div>';

	try {
		const reviews = await getReviewsByBookId(bookId);
		renderReviewItems(listMount, reviews);
	} catch (error) {
		listMount.innerHTML = `<div class="alert alert-warning mb-0">${escapeHtml(error.message || "Unable to load reviews.")}</div>`;
	}
}

function wireReviewForm(bookId, currentUserId) {
	if (!reviewSectionMount) {
		return;
	}

	const form = reviewSectionMount.querySelector("#review-form");
	const ratingInput = reviewSectionMount.querySelector("#review-rating");
	const textInput = reviewSectionMount.querySelector("#review-text");
	const submitButton = reviewSectionMount.querySelector("#review-submit-button");
	const submitAlert = reviewSectionMount.querySelector("#review-submit-alert");
	const starButtons = reviewSectionMount.querySelectorAll("[data-star-value]");

	if (!form || !ratingInput || !textInput || !submitButton || !submitAlert) {
		return;
	}

	const defaultButtonHtml = submitButton.innerHTML;

	const paintInputStars = (currentRating) => {
		starButtons.forEach((button) => {
			const starValue = Number(button.dataset.starValue);
			const icon = button.querySelector("i");

			if (!icon) {
				return;
			}

			icon.className = `bi ${starValue <= currentRating ? "bi-star-fill" : "bi-star"} text-warning fs-4`;
		});
	};

	starButtons.forEach((button) => {
		button.addEventListener("click", () => {
			const nextRating = Number(button.dataset.starValue);
			ratingInput.value = String(nextRating);
			paintInputStars(nextRating);
		});
	});

	paintInputStars(Number(ratingInput.value) || 0);

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		submitAlert.className = "alert d-none";
		submitAlert.innerHTML = "";

		submitButton.disabled = true;
		submitButton.innerHTML =
			'<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...';

		try {
			await addReview(bookId, textInput.value, ratingInput.value);

			try {
				await markAsFinished(currentUserId, bookId);
			} catch (markError) {
				console.error("Unable to mark book as finished after review submission:", markError);
			}

			form.reset();
			paintInputStars(0);
			await refreshRatingSummary(bookId);
			await refreshReviewList(bookId);
			await refreshLibraryStatus(bookId);
		} catch (error) {
			submitAlert.className = "alert alert-danger alert-dismissible fade show";
			submitAlert.innerHTML = `
				<span>${escapeHtml(error.message || "Failed to submit review.")}</span>
				<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
			`;
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

	renderReviewSection('<div class="alert alert-info mb-0 d-flex align-items-center gap-2"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span>Loading review form...</span></div>');

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
		await refreshLibraryStatus(bookId);
		renderReviewSection(`
			<section class="card shadow-sm mb-3">
				<div class="card-body">
					<h2 class="h5 mb-3">Leave a Review</h2>
					<form id="review-form" data-book-id="${escapeHtml(bookId)}" novalidate>
						<div id="review-submit-alert" class="alert d-none" role="alert"></div>
						<div class="mb-3">
							<label for="review-rating" class="form-label">Rating</label>
							<input id="review-rating" type="hidden" value="" required />
							<div class="d-flex align-items-center gap-1" role="group" aria-label="Choose rating">
								<button type="button" class="btn btn-link text-decoration-none p-0" data-star-value="1" aria-label="Rate 1 star"><i class="bi bi-star text-warning fs-4" aria-hidden="true"></i></button>
								<button type="button" class="btn btn-link text-decoration-none p-0" data-star-value="2" aria-label="Rate 2 stars"><i class="bi bi-star text-warning fs-4" aria-hidden="true"></i></button>
								<button type="button" class="btn btn-link text-decoration-none p-0" data-star-value="3" aria-label="Rate 3 stars"><i class="bi bi-star text-warning fs-4" aria-hidden="true"></i></button>
								<button type="button" class="btn btn-link text-decoration-none p-0" data-star-value="4" aria-label="Rate 4 stars"><i class="bi bi-star text-warning fs-4" aria-hidden="true"></i></button>
								<button type="button" class="btn btn-link text-decoration-none p-0" data-star-value="5" aria-label="Rate 5 stars"><i class="bi bi-star text-warning fs-4" aria-hidden="true"></i></button>
							</div>
						</div>
						<div class="mb-3">
							<label for="review-text" class="form-label">Review</label>
							<textarea id="review-text" class="form-control" rows="4" placeholder="Share your thoughts"></textarea>
						</div>
						<button id="review-submit-button" type="submit" class="btn btn-primary w-100 w-md-auto">Submit Review</button>
					</form>
				</div>
			</section>
			<section>
				<div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
					<h2 class="h5 mb-0">Reviews</h2>
					<div id="review-summary" class="text-body-secondary"></div>
				</div>
				<div id="review-list"></div>
			</section>
		`);
		wireReviewForm(bookId, session.user.id);
		await refreshRatingSummary(bookId);
		await refreshReviewList(bookId);
		return;
	}

	const statusMount = detailsMount.querySelector("#book-library-status");

	if (statusMount) {
		statusMount.innerHTML = '<span class="text-body-secondary">Sign in to see your library status.</span>';
	}
	renderReviewSection(`
		<section class="mb-3">
			<div class="alert alert-secondary mb-0">
				Log in to leave a review.
				<a href="/pages/login.html" class="alert-link">Go to login</a>.
			</div>
		</section>
		<section>
			<div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
				<h2 class="h5 mb-0">Reviews</h2>
				<div id="review-summary" class="text-body-secondary"></div>
			</div>
			<div id="review-list"></div>
		</section>
	`);
	await refreshRatingSummary(bookId);
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

	detailsMount.innerHTML = '<div class="alert alert-info mb-0 d-flex align-items-center gap-2"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span>Loading book details...</span></div>';

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