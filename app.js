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
const excludeAI = document.getElementById("excludeAI");
const excludeProblematic = document.getElementById("excludeProblematic");
const emailAddress = document.getElementById("emailAddress");
const emailFavoritesBtn = document.getElementById("emailFavoritesBtn");
const copyFavoritesBtn = document.getElementById("copyFavoritesBtn");
const clearFavoritesBtn = document.getElementById("clearFavoritesBtn");
const list = document.getElementById("list");
const menuToggle = document.getElementById("menuToggle");
const navBar = document.getElementById("navBar");

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
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    allData = parsed.data.map((item, index) => normalizeItem(item, index));
    filterAndRender();
  })
  .catch((err) => {
    console.error("Failed to load CSV:", err);
    list.innerHTML = `<div class="load-error">Could not load data.</div>`;
  });

// EVENTS
searchInput?.addEventListener("input", filterAndRender);
searchMode?.addEventListener("change", filterAndRender);
favoritesOnly?.addEventListener("change", filterAndRender);
favoritesFirst?.addEventListener("change", filterAndRender);
recentOnly?.addEventListener("change", filterAndRender);
recentFirst?.addEventListener("change", filterAndRender);
excludeAI?.addEventListener("change", filterAndRender);
excludeProblematic?.addEventListener("change", filterAndRender);

emailFavoritesBtn?.addEventListener("click", emailFavorites);
copyFavoritesBtn?.addEventListener("click", copyFavorites);
clearFavoritesBtn?.addEventListener("click", clearFavorites);

emailAddress?.addEventListener("input", () => {
  try {
    localStorage.setItem(EMAIL_KEY, emailAddress.value.trim());
  } catch (err) {
    console.error("Failed to save email:", err);
  }
});

if (menuToggle && navBar) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navBar.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

function safeValue(value) {
  return (value || "").toString().toLowerCase().trim();
}

function normalizeItem(item, index) {
  const normalized = {
    ID: (item.ID || item.Id || item.id || "").toString().trim(),
    Title: (item.Title || "").toString().trim(),
    Early_Literacy_Skill: (item.Early_Literacy_Skill || "").toString().trim(),
    Physical_Skill: (item.Physical_Skill || "").toString().trim(),
    Cognitive_Skill: (item.Cognitive_Skill || "").toString().trim(),
    Social_Emotional_Skill: (item.Social_Emotional_Skill || "").toString().trim(),
    Concept: (item.Concept || "").toString().trim(),
    Theme: (item.Theme || "").toString().trim(),
    Tune: (item.Tune || "").toString().trim(),
    Language: (item.Language || "").toString().trim(),
    Prop: (item.Prop || item.Props || "").toString().trim(),
    Music_Genre: (item.Music_Genre || item["Music Genre"] || "").toString().trim(),
    Format: (item.Format || "").toString().trim(),
    Music_Source: (item.Music_Source || item["Music Source"] || "").toString().trim(),
    AI_Supported: (item.AI_Supported || item["AI-Supported"] || "").toString().trim(),
    Problematic_History: (
      item.Problematic_History ||
      item["Problematic_History"] ||
      item["Problematic History"] ||
      ""
    ).toString().trim(),
    Creator: (item.Creator || "").toString().trim(),
    Video: (item.Video || "").toString().trim(),
    Supplemental: (item.Supplemental || "").toString().trim()
  };

  normalized._key = normalized.ID ? `id:${normalized.ID}` : `row:${index}`;

  normalized._keywordSearch = [
    normalized.Early_Literacy_Skill,
    normalized.Physical_Skill,
    normalized.Cognitive_Skill,
    normalized.Social_Emotional_Skill,
    normalized.Concept,
    normalized.Theme,
    normalized.Tune,
    normalized.Language,
    normalized.Prop,
    normalized.Music_Genre,
    normalized.Format,
    normalized.Music_Source,
    normalized.AI_Supported,
    normalized.Problematic_History
  ]
    .filter(Boolean)
    .join(" | ");

  return normalized;
}

function getItemKey(item) {
  return item._key;
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
    if (saved && emailAddress) {
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

function markRecent(itemKey) {
  recent = recent.filter((x) => x !== itemKey);
  recent.unshift(itemKey);
  recent = recent.slice(0, 50);
  saveRecent();
}

function toggleFavorite(itemKey) {
  if (favorites.has(itemKey)) {
    favorites.delete(itemKey);
  } else {
    favorites.add(itemKey);
  }

  markRecent(itemKey);
  saveFavorites();
  filterAndRender();
}

function applyKeywordSearch(keyword) {
  if (!searchMode || !searchInput) return;
  searchMode.value = "keywords";
  searchInput.value = keyword;
  filterAndRender();
}

function applyLanguageSearch(language) {
  if (!searchMode || !searchInput) return;
  searchMode.value = "language";
  searchInput.value = language;
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
  return allData.filter((item) => favorites.has(getItemKey(item)));
}

function buildFavoritesText() {
  const favoriteItems = getFavoriteItems();

  const lines = [
    "My Find a Rhyme Favorites:",
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

    if (item.ID) {
      lines.push(`ID: ${item.ID}`);
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
  if (!emailAddress) return;

  const to = (emailAddress.value || "").trim();
  const favoriteItems = getFavoriteItems();

  if (favoriteItems.length === 0) {
    alert("You have no favorites selected yet.");
    return;
  }

  const subject = "My Find a Rhyme Favorites";
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
  if (!copyFavoritesBtn) return;

  const original = copyFavoritesBtn.textContent;
  copyFavoritesBtn.textContent = "Copied!";
  copyFavoritesBtn.disabled = true;

  setTimeout(() => {
    copyFavoritesBtn.textContent = original;
    copyFavoritesBtn.disabled = false;
  }, 1500);
}

function copyID(id, element) {
  navigator.clipboard.writeText(id)
    .then(() => {
      const original = element.textContent;
      element.textContent = "Copied!";
      element.disabled = true;

      setTimeout(() => {
        element.textContent = `ID: ${id}`;
        element.disabled = false;
      }, 1200);
    })
    .catch(() => {
      alert("Copy failed. Please try again.");
    });
}

function splitValues(value) {
  return (value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function addPills(container, value, className, clickHandler, labelPrefix = "Search keyword") {
  splitValues(value).forEach((text) => {
    const pill = document.createElement("button");
    pill.className = `pill ${className}`;
    pill.type = "button";
    pill.textContent = text;
    pill.setAttribute("aria-label", `${labelPrefix} ${text}`);

    pill.addEventListener("click", () => {
      clickHandler(text);
    });

    container.appendChild(pill);
  });
}

function hasTruthyFlag(value) {
  const normalized = safeValue(value);
  return normalized !== "" && normalized !== "no" && normalized !== "false" && normalized !== "0";
}

// FILTER + SORT
function filterAndRender() {
  if (!list) return;

  const query = safeValue(searchInput?.value);
  const mode = searchMode?.value || "all";
  const favOnly = favoritesOnly?.checked || false;
  const favFirst = favoritesFirst?.checked || false;
  const recOnly = recentOnly?.checked || false;
  const recFirst = recentFirst?.checked || false;
  const excludeAIOn = excludeAI?.checked || false;
  const excludeProblematicOn = excludeProblematic?.checked || false;

  let filtered = allData.filter((item) => {
    const itemKey = getItemKey(item);

    if (favOnly && !favorites.has(itemKey)) return false;
    if (recOnly && !recent.includes(itemKey)) return false;
    if (excludeAIOn && hasTruthyFlag(item.AI_Supported)) return false;
    if (excludeProblematicOn && hasTruthyFlag(item.Problematic_History)) return false;

    if (!query) return true;

    const title = safeValue(item.Title);
    const creator = safeValue(item.Creator);
    const keywords = safeValue(item._keywordSearch);
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
    const aKey = getItemKey(a);
    const bKey = getItemKey(b);

    const aFav = favorites.has(aKey);
    const bFav = favorites.has(bKey);

    const aRec = recent.indexOf(aKey);
    const bRec = recent.indexOf(bKey);

    if (recFirst && aRec !== bRec) {
      return (aRec === -1 ? Infinity : aRec) - (bRec === -1 ? Infinity : bRec);
    }

    if (favFirst && aFav !== bFav) {
      return aFav ? -1 : 1;
    }

    return (a.Title || "").localeCompare(b.Title || "");
  });

  renderList(filtered);
}

// RENDER
function renderList(data) {
  if (!list) return;

  list.innerHTML = "";

  if (!data.length) {
    list.innerHTML = `<div class="load-error">No results found.</div>`;
    return;
  }

  data.forEach((item) => {
    const itemKey = getItemKey(item);

    const card = document.createElement("div");
    card.className = "card";

    if (item.ID) {
      const idLabel = document.createElement("button");
      idLabel.className = "card-id";
      idLabel.type = "button";
      idLabel.textContent = `ID: ${item.ID}`;
      idLabel.setAttribute("aria-label", `Copy ID ${item.ID}`);

      idLabel.addEventListener("click", () => {
        copyID(item.ID, idLabel);
      });

      card.appendChild(idLabel);
    }

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

    if (favorites.has(itemKey)) {
      star.classList.add("fav");
    }

    star.addEventListener("click", () => {
      toggleFavorite(itemKey);
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

    if (item.Creator) {
      meta.appendChild(creator);
    }

    textBlock.appendChild(title);
    textBlock.appendChild(meta);

    topMain.appendChild(star);
    topMain.appendChild(textBlock);
    top.appendChild(topMain);

    // MIDDLE
    const keywords = document.createElement("div");
    keywords.className = "keywords";

    addPills(keywords, item.Early_Literacy_Skill, "early-literacy-pill", applyKeywordSearch);
    addPills(keywords, item.Physical_Skill, "physical-pill", applyKeywordSearch);
    addPills(keywords, item.Cognitive_Skill, "cognitive-pill", applyKeywordSearch);
    addPills(keywords, item.Social_Emotional_Skill, "social-emotional-pill", applyKeywordSearch);
    addPills(keywords, item.Concept, "concept-pill", applyKeywordSearch);
    addPills(keywords, item.Theme, "theme-pill", applyKeywordSearch);
    addPills(keywords, item.Tune, "tune-pill", applyKeywordSearch);
    addPills(keywords, item.Language, "language-pill", applyLanguageSearch, "Search language");
    addPills(keywords, item.Prop, "prop-pill", applyKeywordSearch);
    addPills(keywords, item.Music_Genre, "music-genre-pill", applyKeywordSearch);
    addPills(keywords, item.Format, "format-pill", applyKeywordSearch);
    addPills(keywords, item.Music_Source, "music-source-pill", applyKeywordSearch);

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
        markRecent(itemKey);
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
        markRecent(itemKey);
      });

      links.appendChild(supplementalLink);
    }

    const statusFlags = document.createElement("div");
    statusFlags.className = "status-flags";

    if (hasTruthyFlag(item.AI_Supported)) {
      const aiFlag = document.createElement("button");
      aiFlag.className = "status-flag ai-flag";
      aiFlag.type = "button";
      aiFlag.textContent = "💻 AI-Supported";
      aiFlag.setAttribute("aria-label", "Search keyword AI-Supported");
      aiFlag.addEventListener("click", () => {
        applyKeywordSearch("AI-Supported");
      });
      statusFlags.appendChild(aiFlag);
    }

    if (hasTruthyFlag(item.Problematic_History)) {
      const problematicFlag = document.createElement("button");
      problematicFlag.className = "status-flag warning-flag";
      problematicFlag.type = "button";
      problematicFlag.textContent = "🚩 Problematic History";
      problematicFlag.setAttribute("aria-label", "Search keyword Problematic History");
      problematicFlag.addEventListener("click", () => {
        applyKeywordSearch("Problematic History");
      });
      statusFlags.appendChild(problematicFlag);
    }

    if (statusFlags.childNodes.length) {
      links.appendChild(statusFlags);
    }

    card.appendChild(top);
    card.appendChild(keywords);
    card.appendChild(links);

    list.appendChild(card);
  });
}