// ─── STATE ───────────────────────────────────────────────────
let songs       = JSON.parse(localStorage.getItem('melodia_songs')    || '[]');
let playlists   = JSON.parse(localStorage.getItem('melodia_playlists') || '[]');
let artists     = JSON.parse(localStorage.getItem('melodia_artists')   || '[]');
let userProfile = JSON.parse(localStorage.getItem('melodia_profile')   || '{"name":"","avatar":"","darkMode":true,"fontSize":100}');
let currentRating  = 0;
let currentView    = 'feed';
let songViewMode   = 'grid';
let previousView   = 'feed';
let editingId      = null;

// ─── DADOS / HELPERS ─────────────────────────────────────────
const GENRES_COLORS = {
  'Clássica': '#8b6f4a', 'Jazz': '#5a7a8c', 'Rock': '#7a4a4a',
  'Pop': '#7a5a8c', 'MPB': '#4a7a5a', 'Samba': '#8c6a3a',
  'Bossa Nova': '#4a6a8c', 'Eletrônica': '#3a6a7a',
  'Soul / R&B': '#7a4a6a', 'Hip-Hop': '#4a4a7a', 'Folk': '#6a7a4a', 'Outro': '#5a5a5a'
};

function genreEmoji(g) {
  const map = {
    'Clássica': '🎻', 'Jazz': '🎷', 'Rock': '🎸', 'Pop': '🎤',
    'MPB': '🎶', 'Samba': '🥁', 'Bossa Nova': '🎹', 'Eletrônica': '🎧',
    'Soul / R&B': '🎤', 'Hip-Hop': '🎤', 'Folk': '🪕'
  };
  return map[g] || '🎵';
}

function genreColor(g) { return GENRES_COLORS[g] || '#5a5a5a'; }

function save() {
  localStorage.setItem('melodia_songs',     JSON.stringify(songs));
  localStorage.setItem('melodia_playlists', JSON.stringify(playlists));
  localStorage.setItem('melodia_artists',   JSON.stringify(artists));
}

function saveProfile() {
  localStorage.setItem('melodia_profile', JSON.stringify(userProfile));
}