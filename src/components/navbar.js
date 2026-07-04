export function renderNavbar(pathPrefix = "./") {
  // TODO: Replace Login/Register with Logout when auth state is authenticated.
  return `
    <nav class="navbar navbar-expand-lg bg-body-tertiary border-bottom">
      <div class="container">
        <a class="navbar-brand fw-semibold" href="${pathPrefix}index.html">BookTrail</a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#booktrailNavbar"
          aria-controls="booktrailNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="booktrailNavbar">
          <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" href="${pathPrefix}index.html">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="${pathPrefix}pages/library.html">My Library</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="${pathPrefix}pages/profile.html">Profile</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="${pathPrefix}pages/login.html">Login / Register</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `;
}