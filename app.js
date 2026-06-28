// State variables
let watchlist = [];
let currentFilter = 'all';
let currentSort = 'name-asc';
let selectedGradient = 'gradient-cyberpunk';

// Discover View State
let activeView = 'discover'; // 'discover' or 'watchlist'
let discoverYear = '2026';
let activeDiscoverGenre = null; // Store selected discover genre (e.g. "Action")
let searchTimeout = null; // Debounce timer for search
let currentSeasonData = []; // Store fetched season data globally

// DOM Elements - General, Header & Navigation
const logoHome = document.getElementById('logo-home');
const unifiedSearchInput = document.getElementById('unified-search-input');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeColorPicker = document.getElementById('theme-color-picker');
const tabDiscover = document.getElementById('tab-discover');
const tabWatchlist = document.getElementById('tab-watchlist');
const viewDiscover = document.getElementById('view-discover-container');
const viewWatchlist = document.getElementById('view-watchlist-container');

// DOM Elements - Watchlist Page Controls
const animeGrid = document.getElementById('anime-grid');
const sortSelect = document.getElementById('sort-select');
const statusTabs = document.getElementById('status-tabs');
const btnAddAnime = document.getElementById('btn-add-anime');
const animeModal = document.getElementById('anime-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const animeForm = document.getElementById('anime-form');
const gradientSelector = document.getElementById('gradient-selector');
const toastContainer = document.getElementById('toast-container');

// DOM Elements - Discover Section
const discoverGrid = document.getElementById('discover-grid');
const discoverInfoText = document.getElementById('discover-info-text');
const apiStatusBadge = document.getElementById('api-status-badge');
const yearChips = document.getElementById('year-chips');

// DOM Elements - Sidebar
const sidebarToggle = document.getElementById('sidebar-toggle');
const genreSidebar = document.getElementById('genre-sidebar');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');
const btnTopAnime = document.getElementById('btn-top-anime');
const sidebarGenreList = document.getElementById('sidebar-genre-list');
const sidebarResultsTitle = document.getElementById('sidebar-results-title');
const sidebarResultsCount = document.getElementById('sidebar-results-count');
const sidebarResultsGrid = document.getElementById('sidebar-results-grid');

// Dashboard Counters
const statTotal = document.getElementById('stat-total');
const statWatching = document.getElementById('stat-watching');
const statCompleted = document.getElementById('stat-completed');
const statWatchNext = document.getElementById('stat-watch-next');
const statPlanning = document.getElementById('stat-planning');
const statRating = document.getElementById('stat-rating');

// Initialize App
function init() {
  initTheme();
  initCustomColorTheme();
  loadWatchlist();
  setupEventListeners();
  calculateAnalytics();
  
  // Set initial browser history state for SPAs
  history.replaceState({ view: 'discover', genre: null }, '');
  
  // Default view is Discover
  fetchDiscoverSeasons();

  // Load genre sidebar data
  fetchGenreList();
}

// Theme Management - Load saved theme or default to light
function initTheme() {
  const savedTheme = localStorage.getItem('otaku_theme') || 'light';
  applyTheme(savedTheme);
}

// Theme Custom Color Spectrum helpers
function applyCustomColorTheme(primaryColor) {
  document.documentElement.style.setProperty('--primary', primaryColor);
  document.documentElement.style.setProperty('--primary-glow', `${primaryColor}26`); // 15% opacity

  const secondaryColor = adjustColorBrightness(primaryColor, -20);
  document.documentElement.style.setProperty('--gradient-cyberpunk', `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`);

  localStorage.setItem('otaku_theme_color', primaryColor);
  if (themeColorPicker) {
    themeColorPicker.value = primaryColor;
  }
}

function initCustomColorTheme() {
  const savedColor = localStorage.getItem('otaku_theme_color') || '#8b5cf6'; // default to purple
  applyCustomColorTheme(savedColor);
}

function adjustColorBrightness(hex, percent) {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  R = (R > 0) ? R : 0;
  G = (G > 0) ? G : 0;
  B = (B > 0) ? B : 0;

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

// Apply theme to DOM
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

// Toggle between light and dark themes
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('otaku_theme', newTheme);
  showToast(`Switched to ${newTheme === 'dark' ? '🌙 Dark' : '☀️ Light'} mode`, 'info');
}

// Load watchlist from LocalStorage (Starts empty if not present)
function loadWatchlist() {
  const stored = localStorage.getItem('otaku_watchlist');
  if (stored) {
    watchlist = JSON.parse(stored);
  } else {
    watchlist = [];
    saveToLocalStorage();
  }
}

// Save watchlist to LocalStorage
function saveToLocalStorage() {
  localStorage.setItem('otaku_watchlist', JSON.stringify(watchlist));
}

// Set up UI Event Listeners
function setupEventListeners() {
  // Theme Toggle
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Custom Color Theme Picker
  themeColorPicker.addEventListener('input', (e) => {
    applyCustomColorTheme(e.target.value);
  });

  // Sidebar Toggle
  sidebarToggle.addEventListener('click', toggleSidebar);
  sidebarBackdrop.addEventListener('click', closeSidebar);

  // Top Anime button
  btnTopAnime.addEventListener('click', () => {
    sidebarGenreList.querySelectorAll('.sidebar-genre-btn').forEach(b => b.classList.remove('active'));
    btnTopAnime.classList.add('active');
    fetchTopAnime();
  });

  // Navigation View Switching - Discover Tab
  tabDiscover.addEventListener('click', () => {
    if (activeView !== 'discover') {
      activeView = 'discover';
      activeDiscoverGenre = null; // Reset genre sub-page
      history.pushState({ view: 'discover', genre: null }, '');
    }
    tabDiscover.classList.add('active');
    tabWatchlist.classList.remove('active');
    viewDiscover.classList.add('active');
    viewWatchlist.classList.remove('active');
    
    // Clear search input on tab change
    unifiedSearchInput.value = '';
    filterAndRenderDiscover(); 
  });

  // Navigation View Switching - Watchlist Tab
  tabWatchlist.addEventListener('click', () => {
    if (activeView !== 'watchlist') {
      activeView = 'watchlist';
      activeDiscoverGenre = null;
      history.pushState({ view: 'watchlist' }, '');
    }
    tabWatchlist.classList.add('active');
    tabDiscover.classList.remove('active');
    viewWatchlist.classList.add('active');
    viewDiscover.classList.remove('active');
    
    // Clear search input on tab change
    unifiedSearchInput.value = '';
    renderWatchlist();
  });

  // OtakuVault Logo Click - Go to Homepage (Discover tab's default state)
  logoHome.addEventListener('click', () => {
    activeView = 'discover';
    activeDiscoverGenre = null; // Reset genre sub-page
    history.pushState({ view: 'discover', genre: null }, '');

    tabDiscover.classList.add('active');
    tabWatchlist.classList.remove('active');
    viewDiscover.classList.add('active');
    viewWatchlist.classList.remove('active');

    // Reset chips selection state in UI
    yearChips.querySelectorAll('.chip-btn').forEach(b => {
      if (b.dataset.year === '2026') b.classList.add('active');
      else b.classList.remove('active');
    });

    // Reset states
    discoverYear = '2026';
    unifiedSearchInput.value = '';

    // Reload
    fetchDiscoverSeasons();
    showToast("Welcome back to the Homepage!", "info");
  });

  // Discover Year Chip Selector
  yearChips.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    
    yearChips.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    discoverYear = btn.dataset.year;
    activeDiscoverGenre = null; // Reset genre sub-page on year switch
    history.pushState({ view: 'discover', genre: null }, '');
    
    // Reset search input on year switch
    unifiedSearchInput.value = '';
    fetchDiscoverSeasons();
  });

  // Native Browser Back/Forward navigation support
  window.addEventListener('popstate', (e) => {
    const state = e.state;
    if (!state) return;

    activeView = state.view;
    activeDiscoverGenre = state.genre || null;

    if (activeView === 'discover') {
      tabDiscover.classList.add('active');
      tabWatchlist.classList.remove('active');
      viewDiscover.classList.add('active');
      viewWatchlist.classList.remove('active');
      
      // Update year chips active class to match state
      yearChips.querySelectorAll('.chip-btn').forEach(b => {
        if (b.dataset.year === discoverYear) b.classList.add('active');
        else b.classList.remove('active');
      });
      
      filterAndRenderDiscover();
    } else if (activeView === 'watchlist') {
      tabWatchlist.classList.add('active');
      tabDiscover.classList.remove('active');
      viewWatchlist.classList.add('active');
      viewDiscover.classList.remove('active');
      
      renderWatchlist();
    }
  });

  // Unified Search Input Handler
  unifiedSearchInput.addEventListener('input', () => {
    if (activeView === 'discover') {
      filterAndRenderDiscover();
    } else {
      renderWatchlist();
    }
  });

  // Watchlist Sort dropdown
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderWatchlist();
  });

  // Watchlist Filter Tabs
  statusTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
      statusTabs.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      e.target.classList.add('active');
      e.target.setAttribute('aria-selected', 'true');
      
      currentFilter = e.target.dataset.status;
      renderWatchlist();
    }
  });

  // Modal controls
  btnAddAnime.addEventListener('click', () => openModal());
  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);

  // Close modal clicking outside content
  animeModal.addEventListener('click', (e) => {
    if (e.target === animeModal) closeModal();
  });

  // Form gradient theme selection
  gradientSelector.addEventListener('click', (e) => {
    if (e.target.classList.contains('gradient-option')) {
      gradientSelector.querySelectorAll('.gradient-option').forEach(opt => opt.classList.remove('active'));
      e.target.classList.add('active');
      selectedGradient = e.target.dataset.gradient;
    }
  });

  // Form submission
  animeForm.addEventListener('submit', handleFormSubmit);

  // Automate status to Completed when episodesWatched matches episodesTotal (and episodesTotal > 0)
  const episodesWatchedInput = document.getElementById('episodes-watched');
  const episodesTotalInput = document.getElementById('episodes-total');
  const statusSelect = document.getElementById('anime-status');

  episodesWatchedInput.addEventListener('input', () => {
    const watched = parseInt(episodesWatchedInput.value) || 0;
    const total = parseInt(episodesTotalInput.value) || 0;
    if (total > 0 && watched >= total) {
      statusSelect.value = 'completed';
    }
  });
}

// Normalize string for punctuation-flexible search (ignores spaces, dots, hyphens, colons, quotes)
function normalizeString(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Fetch seasonal anime using Jikan API (with LocalStorage caching)
async function fetchDiscoverSeasons() {
  const cacheKey = `otaku_year_cache_v3_${discoverYear}`;
  
  // Set loading UI state
  apiStatusBadge.className = 'api-status-badge loading';
  apiStatusBadge.textContent = 'Loading...';
  discoverGrid.innerHTML = `
    <div class="spinner-container">
      <div class="spinner"></div>
      <span class="spinner-text">Fetching highly rated anime catalog for ${discoverYear}...</span>
    </div>
  `;

  // Try checking cache first (12h TTL)
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const now = Date.now();
      if (now - parsed.timestamp < 43200000) { // 12 hours
        apiStatusBadge.className = 'api-status-badge cached';
        apiStatusBadge.textContent = 'Cached';
        discoverInfoText.textContent = `Showing highly rated anime (>7.0) for ${discoverYear}`;
        
        currentSeasonData = parsed.data;
        filterAndRenderDiscover();
        return;
      }
    } catch (e) {
      console.error("Cache read failed", e);
    }
  }

  // Fetch all 4 seasons for the year: winter, spring, summer, fall
  const seasons = ['winter', 'spring', 'summer', 'fall'];
  let compiledData = [];
  let fetchErrors = [];

  // Fetch with staggered delay to avoid hitting Jikan API rate limit (3 req/sec) too hard
  const fetchPromises = seasons.map(async (season, index) => {
    const url = `https://api.jikan.moe/v4/seasons/${discoverYear}/${season}`;
    try {
      // Stagger the requests
      await new Promise(r => setTimeout(r, index * 650));

      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404 || response.status === 400) {
          // Future seasons might 404/400, ignore them silently
          return [];
        }
        throw new Error(`Status ${response.status}`);
      }
      const res = await response.json();
      return res.data || [];
    } catch (err) {
      console.warn(`Failed to fetch ${season} for ${discoverYear}:`, err);
      fetchErrors.push(`${season}: ${err.message}`);
      return [];
    }
  });

  try {
    const results = await Promise.all(fetchPromises);
    
    // Flatten
    results.forEach(list => {
      compiledData = compiledData.concat(list);
    });

    // Filter by score above 7.0 (as requested)
    compiledData = compiledData.filter(anime => anime.score && anime.score >= 7.0);

    // Deduplicate entries by MAL ID and normalized title (prevents duplicate shows like Dr. Stone)
    const seenIds = new Set();
    const seenTitles = new Set();
    compiledData = compiledData.filter(anime => {
      if (!anime.mal_id) return true;
      const titleKey = normalizeString(anime.title_english || anime.title);
      if (seenIds.has(anime.mal_id) || seenTitles.has(titleKey)) {
        return false;
      }
      seenIds.add(anime.mal_id);
      seenTitles.add(titleKey);
      return true;
    });

    // Sort by rating descending (highest score first)
    compiledData.sort((a, b) => b.score - a.score);

    // If we fetched absolutely nothing and had errors, throw an error
    if (compiledData.length === 0 && fetchErrors.length > 0) {
      throw new Error(`Failed to load any seasons for ${discoverYear}. Jikan API rate limit or service error.`);
    }

    // Cache the parsed result
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: compiledData
    }));

    apiStatusBadge.className = 'api-status-badge';
    apiStatusBadge.textContent = 'Loaded from API';
    discoverInfoText.textContent = `Showing highly rated anime (>7.0) for ${discoverYear}`;
    
    currentSeasonData = compiledData;
    filterAndRenderDiscover();
  } catch (err) {
    console.error("API request failed:", err);
    
    // Fallback to expired cache if available
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        apiStatusBadge.className = 'api-status-badge error';
        apiStatusBadge.textContent = 'Fallback Cache';
        discoverInfoText.textContent = `Offline fallback for ${discoverYear}`;
        
        currentSeasonData = parsed.data;
        filterAndRenderDiscover();
        showToast("Using offline backup catalog.", "info");
        return;
      } catch (e) {}
    }

    // Display error message to user with a Retry button
    apiStatusBadge.className = 'api-status-badge error';
    apiStatusBadge.textContent = 'Error';
    discoverGrid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--secondary)">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>Could not load catalog</h3>
        <p>${err.message}</p>
        <button class="add-btn" id="btn-api-retry" style="margin: 1.5rem auto 0 auto;">
          🔄 Retry Connection
        </button>
      </div>
    `;
    
    document.getElementById('btn-api-retry').addEventListener('click', () => fetchDiscoverSeasons());
  }
}

// Filter current season's anime based on search query, showing quirky state if empty (punctuation-flexible)
function filterAndRenderDiscover() {
  const query = unifiedSearchInput.value.trim();
  if (!query) {
    if (searchTimeout) clearTimeout(searchTimeout);
    discoverInfoText.style.display = 'block';
    discoverInfoText.textContent = `Showing highly rated anime (>7.0) for ${discoverYear}`;
    renderDiscoverCards(currentSeasonData);
    return;
  }

  // Debounce the global API search to avoid spamming the Jikan API
  if (searchTimeout) clearTimeout(searchTimeout);
  
  discoverInfoText.style.display = 'none';
  discoverGrid.classList.remove('genre-view');
  discoverGrid.innerHTML = `
    <div class="spinner-container" style="grid-column: 1 / -1;">
      <div class="spinner"></div>
      <span class="spinner-text">Searching all years for "${escapeHtml(query)}"...</span>
    </div>
  `;

  searchTimeout = setTimeout(() => {
    performGlobalSearch(query);
  }, 600);
}

// Fetch search results from Jikan across all years (with caching and debouncing)
async function performGlobalSearch(query) {
  const normalizedQuery = normalizeString(query);
  const cacheKey = `otaku_global_search_${normalizedQuery}`;

  // Check cache first
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 43200000) { // 12 hours
        if (normalizeString(unifiedSearchInput.value) === normalizedQuery) {
          renderDiscoverCards(parsed.data);
        }
        return;
      }
    } catch (e) {}
  }

  try {
    const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&min_score=7&limit=25`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429) throw new Error('Rate limit hit. Wait a second.');
      throw new Error(`API error ${response.status}`);
    }

    const result = await response.json();
    let data = result.data || [];

    // Filter score >= 7.0
    data = data.filter(anime => anime.score && anime.score >= 7.0);

    // Dedup
    const seenIds = new Set();
    const seenTitles = new Set();
    data = data.filter(anime => {
      if (!anime.mal_id) return true;
      const titleKey = normalizeString(anime.title_english || anime.title);
      if (seenIds.has(anime.mal_id) || seenTitles.has(titleKey)) return false;
      seenIds.add(anime.mal_id);
      seenTitles.add(titleKey);
      return true;
    });

    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: data
    }));

    if (normalizeString(unifiedSearchInput.value) === normalizedQuery) {
      renderDiscoverCards(data);
    }
  } catch (err) {
    console.error('Global search error:', err);
    
    if (normalizeString(unifiedSearchInput.value) === normalizedQuery) {
      discoverGrid.classList.remove('genre-view');
      discoverGrid.innerHTML = `
        <div class="empty-state" style="border-color: var(--secondary);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--secondary)">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>Search Failed</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  }
}

// Escape HTML utility to prevent XSS in query display
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Return human-readable label for Year
function getSeasonYearLabel() {
  return `${discoverYear}`;
}

// Find watchlist entry securely by comparing malId and title
function findWatchlistEntry(anime) {
  const title = anime.title_english || anime.title;
  const malId = anime.mal_id;
  return watchlist.find(item => 
    (item.malId && malId && item.malId === malId) || 
    (item.title && title && item.title.toLowerCase() === title.toLowerCase())
  );
}

// Find watchlist index securely
function findWatchlistIndex(anime) {
  const title = anime.title_english || anime.title;
  const malId = anime.mal_id;
  return watchlist.findIndex(item => 
    (item.malId && malId && item.malId === malId) || 
    (item.title && title && item.title.toLowerCase() === title.toLowerCase())
  );
}

// Genre icons mapping for a premium visual display
const genreIcons = {
  "Action": "💥",
  "Adventure": "🧭",
  "Award Winning": "🏆",
  "Comedy": "😂",
  "Drama": "🎭",
  "Fantasy": "🧙",
  "Horror": "😱",
  "Mystery": "🕵️",
  "Romance": "💖",
  "Sci-Fi": "🚀",
  "Slice of Life": "🍃",
  "Sports": "⚽",
  "Supernatural": "👻",
  "Suspense": "🤫",
  "Gourmet": "🍳",
  "Ecchi": "💋",
  "Hentai": "🔞",
  "Erotica": "🔞",
  "Boys Love": "👬",
  "Girls Love": "👭",
  "Avant Garde": "🌀",
  "General": "📺"
};

// Render Discover Cards: shows clickable genre boxes or a sub-page grid for a selected genre
function renderDiscoverCards(data) {
  discoverGrid.innerHTML = '';

  if (data.length === 0) {
    discoverGrid.classList.remove('genre-view');
    const query = unifiedSearchInput.value.trim();
    if (query) {
      discoverGrid.innerHTML = `
        <div class="empty-state" style="padding: 4rem 2rem; border-color: var(--secondary);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🛸</div>
          <h3 style="color: var(--secondary); font-weight: 800; letter-spacing: -0.5px;">Timeline Disruption Detected!</h3>
          <p style="margin-top: 0.5rem; line-height: 1.5; color: var(--text-muted); max-width: 450px; margin-left: auto; margin-right: auto;">
            Bzzt! The anime <b>"${escapeHtml(query)}"</b> is not released in the <b>2005-2026</b> timeline. 
            Did you spell it right, or are you a time traveler trying to stream futuristic shows? 🌌
          </p>
        </div>
      `;
    } else {
      discoverGrid.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <h3>No highly rated shows found</h3>
          <p>No anime in this catalog met the rating threshold of score > 7.0.</p>
        </div>
      `;
    }
    return;
  }

  // 1. Group anime by genre first
  const genreMap = new Map(); // genreName -> array of anime
  data.forEach(anime => {
    const genres = anime.genres || [];
    if (genres.length === 0) {
      if (!genreMap.has("General")) genreMap.set("General", []);
      genreMap.get("General").push(anime);
    } else {
      genres.forEach(g => {
        if (!genreMap.has(g.name)) genreMap.set(g.name, []);
        genreMap.get(g.name).push(anime);
      });
    }
  });

  const query = unifiedSearchInput.value.trim();

  // If a search query is active, bypass the genre list/sub-page structure and show matching shows directly!
  if (query) {
    discoverGrid.classList.remove('genre-view');

    const headerEl = document.createElement('div');
    headerEl.className = 'sub-page-header';
    headerEl.innerHTML = `<h2 class="sub-page-title">Search Results for "${escapeHtml(query)}"</h2>`;
    discoverGrid.appendChild(headerEl);

    data.forEach(anime => {
      discoverGrid.appendChild(createAnimeCard(anime));
    });
    return;
  }

  // Case A: No genre is selected -> Show clickable Genre Cards/Buttons
  if (activeDiscoverGenre === null) {
    discoverGrid.classList.add('genre-view');
    const sortedGenres = Array.from(genreMap.keys()).sort();
    
    const gridContainer = document.createElement('div');
    gridContainer.className = 'genre-cards-grid';

    sortedGenres.forEach(genreName => {
      const list = genreMap.get(genreName);
      if (list.length === 0) return;

      // Extract the first anime's cover art in this list (since they are sorted by score descending, this is the most popular/top-rated anime!)
      const topAnime = list[0];
      const posterUrl = topAnime?.images?.jpg?.large_image_url || topAnime?.images?.jpg?.image_url || '';
      
      const card = document.createElement('div');
      card.className = 'genre-item-card';
      
      // Style the genre card with the popular anime poster background and a dark overlay
      card.style.backgroundImage = `linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.85) 100%), url('${posterUrl}')`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
      card.style.minHeight = '180px';
      card.style.justifyContent = 'flex-end';
      card.style.alignItems = 'flex-start';
      card.style.textAlign = 'left';
      card.style.padding = '1.25rem';
      
      card.innerHTML = `
        <span class="genre-name" style="color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.6); font-size: 1.35rem; margin-bottom: 0.15rem; font-weight: 800;">${genreName}</span>
        <span class="genre-count" style="color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 3px rgba(0,0,0,0.6); font-weight: 600; font-size: 0.8rem;">${list.length} highly rated shows</span>
      `;
      card.addEventListener('click', () => {
        activeDiscoverGenre = genreName;
        history.pushState({ view: 'discover', genre: genreName }, '');
        filterAndRenderDiscover();
      });
      gridContainer.appendChild(card);
    });

    discoverGrid.appendChild(gridContainer);
  }
  // Case B: A genre is selected -> Show the sub-page grid
  else {
    discoverGrid.classList.remove('genre-view');
    const animeList = genreMap.get(activeDiscoverGenre) || [];

    const headerEl = document.createElement('div');
    headerEl.className = 'sub-page-header';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back-genres';
    backBtn.id = 'btn-back-to-genres';
    backBtn.innerHTML = `← Back to Genres`;
    backBtn.addEventListener('click', () => {
      activeDiscoverGenre = null;
      history.pushState({ view: 'discover', genre: null }, '');
      filterAndRenderDiscover();
    });

    const titleEl = document.createElement('h2');
    titleEl.className = 'sub-page-title';
    titleEl.innerHTML = `${activeDiscoverGenre} Anime from ${discoverYear} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 500;">(${animeList.length} shows)</span>`;

    headerEl.appendChild(backBtn);
    headerEl.appendChild(titleEl);
    discoverGrid.appendChild(headerEl);

    if (animeList.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-state';
      emptyMsg.style.gridColumn = '1 / -1';
      emptyMsg.innerHTML = `<p>No highly rated shows found for this genre in ${discoverYear}.</p>`;
      discoverGrid.appendChild(emptyMsg);
      return;
    }

    animeList.forEach(anime => {
      discoverGrid.appendChild(createAnimeCard(anime));
    });
  }
}

// Helper to create an anime card DOM node (reusable in discover grids)
function createAnimeCard(anime) {
  const title = anime.title_english || anime.title;
  const coverUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '';
  const coverStyle = coverUrl 
    ? `background-image: url('${coverUrl}')` 
    : `background: var(--gradient-cyberpunk)`;

  const score = anime.score ? anime.score.toFixed(1) : 'N/A';
  const genresLabel = anime.genres && anime.genres.length > 0 ? anime.genres.map(g => g.name).join(', ') : 'General';
  const synopsis = anime.synopsis || 'No description available.';
  const episodesCount = anime.episodes || 0;
  const episodesLabel = episodesCount > 0 ? `${episodesCount} eps` : 'Ongoing';

  // Check if this anime exists in the user's watchlist
  const watchlistEntry = findWatchlistEntry(anime);
  const isAdded = !!watchlistEntry;
  const currentStatus = isAdded ? watchlistEntry.status : '';

  const card = document.createElement('article');
  card.className = 'anime-card';
  card.setAttribute('aria-label', title);

  card.innerHTML = `
    <div class="card-cover" style="${coverStyle}">
      <div class="card-score-badge">⭐ ${score}</div>
      ${isAdded ? `<span class="card-badge ${currentStatus}">${getStatusLabel(currentStatus)}</span>` : ''}
    </div>
    
    <div class="card-body">
      <h3 class="card-title">${title}</h3>
      <div class="card-meta">
        <span class="card-genre">${genresLabel}</span>
        <span class="card-genre" style="background: rgba(139, 92, 246, 0.1); color: var(--primary);">${episodesLabel}</span>
      </div>
      <p class="card-synopsis" title="Click to toggle full synopsis">${synopsis}</p>
      
      <div class="card-actions-watchlist">
        <button class="watchlist-btn watching ${currentStatus === 'watching' ? 'active' : ''}" data-status="watching" title="Currently Watching">
          Watching
        </button>
        <button class="watchlist-btn completed ${currentStatus === 'completed' ? 'active' : ''}" data-status="completed" title="Already Watched">
          Watched
        </button>
        <button class="watchlist-btn watch-next ${currentStatus === 'watch-next' ? 'active' : ''}" data-status="watch-next" title="Watch Next">
          Next
        </button>
        <button class="watchlist-btn planning ${currentStatus === 'planning' ? 'active' : ''}" data-status="planning" title="Plan to Watch">
          Plan
        </button>
        ${isAdded ? `
          <button class="card-remove-btn" title="Remove from Watchlist">
            ❌ Remove from List
          </button>
        ` : ''}
      </div>
    </div>
  `;

  // Hook events inside cards
  const synopsisP = card.querySelector('.card-synopsis');
  synopsisP.addEventListener('click', () => {
    synopsisP.classList.toggle('expanded');
  });

  card.querySelectorAll('.watchlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWatchlistStatus(anime, btn.dataset.status);
    });
  });

  if (isAdded) {
    card.querySelector('.card-remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromWatchlistByMalId(anime.mal_id, title);
    });
  }

  return card;
}

// Add/Update/Remove watchlist item directly from status buttons (handles toggling off same status)
function toggleWatchlistStatus(anime, newStatus) {
  const title = anime.title_english || anime.title;
  const malId = anime.mal_id;
  const index = findWatchlistIndex(anime);

  if (index !== -1) {
    const item = watchlist[index];
    if (item.status === newStatus) {
      // Toggle OFF: Clicking the active status again removes it from the list
      watchlist.splice(index, 1);
      showToast(`Removed "${title}" from watchlist.`, "info");
      
      saveToLocalStorage();
      calculateAnalytics();
      
      // Update displays
      if (activeView === 'watchlist') {
        renderWatchlist();
      } else {
        filterAndRenderDiscover();
      }
      return;
    }

    // Changing status
    item.status = newStatus;
    
    // Auto complete episodes if moving to Already Watched
    if (newStatus === 'completed' && item.episodesTotal > 0) {
      item.episodesWatched = item.episodesTotal;
    }
    
    showToast(`Updated "${title}" status to "${getStatusLabel(newStatus)}".`);
  } else {
    // Add new entry
    const newEntry = {
      id: 'anime-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      malId: malId,
      title: title,
      status: newStatus,
      rating: anime.score ? Math.round(anime.score) : null,
      episodesWatched: newStatus === 'completed' ? (anime.episodes || 0) : 0,
      episodesTotal: anime.episodes || 0,
      genre: anime.genres && anime.genres.length > 0 ? anime.genres.map(g => g.name).join(', ') : 'General',
      notes: `Added from "${getSeasonYearLabel()}". MAL Rating: ${anime.score || 'N/A'}.`,
      coverUrl: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '',
      coverGradient: 'gradient-cyberpunk'
    };
    watchlist.push(newEntry);
    showToast(`Added "${title}" as "${getStatusLabel(newStatus)}"!`);
  }

  saveToLocalStorage();
  calculateAnalytics();
  
  if (activeView === 'watchlist') {
    renderWatchlist();
  } else {
    filterAndRenderDiscover();
  }
}

// Remove from watchlist from Discover View
function removeFromWatchlistByMalId(malId, title) {
  const index = watchlist.findIndex(item => (item.malId && item.malId === malId) || item.title.toLowerCase() === title.toLowerCase());
  if (index !== -1) {
    if (confirm(`Are you sure you want to remove "${watchlist[index].title}" from your watchlist?`)) {
      watchlist.splice(index, 1);
      showToast(`Removed "${title}" from watchlist.`, "info");
      saveToLocalStorage();
      calculateAnalytics();
      filterAndRenderDiscover();
    }
  }
}

// Map technical status keys to human-readable strings
function getStatusLabel(status) {
  const labels = {
    'watching': 'Currently Watching',
    'completed': 'Already Watched',
    'watch-next': 'Watch Next',
    'planning': 'Plan to Watch'
  };
  return labels[status] || status;
}

// Open modal (Add mode vs Edit mode)
function openModal(anime = null) {
  const modalTitle = document.getElementById('modal-title');
  const editId = document.getElementById('edit-id');
  
  // Reset form first
  animeForm.reset();
  gradientSelector.querySelectorAll('.gradient-option').forEach(opt => opt.classList.remove('active'));
  
  if (anime) {
    // Edit Mode
    modalTitle.textContent = "Edit Anime Details";
    editId.value = anime.id;
    document.getElementById('anime-title').value = anime.title;
    document.getElementById('anime-status').value = anime.status;
    document.getElementById('anime-rating').value = anime.rating === null ? 'none' : anime.rating;
    document.getElementById('episodes-watched').value = anime.episodesWatched;
    document.getElementById('episodes-total').value = anime.episodesTotal;
    document.getElementById('anime-genre').value = anime.genre;
    document.getElementById('anime-notes').value = anime.notes;
    document.getElementById('cover-url').value = anime.coverUrl;
    
    selectedGradient = anime.coverGradient || 'gradient-cyberpunk';
    const activeOpt = gradientSelector.querySelector(`[data-gradient="${selectedGradient}"]`);
    if (activeOpt) activeOpt.classList.add('active');
  } else {
    // Add Mode
    modalTitle.textContent = "Add New Anime";
    editId.value = "";
    selectedGradient = 'gradient-cyberpunk';
    gradientSelector.querySelector(`[data-gradient="gradient-cyberpunk"]`).classList.add('active');
  }
  
  animeModal.classList.add('active');
  document.getElementById('anime-title').focus();
}

// Close Modal
function closeModal() {
  animeModal.classList.remove('active');
}

// Handle Add/Edit form submission
function handleFormSubmit(e) {
  e.preventDefault();
  
  const editId = document.getElementById('edit-id').value;
  const title = document.getElementById('anime-title').value.trim();
  const status = document.getElementById('anime-status').value;
  const ratingVal = document.getElementById('anime-rating').value;
  const rating = ratingVal === 'none' ? null : parseInt(ratingVal);
  const episodesWatched = parseInt(document.getElementById('episodes-watched').value) || 0;
  let episodesTotal = parseInt(document.getElementById('episodes-total').value) || 0;
  const genre = document.getElementById('anime-genre').value.trim() || 'General';
  const notes = document.getElementById('anime-notes').value.trim();
  const coverUrl = document.getElementById('cover-url').value.trim();
  
  if (!title) {
    showToast("Title is required!", "error");
    return;
  }

  // Basic sanity check for episode counts
  if (episodesTotal > 0 && episodesWatched > episodesTotal) {
    showToast("Episodes watched cannot exceed total episodes.", "warning");
  }

  if (editId) {
    // Editing existing anime
    const index = watchlist.findIndex(item => item.id === editId);
    if (index !== -1) {
      watchlist[index] = {
        ...watchlist[index],
        title,
        status,
        rating,
        episodesWatched,
        episodesTotal,
        genre,
        notes,
        coverUrl,
        coverGradient: selectedGradient
      };
      showToast(`Updated details for "${title}"`);
    }
  } else {
    // Add new anime
    const newAnime = {
      id: 'anime-' + Date.now(),
      title,
      status,
      rating,
      episodesWatched,
      episodesTotal,
      genre,
      notes,
      coverUrl,
      coverGradient: selectedGradient
    };
    watchlist.push(newAnime);
    showToast(`Added "${title}" to your list!`);
  }

  saveToLocalStorage();
  calculateAnalytics();
  renderWatchlist();
  closeModal();
}

// Quick increment function (+1 episode button)
function quickIncrementProgress(id) {
  const index = watchlist.findIndex(item => item.id === id);
  if (index !== -1) {
    const item = watchlist[index];
    if (item.episodesTotal > 0 && item.episodesWatched >= item.episodesTotal) {
      showToast(`"${item.title}" is already completed!`);
      return;
    }
    
    item.episodesWatched++;
    
    // Auto complete status transition
    if (item.episodesTotal > 0 && item.episodesWatched === item.episodesTotal) {
      item.status = "completed";
      showToast(`🎉 Completed watching "${item.title}"!`);
    } else {
      showToast(`Progress updated: ${item.episodesWatched} eps for "${item.title}"`);
    }
    
    saveToLocalStorage();
    calculateAnalytics();
    renderWatchlist();
  }
}

// Delete entry
function deleteAnime(id) {
  const item = watchlist.find(i => i.id === id);
  if (!item) return;
  
  if (confirm(`Are you sure you want to remove "${item.title}" from your watchlist?`)) {
    watchlist = watchlist.filter(i => i.id !== id);
    showToast(`Removed "${item.title}" from list.`, "info");
    saveToLocalStorage();
    calculateAnalytics();
    renderWatchlist();
  }
}

// Calculate dashboard analytics
function calculateAnalytics() {
  const total = watchlist.length;
  const watching = watchlist.filter(item => item.status === 'watching').length;
  const completed = watchlist.filter(item => item.status === 'completed').length;
  const watchNext = watchlist.filter(item => item.status === 'watch-next').length;
  const planning = watchlist.filter(item => item.status === 'planning').length;
  
  // Calculate average rating
  const ratedAnime = watchlist.filter(item => item.rating !== null);
  const avgRating = ratedAnime.length > 0
    ? (ratedAnime.reduce((sum, item) => sum + item.rating, 0) / ratedAnime.length).toFixed(1)
    : "0.0";
    
  statTotal.textContent = total;
  statWatching.textContent = watching;
  statCompleted.textContent = completed;
  if (statWatchNext) statWatchNext.textContent = watchNext;
  statPlanning.textContent = planning;
  statRating.textContent = avgRating;
}

// Helper to render rating stars
function renderStars(rating) {
  if (rating === null) {
    return `<span style="color: var(--text-muted); font-size: 0.75rem;">Unrated</span>`;
  }
  return '⭐'.repeat(Math.round(rating / 2)) || '⭐'; // Simplified rating out of 5 stars
}

// Render dynamic Watchlist grid (with full status button controls on each card)
function renderWatchlist() {
  animeGrid.innerHTML = '';
  
  const query = unifiedSearchInput.value.toLowerCase().trim();
  const normalizedQuery = normalizeString(query);
  
  // 1. Filter
  let filtered = watchlist.filter(item => {
    const title = normalizeString(item.title);
    const genre = normalizeString(item.genre);
    const matchesSearch = title.includes(normalizedQuery) || genre.includes(normalizedQuery);
    const matchesStatus = currentFilter === 'all' || item.status === currentFilter;
    return matchesSearch && matchesStatus;
  });

  // 2. Sort
  filtered.sort((a, b) => {
    if (currentSort === 'name-asc') {
      return a.title.localeCompare(b.title);
    } else if (currentSort === 'name-desc') {
      return b.title.localeCompare(a.title);
    } else if (currentSort === 'rating-desc') {
      return (b.rating || 0) - (a.rating || 0);
    } else if (currentSort === 'rating-asc') {
      return (a.rating || 99) - (b.rating || 99); // Unrated goes to bottom
    } else if (currentSort === 'progress-desc') {
      const progressA = a.episodesTotal > 0 ? (a.episodesWatched / a.episodesTotal) : 0;
      const progressB = b.episodesTotal > 0 ? (b.episodesWatched / b.episodesTotal) : 0;
      return progressB - progressA;
    }
    return 0;
  });

  // 3. Render
  if (filtered.length === 0) {
    animeGrid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <h3>No Anime Entries Found</h3>
        <p>${query ? 'Try broadening your search criteria.' : 'Start logging your watchlist by adding them from the Discover tab!'}</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    // Determine card background style (custom cover URL vs gradient)
    const coverStyle = item.coverUrl 
      ? `background-image: url('${item.coverUrl}')` 
      : `background: var(--${item.coverGradient || 'gradient-cyberpunk'})`;

    const progressPercent = item.episodesTotal > 0 
      ? Math.min(100, Math.round((item.episodesWatched / item.episodesTotal) * 100)) 
      : 0;

    const card = document.createElement('article');
    card.className = 'anime-card';
    card.setAttribute('aria-label', item.title);
    
    // Status label mapping
    const statusLabel = getStatusLabel(item.status);

    card.innerHTML = `
      <div class="card-cover" style="${coverStyle}">
        <span class="card-badge ${item.status}">${statusLabel}</span>
        <div class="card-actions-quick">
          <button class="card-btn-action btn-edit" title="Edit Entry" aria-label="Edit entry">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="card-btn-action btn-delete" title="Delete Entry" aria-label="Delete entry">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="card-body">
        <h3 class="card-title">${item.title}</h3>
        <div class="card-meta">
          <span class="card-genre">${item.genre}</span>
          <div class="card-rating-stars">${renderStars(item.rating)}</div>
        </div>
        <p class="card-notes">${item.notes || 'No description or remarks added yet.'}</p>
        
        <div class="progress-section" style="margin-bottom: 0.75rem;">
          <div class="progress-header">
            <span>Watch Progress</span>
            <span class="progress-fraction">${item.episodesWatched} / ${item.episodesTotal > 0 ? item.episodesTotal : '∞'} eps</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${item.episodesTotal > 0 ? progressPercent : 0}%"></div>
          </div>
          <div class="progress-controls">
            <span class="progress-label">${item.episodesTotal > 0 ? progressPercent + '% Complete' : 'Ongoing'}</span>
            <button class="btn-increment" title="Watch 1 Episode" aria-label="Watch 1 Episode">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>+1 Ep</span>
            </button>
          </div>
        </div>

        <div class="card-actions-watchlist">
          <button class="watchlist-btn watching ${item.status === 'watching' ? 'active' : ''}" data-status="watching" title="Currently Watching">
            Watching
          </button>
          <button class="watchlist-btn completed ${item.status === 'completed' ? 'active' : ''}" data-status="completed" title="Already Watched">
            Watched
          </button>
          <button class="watchlist-btn watch-next ${item.status === 'watch-next' ? 'active' : ''}" data-status="watch-next" title="Watch Next">
            Next
          </button>
          <button class="watchlist-btn planning ${item.status === 'planning' ? 'active' : ''}" data-status="planning" title="Plan to Watch">
            Plan
          </button>
        </div>
      </div>
    `;

    // Attach local button listeners inside card
    card.querySelector('.btn-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(item);
    });

    card.querySelector('.btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteAnime(item.id);
    });

    card.querySelector('.btn-increment').addEventListener('click', (e) => {
      e.stopPropagation();
      quickIncrementProgress(item.id);
    });

    // Unify status change buttons in watchlist view
    card.querySelectorAll('.watchlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Construct a mock Jikan-like anime object for the toggle status helper
        const mockAnime = {
          mal_id: item.malId,
          title: item.title,
          title_english: item.title,
          score: item.rating ? item.rating * 2 : null,
          genres: item.genre ? item.genre.split(', ').map(g => ({ name: g })) : [],
          episodes: item.episodesTotal,
          images: {
            jpg: {
              large_image_url: item.coverUrl,
              image_url: item.coverUrl
            }
          }
        };
        toggleWatchlistStatus(mockAnime, btn.dataset.status);
      });
    });

    animeGrid.appendChild(card);
  });
}

// Show helper toast notification
function showToast(message, type = "success") {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  // Trigger fade out
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}

// ============================================================
//  GENRE SIDEBAR FUNCTIONALITY
// ============================================================

// Toggle sidebar open/closed
function toggleSidebar() {
  document.body.classList.toggle('sidebar-open');
}

function closeSidebar() {
  document.body.classList.remove('sidebar-open');
}

// Fetch genre list from Jikan API (cached 24h)
async function fetchGenreList() {
  const cacheKey = 'otaku_genre_list';
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 86400000) { // 24 hours
        renderGenreButtons(parsed.data);
        return;
      }
    } catch (e) { /* ignore */ }
  }

  try {
    const response = await fetch('https://api.jikan.moe/v4/genres/anime');
    if (!response.ok) throw new Error('Failed to fetch genres');

    const result = await response.json();
    const genres = (result.data || []).sort((a, b) => a.name.localeCompare(b.name));

    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: genres
    }));

    renderGenreButtons(genres);
  } catch (err) {
    console.error('Genre fetch error:', err);
    sidebarGenreList.innerHTML = '<div class="sidebar-genre-loading">Could not load genres.</div>';
  }
}

// Render genre pill buttons in sidebar
function renderGenreButtons(genres) {
  sidebarGenreList.innerHTML = '';
  genres.forEach(genre => {
    const btn = document.createElement('button');
    btn.className = 'sidebar-genre-btn';
    btn.textContent = genre.name;
    btn.dataset.genreId = genre.mal_id;
    btn.addEventListener('click', () => {
      // Deactivate other buttons
      sidebarGenreList.querySelectorAll('.sidebar-genre-btn').forEach(b => b.classList.remove('active'));
      btnTopAnime.classList.remove('active');
      btn.classList.add('active');
      fetchAnimeByGenre(genre.mal_id, genre.name);
    });
    sidebarGenreList.appendChild(btn);
  });
}

// Fetch top anime of all time (cached 12h)
async function fetchTopAnime() {
  const cacheKey = 'otaku_top_anime_v2';

  sidebarResultsTitle.textContent = '🏆 Top Anime of All Time';
  sidebarResultsCount.textContent = '';
  sidebarResultsGrid.innerHTML = `
    <div class="sidebar-spinner">
      <div class="spinner"></div>
      <span class="spinner-text">Loading legends...</span>
    </div>
  `;

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 43200000) {
        renderSidebarCards(parsed.data);
        sidebarResultsCount.textContent = `${parsed.data.length} titles`;
        return;
      }
    } catch (e) { /* ignore */ }
  }

  try {
    const response = await fetch('https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=25');
    if (!response.ok) throw new Error('API error');

    const result = await response.json();
    let data = (result.data || []).filter(a => a.score && a.score >= 7.8);
    data.sort((a, b) => b.score - a.score);

    // Dedup
    const seenIds = new Set();
    data = data.filter(a => {
      if (seenIds.has(a.mal_id)) return false;
      seenIds.add(a.mal_id);
      return true;
    });

    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: data
    }));

    renderSidebarCards(data);
    sidebarResultsCount.textContent = `${data.length} titles`;
  } catch (err) {
    console.error('Top anime fetch error:', err);
    sidebarResultsGrid.innerHTML = '<div class="sidebar-genre-loading">Failed to load. Try again later.</div>';
  }
}

// Fetch anime filtered by genre (cached 12h)
async function fetchAnimeByGenre(genreId, genreName) {
  const cacheKey = `otaku_genre_${genreId}`;

  sidebarResultsTitle.textContent = genreName;
  sidebarResultsCount.textContent = '';
  sidebarResultsGrid.innerHTML = `
    <div class="sidebar-spinner">
      <div class="spinner"></div>
      <span class="spinner-text">Loading ${genreName} anime...</span>
    </div>
  `;

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 43200000) {
        renderSidebarCards(parsed.data);
        sidebarResultsCount.textContent = `${parsed.data.length} titles`;
        return;
      }
    } catch (e) { /* ignore */ }
  }

  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=score&sort=desc&min_score=7&limit=25`);
    if (!response.ok) {
      if (response.status === 429) throw new Error('Rate limited. Wait a moment.');
      throw new Error('API error');
    }

    const result = await response.json();
    let data = (result.data || []).filter(a => a.score && a.score >= 7.0);

    // Dedup
    const seenIds = new Set();
    data = data.filter(a => {
      if (seenIds.has(a.mal_id)) return false;
      seenIds.add(a.mal_id);
      return true;
    });

    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: data
    }));

    renderSidebarCards(data);
    sidebarResultsCount.textContent = `${data.length} titles`;
  } catch (err) {
    console.error('Genre anime fetch error:', err);
    sidebarResultsGrid.innerHTML = `<div class="sidebar-genre-loading">${err.message}</div>`;
  }
}

// Render compact cards inside sidebar results
function renderSidebarCards(data) {
  sidebarResultsGrid.innerHTML = '';

  if (data.length === 0) {
    sidebarResultsGrid.innerHTML = '<div class="sidebar-genre-loading">No anime found matching criteria.</div>';
    return;
  }

  data.forEach(anime => {
    const title = anime.title_english || anime.title;
    const coverUrl = anime.images?.jpg?.image_url || '';
    const score = anime.score ? anime.score.toFixed(1) : 'N/A';
    const genres = anime.genres ? anime.genres.map(g => g.name).slice(0, 2).join(', ') : '';

    const watchlistEntry = findWatchlistEntry(anime);
    const currentStatus = watchlistEntry ? watchlistEntry.status : '';

    const card = document.createElement('div');
    card.className = 'sidebar-card';

    card.innerHTML = `
      <div class="sidebar-card-cover" style="background-image: url('${coverUrl}')"></div>
      <div class="sidebar-card-info">
        <div class="sidebar-card-title">${title}</div>
        <div class="sidebar-card-meta">⭐ ${score} ${genres ? '· ' + genres : ''}</div>
        <div class="sidebar-card-actions">
          <button class="watchlist-btn watching ${currentStatus === 'watching' ? 'active' : ''}" data-status="watching">Watching</button>
          <button class="watchlist-btn completed ${currentStatus === 'completed' ? 'active' : ''}" data-status="completed">Watched</button>
          <button class="watchlist-btn watch-next ${currentStatus === 'watch-next' ? 'active' : ''}" data-status="watch-next">Next</button>
          <button class="watchlist-btn planning ${currentStatus === 'planning' ? 'active' : ''}" data-status="planning">Plan</button>
        </div>
      </div>
    `;

    card.querySelectorAll('.watchlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWatchlistStatus(anime, btn.dataset.status);
        // Re-render this card's buttons to reflect new state
        const updated = findWatchlistEntry(anime);
        const newStatus = updated ? updated.status : '';
        card.querySelectorAll('.watchlist-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.status === newStatus);
        });
      });
    });

    sidebarResultsGrid.appendChild(card);
  });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);
