// ==========================================
// 🔐 LOGIN CREDENTIALS – CHANGE THESE VALUES
// ==========================================
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'DataVault2024';
// ==========================================

function checkAuth() {
  return sessionStorage.getItem('datavault_authenticated') === 'true';
}

function setAuth() {
  sessionStorage.setItem('datavault_authenticated', 'true');
}

function clearAuth() {
  sessionStorage.removeItem('datavault_authenticated');
}

// Show / hide overlay based on auth state
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

// Handle login form submission
function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const error = document.getElementById('loginError');

  if (user === VALID_USERNAME && pass === VALID_PASSWORD) {
    setAuth();
    toggleOverlay();
    // If view page, refresh data
    if (typeof loadAllData === 'function') loadAllData();
  } else {
    error.textContent = 'Invalid username or password';
    error.style.display = 'block';
  }
}

// Logout action
function logout() {
  clearAuth();
  toggleOverlay();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Attach login form event
  const form = document.getElementById('loginForm');
  if (form) form.addEventListener('submit', handleLogin);

  // Attach logout button if present
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // Show appropriate view
  toggleOverlay();

  // If already authenticated and view page, load data
  if (checkAuth() && typeof loadAllData === 'function') {
    loadAllData();
  }
});