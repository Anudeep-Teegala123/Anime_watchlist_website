// Sample initial data if LocalStorage is empty
const defaultAnimeList = [
  {
    id: "default-frieren",
    title: "Frieren: Beyond Journey's End",
    status: "completed",
    rating: 10,
    episodesWatched: 28,
    episodesTotal: 28,
    genre: "Fantasy, Adventure, Drama",
    notes: "Absolutely beautiful animation, music, and pacing. A masterpiece about life, time, memory, and relationships.",
    coverUrl: "",
    coverGradient: "gradient-cyberpunk"
  },
  {
    id: "default-demonslayer",
    title: "Demon Slayer: Entertainment District Arc",
    status: "watching",
    rating: 9,
    episodesWatched: 8,
    episodesTotal: 11,
    genre: "Action, Fantasy, Historical",
    notes: "Incredible fight animations by ufotable. Standard shonen structure but executed with absolute visual excellence.",
    coverUrl: "",
    coverGradient: "gradient-sunset"
  },
  {
    id: "default-spiritedaway",
    title: "Spirited Away",
    status: "completed",
    rating: 10,
    episodesWatched: 1,
    episodesTotal: 1,
    genre: "Fantasy, Supernatural, Adventure",
    notes: "Classic Ghibli movie. Breathtaking art, deep symbolism, and a timeless coming-of-age story.",
    coverUrl: "",
    coverGradient: "gradient-ocean"
  },
  {
    id: "default-chainsawman",
    title: "Chainsaw Man",
    status: "planning",
    rating: null,
    episodesWatched: 0,
    episodesTotal: 12,
    genre: "Action, Dark Fantasy, Comedy",
    notes: "Heard excellent things about the dark humor, cinematography, and animation style. Excited to start!",
    coverUrl: "",
    coverGradient: "gradient-dark"
  }
];

// State variables
let watchlist = [];
let currentFilter = 'all';
let currentSort = 'name-asc';
let selectedGradient = 'gradient-cyberpunk';

// DOM Elements
const animeGrid = document.getElementById('anime-grid');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const statusTabs = document.getElementById('status-tabs');
const btnAddAnime = document.getElementById('btn-add-anime');
const animeModal = document.getElementById('anime-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const animeForm = document.getElementById('anime-form');
const gradientSelector = document.getElementById('gradient-selector');
const toastContainer = document.getElementById('toast-container');

// Dashboard Counters
const statTotal = document.getElementById('stat-total');
const statWatching = document.getElementById('stat-watching');
const statCompleted = document.getElementById('stat-completed');
const statPlanning = document.getElementById('stat-planning');
const statRating = document.getElementById('stat-rating');

// Initialize App
function init() {
  loadWatchlist();
  setupEventListeners();
  calculateAnalytics();
  renderWatchlist();
}

// Load watchlist from LocalStorage
function loadWatchlist() {
  const stored = localStorage.getItem('otaku_watchlist');
  if (stored) {
    watchlist = JSON.parse(stored);
  } else {
    watchlist = [...defaultAnimeList];
    saveToLocalStorage();
  }
}

// Save watchlist to LocalStorage
function saveToLocalStorage() {
  localStorage.setItem('otaku_watchlist', JSON.stringify(watchlist));
}

// Set up UI Event Listeners
function setupEventListeners() {
  // Search and Sort
  searchInput.addEventListener('input', () => renderWatchlist());
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderWatchlist();
  });

  // Filter Tabs
  statusTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
      // Remove active from all tabs
      statusTabs.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      // Add active to current tab
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
  const planning = watchlist.filter(item => item.status === 'planning').length;
  
  // Calculate average rating
  const ratedAnime = watchlist.filter(item => item.rating !== null);
  const avgRating = ratedAnime.length > 0
    ? (ratedAnime.reduce((sum, item) => sum + item.rating, 0) / ratedAnime.length).toFixed(1)
    : "0.0";
    
  statTotal.textContent = total;
  statWatching.textContent = watching;
  statCompleted.textContent = completed;
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

// Render dynamic Watchlist grid
function renderWatchlist() {
  animeGrid.innerHTML = '';
  
  const query = searchInput.value.toLowerCase().trim();
  
  // 1. Filter
  let filtered = watchlist.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(query) || 
                          item.genre.toLowerCase().includes(query);
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
        <p>${query ? 'Try broadening your search criteria.' : 'Start logging your watchlist by clicking "Add Anime" above!'}</p>
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
    
    // Status display helper
    let statusLabel = item.status.replace('-', ' ');
    statusLabel = statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1);

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
        
        <div class="progress-section">
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
    // Remove element completely
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);
