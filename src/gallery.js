// ── Project gallery overlay ──────────────────────────────────────────
// Opens on top of the museum when the visitor clicks "Menu".
// Shows a sneak peek of every project — browsable images + a short
// description — so people can explore without opening each page.

const PROJECTS = [
  {
    id: "Mod6",
    title: "Module 6 — Running feedback",
    blurb:
      "Reducing overstriding, one of the most common issues among runners, through real-time feedback.",
    images: ["./img/Mod6_1.png", "./img/Mod6_2.png"],
    url: "./extra_pages/Mod6.html",
  },
  {
    id: "Mod7",
    title: "Module 7 — AI stretching game",
    blurb:
      "An algorithm that uses Artificial Intelligence to help users stretch through a game.",
    images: ["./img/Mod7_1.png", "./img/Mod7_2.png"],
    url: "./extra_pages/Mod7.html",
  },
  {
    id: "Mod8A",
    title: "Smart Technology — Gamified running",
    blurb:
      "Using IMU sensors to gamify physical activities, such as running on a treadmill.",
    images: ["./img/Mod8A_1.png", "./img/Mod8A_2.png", "./img/Mod8A_3.png"],
    url: "./extra_pages/Mod8A.html",
  },
  {
    id: "Mod8B",
    title: "Module 8 — Awareness installation",
    blurb:
      "An installation to raise awareness of the dangers of smoking and drinking.",
    images: [
      "./img/Mod8B_1.png",
      "./img/Mod8B_2.png",
      "./img/Mod8B_3.png",
      "./img/Mod8B_4.png",
      "./img/Mod8B_5.png",
      "./img/Mod8B_6.png",
      "./img/Mod8B_7.png",
      "./img/Mod8B_8.png",
    ],
    url: "./extra_pages/Mod8B.html",
  },
  {
    id: "tesis",
    title: "Thesis",
    blurb: "My thesis project — a work in progress. Stay tuned!",
    images: [],
    url: "./extra_pages/tesis.html",
  },
];

let overlay = null;

export function isGalleryOpen() {
  return overlay && !overlay.classList.contains("hidden");
}

export function toggleGallery() {
  if (!overlay) return;
  overlay.classList.toggle("hidden");
}

export function closeGallery() {
  if (overlay) overlay.classList.add("hidden");
}

function buildCard(project) {
  const card = document.createElement("div");
  card.className = "g-card";

  // image carousel (only if the project has images)
  if (project.images.length > 0) {
    const imgWrap = document.createElement("div");
    imgWrap.className = "g-img-wrap";

    const img = document.createElement("img");
    img.className = "g-img";
    img.src = project.images[0];
    img.alt = project.title;
    img.loading = "lazy";
    imgWrap.appendChild(img);

    let index = 0;
    const counter = document.createElement("span");
    counter.className = "g-counter";

    function update() {
      img.src = project.images[index];
      counter.textContent = `${index + 1}/${project.images.length}`;
    }

    if (project.images.length > 1) {
      const prev = document.createElement("button");
      prev.className = "g-arrow g-prev";
      prev.textContent = "‹";
      prev.addEventListener("click", () => {
        index = (index - 1 + project.images.length) % project.images.length;
        update();
      });

      const next = document.createElement("button");
      next.className = "g-arrow g-next";
      next.textContent = "›";
      next.addEventListener("click", () => {
        index = (index + 1) % project.images.length;
        update();
      });

      imgWrap.appendChild(prev);
      imgWrap.appendChild(next);
      imgWrap.appendChild(counter);
      update();
    }

    card.appendChild(imgWrap);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "g-img-wrap g-placeholder";
    placeholder.textContent = "In progress ...";
    card.appendChild(placeholder);
  }

  const title = document.createElement("h3");
  title.className = "g-title";
  title.textContent = project.title;
  card.appendChild(title);

  const blurb = document.createElement("p");
  blurb.className = "g-blurb";
  blurb.textContent = project.blurb;
  card.appendChild(blurb);

  const open = document.createElement("a");
  open.className = "g-open";
  open.textContent = "Open project →";
  open.href = project.url;
  card.appendChild(open);

  return card;
}

export function initGallery() {
  overlay = document.getElementById("menuOverlay");
  if (!overlay) return;

  const grid = document.getElementById("galleryGrid");
  for (const project of PROJECTS) {
    grid.appendChild(buildCard(project));
  }

  // close button, click on backdrop, and Escape key
  document
    .getElementById("galleryClose")
    .addEventListener("click", closeGallery);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeGallery();
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape" && isGalleryOpen()) closeGallery();
  });
}
