// =====================================================
//  🔐 PAGE‑SPECIFIC LOGIN CREDENTIALS
//  Change these values for each page as you like
// =====================================================
const PAGE_CREDENTIALS = {
  'index.html': { username: '1', password: '1' },      // Data Entry page
  'view.html':  { username: '2', password: '2' }       // Data Viewer page
};
// =====================================================

function getCurrentPageKey() {
  const path = window.location.pathname;
  if (path.includes('view.html')) return 'view.html';
  if (path.includes('index.html')) return 'index.html';
  // default: treat root or unknown as index
  return 'index.html';
}

function checkAuth() {
  const authenticated = localStorage.getItem('datavault_authenticated') === 'true';
  const authPage = localStorage.getItem('datavault_page');
  const currentPage = getCurrentPageKey();
  return authenticated && authPage === currentPage;
}

function setAuth() {
  localStorage.setItem('datavault_authenticated', 'true');
  localStorage.setItem('datavault_page', getCurrentPageKey());
}

function clearAuth() {
  localStorage.removeItem('datavault_authenticated');
  localStorage.removeItem('datavault_page');
}

function toggleOverlay() {
  const overlay = document.getElementById('loginOverlay');
  const mainContent = document.getElementById('mainContent');
  if (checkAuth()) {
    overlay.style.display = 'none';
    mainContent.style.display = 'block';
  } else {
    overlay.style.display = 'flex';
    mainContent.style.display = 'none';
  }
}

function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const error = document.getElementById('loginError');

  const pageKey = getCurrentPageKey();
  const creds = PAGE_CREDENTIALS[pageKey];

  if (!creds) {
    error.textContent = 'No credentials defined for this page';
    error.style.display = 'block';
    return;
  }

  if (user === creds.username && pass === creds.password) {
    setAuth();
    toggleOverlay();
    // If we're on the view page, reload data
    if (typeof loadAllData === 'function') loadAllData();
  } else {
    error.textContent = 'Invalid username or password';
    error.style.display = 'block';
  }
}

function logout() {
  clearAuth();
  toggleOverlay();
}

// Initialise when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (form) form.addEventListener('submit', handleLogin);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  toggleOverlay();

  // If already authenticated for this page and we're on the view page, load data
  if (checkAuth() && typeof loadAllData === 'function') {
    loadAllData();
  }
});
