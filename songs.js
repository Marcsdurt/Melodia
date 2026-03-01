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

  const existing = document.getElementById('delete-prompt');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'delete-prompt';
  popup.className = 'playlist-prompt-overlay';
  popup.innerHTML = `
    <div class="playlist-prompt-box" style="padding-bottom:16px">
      <div class="playlist-prompt-title">Remover música</div>
      <div style="text-align:center;padding:6px 24px 20px;font-size:13px;color:var(--cream-dim);line-height:1.6">
        Tem certeza que quer remover<br><strong style="color:var(--cream)">"${s.title}"</strong> do seu diário?
      </div>
      <div style="display:flex;gap:10px;padding:0 16px">
        <button class="playlist-prompt-cancel" style="margin:0;flex:1" onclick="document.getElementById('delete-prompt').remove()">Cancelar</button>
        <button class="playlist-prompt-cancel" style="margin:0;flex:1;background:rgba(196,92,74,0.15);color:var(--red);border:1px solid rgba(196,92,74,0.3)" onclick="confirmDeleteSong('${id}')">Remover</button>
      </div>
    </div>`;
  popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
  document.body.appendChild(popup);
}

function confirmDeleteSong(id) {
  const s = songs.find(x => x.id === id);
  if (!s) return;
  document.getElementById('delete-prompt')?.remove();
  songs = songs.filter(x => x.id !== id);
  save();
  toast('Removido', `"${s.title}" foi removido.`);
  navigate(previousView);
}

function addToPlaylistPrompt(id) {
  const s = songs.find(x => x.id === id);
  if (!s) return;

  if (playlists.length === 0) {
    toast('Sem playlists', 'Crie uma playlist primeiro na Biblioteca.');
    return;
  }

  // Criar popup inline
  const existing = document.getElementById('playlist-prompt');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'playlist-prompt';
  popup.className = 'playlist-prompt-overlay';
  popup.innerHTML = `
    <div class="playlist-prompt-box">
      <div class="playlist-prompt-title">Adicionar à playlist</div>
      <div class="playlist-prompt-list">
        ${playlists.map(p => {
          const active = s.playlistId === p.id;
          return `<div class="playlist-prompt-item${active ? ' active' : ''}" onclick="assignPlaylist('${id}','${p.id}')">
            <span class="playlist-prompt-emoji">${p.emoji||'🎵'}</span>
            <span class="playlist-prompt-name">${p.name}</span>
            ${active ? '<span class="playlist-prompt-check">✓</span>' : ''}
          </div>`;
        }).join('')}
        ${s.playlistId ? `<div class="playlist-prompt-item playlist-prompt-remove" onclick="assignPlaylist('${id}','')">
          <span class="playlist-prompt-emoji">✕</span>
          <span class="playlist-prompt-name">Remover da playlist</span>
        </div>` : ''}
      </div>
      <button class="playlist-prompt-cancel" onclick="document.getElementById('playlist-prompt').remove()">Cancelar</button>
    </div>`;
  popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
  document.body.appendChild(popup);
}

function editPlaylistImg() {
  document.getElementById('playlist-img-edit-input').click();
}

function handlePlaylistImgEdit(id, event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const pl = playlists.find(p => p.id === id);
    if (!pl) return;
    pl.img = e.target.result;
    save();
    showPlaylist(id); // re-render com nova imagem
  };
  reader.readAsDataURL(file);
}

function deletePlaylist(id) {
  const pl = playlists.find(p => p.id === id);
  if (!pl) return;

  const existing = document.getElementById('delete-prompt');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'delete-prompt';
  popup.className = 'playlist-prompt-overlay';
  popup.innerHTML = `
    <div class="playlist-prompt-box" style="padding-bottom:16px">
      <div class="playlist-prompt-title">Excluir playlist</div>
      <div style="text-align:center;padding:6px 24px 20px;font-size:13px;color:var(--cream-dim);line-height:1.6">
        Tem certeza que quer excluir<br><strong style="color:var(--cream)">"${pl.name}"</strong>?<br>
        <span style="font-size:11px;opacity:0.7">As músicas não serão removidas.</span>
      </div>
      <div style="display:flex;gap:10px;padding:0 16px">
        <button class="playlist-prompt-cancel" style="margin:0;flex:1" onclick="document.getElementById('delete-prompt').remove()">Cancelar</button>
        <button class="playlist-prompt-cancel" style="margin:0;flex:1;background:rgba(196,92,74,0.15);color:var(--red);border:1px solid rgba(196,92,74,0.3)" onclick="confirmDeletePlaylist('${id}')">Excluir</button>
      </div>
    </div>`;
  popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
  document.body.appendChild(popup);
}

function confirmDeletePlaylist(id) {
  const pl = playlists.find(p => p.id === id);
  document.getElementById('delete-prompt')?.remove();
  // Desvincula músicas da playlist
  songs.forEach(s => { if (s.playlistId === id) s.playlistId = null; });
  playlists = playlists.filter(p => p.id !== id);
  save();
  toast('Excluída', `"${pl?.name}" foi excluída.`);
  navigate('library');
}

function assignPlaylist(songId, playlistId) {
  const s = songs.find(x => x.id === songId);
  if (!s) return;
  s.playlistId = playlistId || null;
  save();
  document.getElementById('playlist-prompt')?.remove();
  const pl = playlists.find(p => p.id === playlistId);
  toast('Playlist', pl ? `Adicionado a "${pl.name}"` : 'Removido da playlist');
  openDetail(songId); // re-render detail
}



// ─── PLAYLISTS ────────────────────────────────────────────────
function openPlaylistModal() {
  document.getElementById('p-name').value = '';
  document.getElementById('p-desc').value = '';
  // Reset image preview
  const preview = document.getElementById('p-img-preview');
  const placeholder = document.getElementById('p-img-placeholder');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  if (placeholder) placeholder.style.display = '';
  window._playlistImgData = null;
  openModal('modal-playlist');
  setTimeout(() => document.getElementById('p-name').focus(), 100);
}

function handlePlaylistImg(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    window._playlistImgData = e.target.result;
    const preview = document.getElementById('p-img-preview');
    const placeholder = document.getElementById('p-img-placeholder');
    preview.src = e.target.result;
    preview.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function savePlaylist() {
  const name = document.getElementById('p-name').value.trim();
  if (!name) { toast('Atenção', 'Dê um nome à sua playlist.'); return; }
  playlists.push({
    id:    'p' + Date.now(),
    name,
    img:   window._playlistImgData || null,
    desc:  document.getElementById('p-desc').value.trim()
  });
  window._playlistImgData = null;
  save();
  closeModal('modal-playlist');
  toast('Criada!', `Playlist "${name}" criada.`);
  renderLibrary();
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
  if (!g) return '';
  const gl = g.toLowerCase();
  if (gl.includes('hip-hop') || gl.includes('hip hop') || gl.includes('rap')) {
    if (gl.includes('alternative')) return 'Alternative Hip Hop';
    if (gl.includes('conscious'))   return 'Conscious Rap';
    if (gl.includes('trap'))        return 'Trap';
    return 'Hip Hop';
  }
  if (gl.includes('r&b') || gl.includes('rhythm')) {
    if (gl.includes('contemporary')) return 'Contemporary R&B';
    return 'R&B';
  }
  if (gl.includes('soul'))   return 'Soul';
  if (gl.includes('funk'))   return 'Funk';
  if (gl.includes('disco'))  return 'Disco';
  if (gl.includes('electronic') || gl.includes('electronica') || gl.includes('dance')) {
    if (gl.includes('ambient'))   return 'Ambient';
    if (gl.includes('house'))     return 'House';
    if (gl.includes('techno'))    return 'Techno';
    if (gl.includes('trance'))    return 'Trance';
    if (gl.includes('drum'))      return 'Drum and Bass';
    if (gl.includes('dubstep'))   return 'Dubstep';
    if (gl.includes('synth'))     return 'Synthwave';
    return 'Electronic';
  }
  if (gl.includes('classical') || gl.includes('clássica')) {
    if (gl.includes('baroque'))      return 'Baroque';
    if (gl.includes('romantic'))     return 'Romantic';
    if (gl.includes('orchestral'))   return 'Orchestral';
    if (gl.includes('contemporary')) return 'Contemporary Classical';
    return 'Classical';
  }
  if (gl.includes('jazz')) {
    if (gl.includes('smooth'))  return 'Smooth Jazz';
    if (gl.includes('fusion'))  return 'Jazz Fusion';
    if (gl.includes('bebop'))   return 'Bebop';
    if (gl.includes('swing'))   return 'Swing';
    return 'Jazz';
  }
  if (gl.includes('blues')) {
    if (gl.includes('rock'))    return 'Blues Rock';
    if (gl.includes('chicago')) return 'Chicago Blues';
    if (gl.includes('delta'))   return 'Delta Blues';
    return 'Blues';
  }
  if (gl.includes('metal')) {
    if (gl.includes('heavy'))       return 'Heavy Metal';
    if (gl.includes('thrash'))      return 'Thrash Metal';
    if (gl.includes('death'))       return 'Death Metal';
    if (gl.includes('black'))       return 'Black Metal';
    if (gl.includes('core'))        return 'Metalcore';
    if (gl.includes('doom'))        return 'Doom Metal';
    if (gl.includes('progressive')) return 'Progressive Metal';
    if (gl.includes('nu'))          return 'Nu Metal';
    return 'Metal';
  }
  if (gl.includes('rock')) {
    if (gl.includes('alternative')) return 'Alternative Rock';
    if (gl.includes('indie'))       return 'Indie Rock';
    if (gl.includes('hard'))        return 'Hard Rock';
    if (gl.includes('punk'))        return 'Punk Rock';
    if (gl.includes('progressive')) return 'Progressive Rock';
    if (gl.includes('post'))        return 'Post-Rock';
    if (gl.includes('grunge'))      return 'Grunge';
    if (gl.includes('garage'))      return 'Garage Rock';
    if (gl.includes('folk'))        return 'Folk Rock';
    if (gl.includes('country'))     return 'Country Rock';
    return 'Rock';
  }
  if (gl.includes('pop')) {
    if (gl.includes('indie'))    return 'Indie Pop';
    if (gl.includes('synth'))    return 'Synthpop';
    if (gl.includes('electro'))  return 'Electropop';
    if (gl.includes('dream'))    return 'Dream Pop';
    if (gl.includes('dance'))    return 'Dance Pop';
    if (gl.includes('k-pop') || gl.includes('korean')) return 'K-Pop';
    if (gl.includes('latin'))    return 'Latin Pop';
    if (gl.includes('country'))  return 'Country Pop';
    if (gl.includes('art'))      return 'Art Pop';
    return 'Pop';
  }
  if (gl.includes('country')) {
    if (gl.includes('bluegrass')) return 'Bluegrass';
    if (gl.includes('outlaw'))    return 'Outlaw Country';
    return 'Country';
  }
  if (gl.includes('folk') || gl.includes('singer')) {
    if (gl.includes('indie'))  return 'Indie Folk';
    if (gl.includes('americana')) return 'Americana';
    return 'Folk';
  }
  if (gl.includes('punk')) return 'Punk';
  if (gl.includes('reggaeton'))            return 'Reggaeton';
  if (gl.includes('latin') || gl.includes('salsa') || gl.includes('bachata') || gl.includes('cumbia')) return 'Latin';
  if (gl.includes('samba'))                return 'Samba';
  if (gl.includes('bossa'))                return 'Bossa Nova';
  if (gl.includes('reggae'))               return 'Reggae';
  if (gl.includes('gospel') || gl.includes('christian')) return 'Gospel';
  if (gl.includes('world') || gl.includes('brazilian') || gl.includes('afro')) return 'World Music';
  if (gl.includes('ambient'))              return 'Ambient';
  if (gl.includes('experimental'))         return 'Experimental';
  return '';
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