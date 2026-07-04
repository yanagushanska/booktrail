function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderBookCard(book) {
  const title = escapeHtml(book?.title || "Untitled");
  const author = escapeHtml(book?.author || "Unknown author");
  const description = escapeHtml(book?.description || "No description available yet.");

  return `
    <div class="col-12 col-sm-6 col-lg-4">
      <article class="card h-100 shadow-sm">
        <div class="card-body">
          <h3 class="h5 card-title mb-2">${title}</h3>
          <p class="text-body-secondary mb-2">by ${author}</p>
          <p class="card-text mb-0">${description}</p>
        </div>
      </article>
    </div>
  `;
}