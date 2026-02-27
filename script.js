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
            Toque em um verso para marcá-lo como favorito
          </div>
        </div>
        <div class="lyrics-body" id="lyrics-body-${s.id}">${renderLyrics(s.lyrics, s.highlights || [], s.id)}</div>
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
function renderLyrics(lyrics, highlights, songId) {
  if (!lyrics) return '';

  const highlightedTexts = new Set((highlights || []).map(h => normalize(h.text)));

  // Split into lines, group by stanzas (blank line = stanza break)
  const rawLines = lyrics.split('\n');
  let html = '';
  let inStanza = false;

  rawLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      // blank line = stanza separator
      if (inStanza) { html += '</p>'; inStanza = false; }
      return;
    }
    if (!inStanza) { html += '<p class="lyric-stanza">'; inStanza = true; }

    // Escape HTML
    const escaped = trimmed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const isHighlighted = highlightedTexts.has(normalize(trimmed));
    const songAttr = songId ? ` data-song-id="${songId}"` : '';

    html += `<span class="lyric-line${isHighlighted ? ' lyric-line-marked' : ''}" data-line="${idx}"${songAttr} onclick="toggleVerse(this)">${escaped}</span>`;
  });

  if (inStanza) html += '</p>';
  return html;
}

function toggleVerse(el) {
  const songId = el.getAttribute('data-song-id');
  const lineText = el.textContent.trim();
  const s = songs.find(x => x.id === songId);
  if (!s) return;
  if (!s.highlights) s.highlights = [];

  const normLine = normalize(lineText);
  const existingIdx = s.highlights.findIndex(h => normalize(h.text) === normLine);

  if (existingIdx !== -1) {
    // Desmarcar
    s.highlights.splice(existingIdx, 1);
    el.classList.remove('lyric-line-marked');
    save();
    // Atualiza seção de trechos sem re-renderizar tudo
    refreshHighlightsSection(songId, s);
    toast('Verso desmarcado', 'O verso foi removido dos seus favoritos.');
  } else {
    // Marcar
    s.highlights.push({ text: lineText, date: new Date().toLocaleDateString('pt-BR') });
    el.classList.add('lyric-line-marked');
    save();
    refreshHighlightsSection(songId, s);
    toast('✦ Verso marcado!', `"${lineText.slice(0, 40)}${lineText.length > 40 ? '…' : ''}" salvo.`);
  }
}

function refreshHighlightsSection(songId, s) {
  // Find or create highlights section in detail view
  const lyricsSection = document.querySelector('.lyrics-section');
  if (!lyricsSection) return;

  let hSection = lyricsSection.querySelector('.highlights-section');

  if (!s.highlights || s.highlights.length === 0) {
    if (hSection) hSection.remove();
    return;
  }

  const hHTML = `
    <div class="highlights-section">
      <div class="highlights-title">✦ Trechos <em>marcados</em></div>
      ${s.highlights.map((h, i) => `
        <div class="highlight-item">
          <div class="highlight-quote">${h.text}</div>
          <button class="highlight-remove" onclick="removeHighlight('${songId}', ${i})" title="Remover">×</button>
        </div>
      `).join('')}
    </div>`;

  if (hSection) {
    hSection.outerHTML = hHTML;
  } else {
    lyricsSection.insertAdjacentHTML('beforeend', hHTML);
  }
}

function normalize(str) {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
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
    if (shareSelectedVerses.size >= 3) {
      toast('Máximo atingido', 'Você pode marcar até 3 versos.');
      return;
    }
    const currentChars = [...shareSelectedVerses]
      .map(i => s.highlights[i]?.text || '')
      .join('').length;
    const newVerseChars = (s.highlights[idx]?.text || '').length;
    if (currentChars + newVerseChars > 78) {
      toast('Limite de caracteres', 'A soma dos versos não pode ultrapassar 78 caracteres.');
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

// ─── CANVAS HELPERS ───────────────────────────────────────────

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

// Fit text into maxW, reducing font until minSize, then truncating with ellipsis
function fitAutoText(ctx, text, baseFont, maxW, minSize, currentSize) {
  let size = currentSize;
  const makeFont = (s) => baseFont.replace(/\d+px/, `${s}px`);
  ctx.font = makeFont(size);
  while (ctx.measureText(text).width > maxW && size > minSize) {
    size -= 2;
    ctx.font = makeFont(size);
  }
  if (ctx.measureText(text).width > maxW) {
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    return { text: t + '…', size };
  }
  return { text, size };
}

// Draw multi-line text with auto font reduction, max lines, ellipsis
function drawAutoText(ctx, text, x, y, maxW, baseFont, startSize, minSize, maxLines, align = 'center', lineH_ratio = 1.3) {
  let size = startSize;
  const makeFont = (s) => baseFont.replace(/\d+px/, `${s}px`);

  // Try to find a font size where text wraps within maxLines
  ctx.font = makeFont(size);
  let lines = wrapText(ctx, text, maxW, size);
  while (lines.length > maxLines && size > minSize) {
    size -= 2;
    ctx.font = makeFont(size);
    lines = wrapText(ctx, text, maxW, size);
  }

  // If still too many lines, truncate last line
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
    lines[maxLines - 1] = last + '…';
  }

  const lineH = size * lineH_ratio;
  const totalH = lines.length * lineH;

  ctx.font = makeFont(size);
  ctx.textAlign = align;
  ctx.textBaseline = 'top';

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineH);
  }

  return { lines, size, totalH, lineH };
}

// ─── MAIN CARD DRAW ───────────────────────────────────────────

async function drawStorie() {
  const s = songs.find(x => x.id === shareSongId);
  if (!s) return;
  const canvas = document.getElementById('share-canvas');
  const ctx = canvas.getContext('2d');
  const W = 1080, H = 1920;
  const T = SHARE_THEMES[shareTheme];
  const PAD = 88;

  ctx.clearRect(0, 0, W, H);

  // ─────────────────────────────────────────────────────────────
  // LAYOUT CONSTANTS
  // ─────────────────────────────────────────────────────────────
  const INNER_W = W - PAD * 2;

  // ── BACKGROUND ──────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0,   T.bg2);
  bgGrad.addColorStop(0.4, T.bg);
  bgGrad.addColorStop(0.8, T.bg2);
  bgGrad.addColorStop(1,   T.bg);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle noise texture
  ctx.save();
  ctx.globalAlpha = 0.018;
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = shareTheme === 'light' ? '#000' : '#fff';
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
  }
  ctx.restore();

  // Diagonal vignette
  ctx.save();
  const vigGrad = ctx.createRadialGradient(W/2, H*0.4, 0, W/2, H*0.4, W);
  vigGrad.addColorStop(0, 'transparent');
  vigGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // ─────────────────────────────────────────────────────────────
  // ZONE SIZING
  // ─────────────────────────────────────────────────────────────
  const verses = [...shareSelectedVerses]
    .sort((a, b) => a - b)
    .map(i => s.highlights[i]?.text)
    .filter(Boolean);
  const hasVerses = verses.length > 0;
  const hasUser   = shareShowUser && (userProfile.name || userProfile.avatar);

  // Zone heights (will be used for layout)
  const TOP_ZONE_H   = 110;  // app name + date
  const COVER_SIZE   = 560;  // square cover art
  const INFO_TOP_PAD = 64;   // space between cover and info
  const FOOTER_H     = hasUser ? 190 : 0;

  // ─────────────────────────────────────────────────────────────
  // TOP BAR — App name + date
  // ─────────────────────────────────────────────────────────────
  const topBarY = 80;
  ctx.save();
  ctx.textBaseline = 'alphabetic';

  // App name
  ctx.font = 'italic 300 46px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = T.accent;
  ctx.globalAlpha = 0.45;
  ctx.textAlign = 'left';
  ctx.fillText('Melodia.', PAD, topBarY);

  // Date
  ctx.font = '300 26px "Nunito Sans", Arial, sans-serif';
  ctx.fillStyle = T.textDim;
  ctx.globalAlpha = 0.4;
  ctx.textAlign = 'right';
  ctx.fillText(s.date || new Date().toLocaleDateString('pt-BR'), W - PAD, topBarY);
  ctx.restore();

  // Top accent line
  ctx.save();
  const topLineGrad = ctx.createLinearGradient(0, 0, W, 0);
  topLineGrad.addColorStop(0, 'transparent');
  topLineGrad.addColorStop(0.15, T.accent + '88');
  topLineGrad.addColorStop(0.85, T.accent2 + '88');
  topLineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = topLineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, topBarY + 18);
  ctx.lineTo(W, topBarY + 18);
  ctx.stroke();
  ctx.restore();

  // ─────────────────────────────────────────────────────────────
  // PASS 1 — measure all info-block heights (no drawing yet)
  // ─────────────────────────────────────────────────────────────

  // Measure title
  ctx.font = '700 108px "Cormorant Garamond", Georgia, serif';
  let _titleLines = wrapText(ctx, s.title, INNER_W, 108);
  let _titleSize  = 108;
  while (_titleLines.length > 2 && _titleSize > 64) {
    _titleSize -= 2;
    ctx.font = `700 ${_titleSize}px "Cormorant Garamond", Georgia, serif`;
    _titleLines = wrapText(ctx, s.title, INNER_W, _titleSize);
  }
  const MEAS_TITLE = _titleLines.length * _titleSize * 1.15;

  // Measure artist
  ctx.font = '300 46px "Nunito Sans", Arial, sans-serif';
  const _artistLines = wrapText(ctx, s.artist, INNER_W, 46);
  const MEAS_ARTIST  = Math.min(_artistLines.length, 2) * 46 * 1.3;

  // Measure album
  let MEAS_ALBUM = 0;
  if (s.album) {
    ctx.font = 'italic 300 36px "Cormorant Garamond", Georgia, serif';
    const _albumLines = wrapText(ctx, s.album, INNER_W * 0.85, 36);
    MEAS_ALBUM = Math.min(_albumLines.length, 2) * 36 * 1.3 + 32;
  } else {
    MEAS_ALBUM = 16;
  }

  // Tags row
  ctx.font = '600 24px "Nunito Sans", Arial, sans-serif';
  const _tags = [];
  if (s.genre) _tags.push(s.genre.toUpperCase());
  if (s.year)  _tags.push(String(s.year));
  const MEAS_TAGS = _tags.length > 0 ? 50 + 30 : 0;  // TAG_H + gap

  const MEAS_STARS  = 52 + 44;
  const MEAS_DIVIDER = hasVerses ? 1.2 + 48 : 0;

  // Verse blocks measurement
  const VERSE_FONT_SIZE = 50;
  const VERSE_FONT = `italic 300 ${VERSE_FONT_SIZE}px "Cormorant Garamond", Georgia, serif`;
  const VERSE_MAX_W  = INNER_W - 80;
  const VERSE_LINE_H = VERSE_FONT_SIZE * 1.4;
  const VERSE_SEP_H  = 40;

  let verseBlocks = [];
  let MEAS_VERSES  = 0;
  if (hasVerses) {
    ctx.font = VERSE_FONT;
    verseBlocks = verses.map(v => {
      let lines = wrapText(ctx, v, VERSE_MAX_W, VERSE_FONT_SIZE);
      if (lines.length > 3) {
        lines = lines.slice(0, 3);
        let last = lines[2];
        while (last.length > 1 && ctx.measureText(last + '…').width > VERSE_MAX_W) last = last.slice(0, -1);
        lines[2] = last + '…';
      }
      return lines;
    });
    verseBlocks.forEach((bl, i) => {
      MEAS_VERSES += bl.length * VERSE_LINE_H;
      if (i < verseBlocks.length - 1) MEAS_VERSES += VERSE_SEP_H;
    });
    MEAS_VERSES += 60; // breathing room around verse zone
  }

  // Total content height (cover + gaps + info + verses)
  const TOP_LINE_Y   = topBarY + 18;     // the accent line below the top bar
  const CONTENT_TOP  = TOP_LINE_Y + 30;  // first pixel available after top bar
  const FOOTER_LINE  = hasUser ? H - FOOTER_H : H - 22;  // top of footer zone / bottom line

  const INFO_BLOCK_H = MEAS_TITLE + 28
                     + MEAS_ARTIST + 10
                     + MEAS_ALBUM
                     + MEAS_TAGS
                     + MEAS_STARS
                     + MEAS_DIVIDER
                     + MEAS_VERSES;
  const TOTAL_H = COVER_SIZE + INFO_TOP_PAD + INFO_BLOCK_H;
  const ZONE_H  = FOOTER_LINE - CONTENT_TOP;

  // Vertical offset to center everything between top line and footer
  const offsetY = Math.max(0, Math.round((ZONE_H - TOTAL_H) / 2));

  // ─────────────────────────────────────────────────────────────
  // PASS 2 — draw everything with the computed offset
  // ─────────────────────────────────────────────────────────────

  // ── COVER ART ──
  const coverY  = CONTENT_TOP + offsetY;
  const coverX  = (W - COVER_SIZE) / 2;
  const coverR  = 32;

  // Glow behind cover
  ctx.save();
  const glowGrad = ctx.createRadialGradient(W/2, coverY + COVER_SIZE/2, 0, W/2, coverY + COVER_SIZE/2, COVER_SIZE * 0.75);
  glowGrad.addColorStop(0, T.accent + '22');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, coverY - 60, W, COVER_SIZE + 120);
  ctx.restore();

  // Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  roundRect(ctx, coverX, coverY, COVER_SIZE, COVER_SIZE, coverR);
  ctx.fillStyle = T.bg;
  ctx.fill();
  ctx.restore();

  // Clip and draw cover
  ctx.save();
  roundRect(ctx, coverX, coverY, COVER_SIZE, COVER_SIZE, coverR);
  ctx.clip();

  const artUrl = s.coverUrl || (s.itunesArt ? s.itunesArt.replace('100x100bb', '600x600bb') : null);
  let coverDrawn = false;
  if (artUrl) {
    try {
      const img = await loadImage(artUrl);
      ctx.drawImage(img, coverX, coverY, COVER_SIZE, COVER_SIZE);
      coverDrawn = true;
    } catch (_) {}
  }
  if (!coverDrawn) {
    const fallGrad = ctx.createLinearGradient(coverX, coverY, coverX + COVER_SIZE, coverY + COVER_SIZE);
    fallGrad.addColorStop(0, T.bg2);
    fallGrad.addColorStop(1, T.bg);
    ctx.fillStyle = fallGrad;
    ctx.fillRect(coverX, coverY, COVER_SIZE, COVER_SIZE);
    ctx.font = `${COVER_SIZE * 0.35}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(genreEmoji(s.genre), W/2, coverY + COVER_SIZE/2);
  }

  roundRect(ctx, coverX, coverY, COVER_SIZE, COVER_SIZE, coverR);
  ctx.restore();
  ctx.save();
  roundRect(ctx, coverX, coverY, COVER_SIZE, COVER_SIZE, coverR);
  ctx.strokeStyle = T.accent + '28';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // ── INFO SECTION ──
  let cur = coverY + COVER_SIZE + INFO_TOP_PAD;

  // Song title
  ctx.save();
  ctx.fillStyle = T.text;
  ctx.globalAlpha = 1;
  const { totalH: titleH } = drawAutoText(
    ctx, s.title, W / 2, cur, INNER_W,
    '700 108px "Cormorant Garamond", Georgia, serif',
    108, 64, 2, 'center', 1.15
  );
  cur += titleH + 28;
  ctx.restore();

  // Artist
  ctx.save();
  ctx.fillStyle = T.textDim;
  ctx.globalAlpha = 0.85;
  const { totalH: artistH } = drawAutoText(
    ctx, s.artist, W / 2, cur, INNER_W,
    '300 46px "Nunito Sans", Arial, sans-serif',
    46, 30, 2, 'center', 1.3
  );
  cur += artistH + 10;
  ctx.restore();

  // Album
  if (s.album) {
    ctx.save();
    ctx.fillStyle = T.textDim;
    ctx.globalAlpha = 0.55;
    const { totalH: albumH } = drawAutoText(
      ctx, s.album, W / 2, cur, INNER_W * 0.85,
      'italic 300 36px "Cormorant Garamond", Georgia, serif',
      36, 24, 2, 'center', 1.3
    );
    cur += albumH + 32;
    ctx.restore();
  } else {
    cur += 16;
  }

  // Tags
  ctx.save();
  ctx.font = '600 24px "Nunito Sans", Arial, sans-serif';
  const tags = [];
  if (s.genre) tags.push(s.genre.toUpperCase());
  if (s.year)  tags.push(String(s.year));
  if (tags.length > 0) {
    const TAG_H = 50, TAG_R = 25, TAG_GAP = 16, TAG_PADX = 36;
    const tagWidths = tags.map(t => ctx.measureText(t).width + TAG_PADX * 2);
    const totalTagW = tagWidths.reduce((a, b) => a + b, 0) + (tags.length - 1) * TAG_GAP;
    let tx = (W - totalTagW) / 2;
    tags.forEach((label, i) => {
      const tw = tagWidths[i];
      roundRect(ctx, tx, cur, tw, TAG_H, TAG_R);
      ctx.fillStyle = shareTheme === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.28)';
      ctx.fill();
      ctx.strokeStyle = T.accent + '66'; ctx.lineWidth = 1;
      roundRect(ctx, tx, cur, tw, TAG_H, TAG_R);
      ctx.stroke();
      ctx.fillStyle = T.accent;
      ctx.globalAlpha = 0.62;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(label, tx + TAG_PADX, cur + (TAG_H - 24) / 2);
      ctx.globalAlpha = 1;
      tx += tw + TAG_GAP;
    });
    cur += TAG_H + 30;
  }
  ctx.restore();

  // Stars
  const STAR_SIZE = 52, STAR_GAP = 10;
  const totalStarW = 5 * STAR_SIZE + 4 * STAR_GAP;
  let sx = (W - totalStarW) / 2;
  for (let i = 1; i <= 5; i++) {
    ctx.save();
    ctx.font = `${STAR_SIZE}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = i <= s.rating ? 0.92 : 0.15;
    ctx.fillStyle = i <= s.rating ? T.accent : T.textDim;
    ctx.fillText('★', sx, cur);
    ctx.restore();
    sx += STAR_SIZE + STAR_GAP;
  }
  cur += STAR_SIZE + 44;

  // ── DIVIDER (only if verses present) ──
  if (hasVerses) {
    ctx.save();
    const divGrad = ctx.createLinearGradient(0, 0, W, 0);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.12, T.border);
    divGrad.addColorStop(0.5,  T.accent + '55');
    divGrad.addColorStop(0.88, T.border);
    divGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(PAD, cur); ctx.lineTo(W - PAD, cur); ctx.stroke();
    ctx.restore();
    cur += 48;
  }

  // ── VERSES ──
  if (hasVerses) {
    // Available zone for verses: from cur to the footer boundary
    const VERSE_ZONE_BOT = FOOTER_LINE - (hasUser ? 20 : 0);
    const VERSE_AVAIL    = VERSE_ZONE_BOT - cur;
    let vy = cur + Math.max(0, (VERSE_AVAIL - MEAS_VERSES + 60) / 2);

    const VERSE_BLOCK_W = INNER_W - 80;
    const VERSE_COL_X   = (W - VERSE_BLOCK_W) / 2;
    const BAR_W = 3, BAR_GAP = 22;
    const TEXT_X = VERSE_COL_X + BAR_W + BAR_GAP;

    // Decorative quote mark
    ctx.save();
    ctx.font = `italic 200px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = T.accent;
    ctx.globalAlpha = 0.10;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('"', VERSE_COL_X - 6, vy - 40);
    ctx.restore();

    ctx.save();
    ctx.font = VERSE_FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    verseBlocks.forEach((lines, vi) => {
      const blockH = lines.length * VERSE_LINE_H;

      ctx.save();
      roundRect(ctx, VERSE_COL_X, vy - 14, VERSE_BLOCK_W, blockH + 28, 12);
      ctx.fillStyle = shareTheme === 'light' ? 'rgba(0,0,0,0.055)' : 'rgba(255,255,255,0.065)';
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = T.accent;
      ctx.globalAlpha = 0.55;
      roundRect(ctx, VERSE_COL_X, vy - 2, BAR_W, blockH + 4, BAR_W / 2);
      ctx.fill();
      ctx.restore();

      lines.forEach((line, li) => {
        ctx.fillStyle = T.text;
        ctx.globalAlpha = 0.88;
        ctx.fillText(line, TEXT_X, vy + li * VERSE_LINE_H);
      });
      vy += blockH;

      if (vi < verseBlocks.length - 1) {
        vy += 16;
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = T.accent;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 7]);
        ctx.beginPath();
        ctx.moveTo(TEXT_X, vy); ctx.lineTo(VERSE_COL_X + VERSE_BLOCK_W, vy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        vy += VERSE_SEP_H - 16;
      }
    });
    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // FOOTER — user profile pill
  // ─────────────────────────────────────────────────────────────
  if (hasUser) {
    const PILL_H = 100;

    // The two bounding lines of the footer zone:
    // — top separator line (same as drawn in DIVIDER section logic, fixed here)
    const LINE_TOP = H - FOOTER_H;          // where the top separator will be drawn
    const LINE_BOT = H - 22;                // bottom accent line (drawn at the very end)
    const ZONE_MID = (LINE_TOP + LINE_BOT) / 2;  // true midpoint between both lines
    const pillY    = Math.round(ZONE_MID - PILL_H / 2);  // pill vertically centered in zone

    // Horizontal accent line — top of footer zone
    ctx.save();
    const footLineGrad = ctx.createLinearGradient(0, 0, W, 0);
    footLineGrad.addColorStop(0, 'transparent');
    footLineGrad.addColorStop(0.2, T.accent + '33');
    footLineGrad.addColorStop(0.8, T.accent + '33');
    footLineGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = footLineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, LINE_TOP); ctx.lineTo(W, LINE_TOP); ctx.stroke();
    ctx.restore();

    // ── Optical centering ──────────────────────────────────────
    // Measure the text block so we can calculate true content width
    // and position the whole group so it reads as visually centered,
    // not just mathematically centered (the avatar circle pulls left).
    const AVA_R    = 36;
    const AVA_GAP  = 24;          // gap between avatar edge and text
    const NAME_SIZE = 34, SUB_SIZE = 28;

    ctx.font = `600 ${NAME_SIZE}px "Nunito Sans", Arial, sans-serif`;
    const nameW = userProfile.name ? ctx.measureText(userProfile.name).width : 0;
    ctx.font = `italic 300 ${SUB_SIZE}px "Cormorant Garamond", Georgia, serif`;
    const subW  = ctx.measureText('no Melodia.').width;
    const textBlockW = Math.max(nameW, subW);

    // Total content width: avatar diameter + gap + text block
    const contentW = AVA_R * 2 + AVA_GAP + textBlockW;

    // Optical offset: shift the whole group +8px right to compensate
    // for the visual weight of the circular avatar on the left side.
    const OPTICAL_SHIFT = 8;
    const groupX = Math.round((W - contentW) / 2) + OPTICAL_SHIFT;

    const AVA_CX = groupX + AVA_R;         // avatar center X
    const AVA_CY = pillY + PILL_H / 2;     // avatar center Y (vertical middle of pill)
    const TEXT_X = groupX + AVA_R * 2 + AVA_GAP;  // where text starts

    // Size pill to snugly wrap the content with balanced horizontal padding
    const PILL_PAD_H = 36;   // horizontal padding each side
    const PILL_W_OPT = contentW + PILL_PAD_H * 2;
    const pillXOpt   = Math.round((W - PILL_W_OPT) / 2);

    ctx.save();
    roundRect(ctx, pillXOpt, pillY, PILL_W_OPT, PILL_H, PILL_H / 2);
    ctx.fillStyle = shareTheme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = T.accent;
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 1.5;
    roundRect(ctx, pillXOpt, pillY, PILL_W_OPT, PILL_H, PILL_H / 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Avatar clip & fill
    ctx.save();
    ctx.beginPath(); ctx.arc(AVA_CX, AVA_CY, AVA_R, 0, Math.PI * 2); ctx.clip();
    if (userProfile.avatar) {
      try {
        const avatarImg = await loadImage(userProfile.avatar);
        ctx.drawImage(avatarImg, AVA_CX - AVA_R, AVA_CY - AVA_R, AVA_R * 2, AVA_R * 2);
      } catch {
        ctx.fillStyle = T.accent; ctx.fill();
      }
    } else {
      const aGrad = ctx.createRadialGradient(AVA_CX, AVA_CY, 0, AVA_CX, AVA_CY, AVA_R);
      aGrad.addColorStop(0, T.accent + '99'); aGrad.addColorStop(1, T.accent + '33');
      ctx.fillStyle = aGrad; ctx.fill();
      ctx.font = `600 ${AVA_R}px "Nunito Sans", Arial, sans-serif`;
      ctx.fillStyle = T.bg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((userProfile.name || '?')[0].toUpperCase(), AVA_CX, AVA_CY);
    }
    ctx.restore();

    // Avatar ring
    ctx.save();
    ctx.strokeStyle = T.accent; ctx.lineWidth = 2; ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.arc(AVA_CX, AVA_CY, AVA_R + 3, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // Text: name + subtitle
    if (userProfile.name) {
      // Name — primary, strong
      ctx.font = `600 ${NAME_SIZE}px "Nunito Sans", Arial, sans-serif`;
      ctx.fillStyle = T.text; ctx.globalAlpha = 0.90;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(userProfile.name, TEXT_X, AVA_CY - 12);

      // "no Melodia." — secondary, present but not competing
      ctx.font = `italic 300 ${SUB_SIZE}px "Cormorant Garamond", Georgia, serif`;
      ctx.fillStyle = T.accent; ctx.globalAlpha = 0.72;  // up from 0.55
      ctx.fillText('no Melodia.', TEXT_X, AVA_CY + 22);
    }
    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // BOTTOM ACCENT LINE
  // ─────────────────────────────────────────────────────────────
  ctx.save();
  const botLineGrad = ctx.createLinearGradient(0, 0, W, 0);
  botLineGrad.addColorStop(0, 'transparent');
  botLineGrad.addColorStop(0.2, T.accent + '55');
  botLineGrad.addColorStop(0.8, T.accent2 + '55');
  botLineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = botLineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, H - 22); ctx.lineTo(W, H - 22); ctx.stroke();
  ctx.restore();
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