function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderBookCard(book) {
  const id = encodeURIComponent(String(book?.id ?? ""));
  const title = escapeHtml(book?.title || "Untitled");
  const author = escapeHtml(book?.author || "Unknown author");
  const genre = escapeHtml(book?.genre || "Not specified");
  const coverUrl = book?.cover_url ? escapeHtml(book.cover_url) : "";

  return `
    <div class="col">
      <a
        href="/pages/book.html?id=${id}"
        class="book-card-link text-decoration-none text-reset d-block h-100"
        aria-label="Open details for ${title}"
      >
        <article class="card book-card position-relative">
          <div class="book-card-media">
            ${
              coverUrl
                ? `<img src="${coverUrl}" alt="Cover for ${title}" class="book-card-cover" />`
                : '<div class="book-card-placeholder"><i class="bi bi-book fs-2" aria-hidden="true"></i></div>'
            }
          </div>
          <div class="card-body book-card-body py-3 px-3">
            <div class="book-card-title-row">
              <h3 class="h6 card-title mb-0">${title}</h3>
            </div>
            <div class="book-card-author-row">
              <p class="book-card-author text-body-secondary mb-0">by ${author}</p>
            </div>
            <div class="book-card-genre-row">
              <span class="badge badge-oxblood-soft book-card-genre">${genre}</span>
            </div>
            <span class="stretched-link" aria-hidden="true"></span>
          </div>
        </article>
      </a>
    </div>
  `;
}