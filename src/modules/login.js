

/* ============================================================
login.js — TaskFlow authentication UI logic
Demonstrates JWT-based session persistence: tokens are
stored in localStorage so the role & session survive full
page refreshes without re-authentication.
============================================================ */
(function () {
"use strict";

// ---- Demo "backend" -------------------------------------------------
const DEMO_ACCOUNT = {
email: "demo@taskflow.local",
password: "taskflow123",
name: "Jordan Avery",
role: "Product Manager",
};

let session = null; // { name, role, email } | null

// Registered users key (matches register.js STORAGE_KEY)
var REGISTERED_USERS_KEY = "taskflow_users";

// ---- Element refs ----------------------------------------------------
const form = document.getElementById("loginForm");
const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");
const emailHint = document.getElementById("emailHint");
const passwordHint = document.getElementById("passwordHint");
const errorBox = document.getElementById("loginError");
const errorText = document.getElementById("loginErrorText");
const submitBtn = document.getElementById("submitBtn");
const togglePassword = document.getElementById("togglePassword");
const eyeIcon = document.getElementById("eyeIcon");
const forgotBtn = document.getElementById("forgotBtn");
const googleFallback = document.getElementById("googleFallbackBtn");
const signupFooter = document.getElementById("signupFooter");
const signupLink = document.getElementById("signupLink");

const sessionView = document.getElementById("loginSession");
const sessionAvatar = document.getElementById("sessionAvatar");
const sessionName = document.getElementById("sessionName");
const sessionRole = document.getElementById("sessionRole");
const logoutBtn = document.getElementById("logoutBtn");

const toast = document.getElementById("toast");

// ---- Helpers -----------------------------------------------------------
function showToast(message) {
toast.textContent = message;
toast.classList.add("login-toast--visible");
clearTimeout(showToast._t);
showToast._t = setTimeout(() => toast.classList.remove("login-toast--visible"), 2600);
}

function initials(name) {
return name
.split(" ")
.map((p) => p[0])
.slice(0, 2)
.join("")
.toUpperCase();
}

function setFieldError(input, hintEl, message) {
if (message) {
input.setAttribute("aria-invalid", "true");
hintEl.textContent = message;
} else {
input.removeAttribute("aria-invalid");
hintEl.textContent = "";
}
}

function showFormError(message) {
errorText.textContent = message;
errorBox.hidden = false;
}

function hideFormError() {
errorBox.hidden = true;
errorText.textContent = "";
}

function isValidEmail(value) {
return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Checks if the input looks like a username (no @ symbol).
 * @param {string} value
 * @returns {boolean}
 */
function isUsername(value) {
return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length > 0;
}

function setLoading(isLoading) {
submitBtn.disabled = isLoading;
submitBtn.classList.toggle("login-form__submit--loading", isLoading);
submitBtn.querySelector(".login-form__submit-label").textContent = isLoading
? "Signing in…"
: "Sign In";
}

function persistSession() {
if (!session) return;
var token = window.JWT.create({
name: session.name,
role: session.role,
email: session.email,
});
window.JWT.save(token);
}

function redirectToDashboard() {
setTimeout(function () {
window.location.href = "../../index.html";
}, 800);
}

function renderSession() {
if (!session) return;
persistSession();
sessionAvatar.textContent = initials(session.name);
sessionName.textContent = session.name;
sessionRole.textContent = session.role;
form.hidden = true;
signupFooter.hidden = true;
sessionView.hidden = false;
}

function renderLoginForm() {
form.hidden = false;
signupFooter.hidden = false;
sessionView.hidden = true;
form.reset();
hideFormError();
setFieldError(emailInput, emailHint, "");
setFieldError(passwordInput, passwordHint, "");
}

// ---- Password visibility toggle ----------------------------------------
togglePassword.addEventListener("click", () => {
const isPassword = passwordInput.type === "password";
passwordInput.type = isPassword ? "text" : "password";
togglePassword.setAttribute("aria-pressed", String(isPassword));
togglePassword.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
eyeIcon.innerHTML = isPassword
? '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.6 21.6 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
});

// ---- Live validation ----------------------------------------------------
emailInput.addEventListener("input", () => setFieldError(emailInput, emailHint, ""));
passwordInput.addEventListener("input", () => setFieldError(passwordInput, passwordHint, ""));

// ---- Form submit ----------------------------------------------------
form.addEventListener("submit", (event) => {
event.preventDefault();
hideFormError();

const loginValue = emailInput.value.trim();
const password = passwordInput.value;

let hasError = false;
if (!loginValue) {
setFieldError(emailInput, emailHint, "Username or email is required.");
hasError = true;
}
if (!password) {
setFieldError(passwordInput, passwordHint, "Password is required.");
hasError = true;
} else if (password.length < 6) {
setFieldError(passwordInput, passwordHint, "Password must be at least 6 characters.");
hasError = true;
}
if (hasError) return;

setLoading(true);

// Simulate a network round-trip
setTimeout(() => {
setLoading(false);

// Try demo account — check by both email and username
var demoMatches =
(loginValue.toLowerCase() === DEMO_ACCOUNT.email || loginValue.toLowerCase() === DEMO_ACCOUNT.name.toLowerCase()) &&
password === DEMO_ACCOUNT.password;

if (demoMatches) {
session = {
name: DEMO_ACCOUNT.name,
role: DEMO_ACCOUNT.role,
email: DEMO_ACCOUNT.email,
};
renderSession();
showToast("Signed in successfully.");
redirectToDashboard();
return;
}

// Fallback: check registered users from localStorage
try {
var raw = localStorage.getItem(REGISTERED_USERS_KEY);
var registeredUsers = raw ? JSON.parse(raw) : [];
var found = registeredUsers.find(function (u) {
return (
(u.username.toLowerCase() === loginValue.toLowerCase() ||
(u.email && u.email.toLowerCase() === loginValue.toLowerCase())) &&
u.password === password
);
});
if (found) {
session = {
name: found.username,
role: found.role,
email: found.email || found.username + "@taskflow.local",
};
renderSession();
showToast("Signed in successfully.");
redirectToDashboard();
return;
}
} catch (_) { /* ignore parse errors */ }

showFormError("That username/email and password don't match our records.");
passwordInput.focus();
}, 700);
});

// ---- Forgot password ----------------------------------------------------
forgotBtn.addEventListener("click", () => {
const email = emailInput.value.trim();
showToast(
email && isValidEmail(email)
? `Password reset link sent to ${email} (demo).`
: "Enter your email above first, then try again."
);
});

  // ---- Google Identity Services (real) -------------------------------------
  var GOOGLE_CLIENT_ID =
    window.TASKFLOW_GOOGLE_CLIENT_ID ||
    localStorage.getItem('taskflow_google_client_id') ||
    null;

  function parseGoogleCredential(credential) {
    try {
      var parts = credential.split('.');
      if (parts.length !== 3) return null;
      var raw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (raw.length % 4) raw += '=';
      return JSON.parse(atob(raw));
    } catch (_) { return null; }
  }

  function handleGoogleCredential(response) {
    var payload = parseGoogleCredential(response.credential);
    if (!payload) {
      showFormError('Google Sign-In failed. Please try again.');
      return;
    }
    session = {
      name: payload.name || (payload.email ? payload.email.split('@')[0] : 'User'),
      role: 'Team Member',
      email: payload.email,
      picture: payload.picture || null,
    };
    renderSession();
    showToast('Signed in with Google.');
    redirectToDashboard();
  }

  function initGoogleSignIn() {
    if (!GOOGLE_CLIENT_ID || typeof google === 'undefined' || !google.accounts) {
      return false;
    }
    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: false,
      });
      var btnContainer = document.getElementById('googleSignInBtn');
      if (btnContainer) {
        btnContainer.innerHTML = '';
        google.accounts.id.renderButton(btnContainer, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: btnContainer.offsetWidth || 400,
        });
      }
      console.log(
        'GSI initialized for origin: ' + window.location.origin + '\n' +
        'If Google Sign-In shows "invalid_client" or "no registered origin",\n' +
        'add this exact origin to the Google Cloud Console:\n' +
        '  → https://console.cloud.google.com/apis/credentials\n' +
        '  → Edit OAuth 2.0 Client ID → Authorized JavaScript origins\n' +
        '  → Add: ' + window.location.origin
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  function initGoogleWhenReady(attempts) {
    attempts = attempts || 0;
    if (attempts > 20) return;
    if (!initGoogleSignIn()) {
      setTimeout(function () { initGoogleWhenReady(attempts + 1); }, 250);
    }
  }

  // Fallback click handler — used when GSI is unavailable
  googleFallback.addEventListener('click', function () {
    setLoading(true);
    setTimeout(function () {
      setLoading(false);
      session = { name: 'Alex Rivera', role: 'Signed in with Google', email: 'alex.rivera@gmail.com' };
      renderSession();
      showToast('Signed in with Google (demo).');
      redirectToDashboard();
    }, 700);
  });

  // Try to upgrade to real GSI
  if (GOOGLE_CLIENT_ID) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { initGoogleWhenReady(); });
    } else {
      initGoogleWhenReady();
    }
  }

// ---- Sign up link (navigates to register page) ---------------------------

// ---- Logout ----------------------------------------------------
logoutBtn.addEventListener("click", () => {
session = null;
window.JWT.remove();
renderLoginForm();
showToast("You've been signed out.");
});

// ---- Auto-restore session from JWT on page load ---------------
var restored = window.JWT.getSession();
if (restored) {
session = {
name: restored.name,
role: restored.role,
email: restored.email,
};
renderSession();
showToast("Session restored. Redirecting…");
redirectToDashboard();
}

    // ---- Google Identity Services — loaded from accounts.google.com/gsi/client
    // Set TASKFLOW_GOOGLE_CLIENT_ID in localStorage or window to enable real GSI.
    // Without a client ID, the fallback demo button is used.

})();

