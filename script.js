(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- Theme toggle ---------- */
  var themeBtn = document.getElementById("theme-toggle");
  var themeLabel = document.getElementById("theme-label");
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set === "light" || set === "dark") return set;
    return media.matches ? "dark" : "light";
  }
  function paintThemeLabel() {
    themeLabel.textContent = currentTheme() === "dark" ? "Light" : "Dark";
  }
  themeBtn.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    paintThemeLabel();
  });
  paintThemeLabel();

  /* ---------- Scroll spy for the top bar ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-spy]"));
  var sections = links
    .map(function (a) { return document.getElementById(a.getAttribute("data-spy")); })
    .filter(Boolean);

  function setActive(id) {
    links.forEach(function (a) {
      var on = a.getAttribute("data-spy") === id;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Project filters ---------- */
  var table = document.getElementById("projects-table");
  var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr"));
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-filter]"));
  var clearBtn = document.getElementById("clear-codename");
  var codeValue = document.getElementById("codename-value");
  var count = document.getElementById("count");
  var state = { type: "all", codename: "" };

  function applyFilters() {
    var shown = 0;
    rows.forEach(function (r) {
      var okType = state.type === "all" || r.getAttribute("data-type") === state.type;
      var okCode = !state.codename || r.getAttribute("data-codename") === state.codename;
      r.hidden = !(okType && okCode);
      if (!r.hidden) shown++;
    });
    chips.forEach(function (c) {
      c.setAttribute("aria-pressed", String(c.getAttribute("data-filter") === state.type));
    });
    clearBtn.hidden = !state.codename;
    codeValue.textContent = state.codename;
    count.textContent = shown
      ? "Showing " + shown + " of " + rows.length + " popular repositories. 18 in total on GitHub."
      : "No repositories match. Clear a filter to see them again.";
  }

  function scrollToProjects() {
    var el = document.getElementById("projects");
    if (el) el.scrollIntoView({ block: "start" });
  }

  document.querySelectorAll(".chip[data-filter]").forEach(function (c) {
    c.addEventListener("click", function () {
      state.type = c.getAttribute("data-filter");
      applyFilters();
    });
  });
  document.querySelectorAll(".link[data-filter]").forEach(function (b) {
    b.addEventListener("click", function () {
      state.type = b.getAttribute("data-filter");
      state.codename = "";
      applyFilters();
      scrollToProjects();
    });
  });
  document.querySelectorAll(".code[data-codename]").forEach(function (b) {
    b.addEventListener("click", function () {
      var name = b.getAttribute("data-codename");
      state.codename = state.codename === name ? "" : name;
      state.type = "all";
      applyFilters();
      scrollToProjects();
    });
  });
  clearBtn.addEventListener("click", function () {
    state.codename = "";
    applyFilters();
  });

  /* ---------- Sortable columns ---------- */
  var sortBtns = Array.prototype.slice.call(table.querySelectorAll(".sort"));
  var tbody = table.querySelector("tbody");
  var originalOrder = rows.slice();

  sortBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-sort");
      var dir = btn.getAttribute("data-dir");
      var next = dir === "desc" ? "asc" : dir === "asc" ? "" : "desc";
      if (key === "name") next = dir === "asc" ? "desc" : dir === "desc" ? "" : "asc";

      sortBtns.forEach(function (b) {
        b.removeAttribute("data-dir");
        b.parentElement.removeAttribute("aria-sort");
      });

      var ordered;
      if (!next) {
        ordered = originalOrder.slice();
      } else {
        btn.setAttribute("data-dir", next);
        btn.parentElement.setAttribute("aria-sort", next === "asc" ? "ascending" : "descending");
        ordered = rows.slice().sort(function (a, b) {
          var av = a.getAttribute("data-" + key);
          var bv = b.getAttribute("data-" + key);
          var cmp = key === "name" ? av.localeCompare(bv) : Number(av) - Number(bv);
          if (cmp === 0) cmp = a.getAttribute("data-name").localeCompare(b.getAttribute("data-name"));
          return next === "asc" ? cmp : -cmp;
        });
      }
      ordered.forEach(function (r) { tbody.appendChild(r); });
    });
  });

  /* ---------- Count-up for GitHub numbers ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));

  function runCount(el) {
    var target = Number(el.getAttribute("data-count"));
    if (reduce) { el.textContent = String(target); return; }
    var start = null;
    var dur = 900;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); obs.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ---------- Copy email ---------- */
  var copyBtn = document.getElementById("copy");
  var emailEl = document.getElementById("email");
  function selectEmail() {
    var range = document.createRange();
    range.selectNodeContents(emailEl);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  copyBtn.addEventListener("click", function () {
    function done() {
      copyBtn.textContent = "Copied";
      setTimeout(function () { copyBtn.textContent = "Copy"; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(emailEl.textContent).then(done, selectEmail);
    } else {
      selectEmail();
    }
  });

  applyFilters();
})();
