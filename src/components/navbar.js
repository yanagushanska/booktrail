import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { signOut } from "../services/authService.js";
import { supabase } from "../services/supabaseClient.js";

export function renderNavbar() {
  return `
    <nav class="navbar navbar-expand-md navbar-light bg-light border-bottom">
      <div class="container">
        <a class="navbar-brand fw-semibold" href="/index.html">BookTrail</a>
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
          <ul class="navbar-nav ms-auto mb-2 mb-md-0">
            <li class="nav-item">
              <a class="nav-link" href="/index.html">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/pages/library.html">My Library</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/pages/profile.html">Profile</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/pages/login.html" data-auth="guest">Login</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/pages/register.html" data-auth="guest">Register</a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-none" href="#" data-auth="auth" data-action="logout">Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `;
}

function setAuthLinksVisibility(mountNode, hasSession) {
  const guestLinks = mountNode.querySelectorAll('[data-auth="guest"]');
  const authLinks = mountNode.querySelectorAll('[data-auth="auth"]');

  guestLinks.forEach((link) => {
    link.classList.toggle("d-none", hasSession);
  });

  authLinks.forEach((link) => {
    link.classList.toggle("d-none", !hasSession);
  });
}

export function mountNavbar(mountNode) {
  if (!mountNode) {
    return;
  }

  mountNode.innerHTML = renderNavbar();

  const logoutLink = mountNode.querySelector('[data-action="logout"]');

  if (!logoutLink) {
    return;
  }

  logoutLink.addEventListener("click", async (event) => {
    event.preventDefault();

    try {
      await signOut();
      window.location.href = "/index.html";
    } catch (error) {
      // Keep shell simple for now; auth error handling UI can be centralized later.
      console.error("Sign out failed", error);
    }
  });

  const syncAuthState = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setAuthLinksVisibility(mountNode, Boolean(session));
  };

  syncAuthState();

  supabase.auth.onAuthStateChange((_event, session) => {
    setAuthLinksVisibility(mountNode, Boolean(session));
  });
}