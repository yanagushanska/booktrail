import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/main.css";
import { mountNavbar } from "../components/navbar.js";
import { getUserBooks, updateStatus } from "../services/libraryService.js";
import { requireAuth } from "../utils/roleGuard.js";

await requireAuth();

const navbarMount = document.querySelector("#navbar-mount");
const page = document.querySelector("#library-page");
const alertBox = document.querySelector("#library-alert");
const wantToReadList = document.querySelector("#want-to-read-list");
const readingList = document.querySelector("#reading-list");
const finishedList = document.querySelector("#finished-list");

const STATUS_LABELS = {
	want_to_read: "Want to Read",
	reading: "Reading",
	finished: "Finished",
};

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
	alertBox.textContent = "";
}

function renderLoadingState(container) {
	if (!container) {
		return;
	}

	container.innerHTML =
		'<div class="col-12"><div class="alert alert-info mb-0 d-flex align-items-center gap-2"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span>Loading...</span></div></div>';
}

function getStatusBadgeClass(status) {
	if (status === "reading") {
		return "status-badge--reading";
	}

	if (status === "finished") {
		return "status-badge--finished";
	}

	return "status-badge--want";
}

function renderStatusList(container, entries, emptyMessage) {
	if (!container) {
		return;
	}

	if (!entries.length) {
		container.innerHTML = `<div class="col-12"><div class="alert empty-state-box mb-0 d-flex align-items-center gap-2"><i class="bi bi-inbox empty-state-icon" aria-hidden="true"></i><span>${emptyMessage}</span></div></div>`;
		return;
	}

	container.innerHTML = entries
		.map((entry) => {
			const book = entry.books || {};
			const bookId = encodeURIComponent(String(entry.book_id || ""));
			const title = escapeHtml(book.title || "Untitled");
			const author = escapeHtml(book.author || "Unknown author");
			const description = escapeHtml(book.description || "No description available.");
			const coverUrl = book.cover_url ? escapeHtml(book.cover_url) : "";
			const statusLabel = escapeHtml(STATUS_LABELS[entry.status] || "Want to Read");
			const statusBadgeClass = getStatusBadgeClass(entry.status);

			return `
				<div class="col-12 col-md-6 col-lg-4">
					<article class="card book-card h-100">
						<div class="book-card-media">
							${
								coverUrl
									? `<img src="${coverUrl}" alt="Cover for ${title}" class="book-card-cover" />`
									: '<div class="book-card-placeholder"><i class="bi bi-book fs-2" aria-hidden="true"></i></div>'
							}
						</div>
						<div class="card-body d-flex flex-column">
							<h2 class="h5 card-title mb-2">${title}</h2>
							<p class="text-body-secondary mb-2">by ${author}</p>
							<p class="card-text mb-3">${description}</p>
							<div class="mt-auto d-flex flex-column gap-2">
								<div class="d-flex align-items-center justify-content-between gap-2">
									<label class="form-label mb-0 small" for="status-${entry.id}">Status</label>
									<span class="badge ${statusBadgeClass}">${statusLabel}</span>
								</div>
								<select
									id="status-${entry.id}"
									class="form-select form-select-sm"
									data-status-select
									data-user-book-id="${entry.id}"
								>
									<option value="want_to_read" ${entry.status === "want_to_read" ? "selected" : ""}>Want to Read</option>
									<option value="reading" ${entry.status === "reading" ? "selected" : ""}>Reading</option>
									<option value="finished" ${entry.status === "finished" ? "selected" : ""}>Finished</option>
								</select>
								<a class="btn btn-outline-primary btn-sm" href="/pages/book.html?id=${bookId}">View Book</a>
							</div>
						</div>
					</article>
				</div>
			`;
		})
		.join("");
}

async function loadLibrary() {
	hideAlert();

	renderLoadingState(wantToReadList);
	renderLoadingState(readingList);
	renderLoadingState(finishedList);

	try {
		const [wantToRead, reading, finished] = await Promise.all([
			getUserBooks("want_to_read"),
			getUserBooks("reading"),
			getUserBooks("finished"),
		]);

		renderStatusList(wantToReadList, wantToRead, "No books in Want to Read.");
		renderStatusList(readingList, reading, "No books in Reading.");
		renderStatusList(finishedList, finished, "No books in Finished.");
	} catch (error) {
		const message = error.message || "Failed to load your library.";
		const isAuthError = message.toLowerCase().includes("logged in");
		showAlert(message, isAuthError ? "warning" : "danger");

		if (wantToReadList) {
			wantToReadList.innerHTML = "";
		}
		if (readingList) {
			readingList.innerHTML = "";
		}
		if (finishedList) {
			finishedList.innerHTML = "";
		}
	}
}

if (page) {
	page.addEventListener("change", async (event) => {
		const target = event.target;

		if (!(target instanceof HTMLSelectElement) || !target.matches("[data-status-select]")) {
			return;
		}

		hideAlert();

		const userBookId = target.dataset.userBookId;
		const nextStatus = target.value;

		if (!userBookId) {
			showAlert("Unable to update this book right now.");
			return;
		}

		target.disabled = true;

		try {
			await updateStatus(userBookId, nextStatus);
			showAlert(`Moved to ${STATUS_LABELS[nextStatus]}.`, "success");
			await loadLibrary();
		} catch (error) {
			showAlert(error.message || "Failed to update status.");
		} finally {
			target.disabled = false;
		}
	});
}

loadLibrary();