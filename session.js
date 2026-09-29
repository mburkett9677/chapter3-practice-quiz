/** Shared session + API helpers for Claire's Quizzes */
window.QuizSession = (function () {
  const ADMIN_NAME = "Matt1113";
  const STORAGE_KEY = "claires-quizzes-user";

  function normalizeName(name) {
    return String(name || "").trim();
  }

  function getStoredName() {
    try {
      return normalizeName(sessionStorage.getItem(STORAGE_KEY) || "");
    } catch {
      return "";
    }
  }

  function setStoredName(name) {
    const n = normalizeName(name);
    try {
      if (n) sessionStorage.setItem(STORAGE_KEY, n);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return n;
  }

  function clearStoredName() {
    setStoredName("");
  }

  function isAdminName(name) {
    return normalizeName(name).toLowerCase() === ADMIN_NAME.toLowerCase();
  }

  async function api(path, options = {}) {
    const opts = {
      headers: { "content-type": "application/json", ...(options.headers || {}) },
      ...options,
    };
    const res = await fetch(path, opts);
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      const err = new Error((data && data.error) || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function login(name) {
    const n = normalizeName(name);
    if (!n) throw new Error("Enter a name");
    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ name: n }),
    });
    setStoredName(data.name);
    return data;
  }

  async function getState(name) {
    const n = normalizeName(name || getStoredName());
    if (!n) throw new Error("Not signed in");
    return api(`/api/state?name=${encodeURIComponent(n)}`);
  }

  async function requireRole(expected) {
    const name = getStoredName();
    if (!name) {
      window.location.href = "login.html";
      return null;
    }
    try {
      const state = await getState(name);
      if (expected === "admin" && state.role !== "admin") {
        window.location.href = state.role === "student" ? "index.html" : "login.html";
        return null;
      }
      if (expected === "student" && state.role !== "student") {
        window.location.href = state.role === "admin" ? "admin.html" : "login.html";
        return null;
      }
      return state;
    } catch {
      clearStoredName();
      window.location.href = "login.html";
      return null;
    }
  }

  async function setLive(live) {
    const name = getStoredName();
    return api("/api/live", {
      method: "POST",
      body: JSON.stringify({ name, live: Boolean(live) }),
    });
  }

  async function assignStudent(student) {
    const name = getStoredName();
    return api("/api/assign", {
      method: "POST",
      body: JSON.stringify({ name, student }),
    });
  }

  async function clearScores() {
    const name = getStoredName();
    return api("/api/clear-scores", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async function submitScore(payload) {
    const name = getStoredName();
    return api("/api/score", {
      method: "POST",
      body: JSON.stringify({ name, ...payload }),
    });
  }

  function subjectFromQuizId(quizId) {
    if (String(quizId).startsWith("math")) return "math";
    if (String(quizId).startsWith("history")) return "history";
    if (String(quizId).startsWith("vocab")) return "english";
    if (String(quizId).startsWith("science")) return "science";
    return "other";
  }

  function logout() {
    clearStoredName();
    window.location.href = "login.html";
  }

  return {
    ADMIN_NAME,
    normalizeName,
    getStoredName,
    setStoredName,
    clearStoredName,
    isAdminName,
    login,
    getState,
    requireRole,
    setLive,
    assignStudent,
    clearScores,
    submitScore,
    subjectFromQuizId,
    logout,
    api,
  };
})();
