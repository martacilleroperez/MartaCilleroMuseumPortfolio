// ── Minimap ──────────────────────────────────────────────────────────
// A small black radar in the corner of the screen.
// It shows a pulsing dot for the player and one marker per exhibit.
// Exhibits turn gold once visited; progress is saved in localStorage.

const STORAGE_KEY = "visitedExhibits";

// suggested tour: start top-left, then clockwise around the museum
const TOUR_ORDER = [
  "about_me",
  "tray",
  "Mod8A",
  "tesis",
  "Mod8B",
  "Mod7",
  "Mod6",
  "cont",
];

const state = {
  canvas: null,
  ctx: null,
  worldW: 1,
  worldH: 1,
  exhibits: [], // { id, x, y } in world coordinates
  player: { x: 0, y: 0 },
  visited: new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")),
  rafId: null,
};

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.visited]));
}

function updateCounter() {
  const counter = document.getElementById("minimap-progress");
  if (counter) {
    counter.textContent = `${state.visited.size}/${state.exhibits.length} seen`;
  }
}

// world → minimap pixel coordinates (with a small inner margin)
function toMap(x, y) {
  const m = 8; // margin in px
  const w = state.canvas.width - m * 2;
  const h = state.canvas.height - m * 2;
  return {
    x: m + (x / state.worldW) * w,
    y: m + (y / state.worldH) * h,
  };
}

// small, semi-transparent arrow drawn midway between two points,
// pointing from a to b — a quiet hint of the suggested route
function drawRouteArrow(ctx, a, b) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const ang = Math.atan2(b.y - a.y, b.x - a.x);

  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(ang);
  ctx.strokeStyle = "rgba(232, 193, 99, 0.28)"; // faint gold
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-2.5, -3);
  ctx.lineTo(2.5, 0);
  ctx.lineTo(-2.5, 3);
  ctx.stroke();
  ctx.restore();
}

function draw(time) {
  const { ctx, canvas } = state;

  // pure black background
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // subtle clockwise route arrows, drawn first so dots sit on top
  const byId = {};
  for (const ex of state.exhibits) byId[ex.id] = toMap(ex.x, ex.y);

  for (let i = 0; i < TOUR_ORDER.length - 1; i++) {
    const a = byId[TOUR_ORDER[i]];
    const b = byId[TOUR_ORDER[i + 1]];
    if (a && b) drawRouteArrow(ctx, a, b);
  }

  // exhibit markers (squares, to match the pixel-art look)
  for (const ex of state.exhibits) {
    const p = toMap(ex.x, ex.y);
    if (state.visited.has(ex.id)) {
      // already seen: dark, semi-transparent
      ctx.fillStyle = "rgba(110, 110, 110, 0.3)";
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    } else {
      // still to discover: bright gold outline
      ctx.strokeStyle = "#e8c163";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x - 3, p.y - 3, 6, 6);
    }
  }

  // player: pulsing warm-red dot
  const p = toMap(state.player.x, state.player.y);
  const pulse = 1 + Math.sin(time / 280) * 0.35;

  ctx.fillStyle = "rgba(255, 90, 78, 0.25)";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 7 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff5a4e";
  ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);

  state.rafId = requestAnimationFrame(draw);
}

// ── public API ───────────────────────────────────────────────────────

export function initMinimap({ worldW, worldH, exhibits }) {
  state.canvas = document.getElementById("minimap-canvas");
  if (!state.canvas) return;

  state.ctx = state.canvas.getContext("2d");
  state.worldW = worldW;
  state.worldH = worldH;
  state.exhibits = exhibits;

  // keep canvas proportional to the world (e.g. 900x700 → 180x140)
  state.canvas.width = 180;
  state.canvas.height = Math.round(180 * (worldH / worldW));

  updateCounter();

  if (state.rafId) cancelAnimationFrame(state.rafId);
  state.rafId = requestAnimationFrame(draw);

  // clicking the minimap toggles the full museum map
  const fullMap = document.getElementById("mapText");
  state.canvas.addEventListener("click", () => {
    if (fullMap) fullMap.classList.toggle("hidden");
  });
}

export function updateMinimapPlayer(x, y) {
  state.player.x = x;
  state.player.y = y;
}

export function markVisited(id) {
  if (state.visited.has(id)) return;
  state.visited.add(id);
  save();
  updateCounter();
}

export function isVisited(id) {
  return state.visited.has(id);
}
