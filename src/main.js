import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, setCamScale } from "./utils";
import { initMinimap, updateMinimapPlayer, markVisited, isVisited } from "./minimap";
import { initGallery, toggleGallery, isGalleryOpen } from "./gallery";

// ── restore player position (after coming back from a project page) ──
const saved = sessionStorage.getItem("playerState");
const savedState = saved ? JSON.parse(saved) : null;

// ── menu UI ──────────────────────────────────────────────────────────
initGallery();

const menuButton = document.getElementById("menu");
if (menuButton) {
  menuButton.addEventListener("click", toggleGallery);
}

// quick links inside the museum guide
const menuRoutes = {
  about_menu: "./extra_pages/about_me.html",
  tray_menu: "./extra_pages/tray.html",
  cont_menu: "./extra_pages/cont.html",
};

for (const [id, url] of Object.entries(menuRoutes)) {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener("click", () => (window.location.href = url));
}

// ── sprites ──────────────────────────────────────────────────────────
k.loadSprite("spritesheet", "./spritesheet.png", {
  sliceX: 39,
  sliceY: 31,
  anims: {
    "idle-down": 936,
    "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
    "idle-side": 975,
    "walk-side": { from: 975, to: 978, loop: true, speed: 8 },
    "idle-up": 1014,
    "walk-up": { from: 1014, to: 1017, loop: true, speed: 8 },
  },
});

k.loadSprite("floor", "./back_f.PNG");

k.loadFont("monogram", "./monogram.ttf");

k.loadSprite("marker-arrow", "./marker_arrow.png");

k.setBackground(k.Color.fromHex("#610716"));

// ── main scene ───────────────────────────────────────────────────────
k.scene("main", async () => {
  const mapData = await (await fetch("./Plano_2.json")).json();
  const layers = mapData.layers;

  function getProp(obj, key) {
    return obj.properties?.find((p) => p.name === key)?.value;
  }

  function addPolygonAsWalls(world, boundary, thickness = 3, tag = "boundary") {
    const pts = boundary.polygon;
    if (!pts || pts.length < 2) return;

    const ox = boundary.x;
    const oy = boundary.y;

    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];

      const dx = b.x - a.x;
      const dy = b.y - a.y;

      const len = Math.hypot(dx, dy);
      if (len < 0.0001) continue;

      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;

      const angDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

      world.add([
        k.pos(ox + midX, oy + midY),
        k.rotate(angDeg),
        k.area({
          shape: new k.Rect(k.vec2(-len / 2, -thickness / 2), len, thickness),
        }),
        k.body({ isStatic: true }),
        tag,
      ]);
    }
  }

  function polygonBounds(poly) {
    const xs = poly.map((p) => p.x);
    const ys = poly.map((p) => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  const floor = k.add([k.sprite("floor"), k.pos(0), k.scale(scaleFactor)]);

  // invisible world container for collisions
  const world = k.add([k.pos(0), k.scale(scaleFactor)]);

  // ── player ─────────────────────────────────────────────────────────
  const player = k.make([
    k.sprite("spritesheet", { anim: "idle-down" }),
    k.area({
      shape: new k.Rect(k.vec2(0, 3), 10, 10),
    }),
    k.body({ gravityScale: 0 }),
    k.anchor("center"),
    k.pos(),
    k.scale(scaleFactor * 1.5),
    {
      speed: 150,
      direction: "down",
      isInDialogue: false,
    },
    "player",
  ]);

  // collect exhibit positions for the minimap while we build the level
  const exhibitPoints = [];

  for (const layer of layers) {
    if (layer.name === "triggers") {
      for (const trig of layer.objects) {
        const triggerId = getProp(trig, "name");
        if (!triggerId) continue;

        const bounds = polygonBounds(trig.polygon);

        // store the centre of each exhibit (world coordinates)
        exhibitPoints.push({
          id: triggerId,
          x: (trig.x + bounds.x + bounds.w / 2) * scaleFactor,
          y: (trig.y + bounds.y + bounds.h / 2) * scaleFactor,
        });

        world.add([
          k.pos(trig.x + bounds.x, trig.y + bounds.y),
          k.area({
            shape: new k.Rect(k.vec2(0, 0), bounds.w, bounds.h),
          }),
          k.body({ isStatic: true }),
          triggerId,
          "trigger",
        ]);

        // floating gold arrow pointing down at the exhibit
        const markerX = trig.x + bounds.x + bounds.w / 2;
        const markerY = trig.y + bounds.y - 12;
        const seen = isVisited(triggerId);

        const marker = world.add([
          k.sprite("marker-arrow"),
          k.pos(markerX, markerY),
          k.anchor("center"),
          k.opacity(seen ? 0.3 : 1),
          k.z(100),
          {
            baseY: markerY,
            phase: markerX, // desync the bobbing between markers
          },
          "exhibit-marker",
          `marker-${triggerId}`,
        ]);

        player.onCollide(triggerId, () => {
          if (player.isInDialogue) return;

          player.isInDialogue = true;
          markVisited(triggerId); // light it up on the minimap
          marker.opacity = 0.3; // and fade the in-game arrow

          displayDialogue(
            dialogueData[triggerId],
            triggerId,
            () => {
              player.isInDialogue = false;
            },
            () => ({
              x: player.pos.x,
              y: player.pos.y,
              direction: player.direction,
            })
          );
        });
      }

      continue;
    }

    if (layer.name === "boundaries") {
      for (const boundary of layer.objects) {
        const tag = boundary.name?.trim() ? boundary.name.trim() : "boundary";

        if (boundary.polygon) {
          addPolygonAsWalls(world, boundary, 3, tag);
          continue;
        }

        const w = boundary.width ?? 0;
        const h = boundary.height ?? 0;
        if (w <= 0 || h <= 0) continue;

        world.add([
          k.pos(boundary.x, boundary.y),
          k.area({ shape: new k.Rect(k.vec2(0, 0), w, h) }),
          k.body({ isStatic: true }),
          tag,
        ]);
      }

      continue;
    }

    if (layer.name === "spawnpoints") {
      for (const entity of layer.objects) {
        if (entity.name !== "player") continue;

        if (savedState?.x != null && savedState?.y != null) {
          player.pos = k.vec2(savedState.x, savedState.y);
          player.direction = savedState.direction ?? "down";

          if (player.direction === "down") player.play("idle-down");
          else if (player.direction === "up") player.play("idle-up");
          else player.play("idle-side");

          sessionStorage.removeItem("playerState");
        } else {
          player.pos = k.vec2(entity.x * scaleFactor, entity.y * scaleFactor);
        }

        k.add(player);
      }
    }
  }

  // ── minimap ────────────────────────────────────────────────────────
  // floor image is 900x700, scaled by scaleFactor → world size
  initMinimap({
    worldW: 900 * scaleFactor,
    worldH: 700 * scaleFactor,
    exhibits: exhibitPoints,
  });

  // ── camera ─────────────────────────────────────────────────────────
  setCamScale(k);

  k.onResize(() => {
    setCamScale(k);
  });

  k.onUpdate(() => {
    k.camPos(player.worldPos().x, player.worldPos().y - 100);
    updateMinimapPlayer(player.worldPos().x, player.worldPos().y);

    // gentle bobbing for the exhibit markers
    for (const m of world.get("exhibit-marker")) {
      m.pos.y = m.baseY + Math.sin(k.time() * 3 + m.phase) * 2;
    }
  });

  // ── mouse / touch movement ─────────────────────────────────────────
  k.onMouseDown((mouseBtn) => {
    if (mouseBtn !== "left" || player.isInDialogue || isGalleryOpen()) return;

    const worldMousePos = k.toWorld(k.mousePos());
    player.moveTo(worldMousePos, player.speed);

    const mouseAngle = player.pos.angle(worldMousePos);

    const lowerBound = 50;
    const upperBound = 125;

    if (
      mouseAngle > lowerBound &&
      mouseAngle < upperBound &&
      player.curAnim() !== "walk-up"
    ) {
      player.play("walk-up");
      player.direction = "up";
      return;
    }

    if (
      mouseAngle < -lowerBound &&
      mouseAngle > -upperBound &&
      player.curAnim() !== "walk-down"
    ) {
      player.play("walk-down");
      player.direction = "down";
      return;
    }

    if (Math.abs(mouseAngle) > upperBound) {
      player.flipX = false;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "right";
      return;
    }

    if (Math.abs(mouseAngle) < lowerBound) {
      player.flipX = true;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "left";
      return;
    }
  });

  function stopAnims() {
    if (player.direction === "down") {
      player.play("idle-down");
      return;
    }
    if (player.direction === "up") {
      player.play("idle-up");
      return;
    }
    player.play("idle-side");
  }

  k.onMouseRelease(stopAnims);

  // ── keyboard movement: arrows + WASD, with smooth diagonals ────────
  const isLeft = () => k.isKeyDown("left") || k.isKeyDown("a");
  const isRight = () => k.isKeyDown("right") || k.isKeyDown("d");
  const isUp = () => k.isKeyDown("up") || k.isKeyDown("w");
  const isDown = () => k.isKeyDown("down") || k.isKeyDown("s");

  k.onUpdate(() => {
    if (player.isInDialogue || isGalleryOpen()) return;

    let dx = 0;
    let dy = 0;
    if (isRight()) dx += 1;
    if (isLeft()) dx -= 1;
    if (isDown()) dy += 1;
    if (isUp()) dy -= 1;

    if (dx === 0 && dy === 0) return;

    // normalise so diagonal speed equals straight-line speed
    const len = Math.hypot(dx, dy);
    player.move((dx / len) * player.speed, (dy / len) * player.speed);

    // pick the animation from the dominant axis
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) {
      player.flipX = dx < 0;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = dx < 0 ? "left" : "right";
    } else if (dy < 0) {
      if (player.curAnim() !== "walk-up") player.play("walk-up");
      player.direction = "up";
    } else if (dy > 0) {
      if (player.curAnim() !== "walk-down") player.play("walk-down");
      player.direction = "down";
    }
  });

  k.onKeyRelease(() => {
    // only go idle when no movement key is held anymore
    if (!isLeft() && !isRight() && !isUp() && !isDown()) stopAnims();
  });
});

// start the scene
k.go("main");
