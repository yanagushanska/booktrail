import * as bootstrap from "bootstrap";
import { getCurrentUserRole, signOut } from "../services/authService.js";
import { supabase } from "../services/supabaseClient.js";

void bootstrap;

export function renderNavbar() {
  return `
    <nav class="navbar navbar-expand-md navbar-light navbar-custom">
      <div class="container">
        <a class="navbar-brand fw-semibold" href="/index.html">
          <i class="bi bi-journal-bookmark me-2" aria-hidden="true"></i>BookTrail
        </a>
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
              <a class="nav-link" href="/index.html"><i class="bi bi-house me-1" aria-hidden="true"></i>Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/pages/library.html"><i class="bi bi-book me-1" aria-hidden="true"></i>My Library</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/pages/profile.html"><i class="bi bi-person me-1" aria-hidden="true"></i>Profile</a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-none" href="/pages/admin.html" data-auth="admin"><i class="bi bi-shield-lock me-1" aria-hidden="true"></i>Admin</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/pages/login.html" data-auth="guest"><i class="bi bi-box-arrow-in-right me-1" aria-hidden="true"></i>Login</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/pages/register.html" data-auth="guest"><i class="bi bi-person-plus me-1" aria-hidden="true"></i>Register</a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-none" href="#" data-auth="auth" data-action="logout"><i class="bi bi-box-arrow-right me-1" aria-hidden="true"></i>Logout</a>
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
  const adminLinks = mountNode.querySelectorAll('[data-auth="admin"]');

  guestLinks.forEach((link) => {
    link.classList.toggle("d-none", hasSession);
  });

  authLinks.forEach((link) => {
    link.classList.toggle("d-none", !hasSession);
  });

  adminLinks.forEach((link) => {
    link.classList.toggle("d-none", !hasSession);
  });
}

function setAdminLinkVisibility(mountNode, isAdmin) {
  const adminLinks = mountNode.querySelectorAll('[data-auth="admin"]');

  adminLinks.forEach((link) => {
    link.classList.toggle("d-none", !isAdmin);
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

    if (!session) {
      setAdminLinkVisibility(mountNode, false);
      return;
    }

    try {
      const { role } = await getCurrentUserRole();
      setAdminLinkVisibility(mountNode, role === "admin");
    } catch (error) {
      console.error("Unable to load current user role", error);
      setAdminLinkVisibility(mountNode, false);
    }
  };

  syncAuthState();

  supabase.auth.onAuthStateChange(() => {
    syncAuthState();
  });
}