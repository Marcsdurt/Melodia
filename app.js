// ─── SETTINGS ─────────────────────────────────────────────────
function renderSettings() {
  const isDark   = userProfile.darkMode !== false;
  const fontSize = userProfile.fontSize || 100;
  const avatar   = userProfile.avatar || '';
  const name     = userProfile.name   || '';

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
        <div class="settings-row-label" style="margin-bottom:14px;padding:0 20px">Tamanho do texto</div>
        <div class="settings-font-row">
          <span style="font-size:12px;color:var(--cream-dim)">A</span>
          <input type="range" id="font-slider" min="85" max="130" step="5" value="${fontSize}"
            oninput="applyFontSize(this.value)" class="settings-slider">
          <span style="font-size:20px;color:var(--cream-dim)">A</span>
        </div>
        <div style="text-align:center;font-size:12px;color:var(--cream-faint);margin-top:6px;padding-bottom:16px">${fontSize}% do tamanho original</div>
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
  document.documentElement.style.setProperty('--bg',          isDark ? '#0e0c09' : '#f5f0e8');
  document.documentElement.style.setProperty('--bg2',         isDark ? '#161410' : '#ede8de');
  document.documentElement.style.setProperty('--bg3',         isDark ? '#1e1b16' : '#e5e0d5');
  document.documentElement.style.setProperty('--surface',     isDark ? '#242018' : '#ddd8cc');
  document.documentElement.style.setProperty('--surface2',    isDark ? '#2c2820' : '#d5d0c4');
  document.documentElement.style.setProperty('--border',      isDark ? '#3a3428' : '#c0b8a8');
  document.documentElement.style.setProperty('--cream',       isDark ? '#f0e8d8' : '#1a160f');
  document.documentElement.style.setProperty('--cream-dim',   isDark ? 'rgba(240,232,216,0.55)' : 'rgba(26,22,15,0.6)');
  document.documentElement.style.setProperty('--cream-faint', isDark ? 'rgba(240,232,216,0.18)' : 'rgba(26,22,15,0.22)');
}

function applyFontSize(val) {
  userProfile.fontSize = parseInt(val);
  saveProfile();
  document.documentElement.style.fontSize = (val / 100 * 16) + 'px';
  const slider = document.getElementById('font-slider');
  if (slider) {
    const label = slider.parentElement.nextElementSibling;
    if (label) label.textContent = val + '% do tamanho original';
  }
}

function exportData() {
  const data = { songs, playlists, profile: { name: userProfile.name } };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `melodia-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
        songs     = data.songs;
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
    songs       = [];
    playlists   = [];
    userProfile = { name: '', avatar: '', darkMode: true, fontSize: 100 };
    save();
    saveProfile();
    applyTheme();
    applyFontSize(100);
    updateSidebarUser();
    renderView('feed');
navigate('feed');
    toast('Resetado', 'O Melodia foi reiniciado do zero.');
  }
}

// ─── INIT ─────────────────────────────────────────────────────
// Inject "+ Adicionar" button in topbar on desktop only
if (window.innerWidth >= 900) {
  const topbar = document.querySelector('.topbar');
  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.textContent = '+ Adicionar';
  btn.onclick = openAddModal;
  topbar.appendChild(btn);
}

applyTheme();
applyFontSize(userProfile.fontSize || 100);
updateSidebarUser();
renderView('feed');
navigate('feed');