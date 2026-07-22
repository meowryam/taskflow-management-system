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
    const form            = document.getElementById("loginForm");
    const emailInput      = document.getElementById("loginEmail");
    const passwordInput   = document.getElementById("loginPassword");
    const emailHint       = document.getElementById("emailHint");
    const passwordHint    = document.getElementById("passwordHint");
    const errorBox        = document.getElementById("loginError");
    const errorText       = document.getElementById("loginErrorText");
    const submitBtn       = document.getElementById("submitBtn");
    const togglePassword  = document.getElementById("togglePassword");
    const eyeIcon         = document.getElementById("eyeIcon");
    const forgotBtn       = document.getElementById("forgotBtn");
    const googleFallback  = document.getElementById("googleFallbackBtn");
    const signupFooter    = document.getElementById("signupFooter");
    const signupLink      = document.getElementById("signupLink");

    const sessionView   = document.getElementById("loginSession");
    const sessionAvatar = document.getElementById("sessionAvatar");
    const sessionName   = document.getElementById("sessionName");
    const sessionRole   = document.getElementById("sessionRole");
    const logoutBtn     = document.getElementById("logoutBtn");

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

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      let hasError = false;
      if (!email) {
        setFieldError(emailInput, emailHint, "Email is required.");
        hasError = true;
      } else if (!isValidEmail(email)) {
        setFieldError(emailInput, emailHint, "Enter a valid email address.");
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
        var matches =
          email.toLowerCase() === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password;

        if (matches) {
          session = {
            name: DEMO_ACCOUNT.name,
            role: DEMO_ACCOUNT.role,
            email: DEMO_ACCOUNT.email,
          };
          renderSession();
          showToast("Signed in successfully.");
          return;
        }

        // Fallback: check registered users from localStorage
        try {
          var raw = localStorage.getItem(REGISTERED_USERS_KEY);
          var registeredUsers = raw ? JSON.parse(raw) : [];
          var found = registeredUsers.find(function (u) {
            return (
              u.username.toLowerCase() === email.toLowerCase() &&
              u.password === password
            );
          });
          if (found) {
            session = {
              name: found.username,
              role: found.role,
              email: found.username + "@taskflow.local",
            };
            renderSession();
            showToast("Signed in successfully.");
            return;
          }
        } catch (_) { /* ignore parse errors */ }

        showFormError("That email and password don't match our records.");
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

    // ---- Google sign-in fallback --------------------------------------------
    googleFallback.addEventListener("click", () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        session = { name: "Alex Rivera", role: "Signed in with Google", email: "alex.rivera@gmail.com" };
        renderSession();
        showToast("Signed in with Google.");
      }, 700);
    });

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
      showToast("Session restored.");
    }

    // ---- Google Identity Services (progressive enhancement) ----------------
    // In production, accounts.google.com/gsi/client would render its own
    // button into #googleSignInBtn, replacing the fallback below it.
    // This sandboxed demo intentionally skips loading the external script.

  })();