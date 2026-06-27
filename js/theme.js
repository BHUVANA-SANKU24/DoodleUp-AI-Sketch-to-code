(function () {
  const btn = document.getElementById("themeToggle");
  const root = document.documentElement;

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("sc_theme", theme);
    if (btn) btn.title = theme === "dark" ? "Switch to light" : "Switch to dark";
  }

  const saved = localStorage.getItem("sc_theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  apply(saved);

  if (btn) {
    btn.addEventListener("click", () => {
      apply(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }
})();
