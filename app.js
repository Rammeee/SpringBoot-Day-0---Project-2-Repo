/* ============================================================
   BugNest – app.js
   Full bug tracker logic: CRUD, filter, sort, search, persist
   ============================================================ */

"use strict";

/* ── State ───────────────────────────────────────────────── */
let bugs         = [];
let currentFilter = "all";     // status filter
let currentSearch = "";
let currentPriority = "all";
let currentSort   = "newest";
let editingId     = null;
let idCounter     = 1;

/* ── DOM refs ─────────────────────────────────────────────── */
const bugContainer   = document.getElementById("bugContainer");
const emptyState     = document.getElementById("emptyState");
const modalOverlay   = document.getElementById("modalOverlay");
const modalTitle     = document.getElementById("modalTitle");
const bugIdInput     = document.getElementById("bugId");
const bugTitle       = document.getElementById("bugTitle");
const bugDescription = document.getElementById("bugDescription");
const bugPriority    = document.getElementById("bugPriority");
const bugStatus      = document.getElementById("bugStatus");
const bugAssignee    = document.getElementById("bugAssignee");
const bugTag         = document.getElementById("bugTag");
const formError      = document.getElementById("formError");
const titleCount     = document.getElementById("titleCount");
const searchInput    = document.getElementById("searchInput");
const filterPriority = document.getElementById("filterPriority");
const sortBy         = document.getElementById("sortBy");
const toast          = document.getElementById("toast");

/* ── Counters ─────────────────────────────────────────────── */
const totalCount     = document.getElementById("totalCount");
const statOpen       = document.getElementById("statOpen");
const statInProgress = document.getElementById("statInProgress");
const statResolved   = document.getElementById("statResolved");
const openCount      = document.getElementById("openCount");
const inProgressCount= document.getElementById("inProgressCount");
const resolvedCount  = document.getElementById("resolvedCount");
const closedCount    = document.getElementById("closedCount");

/* ── Helpers ──────────────────────────────────────────────── */

function generateId() {
  return `BUG-${String(idCounter++).padStart(4, "0")}`;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}

function priorityOrder(p) {
  return { critical: 0, high: 1, medium: 2, low: 3 }[p] ?? 4;
}

function statusIcon(s) {
  return {
    "open":        '<i class="fa-solid fa-circle-dot"></i>',
    "in-progress": '<i class="fa-solid fa-spinner fa-spin-pulse"></i>',
    "resolved":    '<i class="fa-solid fa-circle-check"></i>',
    "closed":      '<i class="fa-solid fa-lock"></i>',
  }[s] ?? "";
}

function priorityLabel(p) {
  return { critical:"🔴 Critical", high:"🟠 High", medium:"🟡 Medium", low:"🟢 Low" }[p] ?? p;
}

function escape(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

/* ── LocalStorage ─────────────────────────────────────────── */

function save() {
  localStorage.setItem("bugnest_bugs",      JSON.stringify(bugs));
  localStorage.setItem("bugnest_idCounter", idCounter);
}

function load() {
  try {
    const stored = localStorage.getItem("bugnest_bugs");
    if (stored) bugs = JSON.parse(stored);
    const counter = localStorage.getItem("bugnest_idCounter");
    if (counter) idCounter = parseInt(counter, 10);
  } catch(e) { bugs = []; }
}

/* ── Counts ───────────────────────────────────────────────── */

function updateCounts() {
  const total  = bugs.length;
  const open   = bugs.filter(b => b.status === "open").length;
  const inProg = bugs.filter(b => b.status === "in-progress").length;
  const res    = bugs.filter(b => b.status === "resolved").length;
  const closed = bugs.filter(b => b.status === "closed").length;

  totalCount.textContent     = total;
  statOpen.textContent       = open;
  statInProgress.textContent = inProg;
  statResolved.textContent   = res;
  openCount.textContent      = open;
  inProgressCount.textContent= inProg;
  resolvedCount.textContent  = res;
  closedCount.textContent    = closed;
}

/* ── Render ───────────────────────────────────────────────── */

function getFilteredBugs() {
  let list = [...bugs];

  // Status filter
  if (currentFilter !== "all")
    list = list.filter(b => b.status === currentFilter);

  // Priority filter
  if (currentPriority !== "all")
    list = list.filter(b => b.priority === currentPriority);

  // Search
  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase();
    list = list.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      (b.assignee || "").toLowerCase().includes(q) ||
      (b.tag || "").toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q)
    );
  }

  // Sort
  list.sort((a, b) => {
    if (currentSort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    if (currentSort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (currentSort === "priority") return priorityOrder(a.priority) - priorityOrder(b.priority);
    if (currentSort === "title")   return a.title.localeCompare(b.title);
    return 0;
  });

  return list;
}

function renderBugs() {
  updateCounts();

  // Remove existing cards
  Array.from(bugContainer.querySelectorAll(".bug-card")).forEach(c => c.remove());
  emptyState.style.display = "none";

  const list = getFilteredBugs();

  if (!list.length) {
    emptyState.style.display = "flex";
    emptyState.style.flexDirection = "column";
    emptyState.style.alignItems = "center";
    return;
  }

  list.forEach(bug => {
    const card = document.createElement("div");
    card.className = `bug-card priority-${bug.priority}`;
    card.dataset.id = bug.id;

    card.innerHTML = `
      <div class="bug-card-left">
        <span class="bug-id">${escape(bug.id)}</span>
      </div>
      <div class="bug-card-body">
        <div class="bug-title">${escape(bug.title)}</div>
        <div class="bug-desc">${escape(bug.description)}</div>
        <div class="bug-meta">
          <span class="badge badge-status-${bug.status}">${statusIcon(bug.status)} ${escape(statusLabel(bug.status))}</span>
          <span class="badge badge-priority-${bug.priority}">${escape(priorityLabel(bug.priority))}</span>
          ${bug.assignee ? `<span class="badge badge-assignee"><i class="fa-solid fa-user"></i> ${escape(bug.assignee)}</span>` : ""}
          ${bug.tag      ? `<span class="badge badge-tag">${escape(bug.tag)}</span>` : ""}
          <span class="bug-date">${formatDate(bug.createdAt)}</span>
        </div>
      </div>
      <div class="bug-card-actions">
        <button class="action-btn edit" data-id="${bug.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn delete" data-id="${bug.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;

    bugContainer.appendChild(card);
  });

  // Attach card action listeners
  bugContainer.querySelectorAll(".action-btn.edit").forEach(btn => {
    btn.addEventListener("click", e => { e.stopPropagation(); openEditModal(btn.dataset.id); });
  });
  bugContainer.querySelectorAll(".action-btn.delete").forEach(btn => {
    btn.addEventListener("click", e => { e.stopPropagation(); deleteBug(btn.dataset.id); });
  });
}

function statusLabel(s) {
  return { "open":"Open", "in-progress":"In Progress", "resolved":"Resolved", "closed":"Closed" }[s] ?? s;
}

/* ── Modal ────────────────────────────────────────────────── */

function openAddModal() {
  editingId = null;
  modalTitle.textContent = "Report a Bug";
  clearForm();
  modalOverlay.classList.add("active");
  bugTitle.focus();
}

function openEditModal(id) {
  const bug = bugs.find(b => b.id === id);
  if (!bug) return;
  editingId = id;
  modalTitle.textContent = "Edit Bug";
  bugTitle.value       = bug.title;
  bugDescription.value = bug.description;
  bugPriority.value    = bug.priority;
  bugStatus.value      = bug.status;
  bugAssignee.value    = bug.assignee || "";
  bugTag.value         = bug.tag || "";
  titleCount.textContent = `${bug.title.length}/120`;
  formError.textContent = "";
  clearInvalidStyles();
  modalOverlay.classList.add("active");
  bugTitle.focus();
}

function closeModal() {
  modalOverlay.classList.remove("active");
  clearForm();
}

function clearForm() {
  bugIdInput.value     = "";
  bugTitle.value       = "";
  bugDescription.value = "";
  bugPriority.value    = "";
  bugStatus.value      = "open";
  bugAssignee.value    = "";
  bugTag.value         = "";
  formError.textContent= "";
  titleCount.textContent = "0/120";
  clearInvalidStyles();
}

function clearInvalidStyles() {
  [bugTitle, bugDescription, bugPriority].forEach(el => el.classList.remove("invalid"));
}

/* ── CRUD ─────────────────────────────────────────────────── */

function saveBug() {
  const title  = bugTitle.value.trim();
  const desc   = bugDescription.value.trim();
  const prio   = bugPriority.value;

  clearInvalidStyles();
  formError.textContent = "";

  // Validate
  let valid = true;
  if (!title)  { bugTitle.classList.add("invalid");       valid = false; }
  if (!desc)   { bugDescription.classList.add("invalid"); valid = false; }
  if (!prio)   { bugPriority.classList.add("invalid");    valid = false; }
  if (!valid) { formError.textContent = "Please fill in all required fields."; return; }

  if (editingId) {
    // Edit
    const idx = bugs.findIndex(b => b.id === editingId);
    if (idx !== -1) {
      bugs[idx] = {
        ...bugs[idx],
        title, description: desc,
        priority: prio,
        status:   bugStatus.value,
        assignee: bugAssignee.value.trim(),
        tag:      bugTag.value.trim(),
        updatedAt: new Date().toISOString(),
      };
      showToast("Bug updated successfully", "success");
    }
  } else {
    // Add
    const newBug = {
      id:          generateId(),
      title,
      description: desc,
      priority:    prio,
      status:      bugStatus.value,
      assignee:    bugAssignee.value.trim(),
      tag:         bugTag.value.trim(),
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    };
    bugs.unshift(newBug);
    showToast("Bug reported successfully", "success");
  }

  save();
  closeModal();
  renderBugs();
}

function deleteBug(id) {
  if (!confirm("Are you sure you want to delete this bug?")) return;
  bugs = bugs.filter(b => b.id !== id);
  save();
  renderBugs();
  showToast("Bug deleted", "info");
}

/* ── Toast ────────────────────────────────────────────────── */

let toastTimer;
function showToast(msg, type = "info") {
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = "toast"; }, 3000);
}

/* ── Events ───────────────────────────────────────────────── */

// Open modal
document.getElementById("openModalBtn").addEventListener("click", openAddModal);
document.getElementById("emptyAddBtn").addEventListener("click", openAddModal);
document.getElementById("saveBugBtn").addEventListener("click", saveBug);
document.getElementById("cancelBtn").addEventListener("click", closeModal);
document.getElementById("modalClose").addEventListener("click", closeModal);

// Click overlay to close
modalOverlay.addEventListener("click", e => {
  if (e.target === modalOverlay) closeModal();
});

// Keyboard shortcuts
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && modalOverlay.classList.contains("active")) {
    saveBug();
  }
});

// Character counter
bugTitle.addEventListener("input", () => {
  titleCount.textContent = `${bugTitle.value.length}/120`;
});

// Search
searchInput.addEventListener("input", () => {
  currentSearch = searchInput.value;
  renderBugs();
});

// Priority filter
filterPriority.addEventListener("change", () => {
  currentPriority = filterPriority.value;
  renderBugs();
});

// Sort
sortBy.addEventListener("change", () => {
  currentSort = sortBy.value;
  renderBugs();
});

// Sidebar nav + stat cards filter
document.querySelectorAll("[data-filter]").forEach(el => {
  el.addEventListener("click", e => {
    e.preventDefault();
    currentFilter = el.dataset.filter;

    // Highlight nav items
    document.querySelectorAll(".nav-item[data-filter]").forEach(n => n.classList.remove("active"));
    const navEl = document.querySelector(`.nav-item[data-filter="${currentFilter}"]`);
    if (navEl) navEl.classList.add("active");

    renderBugs();
  });
});

// View toggle (list / grid)
document.getElementById("listViewBtn").addEventListener("click", () => {
  bugContainer.classList.remove("grid-view");
  document.getElementById("listViewBtn").classList.add("active");
  document.getElementById("gridViewBtn").classList.remove("active");
});
document.getElementById("gridViewBtn").addEventListener("click", () => {
  bugContainer.classList.add("grid-view");
  document.getElementById("gridViewBtn").classList.add("active");
  document.getElementById("listViewBtn").classList.remove("active");
});

/* ── Seed Demo Data ───────────────────────────────────────── */

function seedDemoData() {
  const demos = [
    {
      title: "Login page crashes on Safari 17",
      description: "When a user tries to log in using Safari 17 on macOS Sonoma, the page throws a JS exception and the form submission fails entirely.",
      priority: "critical", status: "open", assignee: "Priya S.", tag: "Auth"
    },
    {
      title: "Dashboard graph shows wrong date range",
      description: "The analytics graph on the main dashboard displays data for the previous month instead of the current month after the first week.",
      priority: "high", status: "in-progress", assignee: "Arjun K.", tag: "UI"
    },
    {
      title: "Password reset email delay",
      description: "Password reset emails are arriving with a 10–15 minute delay. Users report not receiving them at all in some cases.",
      priority: "high", status: "open", assignee: "Meera T.", tag: "Email"
    },
    {
      title: "Tooltip text truncated on mobile",
      description: "On screens narrower than 380px, the tooltip content is truncated and cannot be scrolled or expanded.",
      priority: "medium", status: "resolved", assignee: "Dev Team", tag: "UI"
    },
    {
      title: "CSV export missing last column",
      description: "When exporting reports to CSV, the final column (notes) is omitted from the file. Reproducible 100% of the time.",
      priority: "medium", status: "open", assignee: "Karan M.", tag: "Export"
    },
    {
      title: "Search bar slow on large datasets",
      description: "Filtering more than 10,000 records causes noticeable lag (1–2 s) in the search input. Needs debounce or virtual list.",
      priority: "low", status: "closed", assignee: "", tag: "Performance"
    },
  ];

  demos.forEach(d => {
    const offset = demos.indexOf(d) * 86400000;
    bugs.push({
      id:          generateId(),
      title:       d.title,
      description: d.description,
      priority:    d.priority,
      status:      d.status,
      assignee:    d.assignee,
      tag:         d.tag,
      createdAt:   new Date(Date.now() - offset).toISOString(),
      updatedAt:   new Date(Date.now() - offset).toISOString(),
    });
  });
  save();
}

/* ── Init ─────────────────────────────────────────────────── */

(function init() {
  load();
  if (!bugs.length) seedDemoData();
  renderBugs();
})();
