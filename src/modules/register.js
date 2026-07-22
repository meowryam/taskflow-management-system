/**
 * TaskFlow - Registration Logic
 * Keeps data storage and validation isolated from UI logic.
 */

const STORAGE_KEY = 'taskflow_users';

// Default initial users (Matches standard data structure from /scripts)
const INITIAL_USERS = [
  { id: 1, username: 'admin_user', password: 'password123', role: 'Admin', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 2, username: 'manager_john', password: 'password123', role: 'Manager', createdAt: '2026-01-02T00:00:00.000Z' },
  { id: 3, username: 'team_member', password: 'password123', role: 'Team Member', createdAt: '2026-01-03T00:00:00.000Z' }
];

/* ==========================================
   DATA LAYER (Storage & Database Operations)
   ========================================== */

/**
 * Retrieves existing users from localStorage or initializes default script data.
 * @returns {Array<Object>}
 */
function getExistingUsers() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    // Seed initial structure if first run
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse user data from storage', e);
    return [];
  }
}

/**
 * Persists a new user into the storage structure.
 * @param {Object} newUser 
 * @returns {Array<Object>} Updated array of users
 */
function saveUser(newUser) {
  const currentUsers = getExistingUsers();
  const updatedUsers = [...currentUsers, newUser];
  
  // Persist to localStorage so the login page reads it immediately without refresh
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
  
  return updatedUsers;
}

/* ==========================================
   LOGIC LAYER (Validation & Formatting)
   ========================================== */

/**
 * Evaluates password strength and returns a score (0-4) and list of unmet requirements.
 * @param {string} password
 * @returns {{ score: number, errors: string[], isValid: boolean }}
 */
function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('At least 1 uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('At least 1 lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('At least 1 number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('At least 1 special character (!@#$...)');
  }

  const metCount = 5 - errors.length;
  return { score: metCount, errors, isValid: metCount === 5 };
}

/**
 * Validates email format.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates registration inputs.
 * @param {string} username 
 * @param {string} email
 * @param {string} password 
 * @param {string} role 
 * @param {Array<Object>} existingUsers 
 * @returns {{ isValid: boolean, error: string|null }}
 */
function validateRegistration(username, email, password, role, existingUsers) {
  const cleanUsername = username.trim();
  const cleanEmail = email.trim();

  if (!cleanUsername) {
    return { isValid: false, error: 'Please enter a username.' };
  }
  if (cleanUsername.length < 4) {
    return { isValid: false, error: 'Username must be at least 4 characters long.' };
  }
  if (!cleanEmail) {
    return { isValid: false, error: 'Please enter an email address.' };
  }
  if (!isValidEmail(cleanEmail)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }
  if (!password) {
    return { isValid: false, error: 'Please enter a password.' };
  }
  if (!role) {
    return { isValid: false, error: 'Please select a role.' };
  }

  const strength = validatePasswordStrength(password);
  if (!strength.isValid) {
    return { isValid: false, error: 'Password is not strong enough. Meet all requirements below.' };
  }

  const duplicateUsername = existingUsers.some(
    (user) => user.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (duplicateUsername) {
    return { isValid: false, error: 'Username is already taken. Please choose another.' };
  }

  const duplicateEmail = existingUsers.some(
    (user) => user.email && user.email.toLowerCase() === cleanEmail.toLowerCase()
  );

  if (duplicateEmail) {
    return { isValid: false, error: 'Email is already registered. Please use another.' };
  }

  return { isValid: true, error: null };
}

/**
 * Formats a new user object matching the exact /scripts user schema.
 * @param {string} username 
 * @param {string} email
 * @param {string} password 
 * @param {string} role 
 * @returns {Object}
 */
function createUserModel(username, email, password, role) {
  return {
    id: Date.now(),
    username: username.trim(),
    email: email.trim(),
    password: password,
    role: role,
    createdAt: new Date().toISOString()
  };
}

/**
 * Returns a human-readable label for a given password score (0-5).
 * @param {number} score
 * @returns {string}
 */
function getStrengthLabel(score) {
  if (!score) return '';
  if (score <= 2) return 'Weak';
  if (score <= 3) return 'Fair';
  if (score <= 4) return 'Good';
  return 'Strong';
}

/* ==========================================
   PRESENTATION / UI LAYER
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const roleSelect = document.getElementById('role');
  const feedbackElement = document.getElementById('feedback-message');
  const strengthMeter = document.getElementById('password-strength-meter');
  const strengthLabel = document.getElementById('password-strength-label');
  const strengthChecklist = document.getElementById('password-checklist');
  const togglePassword = document.getElementById('toggle-password');

  function showFeedback(message, type) {
    feedbackElement.textContent = message;
    feedbackElement.className = `feedback-message ${type}`;
  }

  function clearFeedback() {
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback-message';
    var hint = document.getElementById('usernameHint');
    if (hint) { hint.textContent = ''; hint.className = 'form-hint'; }
  }

  function renderStrengthFeedback(score, errors) {
    if (strengthMeter) {
      strengthMeter.value = score;
      strengthMeter.className = `strength-meter strength-meter--score-${score}`;
    }
    if (strengthLabel) {
      strengthLabel.textContent = getStrengthLabel(score);
    }
    if (strengthChecklist) {
      strengthChecklist.innerHTML = '';
      const allChecks = [
        { text: 'At least 8 characters',     met: !errors.includes('At least 8 characters') },
        { text: 'At least 1 uppercase letter', met: !errors.includes('At least 1 uppercase letter') },
        { text: 'At least 1 lowercase letter', met: !errors.includes('At least 1 lowercase letter') },
        { text: 'At least 1 number',          met: !errors.includes('At least 1 number') },
        { text: 'At least 1 special character', met: !errors.includes('At least 1 special character (!@#$...)') },
      ];
      allChecks.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.text;
        li.className = item.met ? 'check-met' : 'check-unmet';
        strengthChecklist.appendChild(li);
      });
    }
  }

  usernameInput.addEventListener('input', () => {
    const val = usernameInput.value;
    const hint = document.getElementById('usernameHint');
    if (!hint) return;
    if (!val) {
      hint.textContent = '';
      hint.className = 'form-hint';
    } else if (val.trim().length < 4) {
      hint.textContent = 'Username must be at least 4 characters long.';
      hint.className = 'form-hint';
    } else {
      hint.textContent = '✓ Username looks good';
      hint.className = 'form-hint form-hint--success';
    }
  });

  passwordInput.addEventListener('input', () => {
    const pass = passwordInput.value;
    if (!pass) {
      renderStrengthFeedback(0, ['At least 8 characters', 'At least 1 uppercase letter', 'At least 1 lowercase letter', 'At least 1 number', 'At least 1 special character (!@#$...)']);
      return;
    }
    const strength = validatePasswordStrength(pass);
    renderStrengthFeedback(strength.score, strength.errors);
  });

  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePassword.textContent = isPassword ? '🙈' : '👁';
      togglePassword.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearFeedback();

    const username = usernameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;
    const role = roleSelect.value;

    const existingUsers = getExistingUsers();

    const validation = validateRegistration(username, email, password, role, existingUsers);

    if (!validation.isValid) {
      showFeedback(validation.error, 'error');
      return;
    }

    const newUser = createUserModel(username, email, password, role);
    saveUser(newUser);

    if (window.JWT) {
      window.JWT.save(window.JWT.create({
        name: newUser.username,
        role: newUser.role,
        email: newUser.email,
      }));
    }

    var initials = newUser.username.split(' ').map(function(p) { return p[0]; }).join('').toUpperCase();
    try {
      var membersRaw = localStorage.getItem('taskflow_members');
      var members = membersRaw ? JSON.parse(membersRaw) : [];
      if (!Array.isArray(members)) members = [];
      members.push({
        id: Date.now(),
        name: newUser.username,
        email: newUser.email,
        role: newUser.role,
        initials: initials
      });
      localStorage.setItem('taskflow_members', JSON.stringify(members));
    } catch (_) {}

    showFeedback("User \"" + newUser.username + "\" (" + newUser.email + ") successfully registered as " + newUser.role + "!", 'success');
    form.reset();
    renderStrengthFeedback(0, ['At least 8 characters', 'At least 1 uppercase letter', 'At least 1 lowercase letter', 'At least 1 number', 'At least 1 special character (!@#$...)']);

    setTimeout(function () {
      window.location.href = "../../index.html";
    }, 1500);
  });
});