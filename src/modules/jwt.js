/* ============================================================
   jwt.js — Client-side JWT concept for TaskFlow
   Demonstrates token creation, encoding, signing, verification
   and localStorage persistence for session survival across
   page refreshes.

   Uses a simulated HMAC-SHA256 signature. In production the
   server would sign tokens with a real cryptographic secret.
   ============================================================ */

const JWT_SECRET = "taskflow-jwt-demosecret-2026";
const JWT_STORAGE_KEY = "taskflow_jwt";
const TOKEN_EXPIRY_SECONDS = 3600;

/* ---- internal helpers (not exported on window) ---- */

function _base64UrlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function _base64UrlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return decodeURIComponent(escape(atob(str)));
}

function _sign(data) {
  let h1 = 0xdeadbeef ^ data.length;
  let h2 = 0x41c6ce57 ^ data.length;
  for (let i = 0; i < data.length; i++) {
    const ch = data.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h1 = (h1 << 13) | (h1 >>> 19);
    h2 = (h2 << 15) | (h2 >>> 17);
  }
  const hash = ((h1 ^ h2) >>> 0).toString(16).padStart(8, "0");
  let rounds = (data.length % 7) + 3;
  let result = hash;
  for (let i = 0; i < rounds; i++) {
    let h = 0;
    for (let j = 0; j < result.length; j++) {
      h = ((h << 5) - h) + result.charCodeAt(j);
      h |= 0;
    }
    result = Math.abs(h).toString(16).padStart(8, "0") + result.slice(8);
  }
  return result.slice(0, 32);
}

/* ---- public API ---- */

window.JWT = {
  /**
   * Creates a signed JWT token string.
   * @param {Object} payload — user claims (name, email, role, …)
   * @returns {string} token
   */
  create(payload) {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);

    const claims = Object.assign({}, payload, {
      iat: now,
      exp: now + TOKEN_EXPIRY_SECONDS,
    });

    const headerB64 = _base64UrlEncode(JSON.stringify(header));
    const payloadB64 = _base64UrlEncode(JSON.stringify(claims));
    const signatureInput = headerB64 + "." + payloadB64;
    const signature = _sign(signatureInput + JWT_SECRET);

    return signatureInput + "." + signature;
  },

  /**
   * Verifies signature and expiry. Returns decoded payload or null.
   * @param {string} token
   * @returns {Object|null}
   */
  verify(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const signatureInput = parts[0] + "." + parts[1];
      const expectedSig = _sign(signatureInput + JWT_SECRET);
      if (parts[2] !== expectedSig) return null;

      const payload = JSON.parse(_base64UrlDecode(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) return null;

      return payload;
    } catch (_) {
      return null;
    }
  },

  /**
   * Decodes without verifying signature (useful for inspection).
   * @param {string} token
   * @returns {Object|null}
   */
  decode(token) {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      return JSON.parse(_base64UrlDecode(parts[1]));
    } catch (_) {
      return null;
    }
  },

  /**
   * Persists a token to localStorage.
   * @param {string} token
   */
  save(token) {
    localStorage.setItem(JWT_STORAGE_KEY, token);
  },

  /**
   * Reads the stored token.
   * @returns {string|null}
   */
  get() {
    return localStorage.getItem(JWT_STORAGE_KEY);
  },

  /**
   * Removes the stored token.
   */
  remove() {
    localStorage.removeItem(JWT_STORAGE_KEY);
  },

  /**
   * Returns the verified session from the stored token, or null.
   * Automatically clears the token if verification fails.
   * @returns {Object|null}
   */
  getSession() {
    const token = this.get();
    if (!token) return null;
    const payload = this.verify(token);
    if (!payload) {
      this.remove();
      return null;
    }
    return payload;
  },

  /**
   * Creates a token with explicit iat / exp timestamps (for testing).
   * @param {Object} payload
   * @param {number} iat
   * @param {number} exp
   * @returns {string}
   */
  createWithTimestamps(payload, iat, exp) {
    var header = { alg: "HS256", typ: "JWT" };
    var claims = Object.assign({}, payload, { iat: iat, exp: exp });
    var headerB64 = _base64UrlEncode(JSON.stringify(header));
    var payloadB64 = _base64UrlEncode(JSON.stringify(claims));
    var signatureInput = headerB64 + "." + payloadB64;
    var signature = _sign(signatureInput + JWT_SECRET);
    return signatureInput + "." + signature;
  },

  /**
   * True when there is no stored token or it has expired.
   * @returns {boolean}
   */
  isExpired() {
    const token = this.get();
    if (!token) return true;
    const payload = this.decode(token);
    if (!payload || !payload.exp) return true;
    return payload.exp < Math.floor(Date.now() / 1000);
  },
};
