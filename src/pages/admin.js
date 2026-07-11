import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";
import "../styles/main.css";
import { mountNavbar } from "../components/navbar.js";
import { getCurrentUser } from "../services/authService.js";
import { getAllUsersWithRoles, updateUserRole } from "../services/adminService.js";
import { createBook, deleteBook, getAllBooks, updateBook } from "../services/booksService.js";
import { uploadBookCover } from "../services/storageService.js";
import { requireAdmin } from "../utils/roleGuard.js";

await requireAdmin();

const navbarMount = document.querySelector("#navbar-mount");
const alertBox = document.querySelector("#admin-alert");
const content = document.querySelector("#admin-content");
const form = document.querySelector("#add-book-form");
const titleInput = document.querySelector("#book-title");
const authorInput = document.querySelector("#book-author");
const genreInput = document.querySelector("#book-genre");
const descriptionInput = document.querySelector("#book-description");
const coverFileInput = document.querySelector("#book-cover-file");
const coverPreview = document.querySelector("#book-cover-preview");
const submitButton = document.querySelector("#add-book-submit");
const booksTableBody = document.querySelector("#books-table-body");
const usersTableBody = document.querySelector("#users-table-body");

let selectedCoverFile = null;
let booksCache = [];
let usersCache = [];
let isPermissionLoading = false;

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
	alertBox.textContent = "";
}

function setPermissionLoading(nextValue) {
	isPermissionLoading = nextValue;

	if (isPermissionLoading) {
		showAlert("Checking permissions...", "info");
		return;
	}

	if (alertBox?.textContent === "Checking permissions...") {
		hideAlert();
	}
}

function updateCoverPreview(file) {
	if (!coverPreview || !file) {
		return;
	}

	const objectUrl = URL.createObjectURL(file);
	coverPreview.src = objectUrl;
}

function renderBooksTable(items) {
	if (!booksTableBody) {
		return;
	}

	if (!items.length) {
		booksTableBody.innerHTML =
			'<tr><td colspan="4"><div class="alert empty-state-box mb-0 d-flex align-items-center gap-2"><i class="bi bi-inbox empty-state-icon" aria-hidden="true"></i><span>No books found.</span></div></td></tr>';
		return;
	}

	booksTableBody.innerHTML = items
		.map(
			(book) => `
			<tr>
				<td>${book.title ?? "Untitled"}</td>
				<td>${book.author ?? "Unknown"}</td>
				<td>${book.genre ?? "-"}</td>
				<td>
					<div class="d-flex gap-2">
						<button class="btn btn-sm btn-outline-primary" data-action="edit" data-book-id="${book.id}">Edit</button>
						<button class="btn btn-sm btn-outline-danger" data-action="delete" data-book-id="${book.id}">Delete</button>
					</div>
				</td>
			</tr>
		`,
		)
		.join("");
}

function renderUsersTable(items) {
	if (!usersTableBody) {
		return;
	}

	if (!items.length) {
		usersTableBody.innerHTML =
			'<tr><td colspan="2"><div class="alert empty-state-box mb-0 d-flex align-items-center gap-2"><i class="bi bi-people empty-state-icon" aria-hidden="true"></i><span>No users found.</span></div></td></tr>';
		return;
	}

	usersTableBody.innerHTML = items
		.map(
			(user) => `
			<tr>
				<td>${user.username ?? user.email ?? user.id}</td>
				<td>
					<select class="form-select form-select-sm" data-user-role-select data-user-id="${user.id}">
						<option value="user" ${user.role === "user" ? "selected" : ""}>user</option>
						<option value="admin" ${user.role === "admin" ? "selected" : ""}>admin</option>
					</select>
				</td>
			</tr>
		`,
		)
		.join("");
}

async function loadBooksTable() {
	if (!booksTableBody) {
		return;
	}

	booksTableBody.innerHTML =
		'<tr><td colspan="4" class="text-body-secondary"><div class="d-flex align-items-center gap-2"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span>Loading books...</span></div></td></tr>';

	try {
		booksCache = await getAllBooks();
		renderBooksTable(booksCache);
	} catch (error) {
		booksTableBody.innerHTML =
			'<tr><td colspan="4" class="text-danger">Failed to load books.</td></tr>';
		showAlert(error.message || "Failed to load books.");
	}
}

async function loadUsersTable() {
	if (!usersTableBody) {
		return;
	}

	usersTableBody.innerHTML =
		'<tr><td colspan="2" class="text-body-secondary"><div class="d-flex align-items-center gap-2"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span>Loading users...</span></div></td></tr>';

	try {
		usersCache = await getAllUsersWithRoles();
		console.log("[Admin Users:getAllUsersWithRoles result]", usersCache);
		renderUsersTable(usersCache);
	} catch (error) {
		usersTableBody.innerHTML =
			'<tr><td colspan="2" class="text-danger">Failed to load users.</td></tr>';
		showAlert(error.message || "Failed to load users.");
	}
}

async function handleEdit(bookId) {
	const book = booksCache.find((entry) => String(entry.id) === String(bookId));

	if (!book) {
		showAlert("Book not found.");
		return;
	}

	const nextTitle = window.prompt("Edit title", book.title ?? "");

	if (nextTitle === null) {
		return;
	}

	const nextAuthor = window.prompt("Edit author", book.author ?? "");

	if (nextAuthor === null) {
		return;
	}

	const nextGenre = window.prompt("Edit genre", book.genre ?? "");

	if (nextGenre === null) {
		return;
	}

	const nextDescription = window.prompt("Edit description", book.description ?? "");

	if (nextDescription === null) {
		return;
	}

	try {
		await updateBook(bookId, {
			title: nextTitle,
			author: nextAuthor,
			genre: nextGenre,
			description: nextDescription,
		});

		showAlert("Book updated successfully.", "success");
		await loadBooksTable();
	} catch (error) {
		showAlert(error.message || "Failed to update book.");
	}
}

async function handleDelete(bookId) {
	const shouldDelete = window.confirm("Delete this book?");

	if (!shouldDelete) {
		return;
	}

	try {
		await deleteBook(bookId);
		showAlert("Book deleted.", "success");
		await loadBooksTable();
	} catch (error) {
		showAlert(error.message || "Failed to delete book.");
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
			await loadBooksTable();
		} catch (error) {
			showAlert(error.message || "Failed to add book.");
		} finally {
			submitButton.disabled = false;
		}
	});
}

if (booksTableBody) {
	booksTableBody.addEventListener("click", async (event) => {
		const target = event.target;

		if (!(target instanceof HTMLButtonElement)) {
			return;
		}

		const action = target.dataset.action;
		const bookId = target.dataset.bookId;

		if (!action || !bookId) {
			return;
		}

		if (action === "edit") {
			await handleEdit(bookId);
			return;
		}

		if (action === "delete") {
			await handleDelete(bookId);
		}
	});
}

if (usersTableBody) {
	usersTableBody.addEventListener("change", async (event) => {
		const target = event.target;

		if (!(target instanceof HTMLSelectElement) || !target.matches("[data-user-role-select]")) {
			return;
		}

		const userId = target.dataset.userId;
		const nextRole = target.value;

		if (!userId || !nextRole) {
			return;
		}

		target.disabled = true;

		try {
			await updateUserRole(userId, nextRole);
			showAlert(`Role updated to ${nextRole}.`, "success");
			await loadUsersTable();
		} catch (error) {
			showAlert(error.message || "Failed to update role.");
			await loadUsersTable();
		} finally {
			target.disabled = false;
		}
	});
}

async function initAdminPage() {
	if (!content) {
		return;
	}

	setPermissionLoading(true);

	try {
		const user = await getCurrentUser();

		if (!user?.id) {
			content.classList.add("d-none");
			showAlert("Access is restricted.", "warning");
			return;
		}

		hideAlert();
		content.classList.remove("d-none");
		await Promise.all([loadBooksTable(), loadUsersTable()]);
	} catch (error) {
		content.classList.add("d-none");
		showAlert(error.message || "Access is restricted.", "warning");
	} finally {
		setPermissionLoading(false);
	}
}

initAdminPage();