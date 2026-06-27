(function () {
  "use strict";

  const USERS_KEY = "du_users";
  const SESSION_KEY = "du_session";

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
  }
  function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
  function setSession(user) { localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email })); }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
  }

  /* ── Tab switching ─────────────────────────────────── */
  const tabLogin    = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const loginForm   = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  function showTab(tab) {
    const isLogin = tab === "login";
    tabLogin.classList.toggle("active", isLogin);
    tabRegister.classList.toggle("active", !isLogin);
    loginForm.classList.toggle("hidden", !isLogin);
    registerForm.classList.toggle("hidden", isLogin);
  }

  tabLogin.addEventListener("click", () => showTab("login"));
  tabRegister.addEventListener("click", () => showTab("register"));
  document.getElementById("goRegister").addEventListener("click", (e) => { e.preventDefault(); showTab("register"); });
  document.getElementById("goLogin").addEventListener("click", (e) => { e.preventDefault(); showTab("login"); });

  /* ── Check URL params for initial tab ─────────────── */
  const params = new URLSearchParams(window.location.search);
  if (params.get("tab") === "register") showTab("register");

  /* ── Password visibility toggles ──────────────────── */
  function togglePwd(inputId, btnId) {
    const inp = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    btn.addEventListener("click", () => {
      inp.type = inp.type === "password" ? "text" : "password";
      btn.textContent = inp.type === "password" ? "👁" : "🙈";
    });
  }
  togglePwd("loginPassword", "loginEye");
  togglePwd("regPassword", "regEye");

  /* ── Password strength ─────────────────────────────── */
  const pwdInput = document.getElementById("regPassword");
  const pwdBar   = document.getElementById("pwdBar");
  const pwdHint  = document.getElementById("pwdHint");

  pwdInput.addEventListener("input", () => {
    const val = pwdInput.value;
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const widths = ["0%", "20%", "40%", "65%", "85%", "100%"];
    const colors = ["#e5e7eb", "#f87171", "#fb923c", "#facc15", "#4ade80", "#22c55e"];
    const labels = ["", "Too short", "Weak", "Fair", "Good", "Strong"];
    pwdBar.style.width  = widths[score];
    pwdBar.style.background = colors[score];
    pwdHint.textContent = labels[score];
  });

  /* ── Show / clear errors ───────────────────────────── */
  function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.classList.remove("hidden");
  }
  function clearError(id) { document.getElementById(id).classList.add("hidden"); }

  /* ── Login ─────────────────────────────────────────── */
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearError("loginError");
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const pwd   = document.getElementById("loginPassword").value;
    const btn   = document.getElementById("loginBtn");

    btn.querySelector(".btn-label").classList.add("hidden");
    btn.querySelector(".btn-spinner").classList.remove("hidden");
    btn.disabled = true;

    setTimeout(() => {
      const users = getUsers();
      const user = users.find((u) => u.email === email && u.password === btoa(pwd));
      if (!user) {
        showError("loginError", "Invalid email or password.");
        btn.querySelector(".btn-label").classList.remove("hidden");
        btn.querySelector(".btn-spinner").classList.add("hidden");
        btn.disabled = false;
        return;
      }
      setSession(user);
      document.body.style.opacity = "0";
      document.body.style.transition = "opacity 0.35s";
      setTimeout(() => { window.location.href = "dashboard.html"; }, 350);
    }, 600);
  });

  /* ── Register ──────────────────────────────────────── */
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearError("registerError");
    const name  = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const pwd   = document.getElementById("regPassword").value;
    const btn   = document.getElementById("registerBtn");

    if (pwd.length < 6) { showError("registerError", "Password must be at least 6 characters."); return; }

    btn.querySelector(".btn-label").classList.add("hidden");
    btn.querySelector(".btn-spinner").classList.remove("hidden");
    btn.disabled = true;

    setTimeout(() => {
      const users = getUsers();
      if (users.find((u) => u.email === email)) {
        showError("registerError", "An account with that email already exists.");
        btn.querySelector(".btn-label").classList.remove("hidden");
        btn.querySelector(".btn-spinner").classList.add("hidden");
        btn.disabled = false;
        return;
      }
      const newUser = { id: "u_" + Date.now(), name, email, password: btoa(pwd), created: new Date().toISOString() };
      users.push(newUser);
      saveUsers(users);
      setSession(newUser);
      document.body.style.opacity = "0";
      document.body.style.transition = "opacity 0.35s";
      setTimeout(() => { window.location.href = "dashboard.html"; }, 350);
    }, 600);
  });

  /* ── Demo login ────────────────────────────────────── */
  window.demoLogin = function () {
    const demoUser = { id: "u_demo", name: "Demo User", email: "demo@doodleup.io" };
    setSession(demoUser);
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.35s";
    setTimeout(() => { window.location.href = "dashboard.html"; }, 350);
  };

})();
