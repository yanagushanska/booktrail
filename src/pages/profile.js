import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";
import "../styles/main.css";
import { mountNavbar } from "../components/navbar.js";
import { getReviewsByUser } from "../services/reviewsService.js";
import { supabase } from "../services/supabaseClient.js";
import { uploadAvatar } from "../services/storageService.js";
import { requireAuth } from "../utils/roleGuard.js";
import { downloadImageFromUrl } from "../utils/downloadImage.js";

await requireAuth();

const navbarMount = document.querySelector("#navbar-mount");
mountNavbar(navbarMount);
const form = document.querySelector("#avatar-form");
const fileInput = document.querySelector("#avatar-file");
const previewImage = document.querySelector("#avatar-preview");
const submitButton = document.querySelector("#avatar-submit");
const downloadButton = document.querySelector("#avatar-download-button");
const alertBox = document.querySelector("#avatar-alert");
const myReviewsAlert = document.querySelector("#my-reviews-alert");
const myReviewsList = document.querySelector("#my-reviews-list");
const myReviewsSummary = document.querySelector("#my-reviews-summary");

let selectedFile = null;
let currentAvatarUrl = "";

function escapeHtml(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function renderStaticStars(rating) {
	const normalizedRating = Number(rating) || 0;

	return Array.from({ length: 5 }, (_unused, index) => {
		const isFilled = index < normalizedRating;
		const iconClass = isFilled ? "bi-star-fill text-warning" : "bi-star text-warning";
		return `<i class="bi ${iconClass}" aria-hidden="true"></i>`;
	}).join("");
}

function showAlert(message, type = "danger") {
	if (!alertBox) {
		return;
	}

	alertBox.className = `alert alert-${type} alert-dismissible fade show mb-0`;
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

	alertBox.className = "alert d-none mb-0";
	alertBox.innerHTML = "";
}

function updateAvatarDownloadButton() {
	if (!downloadButton) {
		return;
	}

	const canDownload = Boolean(currentAvatarUrl);
	downloadButton.classList.toggle("d-none", !canDownload);
	downloadButton.disabled = !canDownload;
}

function showMyReviewsAlert(message, type = "danger") {
	if (!myReviewsAlert) {
		return;
	}

	myReviewsAlert.className = `alert alert-${type} mb-0`;
	myReviewsAlert.textContent = message;
}

function hideMyReviewsAlert() {
	if (!myReviewsAlert) {
		return;
	}

	myReviewsAlert.className = "alert d-none";
	myReviewsAlert.textContent = "";
}

function renderMyReviews(reviews) {
	if (!myReviewsList) {
		return;
	}

	if (!reviews.length) {
		myReviewsList.innerHTML =
			'<div class="alert empty-state-box mb-0 d-flex align-items-center gap-2"><i class="bi bi-chat-left-dots empty-state-icon" aria-hidden="true"></i><span>You have not left any reviews yet.</span></div>';
		return;
	}

	myReviewsList.innerHTML = reviews
		.map((review) => {
			const book = review.books || {};
			const title = escapeHtml(book.title || "Untitled");
			const author = escapeHtml(book.author || "Unknown author");
			const coverUrl = book.cover_url ? escapeHtml(book.cover_url) : "";
			const text = escapeHtml(review.review_text || "No written review provided.");
			const rating = Number(review.rating) || 0;
			const createdAt = review.created_at ? new Date(review.created_at).toLocaleString() : "Unknown date";

			return `
				<article class="card shadow-sm mb-3">
					<div class="card-body">
						<div class="d-flex flex-column flex-md-row gap-3">
							<div class="flex-shrink-0 book-detail-cover-frame rounded border bg-body-tertiary" style="width: 120px;">
								${
									coverUrl
										? `<img src="${coverUrl}" alt="Cover for ${title}" class="book-detail-cover" />`
										: '<div class="d-flex align-items-center justify-content-center text-body-secondary h-100 w-100">No cover</div>'
								}
							</div>
							<div class="flex-grow-1">
								<div class="d-flex align-items-center gap-1 mb-2" aria-label="Rating ${rating} out of 5">${renderStaticStars(rating)}</div>
								<h3 class="h6 mb-1">${title}</h3>
								<p class="text-body-secondary mb-1">by ${author}</p>
								<p class="mb-2">${text}</p>
								<small class="text-body-secondary">${escapeHtml(createdAt)}</small>
							</div>
						</div>
					</div>
				</article>
			`;
		})
		.join("");
}

async function loadMyReviews(userId) {
	if (!myReviewsList) {
		return;
	}

	hideMyReviewsAlert();
	myReviewsList.innerHTML =
		'<div class="alert alert-info mb-0 d-flex align-items-center gap-2"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span>Loading your reviews...</span></div>';

	try {
		const reviews = await getReviewsByUser(userId);
		if (myReviewsSummary) {
			myReviewsSummary.textContent = reviews.length
				? `${reviews.length} review${reviews.length === 1 ? "" : "s"}`
				: "No reviews yet";
		}
		renderMyReviews(reviews);
	} catch (error) {
		myReviewsList.innerHTML = "";
		showMyReviewsAlert(error.message || "Unable to load your reviews.");
	}
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
		currentAvatarUrl = "";
		updateAvatarDownloadButton();
		return;
	}

	if (data?.avatar_url) {
		currentAvatarUrl = data.avatar_url;
		previewImage.src = data.avatar_url;
	} else {
		currentAvatarUrl = "";
	}

	updateAvatarDownloadButton();
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
		currentAvatarUrl = "";
		updateAvatarDownloadButton();
		showMyReviewsAlert("Please sign in to view your reviews.", "warning");
		return;
	}

	await loadExistingAvatar(user.id);
	await loadMyReviews(user.id);
	updateAvatarDownloadButton();

	if (downloadButton) {
		downloadButton.addEventListener("click", async () => {
			if (!currentAvatarUrl) {
				return;
			}

			downloadButton.disabled = true;

			try {
				await downloadImageFromUrl(currentAvatarUrl, "avatar.png");
			} catch (error) {
				showAlert(error.message || "Unable to download the avatar.");
			} finally {
				updateAvatarDownloadButton();
			}
		});
	}

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
			currentAvatarUrl = publicUrl;
			previewImage.src = publicUrl;
			updateAvatarDownloadButton();
			showAlert("Avatar uploaded successfully.", "success");
		} catch (error) {
			showAlert(error.message || "Avatar upload failed. Please try again.");
		} finally {
			submitButton.disabled = false;
		}
	});
}

initProfileAvatar();