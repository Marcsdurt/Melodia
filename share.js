// ─── COMPARTILHAR / STORIE ────────────────────────────────────
let shareSongId        = null;
let shareTheme         = 'dark';
let shareSelectedVerses = new Set();
let shareShowUser      = false;

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

  const versesSection = document.getElementById('share-verses-section');
  const versesList    = document.getElementById('share-verses-list');
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

  document.querySelectorAll('.share-theme-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-theme="dark"]').classList.add('active');
  shareTheme = 'dark';

  const userSection = document.getElementById('share-user-section');
  const hasProfile  = userProfile.name || userProfile.avatar;
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

function downloadStorie() {
  const canvas = document.getElementById('share-canvas');
  const link   = document.createElement('a');
  const s      = songs.find(x => x.id === shareSongId);
  link.download = `melodia-${(s?.title || 'musica').toLowerCase().replace(/\s+/g, '-')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  toast('Imagem salva!', 'Abra a galeria e poste no seu Stories 📱');
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
    img.onload  = () => resolve(img);
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

function drawAutoText(ctx, text, x, y, maxW, baseFont, startSize, minSize, maxLines, align = 'center', lineH_ratio = 1.3) {
  let size = startSize;
  const makeFont = (s) => baseFont.replace(/\d+px/, `${s}px`);

  ctx.font = makeFont(size);
  let lines = wrapText(ctx, text, maxW, size);
  while (lines.length > maxLines && size > minSize) {
    size -= 2;
    ctx.font = makeFont(size);
    lines = wrapText(ctx, text, maxW, size);
  }

  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
    lines[maxLines - 1] = last + '…';
  }

  const lineH  = size * lineH_ratio;
  const totalH = lines.length * lineH;

  ctx.font = makeFont(size);
  ctx.textAlign    = align;
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
  const ctx    = canvas.getContext('2d');
  const W = 1080, H = 1920;
  const T   = SHARE_THEMES[shareTheme];
  const PAD = 88;

  ctx.clearRect(0, 0, W, H);

  const INNER_W = W - PAD * 2;

  // ── BACKGROUND ──
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0,   T.bg2);
  bgGrad.addColorStop(0.4, T.bg);
  bgGrad.addColorStop(0.8, T.bg2);
  bgGrad.addColorStop(1,   T.bg);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Noise texture
  ctx.save();
  ctx.globalAlpha = 0.018;
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = shareTheme === 'light' ? '#000' : '#fff';
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
  }
  ctx.restore();

  // Vignette
  ctx.save();
  const vigGrad = ctx.createRadialGradient(W/2, H*0.4, 0, W/2, H*0.4, W);
  vigGrad.addColorStop(0, 'transparent');
  vigGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // ── ZONE SIZING ──
  const verses = [...shareSelectedVerses]
    .sort((a, b) => a - b)
    .map(i => s.highlights[i]?.text)
    .filter(Boolean);
  const hasVerses = verses.length > 0;
  const hasUser   = shareShowUser && (userProfile.name || userProfile.avatar);

  const COVER_SIZE   = 560;
  const INFO_TOP_PAD = 64;
  const FOOTER_H     = hasUser ? 190 : 0;

  // ── TOP BAR ──
  const topBarY = 80;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.font         = 'italic 300 46px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle    = T.accent;
  ctx.globalAlpha  = 0.45;
  ctx.textAlign    = 'left';
  ctx.fillText('Melodia.', PAD, topBarY);

  ctx.font        = '300 26px "Nunito Sans", Arial, sans-serif';
  ctx.fillStyle   = T.textDim;
  ctx.globalAlpha = 0.4;
  ctx.textAlign   = 'right';
  ctx.fillText(s.date || new Date().toLocaleDateString('pt-BR'), W - PAD, topBarY);
  ctx.restore();

  // Top accent line
  ctx.save();
  const topLineGrad = ctx.createLinearGradient(0, 0, W, 0);
  topLineGrad.addColorStop(0,    'transparent');
  topLineGrad.addColorStop(0.15, T.accent  + '88');
  topLineGrad.addColorStop(0.85, T.accent2 + '88');
  topLineGrad.addColorStop(1,    'transparent');
  ctx.strokeStyle = topLineGrad;
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.moveTo(0, topBarY + 18); ctx.lineTo(W, topBarY + 18); ctx.stroke();
  ctx.restore();

  // ─────────────────────────────────────────────────────────────
  // PASS 1 — measure all info-block heights (no drawing yet)
  // ─────────────────────────────────────────────────────────────
  ctx.font = '700 108px "Cormorant Garamond", Georgia, serif';
  let _titleLines = wrapText(ctx, s.title, INNER_W, 108);
  let _titleSize  = 108;
  while (_titleLines.length > 2 && _titleSize > 64) {
    _titleSize -= 2;
    ctx.font = `700 ${_titleSize}px "Cormorant Garamond", Georgia, serif`;
    _titleLines = wrapText(ctx, s.title, INNER_W, _titleSize);
  }
  const MEAS_TITLE = _titleLines.length * _titleSize * 1.15;

  ctx.font = '300 46px "Nunito Sans", Arial, sans-serif';
  const _artistLines = wrapText(ctx, s.artist, INNER_W, 46);
  const MEAS_ARTIST  = Math.min(_artistLines.length, 2) * 46 * 1.3;

  let MEAS_ALBUM = 0;
  if (s.album) {
    ctx.font = 'italic 300 36px "Cormorant Garamond", Georgia, serif';
    const _albumLines = wrapText(ctx, s.album, INNER_W * 0.85, 36);
    MEAS_ALBUM = Math.min(_albumLines.length, 2) * 36 * 1.3 + 32;
  } else {
    MEAS_ALBUM = 16;
  }

  ctx.font = '600 24px "Nunito Sans", Arial, sans-serif';
  const _tags = [];
  if (s.genre) _tags.push(s.genre.toUpperCase());
  if (s.year)  _tags.push(String(s.year));
  const MEAS_TAGS    = _tags.length > 0 ? 50 + 30 : 0;
  const MEAS_STARS   = 52 + 44;
  const MEAS_DIVIDER = hasVerses ? 1.2 + 48 : 0;

  const VERSE_FONT_SIZE = 50;
  const VERSE_FONT      = `italic 300 ${VERSE_FONT_SIZE}px "Cormorant Garamond", Georgia, serif`;
  const VERSE_MAX_W     = INNER_W - 80;
  const VERSE_LINE_H    = VERSE_FONT_SIZE * 1.4;
  const VERSE_SEP_H     = 40;

  let verseBlocks = [];
  let MEAS_VERSES = 0;
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
    MEAS_VERSES += 60;
  }

  const TOP_LINE_Y  = topBarY + 18;
  const CONTENT_TOP = TOP_LINE_Y + 30;
  const FOOTER_LINE = hasUser ? H - FOOTER_H : H - 22;

  const INFO_BLOCK_H = MEAS_TITLE + 28
                     + MEAS_ARTIST + 10
                     + MEAS_ALBUM
                     + MEAS_TAGS
                     + MEAS_STARS
                     + MEAS_DIVIDER
                     + MEAS_VERSES;
  const TOTAL_H = COVER_SIZE + INFO_TOP_PAD + INFO_BLOCK_H;
  const ZONE_H  = FOOTER_LINE - CONTENT_TOP;
  const offsetY = Math.max(0, Math.round((ZONE_H - TOTAL_H) / 2));

  // ─────────────────────────────────────────────────────────────
  // PASS 2 — draw with computed offset
  // ─────────────────────────────────────────────────────────────

  // ── COVER ART ──
  const coverY = CONTENT_TOP + offsetY;
  const coverX = (W - COVER_SIZE) / 2;
  const coverR = 32;

  ctx.save();
  const glowGrad = ctx.createRadialGradient(W/2, coverY + COVER_SIZE/2, 0, W/2, coverY + COVER_SIZE/2, COVER_SIZE * 0.75);
  glowGrad.addColorStop(0, T.accent + '22');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, coverY - 60, W, COVER_SIZE + 120);
  ctx.restore();

  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur    = 60;
  ctx.shadowOffsetY = 20;
  roundRect(ctx, coverX, coverY, COVER_SIZE, COVER_SIZE, coverR);
  ctx.fillStyle = T.bg;
  ctx.fill();
  ctx.restore();

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
    ctx.font         = `${COVER_SIZE * 0.35}px Arial`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(genreEmoji(s.genre), W/2, coverY + COVER_SIZE/2);
  }

  roundRect(ctx, coverX, coverY, COVER_SIZE, COVER_SIZE, coverR);
  ctx.restore();
  ctx.save();
  roundRect(ctx, coverX, coverY, COVER_SIZE, COVER_SIZE, coverR);
  ctx.strokeStyle = T.accent + '28';
  ctx.lineWidth   = 2;
  ctx.stroke();
  ctx.restore();

  // ── INFO SECTION ──
  let cur = coverY + COVER_SIZE + INFO_TOP_PAD;

  ctx.save();
  ctx.fillStyle   = T.text;
  ctx.globalAlpha = 1;
  const { totalH: titleH } = drawAutoText(
    ctx, s.title, W / 2, cur, INNER_W,
    '700 108px "Cormorant Garamond", Georgia, serif',
    108, 64, 2, 'center', 1.15
  );
  cur += titleH + 28;
  ctx.restore();

  ctx.save();
  ctx.fillStyle   = T.textDim;
  ctx.globalAlpha = 0.85;
  const { totalH: artistH } = drawAutoText(
    ctx, s.artist, W / 2, cur, INNER_W,
    '300 46px "Nunito Sans", Arial, sans-serif',
    46, 30, 2, 'center', 1.3
  );
  cur += artistH + 10;
  ctx.restore();

  if (s.album) {
    ctx.save();
    ctx.fillStyle   = T.textDim;
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
      ctx.fillStyle   = T.accent;
      ctx.globalAlpha = 0.62;
      ctx.textAlign   = 'left';
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
    ctx.font         = `${STAR_SIZE}px Arial`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.globalAlpha  = i <= s.rating ? 0.92 : 0.15;
    ctx.fillStyle    = i <= s.rating ? T.accent : T.textDim;
    ctx.fillText('★', sx, cur);
    ctx.restore();
    sx += STAR_SIZE + STAR_GAP;
  }
  cur += STAR_SIZE + 44;

  // Divider
  if (hasVerses) {
    ctx.save();
    const divGrad = ctx.createLinearGradient(0, 0, W, 0);
    divGrad.addColorStop(0,    'transparent');
    divGrad.addColorStop(0.12, T.border);
    divGrad.addColorStop(0.5,  T.accent + '55');
    divGrad.addColorStop(0.88, T.border);
    divGrad.addColorStop(1,    'transparent');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth   = 1.2;
    ctx.beginPath(); ctx.moveTo(PAD, cur); ctx.lineTo(W - PAD, cur); ctx.stroke();
    ctx.restore();
    cur += 48;
  }

  // Verses
  if (hasVerses) {
    const VERSE_ZONE_BOT = FOOTER_LINE - (hasUser ? 20 : 0);
    const VERSE_AVAIL    = VERSE_ZONE_BOT - cur;
    let vy = cur + Math.max(0, (VERSE_AVAIL - MEAS_VERSES + 60) / 2);

    const VERSE_BLOCK_W = INNER_W - 80;
    const VERSE_COL_X   = (W - VERSE_BLOCK_W) / 2;
    const BAR_W = 3, BAR_GAP = 22;
    const TEXT_X = VERSE_COL_X + BAR_W + BAR_GAP;

    ctx.save();
    ctx.font         = `italic 200px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle    = T.accent;
    ctx.globalAlpha  = 0.10;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('"', VERSE_COL_X - 6, vy - 40);
    ctx.restore();

    ctx.save();
    ctx.font         = VERSE_FONT;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';

    verseBlocks.forEach((lines, vi) => {
      const blockH = lines.length * VERSE_LINE_H;

      ctx.save();
      roundRect(ctx, VERSE_COL_X, vy - 14, VERSE_BLOCK_W, blockH + 28, 12);
      ctx.fillStyle = shareTheme === 'light' ? 'rgba(0,0,0,0.055)' : 'rgba(255,255,255,0.065)';
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.fillStyle   = T.accent;
      ctx.globalAlpha = 0.55;
      roundRect(ctx, VERSE_COL_X, vy - 2, BAR_W, blockH + 4, BAR_W / 2);
      ctx.fill();
      ctx.restore();

      lines.forEach((line, li) => {
        ctx.fillStyle   = T.text;
        ctx.globalAlpha = 0.88;
        ctx.fillText(line, TEXT_X, vy + li * VERSE_LINE_H);
      });
      vy += blockH;

      if (vi < verseBlocks.length - 1) {
        vy += 16;
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = T.accent;
        ctx.lineWidth   = 1;
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

  // ── FOOTER — user profile pill ──
  if (hasUser) {
    const PILL_H   = 100;
    const LINE_TOP = H - FOOTER_H;
    const LINE_BOT = H - 22;
    const ZONE_MID = (LINE_TOP + LINE_BOT) / 2;
    const pillY    = Math.round(ZONE_MID - PILL_H / 2);

    ctx.save();
    const footLineGrad = ctx.createLinearGradient(0, 0, W, 0);
    footLineGrad.addColorStop(0,   'transparent');
    footLineGrad.addColorStop(0.2, T.accent + '33');
    footLineGrad.addColorStop(0.8, T.accent + '33');
    footLineGrad.addColorStop(1,   'transparent');
    ctx.strokeStyle = footLineGrad;
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(0, LINE_TOP); ctx.lineTo(W, LINE_TOP); ctx.stroke();
    ctx.restore();

    const AVA_R   = 36;
    const AVA_GAP = 24;
    const NAME_SIZE = 34, SUB_SIZE = 28;

    ctx.font = `600 ${NAME_SIZE}px "Nunito Sans", Arial, sans-serif`;
    const nameW = userProfile.name ? ctx.measureText(userProfile.name).width : 0;
    ctx.font    = `italic 300 ${SUB_SIZE}px "Cormorant Garamond", Georgia, serif`;
    const subW  = ctx.measureText('no Melodia.').width;
    const textBlockW = Math.max(nameW, subW);

    const contentW      = AVA_R * 2 + AVA_GAP + textBlockW;
    const OPTICAL_SHIFT = 8;
    const groupX        = Math.round((W - contentW) / 2) + OPTICAL_SHIFT;

    const AVA_CX  = groupX + AVA_R;
    const AVA_CY  = pillY + PILL_H / 2;
    const TEXT_X  = groupX + AVA_R * 2 + AVA_GAP;

    const PILL_PAD_H = 36;
    const PILL_W_OPT = contentW + PILL_PAD_H * 2;
    const pillXOpt   = Math.round((W - PILL_W_OPT) / 2);

    ctx.save();
    roundRect(ctx, pillXOpt, pillY, PILL_W_OPT, PILL_H, PILL_H / 2);
    ctx.fillStyle = shareTheme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = T.accent;
    ctx.globalAlpha = 0.18;
    ctx.lineWidth   = 1.5;
    roundRect(ctx, pillXOpt, pillY, PILL_W_OPT, PILL_H, PILL_H / 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

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
      ctx.font         = `600 ${AVA_R}px "Nunito Sans", Arial, sans-serif`;
      ctx.fillStyle    = T.bg;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((userProfile.name || '?')[0].toUpperCase(), AVA_CX, AVA_CY);
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = T.accent; ctx.lineWidth = 2; ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.arc(AVA_CX, AVA_CY, AVA_R + 3, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    if (userProfile.name) {
      ctx.font         = `600 ${NAME_SIZE}px "Nunito Sans", Arial, sans-serif`;
      ctx.fillStyle    = T.text;
      ctx.globalAlpha  = 0.90;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(userProfile.name, TEXT_X, AVA_CY - 12);

      ctx.font        = `italic 300 ${SUB_SIZE}px "Cormorant Garamond", Georgia, serif`;
      ctx.fillStyle   = T.accent;
      ctx.globalAlpha = 0.72;
      ctx.fillText('no Melodia.', TEXT_X, AVA_CY + 22);
    }
    ctx.restore();
  }

  // ── BOTTOM ACCENT LINE ──
  ctx.save();
  const botLineGrad = ctx.createLinearGradient(0, 0, W, 0);
  botLineGrad.addColorStop(0,   'transparent');
  botLineGrad.addColorStop(0.2, T.accent  + '55');
  botLineGrad.addColorStop(0.8, T.accent2 + '55');
  botLineGrad.addColorStop(1,   'transparent');
  ctx.strokeStyle = botLineGrad;
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.moveTo(0, H - 22); ctx.lineTo(W, H - 22); ctx.stroke();
  ctx.restore();
}
