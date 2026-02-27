// ─── STATE ───────────────────────────────────────────────────
let songs = JSON.parse(localStorage.getItem('melodia_songs') || '[]');
let playlists = JSON.parse(localStorage.getItem('melodia_playlists') || '[]');
let userProfile = JSON.parse(localStorage.getItem('melodia_profile') || '{"name":"","avatar":"","darkMode":true,"fontSize":100}');
let currentRating = 0;
let currentView = 'home';
let songViewMode = 'grid';
let previousView = 'songs';
let editingId = null;

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
  localStorage.setItem('melodia_songs', JSON.stringify(songs));
  localStorage.setItem('melodia_playlists', JSON.stringify(playlists));
}
function saveProfile() {
  localStorage.setItem('melodia_profile', JSON.stringify(userProfile));
}

// ─── SIDEBAR (mobile) ────────────────────────────────────────
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── NAVEGAÇÃO ───────────────────────────────────────────────
function navigate(view) {
  if (view !== 'detail') previousView = currentView !== 'detail' ? currentView : previousView;

  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.querySelector(`[data-view="${view}"]`);
  if (navEl) navEl.classList.add('active');

  // Sync bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
  const bnEl = document.querySelector(`[data-bnview="${view}"]`);
  if (bnEl) bnEl.classList.add('active');

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  currentView = view;

  const titles = { home: 'Início', songs: 'Músicas', playlists: 'Playlists', favorites: 'Favoritas', notes: 'Anotações', detail: '' };
  document.getElementById('topbar-title').textContent = titles[view] || '';
  renderView(view);
}

function backFromDetail() { navigate(previousView); }

// ─── RENDER GERAL ─────────────────────────────────────────────
function renderView(v) {
  updateStats();
  updateBadges();
  updatePlaylistSelect();
  if (v === 'home')      renderHome();
  if (v === 'songs')     renderSongs();
  if (v === 'playlists') renderPlaylists();
  if (v === 'favorites') renderFavorites();
  if (v === 'notes')     renderNotes();
  if (v === 'settings')  renderSettings();
}

function updateSidebarUser() {
  const nameEl   = document.getElementById('sidebar-user-name');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl)   nameEl.textContent = userProfile.name || 'Meu Perfil';
  if (avatarEl) {
    if (userProfile.avatar) {
      avatarEl.innerHTML = `<img src="${userProfile.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      avatarEl.textContent = userProfile.name ? userProfile.name[0].toUpperCase() : '♪';
    }
  }
}

function updateStats() {
  document.getElementById('stat-total').textContent = songs.length;
  document.getElementById('stat-playlists').textContent = playlists.length;
  document.getElementById('stat-notes').textContent = songs.filter(s => s.notes).length;
  const rated = songs.filter(s => s.rating > 0);
  document.getElementById('stat-avg').textContent = rated.length
    ? (rated.reduce((a, s) => a + s.rating, 0) / rated.length).toFixed(1)
    : '—';
}

function updateBadges() {
  document.getElementById('badge-songs').textContent = songs.length;
  document.getElementById('badge-playlists').textContent = playlists.length;
}

// ─── HTML HELPERS ─────────────────────────────────────────────
function starsHTML(r, cls = 'star') {
  return [1, 2, 3, 4, 5].map(i =>
    `<span class="${cls}${i <= r ? ' filled' : ''}">${i <= r ? '★' : '☆'}</span>`
  ).join('');
}

function coverDiv(song) {
  const e = genreEmoji(song.genre);
  const artUrl = song.coverUrl || (song.itunesArt ? song.itunesArt.replace('100x100bb', '300x300bb') : null);
  const centerContent = artUrl
    ? `<img class="vinyl-art" src="${artUrl}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      + `<div class="vinyl-emoji" style="display:none">${e}</div>`
    : `<div class="vinyl-emoji">${e}</div>`;
  return `<div class="song-cover">
    <div class="vinyl-wrap">
      <div class="vinyl-disc"></div>
      ${centerContent}
      <div class="vinyl-hole"></div>
    </div>
  </div>`;
}

function songCardHTML(song) {
  return `<div class="song-card" onclick="openDetail('${song.id}')">
    ${coverDiv(song)}
    <div class="song-title">${song.title}</div>
    <div class="song-artist">${song.artist}</div>
    <div class="song-meta">
      <span class="song-genre">${song.genre || 'Outro'}</span>
      <span class="song-rating">${starsHTML(song.rating)}</span>
    </div>
  </div>`;
}

// ─── RENDER VIEWS ─────────────────────────────────────────────
function renderHome() {
  const recent = [...songs].reverse().slice(0, 8);
  const g = document.getElementById('recent-grid');
  if (recent.length === 0) {
    g.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <div class="empty-icon">🎵</div>
      <div class="empty-title">Seu diário está esperando</div>
      <div class="empty-sub">Adicione sua primeira música e comece sua coleção.</div>
    </div>`;
  } else {
    g.innerHTML = recent.map(songCardHTML).join('');
  }
}

function renderSongs(filter) {
  let list = filter
    ? songs.filter(s =>
        s.title.toLowerCase().includes(filter) ||
        s.artist.toLowerCase().includes(filter) ||
        (s.album || '').toLowerCase().includes(filter)
      )
    : songs;

  const c = document.getElementById('songs-container');
  if (list.length === 0) {
    c.innerHTML = `<div class="empty">
      <div class="empty-icon">🎵</div>
      <div class="empty-title">${filter ? 'Nenhuma música encontrada' : 'Nenhuma música ainda'}</div>
      <div class="empty-sub">${filter ? 'Tente outro termo de busca.' : 'Clique em "+ Adicionar" para começar.'}</div>
    </div>`;
    return;
  }

  if (songViewMode === 'grid') {
    c.innerHTML = `<div class="song-grid">${[...list].reverse().map(songCardHTML).join('')}</div>`;
  } else {
    c.innerHTML = `<table class="song-table">
      <thead><tr>
        <th>#</th><th>Título</th><th>Artista</th><th class="col-album">Álbum</th><th class="col-year">Ano</th><th>Gênero</th><th>Nota</th>
      </tr></thead>
      <tbody>${[...list].reverse().map((s, i) => `<tr onclick="openDetail('${s.id}')">
        <td style="color:var(--cream-faint);font-size:11px">${i + 1}</td>
        <td class="td-title">${s.title}</td>
        <td class="td-artist">${s.artist}</td>
        <td class="td-artist col-album">${s.album || '—'}</td>
        <td class="td-year col-year">${s.year || '—'}</td>
        <td><span class="song-genre">${s.genre || 'Outro'}</span></td>
        <td><span class="song-rating">${starsHTML(s.rating)}</span></td>
      </tr>`).join('')}</tbody>
    </table>`;
  }
}

function renderPlaylists() {
  const g = document.getElementById('playlists-grid');
  if (playlists.length === 0) {
    g.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <div class="empty-icon">⊞</div>
      <div class="empty-title">Nenhuma playlist ainda</div>
      <div class="empty-sub">Crie uma playlist temática para organizar suas músicas.</div>
    </div>`;
    return;
  }
  g.innerHTML = playlists.map(p => {
    const count = songs.filter(s => s.playlistId === p.id).length;
    return `<div class="playlist-card" onclick="showPlaylist('${p.id}')">
      <div class="playlist-emoji">${p.emoji || '🎵'}</div>
      <div class="playlist-name">${p.name}</div>
      <div class="playlist-desc">${p.desc || 'Sem descrição.'}</div>
      <div class="playlist-count">${count} música${count !== 1 ? 's' : ''}</div>
    </div>`;
  }).join('');
}

function renderFavorites() {
  const favs = songs.filter(s => s.rating >= 4);
  const g = document.getElementById('favorites-grid');
  if (favs.length === 0) {
    g.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <div class="empty-icon">★</div>
      <div class="empty-title">Nenhuma favorita ainda</div>
      <div class="empty-sub">Músicas com 4 ou 5 estrelas aparecem aqui.</div>
    </div>`;
    return;
  }
  g.innerHTML = [...favs].reverse().map(songCardHTML).join('');
}

function renderNotes() {
  const noted = songs.filter(s => s.notes);
  const c = document.getElementById('notes-container');
  if (noted.length === 0) {
    c.innerHTML = `<div class="empty">
      <div class="empty-icon">✎</div>
      <div class="empty-title">Nenhuma anotação ainda</div>
      <div class="empty-sub">Ao adicionar uma música, escreva seus sentimentos sobre ela.</div>
    </div>`;
    return;
  }
  c.innerHTML = [...noted].reverse().map(s => `
    <div style="margin-bottom:20px;cursor:pointer" onclick="openDetail('${s.id}')">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600">${s.title}</div>
        <div style="font-size:12px;color:var(--cream-dim)">— ${s.artist}</div>
        <span class="song-genre" style="margin-left:auto">${s.genre || 'Outro'}</span>
      </div>
      <div class="note-box">
        <div class="note-text">${s.notes}</div>
        <div class="note-date">Adicionado em ${s.date || '—'}</div>
      </div>
    </div>
  `).join('');
}

// ─── DETALHE PLAYLIST ─────────────────────────────────────────
function showPlaylist(id) {
  const pl = playlists.find(p => p.id === id);
  const list = songs.filter(s => s.playlistId === id);
  document.getElementById('detail-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:28px">
      <div style="font-size:48px">${pl.emoji || '🎵'}</div>
      <div>
        <div class="detail-title">${pl.name}</div>
        <div class="detail-artist">${pl.desc || ''}</div>
        <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-top:6px">${list.length} música${list.length !== 1 ? 's' : ''}</div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="song-grid">${list.length
      ? list.map(songCardHTML).join('')
      : '<div class="empty" style="grid-column:1/-1"><div class="empty-title">Playlist vazia</div><div class="empty-sub">Ao adicionar músicas, selecione esta playlist.</div></div>'
    }</div>
  `;
  previousView = 'playlists';
  navigate('detail');
}

// ─── DETALHE MÚSICA ───────────────────────────────────────────
function openDetail(id) {
  const s = songs.find(x => x.id === id);
  if (!s) return;
  const e = genreEmoji(s.genre);
  const artUrl = s.coverUrl || (s.itunesArt ? s.itunesArt.replace('100x100bb', '600x600bb') : null);
  const centerContent = artUrl
    ? `<img class="vinyl-art" src="${artUrl}" alt="">`
    : `<div class="vinyl-emoji">${e}</div>`;
  document.getElementById('detail-content').innerHTML = `
    <div class="detail-header">
      <div class="detail-cover" title="Passe o mouse para girar 🎵">
        <div class="vinyl-disc"></div>
        ${centerContent}
        <div class="vinyl-hole"></div>
      </div>
      <div class="detail-info">
        <div class="detail-title">${s.title}</div>
        <div class="detail-artist">${s.artist}${s.album ? ` — <em>${s.album}</em>` : ''}</div>
        <div class="detail-tags">
          ${s.genre ? `<span class="tag gold">${s.genre}</span>` : ''}
          ${s.year ? `<span class="tag">${s.year}</span>` : ''}
          ${s.playlistId ? `<span class="tag">${playlists.find(p => p.id === s.playlistId)?.name || ''}</span>` : ''}
        </div>
        <div class="detail-stars">${starsHTML(s.rating, 'detail-star')}</div>
        <div class="detail-actions">
          <button class="btn btn-ghost" onclick="editSong('${s.id}')">✎ Editar</button>
          <button class="btn btn-primary" onclick="openShareModal('${s.id}')">↗ Compartilhar</button>
          <button class="btn btn-ghost" style="color:var(--red);border-color:var(--red)" onclick="deleteSong('${s.id}')">✕ Remover</button>
        </div>
      </div>
    </div>
    ${s.notes ? `
      <div class="section-title" style="margin-bottom:14px">Anotações <em>pessoais</em></div>
      <div class="note-box">
        <div class="note-text">${s.notes}</div>
        <div class="note-date">Adicionado em ${s.date || '—'}</div>
      </div>`
    : ''}
    ${s.lyrics ? `
      <div class="lyrics-section">
        <div class="lyrics-header">
          <div class="section-title">Letra <em>da música</em></div>
          <div class="lyrics-tip" id="lyrics-tip-${s.id}">
            <span class="lyrics-tip-icon">✦</span>
            Selecione um trecho para marcar como favorito
          </div>
        </div>
        <div class="lyrics-body" id="lyrics-body-${s.id}" onmouseup="handleLyricsSelection('${s.id}')">${renderLyrics(s.lyrics, s.highlights || [])}</div>
        ${(s.highlights && s.highlights.length > 0) ? `
        <div class="highlights-section">
          <div class="highlights-title">✦ Trechos <em>marcados</em></div>
          ${s.highlights.map((h, i) => `
            <div class="highlight-item">
              <div class="highlight-quote">${h.text}</div>
              <button class="highlight-remove" onclick="removeHighlight('${s.id}', ${i})" title="Remover">×</button>
            </div>
          `).join('')}
        </div>` : ''}
      </div>`
    : `<div class="lyrics-empty" onclick="editSong('${s.id}')">
        <div class="lyrics-empty-icon">♪</div>
        <div class="lyrics-empty-text">Adicione a letra desta música</div>
        <div class="lyrics-empty-sub">Cole a letra no campo de edição e marque seus trechos favoritos</div>
       </div>`}
  `;
  navigate('detail');
}

// ─── LETRAS & HIGHLIGHTS ──────────────────────────────────────
function renderLyrics(lyrics, highlights) {
  if (!lyrics) return '';
  // Escape HTML
  let text = lyrics
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Apply highlights (sort by length desc to avoid overlap issues)
  const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length);
  sorted.forEach(h => {
    const escaped = h.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(escaped, 'g'),
      `<mark class="lyric-mark">$&</mark>`);
  });

  // Line breaks
  text = text.replace(/\n\n/g, '</p><p class="lyric-stanza">').replace(/\n/g, '<br>');
  return `<p class="lyric-stanza">${text}</p>`;
}

function normalize(str) {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

function handleLyricsSelection(songId) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;
  const text = selection.toString().replace(/\s+/g, ' ').trim();
  if (!text || text.length < 3) return;

  const s = songs.find(x => x.id === songId);
  if (!s) return;

  if (!s.highlights) s.highlights = [];

  const normNew = normalize(text);

  // Check exact duplicate
  if (s.highlights.some(h => normalize(h.text) === normNew)) {
    toast('Já marcado', 'Este trecho já está nos seus favoritos.');
    selection.removeAllRanges();
    return;
  }

  // Check if new text is contained within an existing highlight
  const containedBy = s.highlights.find(h => normalize(h.text).includes(normNew));
  if (containedBy) {
    toast('Já incluído', `Este trecho já faz parte de outro marcado.`);
    selection.removeAllRanges();
    return;
  }

  // Check if new text contains an existing highlight (superstring)
  const contains = s.highlights.find(h => normNew.includes(normalize(h.text)));
  if (contains) {
    toast('Já incluído', `Um trecho menor igual já está marcado.`);
    selection.removeAllRanges();
    return;
  }

  s.highlights.push({ text, date: new Date().toLocaleDateString('pt-BR') });
  save();
  toast('✦ Trecho marcado!', `"${text.slice(0, 40)}${text.length > 40 ? '…' : ''}" salvo.`);
  selection.removeAllRanges();
  openDetail(songId);
}

function removeHighlight(songId, index) {
  const s = songs.find(x => x.id === songId);
  if (!s || !s.highlights) return;
  s.highlights.splice(index, 1);
  save();
  openDetail(songId);
}

// ─── MODAIS ───────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function openAddModal() {
  editingId = null;
  ['f-title', 'f-artist', 'f-album', 'f-year', 'f-notes', 'f-lyrics'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-genre').value = '';
  document.getElementById('f-playlist').value = '';
  document.getElementById('api-search-input').value = '';
  document.getElementById('api-results').innerHTML = `
    <div class="api-hint">
      <div class="api-hint-icon">🔍</div>
      Digite o nome de uma música ou artista para buscar na biblioteca
    </div>`;
  document.getElementById('f-itunes-art').value = '';
  document.getElementById('f-cover-url').value = '';
  const preview = document.getElementById('cover-preview');
  preview.style.display = 'none';
  preview.src = '';
  document.getElementById('cover-upload-zone').querySelector('.cover-upload-label').textContent = 'Clique ou arraste uma foto da capa';
  currentRating = 0;
  selectedApiItem = null;
  updateStarPicker(0);
  updatePlaylistSelect();
  // Mostrar zona de busca e divisor
  document.getElementById('modal-search-zone').style.display = '';
  document.getElementById('modal-divider').style.display = '';
  document.getElementById('modal-add-title').textContent = 'Registrar Música';
  document.querySelector('#modal-add .modal-body').classList.remove('form-prefilled');
  openModal('modal-add');
  setTimeout(() => document.getElementById('api-search-input').focus(), 100);
}

// ─── ITUNES SEARCH API ────────────────────────────────────────
let selectedApiItem = null;
let apiSearchTimer = null;

function debounceApiSearch() {
  clearTimeout(apiSearchTimer);
  const q = document.getElementById('api-search-input').value.trim();
  if (!q) {
    document.getElementById('api-results').innerHTML = `
      <div class="api-hint">
        <div class="api-hint-icon">🔍</div>
        Digite o nome de uma música ou artista para buscar na biblioteca
      </div>`;
    return;
  }
  apiSearchTimer = setTimeout(() => searchItunes(q), 400);
}

async function searchItunes(query) {
  const spinner = document.getElementById('api-spinner');
  const results = document.getElementById('api-results');
  spinner.classList.add('active');
  results.innerHTML = '';

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=8&country=BR`;
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      results.innerHTML = `<div class="api-empty">Nenhum resultado encontrado para "<strong>${query}</strong>"</div>`;
      return;
    }

    results.innerHTML = data.results.map((track, i) => {
      const year  = track.releaseDate ? track.releaseDate.slice(0, 4) : '';
      const cover = track.artworkUrl100 || '';
      const genre = mapItunesGenre(track.primaryGenreName);
      return `<div class="api-result-item" id="api-item-${i}" onclick="selectApiResult(${i}, ${JSON.stringify(track).replace(/"/g, '&quot;')})">
        ${cover
          ? `<img class="api-result-cover" src="${cover}" alt="">`
          : `<div class="api-result-cover-placeholder">🎵</div>`}
        <div class="api-result-info">
          <div class="api-result-title">${track.trackName}</div>
          <div class="api-result-sub">${track.artistName} · ${track.collectionName || ''}${year ? ' · ' + year : ''}</div>
        </div>
        <span class="api-result-badge">${genre}</span>
      </div>`;
    }).join('');

  } catch (err) {
    results.innerHTML = `<div class="api-empty">Erro ao conectar com a biblioteca. Preencha manualmente.</div>`;
  } finally {
    spinner.classList.remove('active');
  }
}

function mapItunesGenre(g) {
  if (!g) return 'Outro';
  const map = {
    'Classical': 'Clássica', 'Jazz': 'Jazz', 'Rock': 'Rock', 'Pop': 'Pop',
    'Hip-Hop/Rap': 'Hip-Hop', 'Electronic': 'Eletrônica', 'Dance': 'Eletrônica',
    'R&B/Soul': 'Soul / R&B', 'Soul': 'Soul / R&B', 'Folk': 'Folk',
    'World': 'MPB', 'Brazilian': 'MPB', 'Samba': 'Samba', 'Bossa Nova': 'Bossa Nova',
    'Alternative': 'Rock', 'Singer/Songwriter': 'Folk',
  };
  for (const key of Object.keys(map)) {
    if (g.toLowerCase().includes(key.toLowerCase())) return map[key];
  }
  return 'Outro';
}

function selectApiResult(idx, track) {
  // Highlight selecionado
  document.querySelectorAll('.api-result-item').forEach((el, i) => {
    el.classList.toggle('selected', i === idx);
    el.innerHTML = el.innerHTML.replace(/<span class="api-result-check">.*?<\/span>/g, '');
  });
  const el = document.getElementById('api-item-' + idx);
  if (el) el.insertAdjacentHTML('beforeend', '<span class="api-result-check">✓</span>');

  selectedApiItem = track;

  // Store iTunes art for later saving
  document.getElementById('f-itunes-art').value = track.artworkUrl100 || '';

  // Show preview in upload zone
  const preview = document.getElementById('cover-preview');
  const uploadZone = document.getElementById('cover-upload-zone');
  if (track.artworkUrl100) {
    const bigArt = track.artworkUrl100.replace('100x100bb', '300x300bb');
    preview.src = bigArt;
    preview.style.display = 'block';
    uploadZone.querySelector('.cover-upload-label').textContent = 'Arte obtida da biblioteca';
  }

  // Preencher formulário
  const year  = track.releaseDate ? track.releaseDate.slice(0, 4) : '';
  const genre = mapItunesGenre(track.primaryGenreName);

  document.getElementById('f-title').value  = track.trackName   || '';
  document.getElementById('f-artist').value = track.artistName  || '';
  document.getElementById('f-album').value  = track.collectionName || '';
  document.getElementById('f-year').value   = year;

  // Selecionar gênero compatível
  const genreSelect = document.getElementById('f-genre');
  for (const opt of genreSelect.options) {
    if (opt.value === genre) { genreSelect.value = genre; break; }
  }

  // Feedback visual nos campos preenchidos
  document.querySelector('#modal-add .modal-body').classList.add('form-prefilled');

  // Scroll suave para o formulário
  document.querySelector('#modal-add .modal-body').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function editSong(id) {
  const s = songs.find(x => x.id === id);
  if (!s) return;
  editingId = id;
  document.getElementById('f-title').value   = s.title;
  document.getElementById('f-artist').value  = s.artist;
  document.getElementById('f-album').value   = s.album  || '';
  document.getElementById('f-year').value    = s.year   || '';
  document.getElementById('f-genre').value   = s.genre  || '';
  document.getElementById('f-notes').value   = s.notes  || '';
  document.getElementById('f-lyrics').value  = s.lyrics || '';
  document.getElementById('f-itunes-art').value  = s.itunesArt || '';
  document.getElementById('f-cover-url').value   = s.coverUrl  || '';
  const preview = document.getElementById('cover-preview');
  const artUrl = s.coverUrl || s.itunesArt || '';
  if (artUrl) {
    preview.src = artUrl.replace('100x100bb', '300x300bb');
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
  currentRating = s.rating || 0;
  updateStarPicker(currentRating);
  updatePlaylistSelect(s.playlistId);
  // Ocultar busca ao editar
  document.getElementById('modal-search-zone').style.display = 'none';
  document.getElementById('modal-divider').style.display = 'none';
  document.getElementById('modal-add-title').textContent = 'Editar Música';
  document.querySelector('#modal-add .modal-body').classList.remove('form-prefilled');
  openModal('modal-add');
  setTimeout(() => document.getElementById('f-title').focus(), 100);
}

function updatePlaylistSelect(selected = '') {
  const sel = document.getElementById('f-playlist');
  sel.innerHTML = '<option value="">— Nenhuma —</option>' +
    playlists.map(p =>
      `<option value="${p.id}" ${p.id === selected ? 'selected' : ''}>${p.emoji || ''} ${p.name}</option>`
    ).join('');
}

function setRating(v)     { currentRating = v; updateStarPicker(v); }
function updateStarPicker(v) {
  document.querySelectorAll('.star-pick').forEach(el =>
    el.classList.toggle('on', +el.dataset.v <= v)
  );
}

function saveSong() {
  const title  = document.getElementById('f-title').value.trim();
  const artist = document.getElementById('f-artist').value.trim();
  if (!title || !artist) { toast('Atenção', 'Preencha ao menos título e artista.'); return; }

  const now = new Date().toLocaleDateString('pt-BR');
  const data = {
    title, artist,
    album:      document.getElementById('f-album').value.trim(),
    year:       document.getElementById('f-year').value.trim(),
    genre:      document.getElementById('f-genre').value,
    notes:      document.getElementById('f-notes').value.trim(),
    rating:     currentRating,
    playlistId: document.getElementById('f-playlist').value,
    itunesArt:  document.getElementById('f-itunes-art').value || '',
    coverUrl:   document.getElementById('f-cover-url').value || '',
    lyrics:     document.getElementById('f-lyrics').value.trim()
  };

  if (editingId) {
    const i = songs.findIndex(s => s.id === editingId);
    songs[i] = { ...songs[i], ...data };
    closeModal('modal-add');
    save();
    toast('Atualizado!', `"${title}" foi atualizado.`);
    openDetail(editingId);
  } else {
    songs.push({ id: 's' + Date.now(), ...data, date: now });
    save();
    closeModal('modal-add');
    toast('Adicionado!', `"${title}" foi salvo no seu diário.`);
    renderView(currentView === 'detail' ? previousView : currentView);
  }
  renderView('home');
}

function deleteSong(id) {
  const s = songs.find(x => x.id === id);
  if (!s) return;
  if (!confirm(`Remover "${s.title}" do seu diário?`)) return;
  songs = songs.filter(x => x.id !== id);
  save();
  toast('Removido', `"${s.title}" foi removido.`);
  navigate(previousView);
}

function openPlaylistModal() {
  ['p-emoji', 'p-name', 'p-desc'].forEach(id => document.getElementById(id).value = '');
  openModal('modal-playlist');
  setTimeout(() => document.getElementById('p-emoji').focus(), 100);
}

function savePlaylist() {
  const name = document.getElementById('p-name').value.trim();
  if (!name) { toast('Atenção', 'Dê um nome à sua playlist.'); return; }
  playlists.push({
    id:    'p' + Date.now(),
    name,
    emoji: document.getElementById('p-emoji').value.trim() || '🎵',
    desc:  document.getElementById('p-desc').value.trim()
  });
  save();
  closeModal('modal-playlist');
  toast('Criada!', `Playlist "${name}" criada.`);
  renderView('playlists');
}

// ─── COVER UPLOAD ─────────────────────────────────────────────
function handleCoverUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    document.getElementById('f-cover-url').value = dataUrl;
    document.getElementById('f-itunes-art').value = ''; // manual overrides iTunes
    const preview = document.getElementById('cover-preview');
    preview.src = dataUrl;
    preview.style.display = 'block';
    document.getElementById('cover-upload-zone').querySelector('.cover-upload-label').textContent = file.name;
  };
  reader.readAsDataURL(file);
}

// ─── BUSCA ────────────────────────────────────────────────────
function handleSearch() {
  const q = document.getElementById('search-input').value.toLowerCase().trim();
  if (currentView !== 'songs') navigate('songs');
  renderSongs(q || null);
}

// ─── VIEW TOGGLE ─────────────────────────────────────────────
function setSongView(m) {
  songViewMode = m;
  document.getElementById('vt-grid').classList.toggle('active', m === 'grid');
  document.getElementById('vt-list').classList.toggle('active', m === 'list');
  renderSongs();
}

// ─── TOAST ───────────────────────────────────────────────────
function toast(title, msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-msg').textContent   = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── FECHAR MODAL AO CLICAR NO BACKDROP ──────────────────────
document.querySelectorAll('.modal-backdrop').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); });
});

// ─── COMPARTILHAR / STORIE ────────────────────────────────────
let shareSongId = null;
let shareTheme = 'dark';
let shareSelectedVerses = new Set();
let shareShowUser = false;

const SHARE_THEMES = {
  dark:  { bg: '#0e0c09', bg2: '#1a1713', accent: '#c9a84c', accent2: '#e8c97a', text: '#f0e8d8', textDim: 'rgba(240,232,216,0.6)', border: 'rgba(58,52,40,0.8)', tag: 'rgba(201,168,76,0.15)', watermark: 'rgba(240,232,216,0.12)' },
  gold:  { bg: '#2a1f00', bg2: '#1a1200', accent: '#e8c97a', accent2: '#fff0b0', text: '#fff8e0', textDim: 'rgba(255,248,224,0.7)', border: 'rgba(232,201,122,0.3)', tag: 'rgba(232,201,122,0.2)', watermark: 'rgba(255,255,255,0.1)' },
  light: { bg: '#f5f0e8', bg2: '#ede6d8', accent: '#8a6820', accent2: '#6a4e10', text: '#1a160f', textDim: 'rgba(26,22,15,0.55)', border: 'rgba(26,22,15,0.12)', tag: 'rgba(138,104,32,0.12)', watermark: 'rgba(26,22,15,0.07)' },
  night: { bg: '#060612', bg2: '#0d0d22', accent: '#7878ff', accent2: '#aaaaff', text: '#e8e8ff', textDim: 'rgba(232,232,255,0.55)', border: 'rgba(96,96,200,0.3)', tag: 'rgba(120,120,255,0.15)', watermark: 'rgba(232,232,255,0.08)' },
};

function openShareModal(id) {
  shareSongId = id;
  shareSelectedVerses = new Set();
  const s = songs.find(x => x.id === id);
  if (!s) return;

  // Build verses list from highlights
  const versesSection = document.getElementById('share-verses-section');
  const versesList = document.getElementById('share-verses-list');
  if (s.highlights && s.highlights.length > 0) {
    versesSection.style.display = 'block';
    versesList.innerHTML = s.highlights.map((h, i) => `
      <label class="share-verse-item" id="share-verse-${i}">
        <input type="checkbox" class="share-verse-check" data-idx="${i}"
          onchange="toggleShareVerse(${i})" style="display:none">
        <div class="share-verse-text">"${h.text}"</div>
        <div class="share-verse-tick">✦</div>
      </label>
    `).join('');
  } else {
    versesSection.style.display = 'none';
  }

  // Reset theme buttons
  document.querySelectorAll('.share-theme-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-theme="dark"]').classList.add('active');
  shareTheme = 'dark';

  // Show user profile section if profile configured
  const userSection = document.getElementById('share-user-section');
  const hasProfile = userProfile.name || userProfile.avatar;
  if (hasProfile) {
    userSection.style.display = 'block';
    shareShowUser = false;
    const toggle = document.getElementById('share-user-toggle');
    if (toggle) toggle.classList.remove('on');
  } else {
    userSection.style.display = 'none';
  }

  openModal('modal-share');
  setTimeout(() => drawStorie(), 100);
}

function toggleShareVerse(idx) {
  const s = songs.find(x => x.id === shareSongId);
  if (!s) return;
  if (shareSelectedVerses.has(idx)) {
    shareSelectedVerses.delete(idx);
    document.getElementById('share-verse-' + idx).classList.remove('selected');
  } else {
    if (shareSelectedVerses.size >= 4) {
      toast('Máximo atingido', 'Você pode marcar até 4 versos.');
      return;
    }
    shareSelectedVerses.add(idx);
    document.getElementById('share-verse-' + idx).classList.add('selected');
  }
  drawStorie();
}

function setShareTheme(theme) {
  shareTheme = theme;
  document.querySelectorAll('.share-theme-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.theme === theme)
  );
  drawStorie();
}

function toggleShareUser() {
  shareShowUser = !shareShowUser;
  const toggle = document.getElementById('share-user-toggle');
  if (toggle) toggle.classList.toggle('on', shareShowUser);
  drawStorie();
}

async function drawStorie() {
  const s = songs.find(x => x.id === shareSongId);
  if (!s) return;
  const canvas = document.getElementById('share-canvas');
  const ctx = canvas.getContext('2d');
  const W = 1080, H = 1920;
  const T = SHARE_THEMES[shareTheme];
  const PAD = 90; // horizontal padding

  ctx.clearRect(0, 0, W, H);

  // ── Background ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0,   T.bg2);
  bgGrad.addColorStop(0.4, T.bg);
  bgGrad.addColorStop(1,   T.bg2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Grain texture
  ctx.save();
  ctx.globalAlpha = 0.02;
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = shareTheme === 'light' ? '#000' : '#fff';
    ctx.fillRect(Math.random()*W, Math.random()*H, 1.5, 1.5);
  }
  ctx.restore();

  // ── TOP BAR: logo left, date right ──
  const topBarY = 100;
  ctx.save();
  ctx.font = 'italic 300 46px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = T.accent;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = 'left';
  ctx.fillText('Melodia.', PAD, topBarY);
  ctx.globalAlpha = 0.3;
  ctx.font = '300 30px "Nunito Sans", Arial, sans-serif';
  ctx.textAlign = 'right';
  const dateStr = s.date || new Date().toLocaleDateString('pt-BR');
  ctx.fillText(dateStr, W - PAD, topBarY);
  ctx.restore();

  // Top accent line
  ctx.save();
  const topLine = ctx.createLinearGradient(0, 0, W, 0);
  topLine.addColorStop(0, 'transparent');
  topLine.addColorStop(0.25, T.accent);
  topLine.addColorStop(0.75, T.accent2);
  topLine.addColorStop(1, 'transparent');
  ctx.strokeStyle = topLine;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, topBarY + 24); ctx.lineTo(W, topBarY + 24); ctx.stroke();
  ctx.restore();

  // ── VINYL — centered in top half ──
  const vinylCY = 520;   // center Y of the disc
  const vinylR  = 290;   // radius — tighter than before
  await drawVinyl(ctx, W / 2, vinylCY, vinylR, s, T);

  // ── GENRE TAG ──
  let cursor = vinylCY + vinylR + 70;
  if (s.genre) {
    ctx.save();
    ctx.font = '600 28px "Nunito Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    const tagLabel = s.genre.toUpperCase();
    const tagW = ctx.measureText(tagLabel).width + 72;
    const tagH = 56;
    const tagX = (W - tagW) / 2;
    roundRect(ctx, tagX, cursor, tagW, tagH, tagH / 2);
    ctx.fillStyle = T.tag; ctx.fill();
    ctx.strokeStyle = T.accent; ctx.lineWidth = 1.5;
    roundRect(ctx, tagX, cursor, tagW, tagH, tagH / 2);
    ctx.stroke();
    ctx.fillStyle = T.accent;
    ctx.fillText(tagLabel, W / 2, cursor + 38);
    ctx.restore();
    cursor += tagH + 52;
  } else {
    cursor += 20;
  }

  // ── TITLE ──
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = T.text;
  let titleSize = 124;
  const titleText = s.title.toUpperCase();
  ctx.font = `700 ${titleSize}px "Cormorant Garamond", Georgia, serif`;
  while (ctx.measureText(titleText).width > W - PAD * 2 && titleSize > 70) {
    titleSize -= 4;
    ctx.font = `700 ${titleSize}px "Cormorant Garamond", Georgia, serif`;
  }
  // If still too wide, wrap into 2 lines
  if (ctx.measureText(titleText).width > W - PAD * 2) {
    const words = titleText.split(' ');
    const half = Math.ceil(words.length / 2);
    const line1 = words.slice(0, half).join(' ');
    const line2 = words.slice(half).join(' ');
    ctx.fillText(line1, W / 2, cursor + titleSize * 0.85);
    cursor += titleSize * 0.95;
    ctx.fillText(line2, W / 2, cursor + titleSize * 0.85);
    cursor += titleSize * 0.95 + 20;
  } else {
    ctx.fillText(titleText, W / 2, cursor + titleSize * 0.85);
    cursor += titleSize + 20;
  }
  ctx.restore();

  // ── ARTIST ──
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = T.textDim;
  let artistSize = 46;
  const artistLine = s.album ? `${s.artist}  —  ${s.album}` : s.artist;
  ctx.font = `300 ${artistSize}px "Nunito Sans", Arial, sans-serif`;
  while (ctx.measureText(artistLine).width > W - PAD * 2 && artistSize > 30) {
    artistSize -= 2;
    ctx.font = `300 ${artistSize}px "Nunito Sans", Arial, sans-serif`;
  }
  ctx.fillText(artistLine, W / 2, cursor);
  cursor += artistSize + 16;
  ctx.restore();

  // ── YEAR ──
  if (s.year) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = T.accent;
    ctx.globalAlpha = 0.55;
    ctx.font = '300 34px "Nunito Sans", Arial, sans-serif';
    ctx.fillText(s.year, W / 2, cursor);
    cursor += 50;
    ctx.restore();
  }

  // ── STARS ──
  cursor += 24;
  const starSize = 72;
  const starGap  = 20;
  const totalStarW = 5 * starSize + 4 * starGap;
  let sx = (W - totalStarW) / 2;
  for (let i = 1; i <= 5; i++) {
    ctx.save();
    ctx.font = `${starSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = i <= s.rating ? T.accent : T.border;
    ctx.globalAlpha = i <= s.rating ? 1 : 0.22;
    ctx.fillText('★', sx, cursor);
    ctx.restore();
    sx += starSize + starGap;
  }
  cursor += starSize + 56;

  // ── DIVIDER ──
  ctx.save();
  const divGrad = ctx.createLinearGradient(0, 0, W, 0);
  divGrad.addColorStop(0, 'transparent');
  divGrad.addColorStop(0.15, T.border);
  divGrad.addColorStop(0.85, T.border);
  divGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD, cursor); ctx.lineTo(W - PAD, cursor); ctx.stroke();
  ctx.restore();
  cursor += 64;

  // ── VERSES / NOTE ──
  const verses = [...shareSelectedVerses]
    .sort((a, b) => a - b)
    .map(i => s.highlights[i]?.text)
    .filter(Boolean);

  const textContent = verses.length > 0 ? verses : (s.notes ? [`${s.notes}`] : []);

  if (textContent.length > 0) {
    // Big decorative quote
    ctx.save();
    ctx.font = `italic 220px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = T.accent;
    ctx.globalAlpha = 0.18;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('"', PAD - 10, cursor - 30);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let vi = 0; vi < textContent.length; vi++) {
      const verse = textContent[vi];
      ctx.fillStyle = T.text;
      ctx.globalAlpha = 0.85;
      ctx.font = `italic 300 52px "Cormorant Garamond", Georgia, serif`;
      const lines = wrapText(ctx, verse, W - PAD * 2.5, 52);
      for (const line of lines) {
        if (cursor > H - 220) break; // safety: never overflow bottom
        ctx.fillText(line, W / 2, cursor);
        cursor += 76;
      }
      if (vi < textContent.length - 1) {
        // small separator between verses
        cursor += 16;
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = T.accent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W/2 - 60, cursor); ctx.lineTo(W/2 + 60, cursor);
        ctx.stroke();
        cursor += 32;
      }
    }
    ctx.restore();
  }

  // ── USER PROFILE — pinned above bottom ──
  if (shareShowUser && (userProfile.name || userProfile.avatar)) {
    const userY = H - 200;
    ctx.save();

    // Semi-transparent pill background
    const pillW = 420, pillH = 90, pillX = (W - pillW) / 2;
    roundRect(ctx, pillX, userY, pillW, pillH, pillH / 2);
    ctx.fillStyle = shareTheme === 'light'
      ? 'rgba(0,0,0,0.06)'
      : 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = T.accent;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1.5;
    roundRect(ctx, pillX, userY, pillW, pillH, pillH / 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Avatar circle
    const avatarR = 32;
    const avatarX = pillX + 28 + avatarR;
    const avatarCY = userY + pillH / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarCY, avatarR, 0, Math.PI * 2);
    ctx.clip();
    if (userProfile.avatar) {
      try {
        const avatarImg = await loadImage(userProfile.avatar);
        ctx.drawImage(avatarImg, avatarX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);
      } catch {
        ctx.fillStyle = T.accent;
        ctx.fill();
      }
    } else {
      // Gradient circle with initial
      const aGrad = ctx.createRadialGradient(avatarX, avatarCY, 0, avatarX, avatarCY, avatarR);
      aGrad.addColorStop(0, T.accent + '88');
      aGrad.addColorStop(1, T.accent + '33');
      ctx.fillStyle = aGrad;
      ctx.fill();
      ctx.font = `600 ${avatarR}px "Nunito Sans", Arial, sans-serif`;
      ctx.fillStyle = T.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((userProfile.name || '?')[0].toUpperCase(), avatarX, avatarCY);
    }
    ctx.restore();

    // Name text
    if (userProfile.name) {
      ctx.font = '600 36px "Nunito Sans", Arial, sans-serif';
      ctx.fillStyle = T.text;
      ctx.globalAlpha = 0.85;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(userProfile.name, avatarX + avatarR + 22, avatarCY - 8);
      ctx.font = 'italic 300 26px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = T.accent;
      ctx.globalAlpha = 0.6;
      ctx.fillText('no Melodia.', avatarX + avatarR + 22, avatarCY + 26);
    }

    ctx.restore();
  }

  // ── BOTTOM BRANDING — always pinned to bottom ──
  const botY = H - 80;
  ctx.save();
  const botLine = ctx.createLinearGradient(0, 0, W, 0);
  botLine.addColorStop(0, 'transparent');
  botLine.addColorStop(0.25, T.accent);
  botLine.addColorStop(0.75, T.accent2);
  botLine.addColorStop(1, 'transparent');
  ctx.strokeStyle = botLine;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, botY - 36); ctx.lineTo(W, botY - 36); ctx.stroke();
  ctx.font = 'italic 300 34px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = T.watermark;
  ctx.globalAlpha = 0.45;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Melodia — Diário Musical', W / 2, botY);
  ctx.restore();
}

async function drawVinyl(ctx, cx, cy, r, song, T) {
  ctx.save();

  // Outer glow
  const glowGrad = ctx.createRadialGradient(cx, cy, r*0.85, cx, cy, r*1.15);
  glowGrad.addColorStop(0, T.accent + '30');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.beginPath(); ctx.arc(cx, cy, r*1.15, 0, Math.PI*2); ctx.fill();

  // Main vinyl disc
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  const discGrad = ctx.createRadialGradient(cx-r*0.1, cy-r*0.1, 0, cx, cy, r);
  discGrad.addColorStop(0, '#1e1e1e');
  discGrad.addColorStop(0.5, '#0d0d0d');
  discGrad.addColorStop(1, '#080808');
  ctx.fillStyle = discGrad;
  ctx.fill();

  // Groove rings
  for (let i = 0.25; i < 0.92; i += 0.045) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * i, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Sheen
  const sheen = ctx.createLinearGradient(cx-r, cy-r, cx+r*0.5, cy+r*0.5);
  sheen.addColorStop(0, 'rgba(255,255,255,0.07)');
  sheen.addColorStop(0.4, 'transparent');
  sheen.addColorStop(0.7, 'rgba(255,255,255,0.02)');
  sheen.addColorStop(1, 'transparent');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = sheen; ctx.fill();

  // Center label (art or gradient)
  const labelR = r * 0.38;
  const artUrl = song.coverUrl || (song.itunesArt ? song.itunesArt.replace('100x100bb', '600x600bb') : null);

  if (artUrl) {
    try {
      const img = await loadImage(artUrl);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, labelR, 0, Math.PI*2); ctx.clip();
      ctx.drawImage(img, cx-labelR, cy-labelR, labelR*2, labelR*2);
      ctx.restore();
    } catch {
      drawLabelFallback(ctx, cx, cy, labelR, song, T);
    }
  } else {
    drawLabelFallback(ctx, cx, cy, labelR, song, T);
  }

  // Center hole
  ctx.beginPath(); ctx.arc(cx, cy, r*0.042, 0, Math.PI*2);
  ctx.fillStyle = '#000'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.restore();
}

function drawLabelFallback(ctx, cx, cy, r, song, T) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  const labelGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  labelGrad.addColorStop(0, T.bg2);
  labelGrad.addColorStop(1, T.bg);
  ctx.fillStyle = labelGrad; ctx.fill();
  ctx.strokeStyle = T.accent + '60'; ctx.lineWidth = 2; ctx.stroke();
  // Emoji
  const emoji = genreEmoji(song.genre);
  ctx.font = `${r * 0.7}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, cx, cy);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function wrapText(ctx, text, maxW, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function downloadStorie() {
  const canvas = document.getElementById('share-canvas');
  const link = document.createElement('a');
  const s = songs.find(x => x.id === shareSongId);
  link.download = `melodia-${(s?.title || 'musica').toLowerCase().replace(/\s+/g,'-')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  toast('Imagem salva!', 'Abra a galeria e poste no seu Stories 📱');
}

// ─── SETTINGS ─────────────────────────────────────────────────
function renderSettings() {
  const isDark = userProfile.darkMode !== false;
  const fontSize = userProfile.fontSize || 100;
  const avatar = userProfile.avatar || '';
  const name = userProfile.name || '';

  document.getElementById('settings-content').innerHTML = `
    <div class="settings-page">

      <!-- PERFIL -->
      <div class="settings-section">
        <div class="settings-section-title">👤 Perfil</div>

        <div class="settings-avatar-row">
          <div class="settings-avatar-wrap" onclick="document.getElementById('avatar-upload').click()">
            ${avatar
              ? `<img src="${avatar}" class="settings-avatar-img">`
              : `<div class="settings-avatar-placeholder">${name ? name[0].toUpperCase() : '♪'}</div>`}
            <div class="settings-avatar-overlay">📷</div>
            <input type="file" id="avatar-upload" accept="image/*" style="display:none" onchange="handleAvatarUpload(event)">
          </div>
          <div style="flex:1">
            <label class="form-label">Nome de exibição</label>
            <input class="form-input" id="settings-name" placeholder="Como quer ser chamado?" value="${name}"
              oninput="saveSettingsName(this.value)">
          </div>
        </div>
      </div>

      <!-- APARÊNCIA -->
      <div class="settings-section">
        <div class="settings-section-title">🎨 Aparência</div>

        <label class="settings-toggle-row" onclick="toggleDarkMode()">
          <div>
            <div class="settings-row-label">Modo escuro</div>
            <div class="settings-row-sub">Alterna entre tema escuro e claro</div>
          </div>
          <div class="settings-toggle ${isDark ? 'on' : ''}" id="toggle-dark"></div>
        </label>
      </div>

      <!-- ACESSIBILIDADE -->
      <div class="settings-section">
        <div class="settings-section-title">♿ Acessibilidade</div>

        <div class="settings-row-label" style="margin-bottom:14px">Tamanho do texto</div>
        <div class="settings-font-row">
          <span style="font-size:12px;color:var(--cream-dim)">A</span>
          <input type="range" id="font-slider" min="85" max="130" step="5" value="${fontSize}"
            oninput="applyFontSize(this.value)" class="settings-slider">
          <span style="font-size:20px;color:var(--cream-dim)">A</span>
        </div>
        <div style="text-align:center;font-size:12px;color:var(--cream-faint);margin-top:6px">${fontSize}% do tamanho original</div>
      </div>

      <!-- DADOS -->
      <div class="settings-section">
        <div class="settings-section-title">💾 Dados</div>

        <label class="settings-toggle-row" style="cursor:pointer" onclick="exportData()">
          <div>
            <div class="settings-row-label">Exportar dados</div>
            <div class="settings-row-sub">Baixa um arquivo .json com todas as suas músicas</div>
          </div>
          <span class="settings-arrow">↓</span>
        </label>

        <label class="settings-toggle-row" style="cursor:pointer" onclick="document.getElementById('import-input').click()">
          <div>
            <div class="settings-row-label">Importar dados</div>
            <div class="settings-row-sub">Restaura a partir de um arquivo .json</div>
          </div>
          <span class="settings-arrow">↑</span>
          <input type="file" id="import-input" accept=".json" style="display:none" onchange="importData(event)">
        </label>
      </div>

      <!-- DANGER ZONE -->
      <div class="settings-section settings-danger">
        <div class="settings-section-title">⚠️ Zona de perigo</div>

        <label class="settings-toggle-row" style="cursor:pointer" onclick="confirmClearSongs()">
          <div>
            <div class="settings-row-label" style="color:var(--red)">Apagar todas as músicas</div>
            <div class="settings-row-sub">Remove permanentemente seu diário musical</div>
          </div>
          <span class="settings-arrow" style="color:var(--red)">✕</span>
        </label>

        <label class="settings-toggle-row" style="cursor:pointer;margin-top:2px" onclick="confirmResetAll()">
          <div>
            <div class="settings-row-label" style="color:var(--red)">Resetar tudo</div>
            <div class="settings-row-sub">Apaga músicas, playlists e perfil</div>
          </div>
          <span class="settings-arrow" style="color:var(--red)">✕</span>
        </label>
      </div>

      <!-- RODAPÉ -->
      <div class="settings-footer">
        <div class="settings-footer-logo">Melodia<span>.</span></div>
        <div class="settings-footer-version">Versão 1.0.0</div>
        <div class="settings-footer-quote">"A música é a aritmética dos sons." — Claude Debussy</div>
      </div>

    </div>
  `;
}

function saveSettingsName(val) {
  userProfile.name = val;
  saveProfile();
  updateSidebarUser();
}

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    userProfile.avatar = e.target.result;
    saveProfile();
    updateSidebarUser();
    renderSettings();
    toast('Foto atualizada!', 'Sua foto de perfil foi salva.');
  };
  reader.readAsDataURL(file);
}

function toggleDarkMode() {
  userProfile.darkMode = !userProfile.darkMode;
  saveProfile();
  applyTheme();
  const tog = document.getElementById('toggle-dark');
  if (tog) tog.classList.toggle('on', userProfile.darkMode);
}

function applyTheme() {
  const isDark = userProfile.darkMode !== false;
  document.documentElement.style.setProperty('--bg',           isDark ? '#0e0c09' : '#f5f0e8');
  document.documentElement.style.setProperty('--bg2',          isDark ? '#161410' : '#ede8de');
  document.documentElement.style.setProperty('--bg3',          isDark ? '#1e1b16' : '#e5e0d5');
  document.documentElement.style.setProperty('--surface',      isDark ? '#242018' : '#ddd8cc');
  document.documentElement.style.setProperty('--surface2',     isDark ? '#2c2820' : '#d5d0c4');
  document.documentElement.style.setProperty('--border',       isDark ? '#3a3428' : '#c0b8a8');
  document.documentElement.style.setProperty('--cream',        isDark ? '#f0e8d8' : '#1a160f');
  document.documentElement.style.setProperty('--cream-dim',    isDark ? 'rgba(240,232,216,0.55)' : 'rgba(26,22,15,0.6)');
  document.documentElement.style.setProperty('--cream-faint',  isDark ? 'rgba(240,232,216,0.18)' : 'rgba(26,22,15,0.22)');
}

function applyFontSize(val) {
  userProfile.fontSize = parseInt(val);
  saveProfile();
  document.documentElement.style.fontSize = (val / 100 * 16) + 'px';
  // update label
  const slider = document.getElementById('font-slider');
  if (slider) {
    const label = slider.parentElement.nextElementSibling;
    if (label) label.textContent = val + '% do tamanho original';
  }
}

function exportData() {
  const data = { songs, playlists, profile: { name: userProfile.name } };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `melodia-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Exportado!', 'Arquivo .json baixado com sucesso.');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.songs || !Array.isArray(data.songs)) throw new Error();
      if (confirm(`Importar ${data.songs.length} músicas? Os dados atuais serão substituídos.`)) {
        songs = data.songs;
        playlists = data.playlists || [];
        if (data.profile?.name) userProfile.name = data.profile.name;
        save();
        saveProfile();
        updateSidebarUser();
        renderView('settings');
        toast('Importado!', `${songs.length} músicas restauradas com sucesso.`);
      }
    } catch {
      toast('Erro', 'Arquivo inválido. Use um backup do Melodia.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function confirmClearSongs() {
  if (confirm('Tem certeza? Todas as suas músicas serão apagadas permanentemente.')) {
    songs = [];
    save();
    updateBadges();
    renderSettings();
    toast('Apagado', 'Todas as músicas foram removidas.');
  }
}

function confirmResetAll() {
  if (confirm('Resetar TUDO? Músicas, playlists e perfil serão apagados. Esta ação é irreversível.')) {
    songs = [];
    playlists = [];
    userProfile = { name: '', avatar: '', darkMode: true, fontSize: 100 };
    save();
    saveProfile();
    applyTheme();
    applyFontSize(100);
    updateSidebarUser();
    renderView('home');
    toast('Resetado', 'O Melodia foi reiniciado do zero.');
  }
}

// ─── INIT ─────────────────────────────────────────────────────
applyTheme();
applyFontSize(userProfile.fontSize || 100);
updateSidebarUser();
renderView('home');