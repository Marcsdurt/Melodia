// ─── LETRAS & HIGHLIGHTS ──────────────────────────────────────
function renderLyrics(lyrics, highlights, songId) {
  if (!lyrics) return '';

  const highlightedTexts = new Set((highlights || []).map(h => normalize(h.text)));

  const rawLines = lyrics.split('\n');
  let html = '';
  let inStanza = false;

  rawLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inStanza) { html += '</p>'; inStanza = false; }
      return;
    }
    if (!inStanza) { html += '<p class="lyric-stanza">'; inStanza = true; }

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
  const songId   = el.getAttribute('data-song-id');
  const lineText = el.textContent.trim();
  const s = songs.find(x => x.id === songId);
  if (!s) return;
  if (!s.highlights) s.highlights = [];

  const normLine    = normalize(lineText);
  const existingIdx = s.highlights.findIndex(h => normalize(h.text) === normLine);

  if (existingIdx !== -1) {
    s.highlights.splice(existingIdx, 1);
    el.classList.remove('lyric-line-marked');
    save();
    refreshHighlightsSection(songId, s);
    toast('Verso desmarcado', 'O verso foi removido dos seus favoritos.');
  } else {
    s.highlights.push({ text: lineText, date: new Date().toLocaleDateString('pt-BR') });
    el.classList.add('lyric-line-marked');
    save();
    refreshHighlightsSection(songId, s);
    toast('✦ Verso marcado!', `"${lineText.slice(0, 40)}${lineText.length > 40 ? '…' : ''}" salvo.`);
  }
}

function refreshHighlightsSection(songId, s) {
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

// ─── MODAIS DE MÚSICA ─────────────────────────────────────────
function openAddModal() {
  editingId = null;
  ['f-title', 'f-artist', 'f-album', 'f-year', 'f-notes', 'f-lyrics'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-genre').value    = '';
  document.getElementById('f-playlist').value = '';
  document.getElementById('api-search-input').value = '';
  document.getElementById('api-results').innerHTML = `
    <div class="api-hint">
      <div class="api-hint-icon">🔍</div>
      Digite o nome de uma música ou artista para buscar na biblioteca
    </div>`;
  document.getElementById('f-itunes-art').value = '';
  document.getElementById('f-cover-url').value  = '';
  const preview = document.getElementById('cover-preview');
  preview.style.display = 'none';
  preview.src = '';
  document.getElementById('cover-upload-zone').querySelector('.cover-upload-label').textContent = 'Clique ou arraste uma foto da capa';
  currentRating   = 0;
  selectedApiItem = null;
  updateStarPicker(0);
  updatePlaylistSelect();
  document.getElementById('modal-search-zone').style.display = '';
  document.getElementById('modal-divider').style.display     = '';
  document.getElementById('modal-add-title').textContent = 'Registrar Música';
  document.querySelector('#modal-add .modal-body').classList.remove('form-prefilled');
  openModal('modal-add');
  setTimeout(() => document.getElementById('api-search-input').focus(), 100);
}

function editSong(id) {
  const s = songs.find(x => x.id === id);
  if (!s) return;
  editingId = id;
  document.getElementById('f-title').value      = s.title;
  document.getElementById('f-artist').value     = s.artist;
  document.getElementById('f-album').value      = s.album  || '';
  document.getElementById('f-year').value       = s.year   || '';
  document.getElementById('f-genre').value      = s.genre  || '';
  document.getElementById('f-notes').value      = s.notes  || '';
  document.getElementById('f-lyrics').value     = s.lyrics || '';
  document.getElementById('f-itunes-art').value = s.itunesArt || '';
  document.getElementById('f-cover-url').value  = s.coverUrl  || '';
  const preview = document.getElementById('cover-preview');
  const artUrl  = s.coverUrl || s.itunesArt || '';
  if (artUrl) {
    preview.src = artUrl.replace('100x100bb', '300x300bb');
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
  currentRating = s.rating || 0;
  updateStarPicker(currentRating);
  updatePlaylistSelect(s.playlistId);
  document.getElementById('modal-search-zone').style.display = 'none';
  document.getElementById('modal-divider').style.display     = 'none';
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

function setRating(v)      { currentRating = v; updateStarPicker(v); }
function updateStarPicker(v) {
  document.querySelectorAll('.star-pick').forEach(el =>
    el.classList.toggle('on', +el.dataset.v <= v)
  );
}

function saveSong() {
  const title  = document.getElementById('f-title').value.trim();
  const artist = document.getElementById('f-artist').value.trim();
  if (!title || !artist) { toast('Atenção', 'Preencha ao menos título e artista.'); return; }

  const now  = new Date().toLocaleDateString('pt-BR');
  const data = {
    title, artist,
    album:      document.getElementById('f-album').value.trim(),
    year:       document.getElementById('f-year').value.trim(),
    genre:      document.getElementById('f-genre').value,
    notes:      document.getElementById('f-notes').value.trim(),
    rating:     currentRating,
    playlistId: document.getElementById('f-playlist').value,
    itunesArt:  document.getElementById('f-itunes-art').value || '',
    coverUrl:   document.getElementById('f-cover-url').value  || '',
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
  renderView('feed');
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

// ─── PLAYLISTS ────────────────────────────────────────────────
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
    document.getElementById('f-cover-url').value  = dataUrl;
    document.getElementById('f-itunes-art').value = '';
    const preview = document.getElementById('cover-preview');
    preview.src = dataUrl;
    preview.style.display = 'block';
    document.getElementById('cover-upload-zone').querySelector('.cover-upload-label').textContent = file.name;
  };
  reader.readAsDataURL(file);
}

// ─── ITUNES SEARCH API ────────────────────────────────────────
let selectedApiItem = null;
let apiSearchTimer  = null;

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
    const url  = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=8&country=BR`;
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
  document.querySelectorAll('.api-result-item').forEach((el, i) => {
    el.classList.toggle('selected', i === idx);
    el.innerHTML = el.innerHTML.replace(/<span class="api-result-check">.*?<\/span>/g, '');
  });
  const el = document.getElementById('api-item-' + idx);
  if (el) el.insertAdjacentHTML('beforeend', '<span class="api-result-check">✓</span>');

  selectedApiItem = track;
  document.getElementById('f-itunes-art').value = track.artworkUrl100 || '';

  const preview    = document.getElementById('cover-preview');
  const uploadZone = document.getElementById('cover-upload-zone');
  if (track.artworkUrl100) {
    const bigArt = track.artworkUrl100.replace('100x100bb', '300x300bb');
    preview.src = bigArt;
    preview.style.display = 'block';
    uploadZone.querySelector('.cover-upload-label').textContent = 'Arte obtida da biblioteca';
  }

  const year  = track.releaseDate ? track.releaseDate.slice(0, 4) : '';
  const genre = mapItunesGenre(track.primaryGenreName);

  document.getElementById('f-title').value  = track.trackName    || '';
  document.getElementById('f-artist').value = track.artistName   || '';
  document.getElementById('f-album').value  = track.collectionName || '';
  document.getElementById('f-year').value   = year;

  const genreSelect = document.getElementById('f-genre');
  for (const opt of genreSelect.options) {
    if (opt.value === genre) { genreSelect.value = genre; break; }
  }

  document.querySelector('#modal-add .modal-body').classList.add('form-prefilled');
  document.querySelector('#modal-add .modal-body').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}