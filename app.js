let allData = [];

const FAVORITES_KEY = "find-my-rhyme-favorites";
const EMAIL_KEY = "find-my-rhyme-email";
const RECENT_KEY = "find-my-rhyme-recent";

let favorites = loadFavorites();
let recent = loadRecent();

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ14cW0LzMG6hPjkdWry9d_X8P_Uag-M84cN00o317GK9CCJVuknQkgbTE-O60P54wU7Wd_Uxkuna2h/pub?gid=1251597746&single=true&output=csv";

// DOM
const searchInput = document.getElementById("search");
const searchMode = document.getElementById("searchMode");
const favoritesOnly = document.getElementById("favoritesOnly");
const favoritesFirst = document.getElementById("favoritesFirst");
const recentOnly = document.getElementById("recentOnly");
const recentFirst = document.getElementById("recentFirst");
const emailAddress = document.getElementById("emailAddress");
const emailFavoritesBtn = document.getElementById("emailFavoritesBtn");
const copyFavoritesBtn = document.getElementById("copyFavoritesBtn");
const clearFavoritesBtn = document.getElementById("clearFavoritesBtn");
const list = document.getElementById("list");

// LOAD SAVED EMAIL
loadSavedEmail();

// LOAD CSV
fetch(SHEET_URL)
  .then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    return res.text();
  })
  .then((csv) => {
    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true
    });

    allData = parsed.data;
    filterAndRender();
  })
  .catch((err) => {
    console.error("Failed to load CSV:", err);
    list.innerHTML = `<div class="load-error">Could not load data.</div>`;
  });

// EVENTS
searchInput.addEventListener("input", filterAndRender);
searchMode.addEventListener("change", filterAndRender);
favoritesOnly.addEventListener("change", filterAndRender);
favoritesFirst.addEventListener("change", filterAndRender);
recentOnly.addEventListener("change", filterAndRender);
recentFirst.addEventListener("change", filterAndRender);

emailFavoritesBtn.addEventListener("click", emailFavorites);
copyFavoritesBtn.addEventListener("click", copyFavorites);
clearFavoritesBtn.addEventListener("click", clearFavorites);

emailAddress.addEventListener("input", () => {
  try {
    localStorage.setItem(EMAIL_KEY, emailAddress.value.trim());
  } catch (err) {
    console.error("Failed to save email:", err);
  }
});

function safeValue(value) {
  return (value || "").toString().toLowerCase().trim();
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();

    return new Set(parsed.map(String));
  } catch (err) {
    console.error("Failed to load favorites:", err);
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch (err) {
    console.error("Failed to save favorites:", err);
  }
}

function loadSavedEmail() {
  try {
    const saved = localStorage.getItem(EMAIL_KEY);
    if (saved) {
      emailAddress.value = saved;
    }
  } catch (err) {
    console.error("Failed to load saved email:", err);
  }
}

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (err) {
    console.error("Failed to load recent items:", err);
    return [];
  }
}

function saveRecent() {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch (err) {
    console.error("Failed to save recent items:", err);
  }
}

function markRecent(id) {
  const itemId = String(id);

  recent = recent.filter((x) => x !== itemId);
  recent.unshift(itemId);
  recent = recent.slice(0, 50);

  saveRecent();
}

function toggleFavorite(itemId) {
  if (favorites.has(itemId)) {
    favorites.delete(itemId);
  } else {
    favorites.add(itemId);
  }

  markRecent(itemId);
  saveFavorites();
  filterAndRender();
}

function applyKeywordSearch(keyword) {
  searchMode.value = "keywords";
  searchInput.value = keyword;
  filterAndRender();
}

function clearFavorites() {
  if (favorites.size === 0) {
    alert("You don’t have any favorites yet.");
    return;
  }

  const confirmed = confirm("Clear all favorites?");
  if (!confirmed) return;

  favorites.clear();
  saveFavorites();
  filterAndRender();
}

function getFavoriteItems() {
  return allData.filter((item) => favorites.has(String(item.ID || "")));
}

function buildFavoritesText() {
  const favoriteItems = getFavoriteItems();

  const lines = [
    "My Find My Rhyme Favorites:",
    ""
  ];

  favoriteItems.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.Title || ""}`);

    const metaParts = [];
    if (item.Creator) metaParts.push(item.Creator);
    if (item.Language) metaParts.push(item.Language);

    if (metaParts.length) {
      lines.push(metaParts.join(" • "));
    }

    if (item.Video) {
      lines.push(`Video: ${item.Video}`);
    }

    if (item.Supplemental) {
      lines.push(`Extra: ${item.Supplemental}`);
    }

    lines.push("");
  });

  return lines.join("\n");
}

function emailFavorites() {
  const to = (emailAddress.value || "").trim();
  const favoriteItems = getFavoriteItems();

  if (favoriteItems.length === 0) {
    alert("You have no favorites selected yet.");
    return;
  }

  const subject = "My Find My Rhyme Favorites";
  const body = buildFavoritesText();

  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

function copyFavorites() {
  const favoriteItems = getFavoriteItems();

  if (favoriteItems.length === 0) {
    alert("You have no favorites to copy yet.");
    return;
  }

  const text = buildFavoritesText();

  navigator.clipboard.writeText(text)
    .then(() => {
      showCopyFeedback();
    })
    .catch(() => {
      alert("Copy failed. Please try again.");
    });
}

function showCopyFeedback() {
  const original = copyFavoritesBtn.textContent;
  copyFavoritesBtn.textContent = "Copied!";
  copyFavoritesBtn.disabled = true;

  setTimeout(() => {
    copyFavoritesBtn.textContent = original;
    copyFavoritesBtn.disabled = false;
  }, 1500);
}

// FILTER + SORT
function filterAndRender() {
  const query = safeValue(searchInput.value);
  const mode = searchMode.value;
  const favOnly = favoritesOnly.checked;
  const favFirst = favoritesFirst.checked;
  const recOnly = recentOnly.checked;
  const recFirst = recentFirst.checked;

  let filtered = allData.filter((item) => {
    const id = String(item.ID || "");

    if (favOnly && !favorites.has(id)) return false;
    if (recOnly && !recent.includes(id)) return false;

    if (!query) return true;

    const title = safeValue(item.Title);
    const creator = safeValue(item.Creator);
    const keywords = safeValue(item.Keywords);
    const language = safeValue(item.Language);

    if (mode === "all") {
      return (
        title.includes(query) ||
        creator.includes(query) ||
        keywords.includes(query) ||
        language.includes(query)
      );
    }

    if (mode === "title") return title.includes(query);
    if (mode === "creator") return creator.includes(query);
    if (mode === "keywords") return keywords.includes(query);
    if (mode === "language") return language.includes(query);

    return true;
  });

  filtered.sort((a, b) => {
    const aId = String(a.ID || "");
    const bId = String(b.ID || "");

    const aFav = favorites.has(aId);
    const bFav = favorites.has(bId);

    const aRec = recent.indexOf(aId);
    const bRec = recent.indexOf(bId);

    if (recFirst && aRec !== bRec) {
      return (aRec === -1 ? Infinity : aRec) - (bRec === -1 ? Infinity : bRec);
    }

    if (favFirst && aFav !== bFav) {
      return aFav ? -1 : 1;
    }

    return 0;
  });

  renderList(filtered);
}

// RENDER
function renderList(data) {
  list.innerHTML = "";

  data.forEach((item) => {
    const itemId = String(item.ID || "");

    const card = document.createElement("div");
    card.className = "card";

    // LEFT
    const top = document.createElement("div");
    top.className = "top";

    const topMain = document.createElement("div");
    topMain.className = "top-main";

    const star = document.createElement("button");
    star.className = "star";
    star.type = "button";
    star.textContent = "★";
    star.setAttribute("aria-label", "Toggle favorite");

    if (favorites.has(itemId)) {
      star.classList.add("fav");
    }

    star.addEventListener("click", () => {
      toggleFavorite(itemId);
    });

    const textBlock = document.createElement("div");
    textBlock.className = "text-block";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = item.Title || "";

    const meta = document.createElement("div");
    meta.className = "meta";

    const creator = document.createElement("div");
    creator.className = "creator";
    creator.textContent = item.Creator || "";

    const language = document.createElement("div");
    language.className = "language";
    language.textContent = item.Language || "";

    if (item.Creator) {
      meta.appendChild(creator);
    }

    if (item.Creator && item.Language) {
      const separator = document.createElement("span");
      separator.className = "meta-separator";
      separator.textContent = "•";
      meta.appendChild(separator);
    }

    if (item.Language) {
      meta.appendChild(language);
    }

    textBlock.appendChild(title);
    textBlock.appendChild(meta);

    topMain.appendChild(star);
    topMain.appendChild(textBlock);
    top.appendChild(topMain);

    // MIDDLE
    const keywords = document.createElement("div");
    keywords.className = "keywords";

    (item.Keywords || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
      .forEach((k) => {
        const pill = document.createElement("button");
        pill.className = "pill";
        pill.type = "button";
        pill.textContent = k;
        pill.setAttribute("aria-label", `Search keyword ${k}`);

        pill.addEventListener("click", () => {
          applyKeywordSearch(k);
        });

        keywords.appendChild(pill);
      });

    // RIGHT
    const links = document.createElement("div");
    links.className = "links";

    if (item.Video) {
      const videoLink = document.createElement("a");
      videoLink.className = "icon-link";
      videoLink.href = item.Video;
      videoLink.target = "_blank";
      videoLink.rel = "noopener noreferrer";
      videoLink.textContent = "🎬 Video";
      videoLink.addEventListener("click", () => {
        markRecent(itemId);
      });
      links.appendChild(videoLink);
    }

    if (item.Supplemental) {
      const supplementalLink = document.createElement("a");
      supplementalLink.className = "icon-link";
      supplementalLink.href = item.Supplemental;
      supplementalLink.target = "_blank";
      supplementalLink.rel = "noopener noreferrer";
      supplementalLink.textContent = "📎 Extra";
      supplementalLink.addEventListener("click", () => {
        markRecent(itemId);
      });
      links.appendChild(supplementalLink);
    }

    card.appendChild(top);
    card.appendChild(keywords);
    card.appendChild(links);

    list.appendChild(card);
  });
}
