import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, setCamScale } from "./utils";
const saved = sessionStorage.getItem("playerState");
const savedState = saved ? JSON.parse(saved) : null;
const menuButton = document.getElementById("menu");
const extraText = document.getElementById("extraText");
const projMenuBtn = document.getElementById("proj_menu");
const projectsMenu = document.getElementById("projectsMenu");
const mapButton = document.getElementById("map");
const mapText = document.getElementById("mapText");

if (mapButton && mapText) {
  mapButton.addEventListener("click", () => {
    mapText.classList.toggle("hidden");
  });
}


if (menuButton && extraText) {
  menuButton.addEventListener("click", () => {
    extraText.classList.toggle("hidden");
  });
}

const aboutBtn = document.getElementById("about_menu");
if (aboutBtn) {
  aboutBtn.addEventListener("click", () => {
    window.location.href = "/extra_pages/about_me.html";
  });
}

const trayBtn = document.getElementById("tray_menu");
if (trayBtn) {
  trayBtn.addEventListener("click", () => {
    window.location.href = "/extra_pages/tray.html";
  });
}

const contBtn = document.getElementById("cont_menu");
if (contBtn) {
  contBtn.addEventListener("click", () => {
    window.location.href = "/extra_pages/cont.html";
  });
}


if (projMenuBtn && projectsMenu) {
  projMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    projectsMenu.classList.toggle("hidden");
  });
}

// Menu navigation buttons
document.getElementById("about_menu").addEventListener("click", () => {
  window.location.href = "/extra_pages/about_me.html";
});

document.getElementById("tray_menu").addEventListener("click", () => {
  window.location.href = "/extra_pages/tray.html";
});

document.getElementById("Mod6_menu").addEventListener("click", () => {
  window.location.href = "/extra_pages/Mod6.html";
});

document.getElementById("Mod7_menu").addEventListener("click", () => {
  window.location.href = "/extra_pages/Mod7.html";
});

document.getElementById("Mod8A_menu").addEventListener("click", () => {
  window.location.href = "/extra_pages/Mod8A.html";
});

document.getElementById("Mod8B_menu").addEventListener("click", () => {
  window.location.href = "/extra_pages/Mod8B.html";
});

document.getElementById("tesis_menu").addEventListener("click", () => {
  window.location.href = "/extra_pages/tesis.html";
});


document.getElementById("cont_menu").addEventListener("click", () => {
  window.location.href = "/extra_pages/cont.html";
});

// loadind images and tools 
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


k.loadSprite("floor", "./back_f.PNG")


k.setBackground(k.Color.fromHex("#610716"));


// defining the main scene
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
  
      // rotate() is DEGREES
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

  const floor = k.add([ k.sprite("floor"), k.pos(0), k.scale(scaleFactor),]);

  // keep an invisible "world" container for collisions (like your old `map`)
const world = k.add([
  k.pos(0 ),
  k.scale(scaleFactor),
]);

// craete the player 
  const player = k.make([
    k.sprite("spritesheet", { anim: "idle-down" }),
    k.area({
      shape: new k.Rect(k.vec2(0, 3), 10, 10),
    }),
    k.body({ gravityScale: 0 }),
    k.anchor("center"),
    k.pos(),
    k.scale(scaleFactor* 1.5 ),
    {
      speed: 150,
      direction: "down",
      isInDialogue: false,
    },
    "player",
  ]);
  
  // Loop through map layers: build walls + spawn player ( it craetes an invisible collision box)
  for (const layer of layers) {
    if (layer.name === "triggers") {
      for (const trig of layer.objects) {
    
        const triggerId = getProp(trig, "name");
        if (!triggerId) continue;
    
        const bounds = polygonBounds(trig.polygon);
    
        world.add([
          k.pos(trig.x + bounds.x, trig.y + bounds.y),
          k.area({
            shape: new k.Rect(k.vec2(0, 0), bounds.w, bounds.h),
          }),
          k.body({ isStatic: true }),
          triggerId,
          "trigger",
        ]);
    
        player.onCollide(triggerId, () => {
          if (player.isInDialogue) return;
    
          player.isInDialogue = true;
    
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
    
        //  Polygon objects from Tiled
        if (boundary.polygon) {
          addPolygonAsWalls(world, boundary, 3, tag); // thickness=3 (try 2..6)
          continue;
        }
    
        // Rectangle objects (if any)
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

    // add teh palyer to the scene in the start position 
    if (layer.name === "spawnpoints") {
      for (const entity of layer.objects) {
        if (entity.name === "player") {
          // if stored position exists, use it; otherwise use spawn.
          if (entity.name === "player") {
            if (savedState?.x != null && savedState?.y != null) {
              player.pos = k.vec2(savedState.x, savedState.y);
              player.direction = savedState.direction ?? "down";
          
              // set correct idle anim for direction
              if (player.direction === "down") player.play("idle-down");
              else if (player.direction === "up") player.play("idle-up");
              else player.play("idle-side");
          
              // optional: clear it so it only restores once
              sessionStorage.removeItem("playerState");
            } else {
              player.pos = k.vec2(entity.x * scaleFactor, entity.y * scaleFactor);
            }
          
            k.add(player);
            continue;
          }
          k.add(player);
          continue;
        }
      }
    }
  }

  // Camera scaling (zoom) for different screens
  setCamScale(k);

  k.onResize(() => {
    setCamScale(k);
  });
  // camera following the player 
  k.onUpdate(() => {
    k.camPos(player.worldPos().x, player.worldPos().y - 100);
  });

  // mosue movement for the character to move 
  k.onMouseDown((mouseBtn) => {
    if (mouseBtn !== "left" || player.isInDialogue) return;

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



  // Stop animation when the character stops moving 
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

  // mouse movments 
  k.onMouseRelease(stopAnims);

  k.onKeyRelease(() => {
    stopAnims();
  });
  k.onKeyDown((key) => {
    const keyMap = [
      k.isKeyDown("right"),
      k.isKeyDown("left"),
      k.isKeyDown("up"),
      k.isKeyDown("down"),
    ];

    let nbOfKeyPressed = 0;
    for (const key of keyMap) {
      if (key) {
        nbOfKeyPressed++;
      }
    }

    if (nbOfKeyPressed > 1) return;

    if (player.isInDialogue) return;
    if (keyMap[0]) {
      player.flipX = false;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "right";
      player.move(player.speed, 0);
      return;
    }

    if (keyMap[1]) {
      player.flipX = true;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "left";
      player.move(-player.speed, 0);
      return;
    }

    if (keyMap[2]) {
      if (player.curAnim() !== "walk-up") player.play("walk-up");
      player.direction = "up";
      player.move(0, -player.speed);
      return;
    }

    if (keyMap[3]) {
      if (player.curAnim() !== "walk-down") player.play("walk-down");
      player.direction = "down";
      player.move(0, player.speed);
    }
  });
});


// strat the scene 
k.go("main");
