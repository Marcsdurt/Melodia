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
  document.getElementById('f-preview-url').value = '';
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
    itunesArt:  document.getElementById('f-itunes-art').value  || '',
    coverUrl:   document.getElementById('f-cover-url').value   || '',
    previewUrl: document.getElementById('f-preview-url').value || '',
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

function editPlaylist(id) {
  const pl = playlists.find(p => p.id === id);
  if (!pl) return;

  const existing = document.getElementById('edit-playlist-prompt');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'edit-playlist-prompt';
  popup.className = 'playlist-prompt-overlay';
  popup.innerHTML = `
    <div class="playlist-prompt-box" style="padding-bottom:20px">
      <div class="playlist-prompt-title">Editar playlist</div>
      <div style="padding:0 20px;display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--cream-dim);display:block;margin-bottom:6px">Nome</label>
          <input id="ep-name" type="text" value="${pl.name.replace(/"/g,'&quot;')}"
            style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px;color:var(--cream);font-family:inherit;font-size:14px;outline:none;transition:border-color .2s"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"
            onkeydown="if(event.key==='Enter')confirmEditPlaylist('${id}')">
        </div>
        <div>
          <label style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--cream-dim);display:block;margin-bottom:6px">Descri\u00e7\u00e3o <span style="opacity:.5">(opcional)</span></label>
          <input id="ep-desc" type="text" value="${(pl.desc||'').replace(/"/g,'&quot;')}"
            style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px;color:var(--cream);font-family:inherit;font-size:14px;outline:none;transition:border-color .2s"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"
            onkeydown="if(event.key==='Enter')confirmEditPlaylist('${id}')">
        </div>
      </div>
      <div style="display:flex;gap:10px;padding:20px 20px 0">
        <button class="playlist-prompt-cancel" style="margin:0;flex:1" onclick="document.getElementById('edit-playlist-prompt').remove()">Cancelar</button>
        <button class="btn btn-primary" style="flex:1;justify-content:center;margin:0" onclick="confirmEditPlaylist('${id}')">Salvar</button>
      </div>
    </div>`;
  popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
  document.body.appendChild(popup);
  setTimeout(() => {
    const inp = document.getElementById('ep-name');
    if (inp) { inp.focus(); inp.select(); }
  }, 80);
}

function confirmEditPlaylist(id) {
  const pl = playlists.find(p => p.id === id);
  if (!pl) return;
  const name = document.getElementById('ep-name').value.trim();
  if (!name) { toast('Aten\u00e7\u00e3o', 'D\u00ea um nome \u00e0 playlist.'); return; }
  const desc = document.getElementById('ep-desc').value.trim();
  pl.name = name;
  pl.desc = desc;
  save();
  document.getElementById('edit-playlist-prompt')?.remove();
  toast('Atualizada!', `Playlist renomeada para "${name}".`);
  showPlaylist(id);
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
  document.getElementById('f-itunes-art').value     = track.artworkUrl100  || '';
  document.getElementById('f-preview-url').value    = track.previewUrl     || '';

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

  document.getElementById('f-title').value  = track.trackName     || '';
  document.getElementById('f-artist').value = track.artistName    || '';
  document.getElementById('f-album').value  = track.collectionName || '';
  document.getElementById('f-year').value   = year;

  const genreSelect = document.getElementById('f-genre');
  for (const opt of genreSelect.options) {
    if (opt.value === genre) { genreSelect.value = genre; break; }
  }

  // Mostra botão de prévia inline no item selecionado se houver previewUrl
  if (track.previewUrl && el) {
    const existingBtn = el.querySelector('.api-inline-preview');
    if (!existingBtn) {
      const previewBtn = document.createElement('button');
      previewBtn.className = 'api-inline-preview';
      previewBtn.title = 'Ouvir prévia de 30s';
      previewBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      previewBtn.onclick = (e) => {
        e.stopPropagation();
        _playApiPreview(track.previewUrl, track.trackName, track.artistName, track.artworkUrl100);
      };
      el.insertBefore(previewBtn, el.querySelector('.api-result-check'));
    }
  }

  document.querySelector('#modal-add .modal-body').classList.add('form-prefilled');
  document.querySelector('#modal-add .modal-body').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Prévia rápida direto da busca (antes de salvar)
function _playApiPreview(url, title, artist, artUrl) {
  // Cria uma song temporária fake só para o player
  const fakeSong = { id: '__api_preview__', title, artist, previewUrl: url,
    itunesArt: artUrl || '', genre: '' };
  // Injeta temporariamente no array (não salvo)
  const existing = songs.find(x => x.id === '__api_preview__');
  if (!existing) songs.push(fakeSong);
  else Object.assign(existing, fakeSong);
  playPreview('__api_preview__');
}

// ─── ARTISTAS ─────────────────────────────────────────────────
function openArtistModal(editId = null) {
  const art = editId ? artists.find(a => a.id === editId) : null;
  const existing = document.getElementById('artist-modal');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'artist-modal';
  popup.className = 'playlist-prompt-overlay';
  popup.innerHTML = `
    <div class="playlist-prompt-box" style="padding-bottom:20px;max-width:380px">
      <div class="playlist-prompt-title">${art ? 'Editar Artista' : 'Novo Artista'}</div>
      <div style="padding:0 20px;display:flex;flex-direction:column;gap:16px">

        <!-- Foto do artista -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
          <div id="artist-modal-img-wrap" style="width:80px;height:80px;border-radius:50%;overflow:hidden;border:2px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;background:var(--surface2);font-size:32px;flex-shrink:0;position:relative"
            onclick="document.getElementById('artist-img-input').click()">
            ${art && art.img
              ? `<img src="${art.img}" style="width:100%;height:100%;object-fit:cover">`
              : `<span id="artist-modal-img-placeholder">🎤</span>`}
            <div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;font-size:18px;opacity:0;transition:opacity .2s;border-radius:50%"
              onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">📷</div>
          </div>
          <input type="file" id="artist-img-input" accept="image/*" style="display:none" onchange="handleArtistImgUpload(event)">
          <span style="font-size:11px;color:var(--cream-faint)">Clique para adicionar foto</span>
        </div>

        <!-- Nome -->
        <div>
          <label style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--cream-dim);display:block;margin-bottom:6px">Nome *</label>
          <input id="artist-modal-name" type="text" value="${art ? art.name.replace(/"/g, '&quot;') : ''}"
            placeholder="Nome do artista ou banda"
            style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px;color:var(--cream);font-family:inherit;font-size:14px;outline:none;transition:border-color .2s"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"
            onkeydown="if(event.key==='Enter')confirmSaveArtist('${editId || ''}')">
        </div>
      </div>
      <div style="display:flex;gap:10px;padding:20px 20px 0">
        <button class="playlist-prompt-cancel" style="margin:0;flex:1" onclick="document.getElementById('artist-modal').remove()">Cancelar</button>
        <button class="btn btn-primary" style="flex:1;justify-content:center;margin:0" onclick="confirmSaveArtist('${editId || ''}')">Salvar</button>
      </div>
    </div>`;
  popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
  document.body.appendChild(popup);
  window._artistImgData = art && art.img ? art.img : null;
  setTimeout(() => { const inp = document.getElementById('artist-modal-name'); if (inp) { inp.focus(); if (art) inp.select(); } }, 80);
}

function handleArtistImgUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    window._artistImgData = e.target.result;
    const wrap = document.getElementById('artist-modal-img-wrap');
    if (wrap) wrap.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;font-size:18px;opacity:0;transition:opacity .2s;border-radius:50%"
        onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0" onclick="document.getElementById('artist-img-input').click()">📷</div>`;
  };
  reader.readAsDataURL(file);
}

function confirmSaveArtist(editId) {
  const name = (document.getElementById('artist-modal-name')?.value || '').trim();
  if (!name) { toast('Atenção', 'Dê um nome ao artista.'); return; }
  if (editId) {
    const a = artists.find(x => x.id === editId);
    if (!a) return;
    a.name = name;
    if (window._artistImgData !== undefined) {
      a.img = window._artistImgData;
      a.imgIsTemp = false; // usuário escolheu foto manualmente — não é mais temporária
    }
    save();
    document.getElementById('artist-modal')?.remove();
    toast('Atualizado!', `Artista "${name}" atualizado.`);
    showArtist(editId);
  } else {
    const newArtist = { id: 'a' + Date.now(), name, img: window._artistImgData || null };
    artists.push(newArtist);
    save();
    document.getElementById('artist-modal')?.remove();
    toast('Criado!', `Artista "${name}" cadastrado.`);
    renderLibrary();
  }
  window._artistImgData = null;
}

function showArtist(id) {
  const a = artists.find(x => x.id === id);
  if (!a) return;
  const list = songs.filter(s => s.artistId === id);
  const borderStyle = a.imgIsTemp ? 'border:2px dashed var(--gold);opacity:.85' : 'border:2px solid var(--border)';

  document.getElementById('detail-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:18px;margin-bottom:${a.imgIsTemp ? '12px' : '28px'}">
      <div style="position:relative;flex-shrink:0">
        <div style="width:72px;height:72px;border-radius:50%;overflow:hidden;${borderStyle};background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:30px;cursor:pointer"
          onclick="openArtistModal('${id}')" title="Editar foto">
          ${a.img ? `<img src="${a.img}" style="width:100%;height:100%;object-fit:cover">` : `🎤`}
        </div>
        ${a.imgIsTemp ? `
        <div style="position:absolute;bottom:-2px;right:-2px;width:20px;height:20px;border-radius:50%;background:var(--gold);border:2px solid var(--bg);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--bg)">⚠</div>` : ''}
      </div>
      <div style="flex:1;min-width:0">
        <div class="detail-title" style="font-size:20px;cursor:pointer" onclick="openArtistModal('${id}')" title="Editar nome">
          ${a.name}<span style="font-size:13px;color:var(--gold);margin-left:8px;opacity:0.7">✎</span>
        </div>
        <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-top:6px">${list.length} música${list.length !== 1 ? 's' : ''} associadas</div>
      </div>
      <button class="detail-icon-btn detail-icon-btn-danger" onclick="deleteArtist('${id}')" title="Excluir artista" style="align-self:flex-start">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>
    ${a.imgIsTemp ? `
    <div class="assoc-temp-img-notice" style="margin:0 0 20px">
      <span class="assoc-temp-notice-icon">⚠</span>
      <div>
        <strong>Foto provisória</strong> — a imagem atual é a capa do álbum, não uma foto real do artista.
        <span style="color:var(--gold);cursor:pointer" onclick="openArtistModal('${id}')"> Substituir agora →</span>
      </div>
    </div>` : ''}
    <div class="divider"></div>
    <div class="song-grid">${list.length
      ? list.map(songCardHTML).join('')
      : '<div class="empty" style="grid-column:1/-1"><div class="empty-title">Nenhuma música associada</div><div class="empty-sub">Abra o detalhe de uma música e toque em "Associar".</div></div>'}
    </div>`;
  previousView = 'library';
  navigate('detail');
}

function deleteArtist(id) {
  const a = artists.find(x => x.id === id);
  if (!a) return;
  const existing = document.getElementById('delete-prompt');
  if (existing) existing.remove();
  const popup = document.createElement('div');
  popup.id = 'delete-prompt';
  popup.className = 'playlist-prompt-overlay';
  popup.innerHTML = `
    <div class="playlist-prompt-box" style="padding-bottom:16px">
      <div class="playlist-prompt-title">Excluir artista</div>
      <div style="text-align:center;padding:6px 24px 20px;font-size:13px;color:var(--cream-dim);line-height:1.6">
        Tem certeza que quer excluir<br><strong style="color:var(--cream)">"${a.name}"</strong>?<br>
        <span style="font-size:11px;opacity:0.7">As músicas não serão removidas.</span>
      </div>
      <div style="display:flex;gap:10px;padding:0 16px">
        <button class="playlist-prompt-cancel" style="margin:0;flex:1" onclick="document.getElementById('delete-prompt').remove()">Cancelar</button>
        <button class="playlist-prompt-cancel" style="margin:0;flex:1;background:rgba(196,92,74,0.15);color:var(--red);border:1px solid rgba(196,92,74,0.3)" onclick="confirmDeleteArtist('${id}')">Excluir</button>
      </div>
    </div>`;
  popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
  document.body.appendChild(popup);
}

function confirmDeleteArtist(id) {
  const a = artists.find(x => x.id === id);
  document.getElementById('delete-prompt')?.remove();
  songs.forEach(s => { if (s.artistId === id) s.artistId = null; });
  artists = artists.filter(x => x.id !== id);
  save();
  toast('Excluído', `"${a?.name}" foi excluído.`);
  navigate('library');
}

// ─── SMART ARTIST ASSOCIATION ─────────────────────────────────

// Normaliza nome para comparação: minúsculas, sem acentos, sem pontuação extra
function normalizeArtistName(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Retorna artista já cadastrado com nome que bate, ou null
function findMatchingArtist(rawName) {
  const norm = normalizeArtistName(rawName);
  if (!norm) return null;
  return artists.find(a => normalizeArtistName(a.name) === norm) || null;
}

// Lê preferência de sugestão por nome normalizado
function getArtistPref(normName) {
  const prefs = JSON.parse(localStorage.getItem('melodia_artist_prefs') || '{}');
  return prefs[normName] || null; // 'always' | 'ask' | 'manual'
}

function saveArtistPref(normName, pref) {
  const prefs = JSON.parse(localStorage.getItem('melodia_artist_prefs') || '{}');
  prefs[normName] = pref;
  localStorage.setItem('melodia_artist_prefs', JSON.stringify(prefs));
}

// Fecha qualquer popup de associação aberto
function closeAssocPopup() {
  document.getElementById('artist-prompt')?.remove();
}

// ── Ponto de entrada principal ──
function associateArtistPrompt(songId) {
  const s = songs.find(x => x.id === songId);
  if (!s) return;
  closeAssocPopup();

  const rawName   = s.artist || '';
  const normName  = normalizeArtistName(rawName);
  const matched   = findMatchingArtist(rawName);
  const pref      = normName ? getArtistPref(normName) : null;
  const coverImg  = s.coverUrl || s.itunesArt || null;

  // Se já tem associação atual, e prefere sempre → confirma direto o matched
  if (matched && pref === 'always' && !s.artistId) {
    _showAssocSuggest(songId, matched, false);
    return;
  }

  // Se preferência = manual → vai direto pra lista
  if (pref === 'manual') {
    _showAssocManualList(songId, rawName);
    return;
  }

  // Fluxo padrão: analisa e apresenta sugestão
  if (matched) {
    // Artista já cadastrado encontrado
    _showAssocSuggest(songId, matched, pref !== 'always');
  } else if (rawName) {
    // Sugere criação temporária
    _showAssocSuggestNew(songId, rawName, coverImg);
  } else {
    // Sem metadado nenhum → lista manual
    _showAssocManualList(songId, rawName);
  }
}

// ── Tela A: artista cadastrado encontrado ──
function _showAssocSuggest(songId, artist, showPrefOption) {
  const s = songs.find(x => x.id === songId);
  const alreadyLinked = s.artistId === artist.id;

  const popup = document.createElement('div');
  popup.id = 'artist-prompt';
  popup.className = 'playlist-prompt-overlay';
  popup.innerHTML = `
    <div class="playlist-prompt-box assoc-box">
      <div class="assoc-header">
        <div class="assoc-badge">✦ Sugestão automática</div>
        <div class="assoc-title">Artista identificado</div>
      </div>

      <div class="assoc-artist-preview">
        <div class="assoc-artist-img">
          ${artist.img
            ? `<img src="${artist.img}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
            : `<span style="font-size:28px">🎤</span>`}
        </div>
        <div class="assoc-artist-info">
          <div class="assoc-artist-name">${artist.name}</div>
          <div class="assoc-artist-sub">
            ${songs.filter(x => x.artistId === artist.id).length} música${songs.filter(x => x.artistId === artist.id).length !== 1 ? 's' : ''} já associadas
          </div>
          ${alreadyLinked ? `<div class="assoc-already-tag">✓ Já associado a esta música</div>` : ''}
        </div>
      </div>

      <div class="assoc-actions">
        ${!alreadyLinked ? `
          <button class="assoc-btn-primary" onclick="_confirmAssignArtist('${songId}','${artist.id}')">
            Confirmar associação
          </button>` : `
          <button class="assoc-btn-danger" onclick="assignArtist('${songId}','')">
            Remover associação
          </button>`}
        <button class="assoc-btn-secondary" onclick="_showAssocManualList('${songId}','${(artist.name||'').replace(/'/g,"\\'")}')">
          Já tenho um cadastro diferente
        </button>
      </div>

      ${showPrefOption ? `
      <div class="assoc-pref-section">
        <div class="assoc-pref-label">Para músicas de <strong>${artist.name}</strong>, no futuro:</div>
        <div class="assoc-pref-opts">
          <label class="assoc-pref-opt">
            <input type="radio" name="assoc-pref" value="always"> Sugerir sempre automaticamente
          </label>
          <label class="assoc-pref-opt">
            <input type="radio" name="assoc-pref" value="ask" checked> Perguntar antes de sugerir
          </label>
          <label class="assoc-pref-opt">
            <input type="radio" name="assoc-pref" value="manual"> Abrir lista manual sempre
          </label>
        </div>
      </div>` : ''}

      <button class="playlist-prompt-cancel" style="margin-top:8px" onclick="closeAssocPopup()">Cancelar</button>
    </div>`;
  popup.addEventListener('click', e => { if (e.target === popup) closeAssocPopup(); });
  document.body.appendChild(popup);
}

// ── Tela B: sugestão de criação de novo artista ──
function _showAssocSuggestNew(songId, rawName, coverImg) {
  const s = songs.find(x => x.id === songId);
  const hasPreview = !!(s?.previewUrl);

  const popup = document.createElement('div');
  popup.id = 'artist-prompt';
  popup.className = 'playlist-prompt-overlay';
  popup.innerHTML = `
    <div class="playlist-prompt-box assoc-box">
      <div class="assoc-header">
        <div class="assoc-badge assoc-badge-new">✦ Sugestão — não cadastrado</div>
        <div class="assoc-title">Novo artista detectado</div>
      </div>

      <div class="assoc-artist-preview">
        <div class="assoc-artist-img-wrap">
          <div class="assoc-artist-img ${coverImg ? 'assoc-img-is-cover' : ''}"
            id="assoc-new-img-wrap" style="cursor:pointer"
            onclick="document.getElementById('assoc-new-img-input').click()" title="Trocar foto">
            ${coverImg
              ? `<img id="assoc-new-img" src="${coverImg}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
              : `<span style="font-size:28px">🎤</span>`}
            <div class="assoc-img-edit-overlay">📷</div>
          </div>
          ${coverImg ? `
          <div class="assoc-temp-img-badge" title="Esta é a capa do álbum, não uma foto do artista">
            <span class="assoc-temp-img-icon">⚠</span>
          </div>` : ''}
        </div>
        <input type="file" id="assoc-new-img-input" accept="image/*" style="display:none" onchange="_handleAssocNewImg(event)">
        <div class="assoc-artist-info" style="flex:1">
          <input id="assoc-new-name" class="assoc-name-input" value="${rawName.replace(/"/g,'&quot;')}" placeholder="Nome do artista"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'">
          <div class="assoc-artist-sub" style="margin-top:4px">Sugestão baseada nos metadados</div>
        </div>
      </div>

      ${coverImg ? `
      <div class="assoc-temp-img-notice">
        <span class="assoc-temp-notice-icon">⚠</span>
        <div>
          <strong>Foto temporária</strong> — esta é a capa do álbum, não uma foto real do artista.
          Toque na imagem para substituir por uma foto adequada.
        </div>
      </div>` : ''}

      <div class="assoc-actions">
        <button class="assoc-btn-primary" onclick="_confirmCreateAndAssign('${songId}')">
          Criar artista e associar
        </button>
        <button class="assoc-btn-secondary" onclick="_showAssocManualList('${songId}','${rawName.replace(/'/g,"\\'")}')">
          Já tenho um cadastro para este artista
        </button>
      </div>

      <button class="playlist-prompt-cancel" style="margin-top:8px" onclick="closeAssocPopup()">Cancelar</button>
    </div>`;
  popup.addEventListener('click', e => { if (e.target === popup) closeAssocPopup(); });
  document.body.appendChild(popup);
  window._assocNewImgData = coverImg || null;
  window._assocNewImgIsTemp = !!coverImg; // marca que é imagem temporária
}

function _handleAssocNewImg(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    window._assocNewImgData   = e.target.result;
    window._assocNewImgIsTemp = false; // usuário escolheu foto real — não é mais temporária
    const wrap = document.getElementById('assoc-new-img-wrap');
    if (wrap) {
      const existing = wrap.querySelector('img,span');
      if (existing) existing.remove();
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%';
      wrap.insertBefore(img, wrap.querySelector('.assoc-img-edit-overlay'));
      wrap.classList.remove('assoc-img-is-cover');
    }
    // Remove badge e aviso de imagem temporária
    document.querySelector('.assoc-temp-img-badge')?.remove();
    document.querySelector('.assoc-temp-img-notice')?.remove();
  };
  reader.readAsDataURL(file);
}

function _confirmCreateAndAssign(songId) {
  const nameEl = document.getElementById('assoc-new-name');
  const name = (nameEl?.value || '').trim();
  if (!name) { toast('Atenção', 'Informe o nome do artista.'); return; }

  // Verificação final de duplicata antes de criar
  const dupe = findMatchingArtist(name);
  if (dupe) {
    // Já existe — pergunta se quer usar o existente
    closeAssocPopup();
    setTimeout(() => _showAssocSuggest(songId, dupe, true), 50);
    return;
  }

  const newArtist = { id: 'a' + Date.now(), name, img: window._assocNewImgData || null, imgIsTemp: !!(window._assocNewImgIsTemp) };
  artists.push(newArtist);
  window._assocNewImgData   = null;
  window._assocNewImgIsTemp = false;

  const s = songs.find(x => x.id === songId);
  if (s) s.artistId = newArtist.id;
  save();
  closeAssocPopup();
  toast('✦ Criado e associado!', `"${name}" foi cadastrado e vinculado à música.`);
  openDetail(songId);
}

// ── Tela C: lista manual de artistas ──
function _showAssocManualList(songId, originalRawName) {
  closeAssocPopup();
  const s = songs.find(x => x.id === songId);

  if (artists.length === 0) {
    // Nenhum artista cadastrado ainda
    const popup = document.createElement('div');
    popup.id = 'artist-prompt';
    popup.className = 'playlist-prompt-overlay';
    popup.innerHTML = `
      <div class="playlist-prompt-box assoc-box">
        <div class="assoc-header">
          <div class="assoc-title">Selecionar artista</div>
        </div>
        <div style="text-align:center;padding:24px 20px;color:var(--cream-dim);font-size:13px;line-height:1.6">
          Nenhum artista cadastrado ainda.<br>Crie um artista na Biblioteca primeiro.
        </div>
        <div class="assoc-actions">
          <button class="assoc-btn-primary" onclick="closeAssocPopup();navigate('library')">Ir para Biblioteca</button>
        </div>
        <button class="playlist-prompt-cancel" style="margin-top:8px" onclick="closeAssocPopup()">Cancelar</button>
      </div>`;
    popup.addEventListener('click', e => { if (e.target === popup) closeAssocPopup(); });
    document.body.appendChild(popup);
    return;
  }

  const normOriginal = normalizeArtistName(originalRawName);

  const popup = document.createElement('div');
  popup.id = 'artist-prompt';
  popup.className = 'playlist-prompt-overlay';
  popup.innerHTML = `
    <div class="playlist-prompt-box assoc-box">
      <div class="assoc-header">
        <div class="assoc-title">Selecionar artista</div>
        <div class="assoc-sub">Escolha quem representa esta música na sua biblioteca</div>
      </div>

      <div class="assoc-manual-search-wrap">
        <input id="assoc-manual-search" class="assoc-manual-search" placeholder="Filtrar artistas…"
          oninput="_filterAssocList('${songId}')"
          onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'">
      </div>

      <div class="playlist-prompt-list" id="assoc-manual-list" style="max-height:260px">
        ${_buildManualListItems(songId, '', normOriginal)}
      </div>

      ${s?.artistId ? `
        <div style="padding:0 16px">
          <button class="assoc-btn-danger" style="width:100%;margin-top:0" onclick="assignArtist('${songId}','')">
            ✕ Remover associação atual
          </button>
        </div>` : ''}

      <div class="assoc-pref-section" id="assoc-manual-pref-section" style="display:none">
        <div class="assoc-pref-label">Guardar preferência para músicas de <strong>${originalRawName}</strong>:</div>
        <div class="assoc-pref-opts">
          <label class="assoc-pref-opt">
            <input type="radio" name="assoc-manual-pref" value="always"> Sugerir sempre o artista escolhido
          </label>
          <label class="assoc-pref-opt">
            <input type="radio" name="assoc-manual-pref" value="ask" checked> Perguntar antes de sugerir
          </label>
          <label class="assoc-pref-opt">
            <input type="radio" name="assoc-manual-pref" value="manual"> Abrir sempre esta lista
          </label>
        </div>
      </div>

      <button class="playlist-prompt-cancel" style="margin-top:8px" onclick="closeAssocPopup()">Cancelar</button>
    </div>`;
  popup.addEventListener('click', e => { if (e.target === popup) closeAssocPopup(); });
  document.body.appendChild(popup);
  setTimeout(() => document.getElementById('assoc-manual-search')?.focus(), 80);
}

function _buildManualListItems(songId, filter, normOriginal) {
  const s = songs.find(x => x.id === songId);
  const norm = normalizeArtistName(filter);
  let list = filter
    ? artists.filter(a => normalizeArtistName(a.name).includes(norm))
    : [...artists];

  // Ordena: artista com nome mais próximo ao original primeiro
  list.sort((a, b) => {
    const na = normalizeArtistName(a.name);
    const nb = normalizeArtistName(b.name);
    const matchA = normOriginal && na === normOriginal ? -1 : 0;
    const matchB = normOriginal && nb === normOriginal ? -1 : 0;
    return matchA - matchB;
  });

  if (list.length === 0) {
    return `<div style="text-align:center;padding:20px;color:var(--cream-faint);font-size:13px">Nenhum artista encontrado</div>`;
  }

  return list.map(a => {
    const active = s?.artistId === a.id;
    const isClosestMatch = normOriginal && normalizeArtistName(a.name) === normOriginal;
    return `<div class="playlist-prompt-item${active ? ' active' : ''}${isClosestMatch ? ' assoc-closest' : ''}"
      onclick="_selectManualArtist('${songId}','${a.id}','${(a.name||'').replace(/'/g,"\\'")}')">
      <span class="playlist-prompt-emoji">
        ${a.img ? `<img src="${a.img}" style="width:22px;height:22px;border-radius:50%;object-fit:cover">` : '🎤'}
      </span>
      <span class="playlist-prompt-name">${a.name}</span>
      ${isClosestMatch && !active ? `<span style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);opacity:.8">mais próximo</span>` : ''}
      ${active ? '<span class="playlist-prompt-check">✓</span>' : ''}
    </div>`;
  }).join('');
}

function _filterAssocList(songId) {
  const filter = document.getElementById('assoc-manual-search')?.value || '';
  const list = document.getElementById('assoc-manual-list');
  if (list) list.innerHTML = _buildManualListItems(songId, filter, '');
}

// Seleção manual: mostra preferências antes de confirmar (se rawName existir)
function _selectManualArtist(songId, artistId, artistName) {
  const s = songs.find(x => x.id === songId);
  if (!s) return;

  // Mostra seção de preferências
  const prefSection = document.getElementById('assoc-manual-pref-section');
  if (prefSection) prefSection.style.display = '';

  // Marca visualmente a seleção
  document.querySelectorAll('#assoc-manual-list .playlist-prompt-item').forEach(el => {
    el.classList.remove('active');
    el.querySelector('.playlist-prompt-check')?.remove();
  });

  // Substitui o clique do item selecionado por confirmação imediata
  // e guarda a escolha pendente
  window._assocPendingSongId   = songId;
  window._assocPendingArtistId = artistId;

  // Atualiza o item marcado visualmente
  const list = document.getElementById('assoc-manual-list');
  const items = list?.querySelectorAll('.playlist-prompt-item');
  items?.forEach(el => {
    if (el.textContent.trim().startsWith(artistName) || el.querySelector('span.playlist-prompt-name')?.textContent === artistName) {
      el.classList.add('active');
      if (!el.querySelector('.playlist-prompt-check')) {
        const chk = document.createElement('span');
        chk.className = 'playlist-prompt-check';
        chk.textContent = '✓';
        el.appendChild(chk);
      }
    }
  });

  // Substitui botão cancelar por "Confirmar"
  let confirmBtn = document.getElementById('assoc-confirm-manual-btn');
  if (!confirmBtn) {
    confirmBtn = document.createElement('button');
    confirmBtn.id = 'assoc-confirm-manual-btn';
    confirmBtn.className = 'assoc-btn-primary';
    confirmBtn.style.cssText = 'margin:0 16px 8px;width:calc(100% - 32px)';
    confirmBtn.textContent = 'Confirmar associação';
    confirmBtn.onclick = _confirmManualAssign;
    const cancelBtn = document.querySelector('#artist-prompt .playlist-prompt-cancel');
    cancelBtn?.parentNode?.insertBefore(confirmBtn, cancelBtn);
  }
}

function _confirmManualAssign() {
  const songId   = window._assocPendingSongId;
  const artistId = window._assocPendingArtistId;
  if (!songId || !artistId) return;

  const s = songs.find(x => x.id === songId);
  const a = artists.find(x => x.id === artistId);
  if (!s || !a) return;

  // Salva preferência selecionada
  const prefVal = document.querySelector('input[name="assoc-manual-pref"]:checked')?.value;
  if (prefVal && s.artist) {
    const norm = normalizeArtistName(s.artist);
    if (norm) saveArtistPref(norm, prefVal);
  }

  s.artistId = artistId;
  save();
  closeAssocPopup();
  window._assocPendingSongId   = null;
  window._assocPendingArtistId = null;
  toast('✦ Associado!', `"${s.title}" vinculado a "${a.name}".`);
  openDetail(songId);
}

// ── Confirmação direta (tela A — artista encontrado) ──
function _confirmAssignArtist(songId, artistId) {
  const s = songs.find(x => x.id === songId);
  const a = artists.find(x => x.id === artistId);
  if (!s || !a) return;

  // Salva preferência se selecionada
  const prefVal = document.querySelector('input[name="assoc-pref"]:checked')?.value;
  if (prefVal && s.artist) {
    const norm = normalizeArtistName(s.artist);
    if (norm) saveArtistPref(norm, prefVal);
  }

  s.artistId = artistId;
  save();
  closeAssocPopup();
  toast('✦ Associado!', `"${s.title}" vinculado a "${a.name}".`);
  openDetail(songId);
}

// ── Assign direto (usado para remover associação) ──
function assignArtist(songId, artistId) {
  const s = songs.find(x => x.id === songId);
  if (!s) return;
  s.artistId = artistId || null;
  save();
  closeAssocPopup();
  const a = artists.find(x => x.id === artistId);
  toast('Artista', a ? `Associado a "${a.name}"` : 'Associação removida');
  openDetail(songId);
}


// ─── PREVIEW DE REPRODUÇÃO ────────────────────────────────────
// Estado global do player
window._previewAudio    = null;
window._previewSongId   = null;
window._previewTimer    = null;
window._previewDuration = 30; // segundos de prévia

function _getPreviewBar() {
  let bar = document.getElementById('preview-player-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'preview-player-bar';
    bar.className = 'preview-bar';
    bar.innerHTML = `
      <div class="preview-bar-art" id="preview-bar-art"></div>
      <div class="preview-bar-info">
        <div class="preview-bar-title" id="preview-bar-title"></div>
        <div class="preview-bar-artist" id="preview-bar-artist"></div>
      </div>
      <div class="preview-bar-controls">
        <div class="preview-bar-progress-wrap">
          <div class="preview-bar-progress" id="preview-bar-progress"></div>
        </div>
        <div class="preview-bar-time" id="preview-bar-time">0:30</div>
      </div>
      <button class="preview-bar-play" id="preview-bar-play" onclick="togglePreview()">
        <svg id="preview-icon-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <svg id="preview-icon-pause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      </button>
      <button class="preview-bar-close" onclick="stopPreview()" title="Fechar">×</button>`;
    document.body.appendChild(bar);
  }
  return bar;
}

function playPreview(songId) {
  const s = songs.find(x => x.id === songId);
  if (!s || !s.previewUrl) {
    toast('Sem prévia', 'Esta música não tem URL de prévia disponível.');
    return;
  }

  // Se já tocando a mesma música, alterna play/pause
  if (window._previewSongId === songId && window._previewAudio) {
    togglePreview();
    return;
  }

  // Para qualquer prévia em andamento
  stopPreview(false);

  const audio = new Audio(s.previewUrl);
  audio.volume = 0.85;
  window._previewAudio  = audio;
  window._previewSongId = songId;

  // Monta a barra
  const bar = _getPreviewBar();
  const artUrl = s.coverUrl || (s.itunesArt ? s.itunesArt.replace('100x100bb','60x60bb') : null);
  document.getElementById('preview-bar-art').innerHTML = artUrl
    ? `<img src="${artUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:4px">`
    : `<span style="font-size:18px">${genreEmoji(s.genre)}</span>`;
  document.getElementById('preview-bar-title').textContent  = s.title;
  document.getElementById('preview-bar-artist').textContent = s.artist;
  document.getElementById('preview-bar-progress').style.width = '0%';
  document.getElementById('preview-bar-time').textContent = '0:30';
  _setPreviewPlayState(true);
  bar.classList.add('visible');

  // Marca botão no detalhe como ativo
  _updateDetailPreviewBtn(songId, true);

  audio.addEventListener('timeupdate', () => {
    const elapsed = audio.currentTime;
    const dur     = audio.duration || window._previewDuration;
    const pct     = Math.min((elapsed / dur) * 100, 100);
    const remain  = Math.max(Math.ceil(dur - elapsed), 0);
    const progressEl = document.getElementById('preview-bar-progress');
    const timeEl     = document.getElementById('preview-bar-time');
    if (progressEl) progressEl.style.width = pct + '%';
    if (timeEl) timeEl.textContent = '0:' + String(remain).padStart(2, '0');
  });

  audio.addEventListener('ended', () => stopPreview());
  audio.addEventListener('error', () => {
    stopPreview();
    toast('Erro', 'Não foi possível carregar a prévia.');
  });

  audio.play().catch(() => {
    stopPreview();
    toast('Bloqueado', 'O navegador bloqueou o áudio. Tente novamente.');
  });
}

function togglePreview() {
  const audio = window._previewAudio;
  if (!audio) return;
  if (audio.paused) {
    audio.play();
    _setPreviewPlayState(true);
    _updateDetailPreviewBtn(window._previewSongId, true);
  } else {
    audio.pause();
    _setPreviewPlayState(false);
    _updateDetailPreviewBtn(window._previewSongId, false);
  }
}

function stopPreview(removeBar = true) {
  if (window._previewAudio) {
    window._previewAudio.pause();
    window._previewAudio.src = '';
    window._previewAudio = null;
  }
  clearTimeout(window._previewTimer);
  _updateDetailPreviewBtn(window._previewSongId, false, true);
  window._previewSongId = null;
  if (removeBar) {
    const bar = document.getElementById('preview-player-bar');
    if (bar) bar.classList.remove('visible');
  }
}

function _setPreviewPlayState(playing) {
  const playIcon  = document.getElementById('preview-icon-play');
  const pauseIcon = document.getElementById('preview-icon-pause');
  const btn       = document.getElementById('preview-bar-play');
  if (!playIcon || !pauseIcon) return;
  playIcon.style.display  = playing ? 'none' : '';
  pauseIcon.style.display = playing ? '' : 'none';
  if (btn) btn.setAttribute('aria-label', playing ? 'Pausar' : 'Reproduzir');
}

// Atualiza o botão no detalhe da música
function _updateDetailPreviewBtn(songId, playing, stopped = false) {
  const btn = document.getElementById('detail-preview-btn');
  if (!btn || !songId) return;
  const s = songs.find(x => x.id === songId);
  if (stopped) {
    btn.innerHTML = _previewBtnInner('play');
    btn.classList.remove('preview-btn-active');
  } else if (playing) {
    btn.innerHTML = _previewBtnInner('pause');
    btn.classList.add('preview-btn-active');
  } else {
    btn.innerHTML = _previewBtnInner('play');
    btn.classList.remove('preview-btn-active');
  }
}

function _previewBtnInner(state) {
  if (state === 'pause') {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span>Pausar</span>`;
  }
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Prévia</span>`;
}


// ─── BUSCA SILENCIOSA DE PREVIEW ──────────────────────────────
// Cache de IDs já tentados nesta sessão, para não refazer buscas
window._previewFetchAttempted = window._previewFetchAttempted || new Set();

async function _fetchAndStorePreview(songId) {
  // Não tenta mais de uma vez por sessão para o mesmo ID
  if (window._previewFetchAttempted.has(songId)) return;
  window._previewFetchAttempted.add(songId);

  const s = songs.find(x => x.id === songId);
  if (!s || s.previewUrl) return; // já tem ou sumiu

  const query = [s.title, s.artist].filter(Boolean).join(' ');
  if (!query.trim()) {
    _setPreviewBtnUnavailable(songId);
    return;
  }

  try {
    const url  = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=5&country=BR`;
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      _setPreviewBtnUnavailable(songId);
      return;
    }

    // Tenta encontrar a melhor correspondência por título e artista normalizados
    const normTitle  = _normPreview(s.title);
    const normArtist = _normPreview(s.artist);

    let best = null;
    let bestScore = -1;

    data.results.forEach(t => {
      if (!t.previewUrl) return;
      const tTitle  = _normPreview(t.trackName  || '');
      const tArtist = _normPreview(t.artistName || '');
      let score = 0;
      if (tTitle  === normTitle)  score += 2;
      else if (tTitle.includes(normTitle) || normTitle.includes(tTitle)) score += 1;
      if (tArtist === normArtist) score += 2;
      else if (tArtist.includes(normArtist) || normArtist.includes(tArtist)) score += 1;
      if (score > bestScore) { bestScore = score; best = t; }
    });

    // Exige ao menos correspondência parcial em título OU artista
    if (!best || bestScore < 1) {
      _setPreviewBtnUnavailable(songId);
      return;
    }

    // Salva a URL encontrada persistentemente
    s.previewUrl = best.previewUrl;
    // Aproveita para atualizar arte do iTunes se a música não tiver
    if (!s.itunesArt && best.artworkUrl100) s.itunesArt = best.artworkUrl100;
    save();

    // Atualiza o botão na tela sem re-renderizar tudo
    _setPreviewBtnReady(songId);

  } catch {
    _setPreviewBtnUnavailable(songId);
  }
}

function _normPreview(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function _setPreviewBtnReady(songId) {
  const btn = document.getElementById('detail-preview-btn');
  // Só atualiza se ainda estamos no detalhe desta música
  if (!btn) return;
  btn.disabled = false;
  btn.classList.remove('detail-preview-loading');
  btn.setAttribute('onclick', `playPreview('${songId}')`);
  btn.setAttribute('title', 'Ouvir prévia de 30s');
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    <span>Prévia</span>`;
}

function _setPreviewBtnUnavailable(songId) {
  const btn = document.getElementById('detail-preview-btn');
  if (!btn) return;
  // Remove o botão discretamente — não há prévia disponível
  btn.style.opacity = '0';
  btn.style.pointerEvents = 'none';
  setTimeout(() => btn?.remove(), 300);
}
