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

  document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
  const bnEl = document.querySelector(`[data-bnview="${view}"]`);
  if (bnEl) bnEl.classList.add('active');

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  currentView = view;

  const titles = {
    feed: 'Feed', diary: 'Diário', search: 'Buscar',
    library: 'Biblioteca', profile: 'Perfil',
    settings: 'Configurações', detail: ''
  };
  document.getElementById('topbar-title').textContent = titles[view] || '';

  renderView(view);
}

function backFromDetail() { navigate(previousView); }

// ─── RENDER GERAL ─────────────────────────────────────────────
function renderView(v) {
  updateStats();
  updateBadges();
  if (v === 'feed')     renderFeed();
  if (v === 'diary')    renderDiary();
  if (v === 'search')   renderSearch();
  if (v === 'library')  renderLibrary();
  if (v === 'profile')  renderProfile();
  if (v === 'settings') renderSettings();
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
  const rated = songs.filter(s => s.rating > 0);
  const avg   = rated.length ? (rated.reduce((a, s) => a + s.rating, 0) / rated.length).toFixed(1) : null;
  const noted = songs.filter(s => s.notes).length;

  const cards = [
    {
      value: songs.length,
      label: 'Músicas',
      emptyIcon: '♪',
      emptyCta: 'Adicionar música',
      emptyAction: 'openAddModal()',
    },
    {
      value: playlists.length,
      label: 'Playlists',
      emptyIcon: '⊞',
      emptyCta: 'Criar playlist',
      emptyAction: "navigate('playlists');openPlaylistModal()",
    },
    {
      value: noted,
      label: 'Anotações',
      emptyIcon: '✎',
      emptyCta: 'Escrever nota',
      emptyAction: 'openAddModal()',
    },
    {
      value: avg,
      label: 'Nota Média',
      emptyIcon: '★',
      emptyCta: 'Avaliar música',
      emptyAction: 'openAddModal()',
    },
  ];

  const row = document.getElementById('stats-row');
  if (!row) return;

  row.innerHTML = cards.map(c => {
    if (c.value === null || c.value === 0) {
      return `<div class="stat-card stat-card-empty" onclick="${c.emptyAction}">
        <div class="stat-empty-icon">${c.emptyIcon}</div>
        <div class="stat-empty-cta">${c.emptyCta}</div>
      </div>`;
    }
    return `<div class="stat-card">
      <div class="stat-num">${c.value}</div>
      <div class="stat-label">${c.label}</div>
    </div>`;
  }).join('');

  // keep legacy IDs working for other code that may read them
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('stat-total',     songs.length);
  setEl('stat-playlists', playlists.length);
  setEl('stat-notes',     noted);
  setEl('stat-avg',       avg || '—');
}

function updateBadges() {
  const el = document.getElementById('badge-songs');
  if (el) el.textContent = songs.length;
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

// ─── HELPERS DE TEMPO ────────────────────────────────────────
function relativeTime(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  const diff = Math.floor((Date.now() - d) / 86400000);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff < 7)  return `há ${diff} dias`;
  if (diff < 30) return `há ${Math.floor(diff/7)} sem.`;
  if (diff < 365) return `há ${Math.floor(diff/30)} meses`;
  return `há ${Math.floor(diff/365)} ano${Math.floor(diff/365) > 1 ? 's' : ''}`;
}

// ─── FEED ─────────────────────────────────────────────────────
function buildFeedEvents(songList) {
  // Each song generates 1-3 events based on its data
  const events = [];
  songList.forEach(s => {
    // Always: "ouviu" event
    events.push({ type: 'listened', song: s, date: s.date });
    // If rated: "avaliou" event
    if (s.rating > 0) events.push({ type: 'rated', song: s, date: s.date });
    // If notes: "anotou" event
    if (s.notes) events.push({ type: 'noted', song: s, date: s.date });
  });
  // Sort: most recent first (stable, since all same day = insertion order)
  return events.reverse();
}

function feedEventHTML(ev, isLast) {
  const s = ev.song;
  const art = s.coverUrl || s.itunesArt || null;
  const artEl = art
    ? `<img src="${art.replace('100x100bb','80x80bb')}" alt="">`
    : `<div class="feed-event-art-placeholder">${genreEmoji(s.genre)}</div>`;

  const typeMap = {
    listened: { icon: '🎧', action: `Ouviu`,                      highlight: false },
    rated:    { icon: '⭐', action: `Avaliou com ${s.rating}★`,   highlight: s.rating >= 4 },
    noted:    { icon: '✎',  action: `Anotou sobre`,               highlight: false },
  };
  const t = typeMap[ev.type];

  return `
    <div class="feed-event${t.highlight ? ' feed-event-highlight' : ''}">
      <div class="feed-event-left">
        <div class="feed-event-icon">${t.icon}</div>
        ${!isLast ? '<div class="feed-event-thread"></div>' : ''}
      </div>
      <div class="feed-event-art" onclick="openDetail('${s.id}')">${artEl}</div>
      <div class="feed-event-body" onclick="openDetail('${s.id}')">
        <div class="feed-event-action">${t.action} <span class="feed-event-name">${s.title}</span></div>
        <div class="feed-event-artist">${s.artist}</div>
        ${ev.type === 'noted' && s.notes
          ? `<div class="feed-event-note">"${s.notes.slice(0,70)}${s.notes.length>70?'…':''}"</div>`
          : ''}
      </div>
      <div class="feed-event-time">${relativeTime(s.date)}</div>
    </div>`;
}

function renderFeed() {
  const c = document.getElementById('feed-container');
  if (!c) return;

  if (songs.length === 0) {
    c.innerHTML = `
      <div class="feed-empty">
        <div class="feed-empty-icon">◈</div>
        <div class="feed-empty-title">Seu feed está esperando</div>
        <div class="feed-empty-sub">Registre sua primeira música para começar sua história musical.</div>
        <button class="btn btn-primary" style="margin-top:20px" onclick="openAddModal()">+ Registrar música</button>
      </div>`;
    return;
  }

  const recent = [...songs].reverse().slice(0, 15);
  const events = buildFeedEvents(recent);

  // Group events by relative day
  const groups = {};
  events.forEach(ev => {
    const key = relativeTime(ev.date) || 'há algum tempo';
    if (!groups[key]) groups[key] = [];
    groups[key].push(ev);
  });

  let html = '';
  let dayIndex = 0;
  Object.entries(groups).forEach(([day, evs]) => {
    const isAlt = dayIndex % 2 === 1;
    html += `<div class="feed-day-group${isAlt ? ' feed-day-alt' : ''}">`;
    html += `<div class="feed-day-label">${day}</div>`;
    evs.forEach((ev, i) => { html += feedEventHTML(ev, i === evs.length - 1); });
    html += `</div>`;
    dayIndex++;
  });

  c.innerHTML = html;
}

// ─── DIÁRIO ───────────────────────────────────────────────────
function renderDiary(filter) {
  const c = document.getElementById('diary-container');
  if (!c) return;
  let list = filter
    ? songs.filter(s => s.title.toLowerCase().includes(filter) || s.artist.toLowerCase().includes(filter) || (s.album||'').toLowerCase().includes(filter))
    : songs;
  list = [...list].reverse();

  if (list.length === 0) {
    c.innerHTML = `<div class="empty"><div class="empty-icon">✎</div><div class="empty-title">${filter ? 'Nenhum resultado' : 'Diário vazio'}</div><div class="empty-sub">${filter ? 'Tente outro termo.' : 'Seus registros aparecerão aqui em ordem cronológica.'}</div></div>`;
    return;
  }

  const groups = {};
  list.forEach(s => {
    let key = 'Sem data';
    if (s.date) {
      const parts = s.date.split('/');
      if (parts.length === 3) {
        const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        key = `${months[+parts[1]-1]} ${parts[2]}`;
      }
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });

  let html = '';
  Object.entries(groups).forEach(([month, items]) => {
    html += `<div class="diary-month-label">${month}</div>`;
    items.forEach(s => {
      html += `
        <div class="diary-row" onclick="openDetail('${s.id}')">
          <div class="diary-row-date">${s.date ? s.date.slice(0,5) : '—'}</div>
          <div class="diary-row-line"></div>
          <div class="diary-row-body">
            <div class="diary-row-title">${s.title}</div>
            <div class="diary-row-artist"><span class="diary-row-artist-text">${s.artist}${s.album ? ` · ${s.album}` : ''}</span>${s.genre ? `<span class="diary-row-genre">· ${s.genre}</span>` : ''}</div>
            ${s.notes ? `<div class="diary-row-note">${s.notes}</div>` : ''}
          </div>
          <div class="diary-row-right">
            ${s.rating ? `<span class="diary-row-rating">${starsHTML(s.rating)}</span>` : ''}
          </div>
        </div>`;
    });
  });
  c.innerHTML = html;
}

// ─── BUSCAR ───────────────────────────────────────────────────
function renderSearch(filter) {
  const c = document.getElementById('search-container');
  if (!c) return;
  if (!filter) {
    const all = [...songs].reverse();
    c.innerHTML = `<div class="search-local-wrap">
      <div class="search-local-hint">Pesquise no seu diário ou use o campo acima para buscar na biblioteca</div>
      ${all.length === 0
        ? `<div class="empty" style="margin-top:32px"><div class="empty-icon">⌕</div><div class="empty-title">Nenhuma música ainda</div><div class="empty-sub">Adicione músicas pelo botão central.</div></div>`
        : `<div class="song-grid">${all.map(songCardHTML).join('')}</div>`}
    </div>`;
    return;
  }
  let list = songs.filter(s =>
    s.title.toLowerCase().includes(filter) ||
    s.artist.toLowerCase().includes(filter) ||
    (s.album||'').toLowerCase().includes(filter));
  c.innerHTML = list.length === 0
    ? `<div class="empty"><div class="empty-icon">⌕</div><div class="empty-title">Nenhum resultado</div><div class="empty-sub">Tente outro termo.</div></div>`
    : `<div class="song-grid">${[...list].reverse().map(songCardHTML).join('')}</div>`;
}

// ─── BIBLIOTECA ───────────────────────────────────────────────
function renderLibrary() {
  const c = document.getElementById('library-container');
  if (!c) return;
  const favs  = songs.filter(s => s.rating >= 4);
  const noted = songs.filter(s => s.notes);
  let html = '';

  // Playlists — mais recente à esquerda
  const sortedPlaylists = [...playlists].reverse();
  const PLAYLIST_PREVIEW = 6; // quantas mostrar no carrossel antes de "ver todas"
  const showAll = window._libraryShowAllPlaylists || false;

  html += `
    <div class="section-head">
      <div class="section-title">Minhas <em>playlists</em></div>
      <div style="display:flex;gap:14px;align-items:center">
        ${playlists.length > 0 ? `<button class="playlist-see-all-btn" onclick="toggleLibraryPlaylists()">${showAll ? 'Recolher' : 'Ver todas'}</button>` : ''}
        <button class="btn btn-ghost" style="font-size:11px;padding:5px 11px" onclick="openPlaylistModal()">+ Nova</button>
      </div>
    </div>`;

  if (playlists.length === 0) {
    html += `<div class="library-empty-section" onclick="openPlaylistModal()"><span>⊞</span> Criar primeira playlist</div>`;
  } else if (showAll) {
    // Grade expandida — todas as playlists
    html += `<div class="playlist-grid playlist-grid-expanded" style="margin-bottom:32px">` +
      sortedPlaylists.map(p => {
        const count = songs.filter(s => s.playlistId === p.id).length;
        return `<div class="playlist-card" onclick="showPlaylist('${p.id}')">
          <div class="playlist-emoji">${p.emoji||'🎵'}</div>
          <div class="playlist-name">${p.name}</div>
          <div class="playlist-desc">${p.desc||'Sem descrição.'}</div>
          <div class="playlist-count">${count} música${count!==1?'s':''}</div>
        </div>`;
      }).join('') + `</div>`;
  } else {
    // Carrossel horizontal — mais recentes à esquerda
    html += `<div class="playlist-carousel" id="playlist-carousel" style="margin-bottom:32px">` +
      sortedPlaylists.map(p => {
        const count = songs.filter(s => s.playlistId === p.id).length;
        return `<div class="playlist-card" onclick="showPlaylist('${p.id}')">
          <div class="playlist-emoji">${p.emoji||'🎵'}</div>
          <div class="playlist-name">${p.name}</div>
          <div class="playlist-desc">${p.desc||'Sem descrição.'}</div>
          <div class="playlist-count">${count} música${count!==1?'s':''}</div>
        </div>`;
      }).join('') + `</div>`;
  }

  html += `<div class="section-head"><div class="section-title">★ <em>Favoritas</em></div><span style="font-size:11px;color:var(--cream-faint)">${favs.length} músicas</span></div>`;
  if (favs.length === 0) {
    html += `<div class="library-empty-section"><span>★</span> Músicas com 4+ estrelas aparecem aqui</div>`;
  } else {
    html += `<div class="song-grid" style="margin-bottom:32px">${[...favs].reverse().slice(0,4).map(songCardHTML).join('')}</div>`;
    if (favs.length > 4) html += `<div style="text-align:center;margin-top:-18px;margin-bottom:32px"><span class="section-link" onclick="navigate('diary')">${favs.length - 4} mais no Diário →</span></div>`;
  }

  html += `<div class="section-head"><div class="section-title">✎ <em>Anotações</em></div><span style="font-size:11px;color:var(--cream-faint)">${noted.length} músicas</span></div>`;
  if (noted.length === 0) {
    html += `<div class="library-empty-section"><span>✎</span> Músicas com anotações pessoais aparecem aqui</div>`;
  } else {
    [...noted].reverse().slice(0,3).forEach(s => {
      html += `<div style="margin-bottom:16px;cursor:pointer" onclick="openDetail('${s.id}')"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:600">${s.title}</div><div style="font-size:12px;color:var(--cream-dim)">— ${s.artist}</div></div><div class="note-box"><div class="note-text">${s.notes}</div></div></div>`;
    });
  }
  c.innerHTML = html;
  setTimeout(initCarouselDrag, 0);
}

// ─── PERFIL ───────────────────────────────────────────────────
function renderProfile() {
  const c = document.getElementById('profile-container');
  if (!c) return;
  const avatar = userProfile.avatar || '';
  const name   = userProfile.name   || '';
  const rated  = songs.filter(s => s.rating > 0);
  const avg    = rated.length ? (rated.reduce((a,s)=>a+s.rating,0)/rated.length).toFixed(1) : null;
  const artistCount = {};
  songs.forEach(s => { if(s.artist) artistCount[s.artist]=(artistCount[s.artist]||0)+1; });
  const topArtist = Object.entries(artistCount).sort((a,b)=>b[1]-a[1])[0];
  const genreCount = {};
  songs.forEach(s => { if(s.genre) genreCount[s.genre]=(genreCount[s.genre]||0)+1; });
  const topGenre = Object.entries(genreCount).sort((a,b)=>b[1]-a[1])[0];
  const topSong = songs.filter(s=>s.rating>0).sort((a,b)=>b.rating-a.rating)[0];
  const pinned = songs.filter(s => s.rating === 5).slice(0,3);
  const recent = [...songs].reverse().slice(0,3);

  let html = `
    <div class="profile-identity">
      <div class="profile-avatar-wrap" onclick="navigate('settings')">
        ${avatar ? `<img src="${avatar}" class="profile-avatar-img">` : `<div class="profile-avatar-placeholder">${name ? name[0].toUpperCase() : '♪'}</div>`}
        <div class="profile-avatar-edit">✎</div>
      </div>
      <div class="profile-identity-info">
        <div class="profile-name">${name || 'Seu Nome'}</div>
        <div class="profile-bio">${songs.length} músicas registradas${avg ? ` · média ${avg}★` : ''}</div>
      </div>
      <button class="btn btn-ghost" style="font-size:10px;padding:6px 10px;margin-left:auto;align-self:flex-start" onclick="navigate('settings')">⚙</button>
    </div>`;

  if (topArtist || topGenre || topSong) {
    html += `<div class="section-head"><div class="section-title">Momento <em>atual</em></div></div><div class="profile-moments">`;
    if (topSong) html += `<div class="profile-moment-card"><div class="profile-moment-icon">🔁</div><div class="profile-moment-val">${topSong.title}</div><div class="profile-moment-key">música favorita</div></div>`;
    if (topArtist) html += `<div class="profile-moment-card"><div class="profile-moment-icon">🎤</div><div class="profile-moment-val">${topArtist[0]}</div><div class="profile-moment-key">artista da fase</div></div>`;
    if (topGenre) html += `<div class="profile-moment-card"><div class="profile-moment-icon">${genreEmoji(topGenre[0])}</div><div class="profile-moment-val">${topGenre[0]}</div><div class="profile-moment-key">gênero dominante</div></div>`;
    html += `</div>`;
  }

  if (pinned.length > 0) {
    html += `<div class="section-head" style="margin-top:8px"><div class="section-title">⭐ <em>Destaques</em></div></div><div class="song-grid" style="margin-bottom:28px">${pinned.map(songCardHTML).join('')}</div>`;
  }

  if (recent.length > 0) {
    html += `<div class="section-head"><div class="section-title">Atividade <em>recente</em></div><span class="section-link" onclick="navigate('diary')">Ver diário →</span></div><div class="feed-timeline">`;
    recent.forEach(s => {
      const art = s.coverUrl || s.itunesArt || null;
      html += `<div class="feed-item" onclick="openDetail('${s.id}')"><div class="feed-item-art">${art ? `<img src="${art.replace('100x100bb','80x80bb')}" alt="">` : `<div class="feed-item-art-placeholder">${genreEmoji(s.genre)}</div>`}</div><div class="feed-item-info"><div class="feed-item-title">${s.title}</div><div class="feed-item-artist">${s.artist}</div></div><div class="feed-item-right">${s.rating ? `<div class="feed-item-rating">${s.rating}★</div>` : ''}<div class="feed-item-time">${relativeTime(s.date)}</div></div></div>`;
    });
    html += `</div>`;
  }

  if (songs.length === 0) {
    html += `<div class="empty" style="margin-top:32px"><div class="empty-icon">♪</div><div class="empty-title">Perfil em branco</div><div class="empty-sub">Registre músicas para seu perfil ganhar vida.</div><button class="btn btn-primary" style="margin-top:20px" onclick="openAddModal()">+ Registrar música</button></div>`;
  }

  c.innerHTML = html;
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
    <div class="song-grid">${list.length ? list.map(songCardHTML).join('') : '<div class="empty" style="grid-column:1/-1"><div class="empty-title">Playlist vazia</div><div class="empty-sub">Ao adicionar músicas, selecione esta playlist.</div></div>'}</div>`;
  previousView = 'library';
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
          ${s.genre   ? `<span class="tag gold">${s.genre}</span>` : ''}
          ${s.year    ? `<span class="tag">${s.year}</span>` : ''}
          ${s.playlistId ? `<span class="tag">${playlists.find(p => p.id === s.playlistId)?.name || ''}</span>` : ''}
        </div>
        <div class="detail-stars">${starsHTML(s.rating, 'detail-star')}</div>
        <div class="detail-actions">
          <button class="detail-icon-btn" onclick="editSong('${s.id}')" title="Editar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <span>Editar</span>
          </button>
          <button class="detail-icon-btn" onclick="openShareModal('${s.id}')" title="Compartilhar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            <span>Compartilhar</span>
          </button>
          <button class="detail-icon-btn" onclick="addToPlaylistPrompt('${s.id}')" title="Adicionar à playlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/><circle cx="19" cy="19" r="3" fill="var(--bg2)" stroke="currentColor"/><line x1="19" y1="17.5" x2="19" y2="20.5"/><line x1="17.5" y1="19" x2="20.5" y2="19"/></svg>
            <span>Playlist</span>
          </button>
          <button class="detail-icon-btn detail-icon-btn-danger" onclick="deleteSong('${s.id}')" title="Remover">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            <span>Remover</span>
          </button>
        </div>
      </div>
    </div>
    ${s.notes ? `
      <div class="section-title" style="margin-bottom:14px">Anotações <em>pessoais</em></div>
      <div class="note-box">
        <div class="note-text">${s.notes}</div>
        <div class="note-date">Adicionado em ${s.date || '—'}</div>
      </div>` : ''}
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
            </div>`).join('')}
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


function handleSearch() {
  const q = document.getElementById('search-input').value.toLowerCase().trim();
  if (currentView === 'diary') { renderDiary(q || null); return; }
  if (currentView !== 'search') navigate('search');
  renderSearch(q || null);
}

function setSongView(m) {
  songViewMode = m;
  renderDiary();
}

function toast(title, msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-msg').textContent   = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close modal on backdrop click
document.querySelectorAll('.modal-backdrop').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); });
});