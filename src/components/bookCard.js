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
  const description = escapeHtml(book?.description || "No description available yet.");
  const coverUrl = book?.cover_url ? escapeHtml(book.cover_url) : "";

  return `
    <div class="col-12 col-md-6 col-lg-4">
      <a
        href="/pages/book.html?id=${id}"
        class="book-card-link text-decoration-none text-reset d-block h-100"
        aria-label="Open details for ${title}"
      >
        <article class="card book-card h-100 position-relative">
          <div class="book-card-media">
            ${
              coverUrl
                ? `<img src="${coverUrl}" alt="Cover for ${title}" class="book-card-cover" />`
                : '<div class="book-card-placeholder"><i class="bi bi-book fs-2" aria-hidden="true"></i></div>'
            }
          </div>
          <div class="card-body">
            <h3 class="h5 card-title mb-2">${title}</h3>
            <p class="text-body-secondary mb-2">by ${author}</p>
            <p class="card-text mb-0">${description}</p>
            <span class="stretched-link" aria-hidden="true"></span>
          </div>
        </article>
      </a>
    </div>
  `;
}