# 🐛 BugNest — Elegant Bug Tracker

A clean, production-grade **client-side bug tracker** built with vanilla HTML, CSS, and JavaScript. No frameworks, no dependencies, no build step — just open `index.html` in a browser and start tracking.

---

## 🚀 Quick Start

```bash
# Clone or download the project
git clone https://github.com/your-repo/bugnest.git
cd bugnest

# Open in browser (no server needed)
open index.html
# OR right-click index.html → Open With → Your Browser
```

> All data is stored in **localStorage** — nothing leaves your machine.

---

## 📁 Project Structure

```
bugnest/
├── index.html   # App layout & markup
├── style.css    # Soft elegant theme with CSS variables
├── app.js       # Full CRUD logic, filtering, sorting, persistence
└── README.md    # This file
```

---

## ✨ Features

| Feature | Details |
|---|---|
| **Report Bugs** | Title, description, priority, status, assignee, tag |
| **Edit / Delete** | Hover a card to reveal edit and delete actions |
| **Status Workflow** | Open → In Progress → Resolved → Closed |
| **Priority Levels** | Critical 🔴 · High 🟠 · Medium 🟡 · Low 🟢 |
| **Smart Search** | Searches title, description, assignee, tag, ID |
| **Filter by Status** | Sidebar nav links + stat cards |
| **Filter by Priority** | Dropdown in the toolbar |
| **Sort** | Newest · Oldest · Priority · Title A–Z |
| **List / Grid View** | Toggle between layouts |
| **Persistent Storage** | Auto-saved to `localStorage` |
| **Demo Data** | 6 pre-loaded bugs on first launch |
| **Toast Notifications** | Feedback on every action |
| **Keyboard Shortcuts** | `Esc` = close modal · `Ctrl+Enter` = save |
| **Responsive** | Mobile-friendly sidebar collapses gracefully |

---

## 🎨 Design System

The UI uses a **soft warm-neutral palette** defined through CSS custom properties:

```css
--bg:       #f5f3ef   /* Page background */
--surface:  #fdfcfa   /* Cards & sidebar */
--accent:   #8b7355   /* Primary action colour */
--accent-2: #c4a882   /* Hover / focus ring */
```

Typography pairs **Fraunces** (serif display) with **DM Sans** (clean body text), loaded from Google Fonts.

---

## 🗂️ Bug Data Model

Each bug object stored in `localStorage` has the following shape:

```json
{
  "id":          "BUG-0001",
  "title":       "Login page crashes on Safari 17",
  "description": "Steps to reproduce…",
  "priority":    "critical",
  "status":      "open",
  "assignee":    "Priya S.",
  "tag":         "Auth",
  "createdAt":   "2025-05-01T08:30:00.000Z",
  "updatedAt":   "2025-05-01T08:30:00.000Z"
}
```

**Priority values:** `critical` | `high` | `medium` | `low`  
**Status values:** `open` | `in-progress` | `resolved` | `closed`

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Esc` | Close the modal |
| `Ctrl + Enter` | Save bug (while modal is open) |

---

## 🔧 How It Works

### Persistence
`app.js` reads from and writes to `localStorage` on every create / edit / delete operation. Data survives page reloads and browser restarts.

### Rendering Pipeline
1. `getFilteredBugs()` — applies status, priority, and search filters, then sorts.
2. `renderBugs()` — clears existing cards, renders new cards from the filtered list, re-attaches event listeners.

### Modal
A single modal handles both **Add** and **Edit** operations. `editingId` tracks whether we are creating a new bug or updating an existing one.

---

## 🌱 Extending BugNest

Some ideas if you want to go further:

- **Backend API** — swap `localStorage` for `fetch` calls to a REST/GraphQL API.
- **Authentication** — add user accounts so bugs can be assigned to real team members.
- **Comments** — attach a threaded comment array to each bug object.
- **File Attachments** — store screenshot URLs alongside each bug.
- **Notifications** — hook into the Web Notifications API for due-date reminders.
- **Export** — add a CSV/JSON export button using the `Blob` API.

---

## 🛠️ Browser Support

| Browser | Support |
|---|---|
| Chrome 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 15+ | ✅ Full |
| Edge 90+ | ✅ Full |

No polyfills required. Uses only standard DOM APIs, CSS custom properties, and `localStorage`.

---

## 📝 License

MIT — free to use, modify, and distribute.

---

> Built with ❤️ using plain HTML, CSS & JavaScript — no frameworks needed.
