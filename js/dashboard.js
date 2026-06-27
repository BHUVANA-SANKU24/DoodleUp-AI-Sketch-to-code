(function () {
  "use strict";

  const SESSION_KEY  = "du_session";
  const PROJECTS_KEY = "du_projects";

  /* ── Auth guard ────────────────────────────────────── */
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
  }
  const session = getSession();
  if (!session) { window.location.href = "login.html"; return; }

  /* ── Init avatar ───────────────────────────────────── */
  const avatarEl = document.getElementById("userAvatar");
  if (avatarEl) avatarEl.textContent = session.name ? session.name.charAt(0).toUpperCase() : "U";

  /* ── Project storage ───────────────────────────────── */
  function getProjects() {
    try { return JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]"); } catch { return []; }
  }
  function saveProjects(arr) { localStorage.setItem(PROJECTS_KEY, JSON.stringify(arr)); }

  /* ── Seed demo projects if empty ───────────────────── */
  function maybeSeedDemo() {
    const existing = getProjects();
    if (existing.length > 0) return;
    const demos = [
      { id: "p_demo1", name: "SaaS Landing Page", template: "saas",      created: new Date(Date.now() - 86400000 * 3).toISOString(), starred: true },
      { id: "p_demo2", name: "Portfolio Site",    template: "portfolio", created: new Date(Date.now() - 86400000 * 1).toISOString(), starred: false },
      { id: "p_demo3", name: "Blog Layout",       template: "blog",      created: new Date(Date.now() - 86400000 * 7).toISOString(), starred: false },
    ];
    saveProjects(demos);
  }
  maybeSeedDemo();

  /* ── State ─────────────────────────────────────────── */
  let projects = getProjects();
  let filter   = "all";
  let query    = "";
  let isGrid   = true;
  let ctxProjectId = null;

  /* ── DOM refs ──────────────────────────────────────── */
  const grid        = document.getElementById("projectsGrid");
  const emptyState  = document.getElementById("emptyState");
  const countLabel  = document.getElementById("projectCount");
  const searchInput = document.getElementById("searchInput");

  /* ── Render ─────────────────────────────────────────── */
  function filteredProjects() {
    let list = [...projects];
    if (filter === "recent") list = list.slice().sort((a, b) => new Date(b.created) - new Date(a.created)).slice(0, 6);
    if (filter === "starred") list = list.filter((p) => p.starred);
    if (query) list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    return list.sort((a, b) => new Date(b.created) - new Date(a.created));
  }

  const TMPL_COLORS = { saas: "#f3701e", portfolio: "#0d3d3a", blog: "#6C171E", dashboard: "#4A69B3", "": "#e8d8c9" };
  const TMPL_ICONS  = { saas: "🚀", portfolio: "🖼", blog: "📝", dashboard: "📊", "": "✏️" };

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1)  return "Just now";
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function render() {
    const list = filteredProjects();
    countLabel.textContent = `${projects.length} project${projects.length !== 1 ? "s" : ""}`;
    grid.innerHTML = "";
    grid.classList.toggle("list-view", !isGrid);

    if (list.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    list.forEach((p) => {
      const card = document.createElement("div");
      card.className = "project-card";
      card.dataset.id = p.id;
      const color = TMPL_COLORS[p.template || ""] || "#e8d8c9";
      const icon  = TMPL_ICONS[p.template || ""] || "✏️";
      card.innerHTML = `
        <div class="card-thumb" style="background: linear-gradient(135deg, ${color}22, ${color}44)">
          <div class="card-thumb-icon">${icon}</div>
          <div class="card-thumb-overlay">
            <div class="card-open-btn">Open</div>
          </div>
          ${p.starred ? '<div class="card-star">★</div>' : ""}
          <button class="card-menu-btn" data-id="${p.id}">⋯</button>
        </div>
        <div class="card-info">
          <div class="card-meta">
            <span class="card-name">${p.name}</span>
            <span class="card-date">Edited ${timeAgo(p.created)}</span>
          </div>
        </div>
      `;
      card.addEventListener("click", (e) => {
        if (e.target.closest(".card-menu-btn")) return;
        openProject(p.id);
      });
      card.querySelector(".card-menu-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        showCtxMenu(p.id, e.currentTarget);
      });
      grid.appendChild(card);
    });
  }

  function openProject(id) {
    localStorage.setItem("du_active_project", id);
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.3s";
    setTimeout(() => { window.location.href = "builder.html"; }, 300);
  }

  /* ── Sidebar filter ────────────────────────────────── */
  document.querySelectorAll(".sidebar-link[data-filter]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".sidebar-link[data-filter]").forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
      filter = link.dataset.filter;
      render();
    });
  });

  /* ── Template sidebar links ─────────────────────────── */
  document.querySelectorAll(".sidebar-link[data-tmpl]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      openNewProjectModal(link.dataset.tmpl);
    });
  });

  /* ── Search ─────────────────────────────────────────── */
  searchInput.addEventListener("input", () => { query = searchInput.value; render(); });

  /* ── View toggle ────────────────────────────────────── */
  document.getElementById("gridView").addEventListener("click", () => {
    isGrid = true;
    document.getElementById("gridView").classList.add("active");
    document.getElementById("listView").classList.remove("active");
    render();
  });
  document.getElementById("listView").addEventListener("click", () => {
    isGrid = false;
    document.getElementById("listView").classList.add("active");
    document.getElementById("gridView").classList.remove("active");
    render();
  });

  /* ── New project modal ──────────────────────────────── */
  const modal        = document.getElementById("newProjectModal");
  const projectNameI = document.getElementById("projectName");
  let selectedTmpl   = "";

  function openNewProjectModal(preselect) {
    selectedTmpl = preselect || "";
    projectNameI.value = "";
    document.querySelectorAll(".tmpl-option").forEach((o) => {
      o.classList.toggle("active", o.dataset.tmpl === selectedTmpl);
    });
    modal.classList.remove("hidden");
    setTimeout(() => projectNameI.focus(), 50);
  }

  document.getElementById("newProjectBtn").addEventListener("click", () => openNewProjectModal(""));
  document.getElementById("emptyNewBtn")  .addEventListener("click", () => openNewProjectModal(""));
  document.getElementById("closeModal")   .addEventListener("click", () => modal.classList.add("hidden"));
  document.getElementById("cancelModal")  .addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

  document.querySelectorAll(".tmpl-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      document.querySelectorAll(".tmpl-option").forEach((o) => o.classList.remove("active"));
      opt.classList.add("active");
      selectedTmpl = opt.dataset.tmpl;
    });
  });

  document.getElementById("createProjectBtn").addEventListener("click", () => {
    const name = projectNameI.value.trim() || "Untitled Project";
    const newP = {
      id: "p_" + Date.now(),
      name,
      template: selectedTmpl,
      created: new Date().toISOString(),
      starred: false,
    };
    projects.unshift(newP);
    saveProjects(projects);
    modal.classList.add("hidden");
    render();
    openProject(newP.id);
  });

  /* ── Context menu ───────────────────────────────────── */
  const ctxMenu = document.getElementById("ctxMenu");

  function showCtxMenu(id, anchor) {
    ctxProjectId = id;
    const rect = anchor.getBoundingClientRect();
    ctxMenu.style.top  = (rect.bottom + 4) + "px";
    ctxMenu.style.left = Math.min(rect.left, window.innerWidth - 170) + "px";
    ctxMenu.classList.remove("hidden");
    const p = projects.find((x) => x.id === id);
    document.getElementById("ctxStar").textContent = p && p.starred ? "Unstar" : "Star";
  }

  document.addEventListener("click", (e) => {
    if (!ctxMenu.contains(e.target)) ctxMenu.classList.add("hidden");
  });

  document.getElementById("ctxOpen").addEventListener("click", () => { ctxMenu.classList.add("hidden"); openProject(ctxProjectId); });
  document.getElementById("ctxRename").addEventListener("click", () => {
    ctxMenu.classList.add("hidden");
    const p = projects.find((x) => x.id === ctxProjectId);
    if (!p) return;
    const newName = prompt("Rename project:", p.name);
    if (newName && newName.trim()) { p.name = newName.trim(); saveProjects(projects); render(); }
  });
  document.getElementById("ctxDuplicate").addEventListener("click", () => {
    ctxMenu.classList.add("hidden");
    const p = projects.find((x) => x.id === ctxProjectId);
    if (!p) return;
    const copy = { ...p, id: "p_" + Date.now(), name: p.name + " (copy)", created: new Date().toISOString() };
    projects.unshift(copy);
    saveProjects(projects);
    render();
  });
  document.getElementById("ctxStar").addEventListener("click", () => {
    ctxMenu.classList.add("hidden");
    const p = projects.find((x) => x.id === ctxProjectId);
    if (!p) return;
    p.starred = !p.starred;
    saveProjects(projects);
    render();
  });
  document.getElementById("ctxDelete").addEventListener("click", () => {
    ctxMenu.classList.add("hidden");
    if (!confirm("Delete this project? This cannot be undone.")) return;
    projects = projects.filter((x) => x.id !== ctxProjectId);
    saveProjects(projects);
    render();
  });

  /* ── Logout ─────────────────────────────────────────── */
  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem(SESSION_KEY);
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.3s";
    setTimeout(() => { window.location.href = "login.html"; }, 300);
  });

  /* ── Initial render ─────────────────────────────────── */
  render();

})();
