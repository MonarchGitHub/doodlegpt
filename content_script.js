// content_script.js
// Full, corrected version: doodles persist and NEVER vanish on scroll
// Key rule followed: canvas scrolls with content, so NO scrollTop math in coordinates

(() => {
  // -------------------- GLOBAL STATE --------------------
  const STATE = { enabled: false };
  let container = null;
  let overlayRoot = null;
  let toolbarRoot = null;
  let canvas = null;
  let ctx = null;
  let drawing = false;
  let drawEnabled = true;
  let currentStroke = null;
  let strokes = [];
  let ro = null;
  let mo = null;

  // Marker so popup can safely detect the content script
  window.__CGPT_DOODLE = { loaded: true, enabled: false };

  // -------------------- CONVERSATION KEY --------------------
  function getConversationKey() {
    const m = location.pathname.match(/\/c\/([^\/]+)/);
    const id = m ? m[1] : location.pathname;
    return `cgpt_doodle:${location.hostname}:${id}`;
  }

  // -------------------- FIND CHAT SCROLLER --------------------
  function findChatContainer() {
    const main = document.querySelector('main');
    if (!main) return document.body;

    const candidates = [...main.querySelectorAll('*')].filter(el => {
      const s = getComputedStyle(el);
      return (
        (s.overflowY === 'auto' || s.overflowY === 'scroll') &&
        el.scrollHeight > el.clientHeight &&
        el.clientHeight > 300 &&
        !el.closest('figure') &&
        !el.closest('[role="group"]')
      );
    });

    candidates.sort((a, b) => b.clientHeight - a.clientHeight);
    return candidates[0] || main;
  }

  // -------------------- STORAGE --------------------
  function saveStrokes() {
    const key = getConversationKey();
    chrome.storage.local.set({ [key]: strokes });
  }

  function loadStrokes() {
    return new Promise(resolve => {
      chrome.storage.local.get([getConversationKey()], res => {
        strokes = Array.isArray(res[getConversationKey()]) ? res[getConversationKey()] : [];
        resolve();
      });
    });
  }

  // -------------------- CANVAS HELPERS --------------------
  function clearCanvas() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function redrawAll() {
    if (!ctx) return;
    clearCanvas();
    for (const stroke of strokes) {
      if (!stroke.points.length) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }

  // -------------------- OVERLAY --------------------
  function createOverlay() {
    if (overlayRoot && toolbarRoot) return;
    if (overlayRoot && !toolbarRoot) {
      overlayRoot.remove();
      overlayRoot = null;
    }

    container = findChatContainer();
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    overlayRoot = document.createElement('div');
    overlayRoot.id = 'cgpt-doodle-root';
    Object.assign(overlayRoot.style, {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: container.scrollHeight + 'px',
      pointerEvents: 'none',
      zIndex: 2147483647
    });

    // Toolbar (iOS-inspired)
    const toolbar = document.createElement('div');
    toolbarRoot = toolbar;
    toolbar.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:12px',
      'display:inline-flex',
      'gap:10px',
      'align-items:center',
      'width:fit-content',
      'max-width:calc(100% - 24px)',
      'padding:8px 10px',
      'border-radius:14px',
      'background:rgba(255,255,255,0.85)',
      'border:1px solid rgba(15,23,42,0.12)',
      'box-shadow:0 10px 24px rgba(15,23,42,0.15)',
      'backdrop-filter:blur(10px)',
      'z-index:2147483647',
      'pointer-events:auto'
    ].join(';');

    const color = document.createElement('input');
    color.type = 'color';
    color.value = '#ff6b6b';
    color.setAttribute('aria-label', 'Brush color');

    const size = document.createElement('input');
    size.type = 'range';
    size.min = 1;
    size.max = 80;
    size.value = 6;
    size.setAttribute('aria-label', 'Brush size');

    const modeBtn = document.createElement('button');
    modeBtn.textContent = 'Type Mode';
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear';
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save PNG';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';

    const pill = (el, bg, fg) => {
      el.style.padding = '6px 10px';
      el.style.borderRadius = '999px';
      el.style.border = '1px solid rgba(15,23,42,0.12)';
      el.style.background = bg;
      el.style.color = fg;
      el.style.fontSize = '12px';
      el.style.fontWeight = '600';
      el.style.letterSpacing = '0.2px';
      el.style.pointerEvents = 'auto';
    };

    pill(modeBtn, 'rgba(15,23,42,0.06)', '#0f172a');
    pill(clearBtn, 'white', '#0f172a');
    pill(saveBtn, 'linear-gradient(135deg, #0a84ff, #36a2ff)', 'white');
    pill(closeBtn, 'rgba(15,23,42,0.06)', '#0f172a');

    color.style.width = '28px';
    color.style.height = '28px';
    color.style.border = '1px solid rgba(15,23,42,0.12)';
    color.style.borderRadius = '8px';
    color.style.padding = '0';
    color.style.background = 'white';
    color.style.pointerEvents = 'auto';

    size.style.width = '120px';
    size.style.accentColor = '#0a84ff';
    size.style.pointerEvents = 'auto';

    toolbar.append(color, size, modeBtn, clearBtn, closeBtn);

    // Canvas
    canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.left = 0;
    canvas.style.top = 0;
    canvas.style.pointerEvents = 'auto';

    overlayRoot.append(canvas);
    container.appendChild(overlayRoot);
    document.body.appendChild(toolbar);

    ctx = canvas.getContext('2d');

    function resize() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = container.clientWidth;
      const h = container.scrollHeight;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      redrawAll();
    }

    resize();
    ro = new ResizeObserver(resize);
    ro.observe(container);
    mo = new MutationObserver(() => setTimeout(resize, 50));
    mo.observe(container, { childList: true, subtree: true });

    function getPos(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function setDrawEnabled(enabled) {
      drawEnabled = !!enabled;
      if (canvas) canvas.style.pointerEvents = drawEnabled ? 'auto' : 'none';
      modeBtn.textContent = drawEnabled ? 'Type Mode' : 'Draw Mode';
      pill(
        modeBtn,
        drawEnabled ? 'rgba(15,23,42,0.06)' : 'linear-gradient(135deg, #0a84ff, #36a2ff)',
        drawEnabled ? '#0f172a' : 'white'
      );
    }

    setDrawEnabled(true);

    modeBtn.onclick = () => setDrawEnabled(!drawEnabled);

    canvas.addEventListener('pointerdown', e => {
      if (!drawEnabled) return;
      drawing = true;
      const p = getPos(e);
      currentStroke = { color: color.value, size: +size.value, points: [p] };
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', e => {
      if (!drawing || !drawEnabled) return;
      const p = getPos(e);
      ctx.strokeStyle = currentStroke.color;
      ctx.lineWidth = currentStroke.size;
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      currentStroke.points.push(p);
    });

    window.addEventListener('pointerup', () => {
      if (!drawing) return;
      drawing = false;
      ctx.closePath();
      strokes.push(currentStroke);
      currentStroke = null;
      saveStrokes();
    });

    clearBtn.onclick = () => {
      strokes = [];
      saveStrokes();
      redrawAll();
    };

    saveBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'doodle.png';
      a.click();
    };

    closeBtn.onclick = () => setEnabled(false);

    loadStrokes().then(redrawAll);
  }

  function destroyOverlay() {
    ro?.disconnect(); mo?.disconnect();
    overlayRoot?.remove();
    toolbarRoot?.remove();
    overlayRoot = toolbarRoot = canvas = ctx = null;
  }

  function setEnabled(on) {
    STATE.enabled = on;
    window.__CGPT_DOODLE.enabled = on;
    chrome.storage.local.set({ doodleEnabled: on });
    on ? createOverlay() : destroyOverlay();
  }

  chrome.storage.local.get(['doodleEnabled'], r => r.doodleEnabled && setEnabled(true));

  chrome.runtime.onMessage.addListener((msg, _, send) => {
    if (msg?.type === 'SET_ENABLED') setEnabled(msg.enabled);
    send({ ok: true });
  });
})();
