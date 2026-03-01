// ─── Y2K WEBCORE MODE ──────────────────────────────────────────
// Adicione este arquivo ao index.html APÓS app.js

function applyY2KMode() {
  const isY2K = userProfile.y2kMode === true;
  document.body.classList.toggle('y2k', isY2K);
}

function toggleY2KMode() {
  userProfile.y2kMode = !userProfile.y2kMode;
  saveProfile();
  applyY2KMode();

  // Se ativar Y2K, desativa dark mode (Y2K é sempre claro)
  if (userProfile.y2kMode) {
    userProfile.darkMode = false;
    saveProfile();
    applyTheme();
  }

  const tog = document.getElementById('toggle-y2k');
  if (tog) tog.classList.toggle('on', userProfile.y2kMode);
  toast(
    userProfile.y2kMode ? '🌐 Y2K Ativado!' : '🌙 Y2K Desativado',
    userProfile.y2kMode ? 'Bem-vindo à internet de 2001 ✨' : 'Voltando ao tema moderno'
  );
}

// Aplica na inicialização
applyY2KMode();
