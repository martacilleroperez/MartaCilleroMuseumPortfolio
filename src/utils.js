export function displayDialogue(text, triggerId, onDisplayEnd, getPlayerState) {
  const dialogueUI = document.getElementById("textbox-container");
  const dialogue = document.getElementById("dialogue");
  const closeBtn = document.getElementById("close");

  // "Know more" buttons
  const aboutBtn = document.getElementById("about_me");
  const mod6Btn = document.getElementById("Mod6");
  const mod7Btn = document.getElementById("Mod7");
  const mod8ABtn = document.getElementById("Mod8A");
  const mod8BBtn = document.getElementById("Mod8B");
  const trayBtn = document.getElementById("tray");
  const contBtn = document.getElementById("cont");

  // Map: triggerId -> which button + which page
  const actions = {
    about_me: { btn: aboutBtn, url: "./extra_pages/about_me.html" },
    Mod6: { btn: mod6Btn, url: "./extra_pages/Mod6.html" },
    Mod7: { btn: mod7Btn, url: "./extra_pages/Mod7.html" },
    Mod8A: { btn: mod8ABtn, url: "./extra_pages/Mod8A.html" },
    Mod8B: { btn: mod8BBtn, url: "./extra_pages/Mod8B.html" },
    tray: { btn: trayBtn, url: "./extra_pages/tray.html" },
    cont: { btn: contBtn, url: "./extra_pages/cont.html" },
  };

  dialogueUI.style.display = "block";
  closeBtn.style.display = "inline-block";

  const allBtns = [
    aboutBtn,
    mod6Btn,
    mod7Btn,
    mod8ABtn,
    mod8BBtn,
    trayBtn,
    contBtn,
  ].filter(Boolean);
  for (const b of allBtns) b.style.display = "none";

  const action = actions[triggerId];
  if (action?.btn) action.btn.style.display = "inline-block";

  // ── typing effect (steady speed, click to reveal everything) ───────
  let index = 0;
  let finished = false;

  const intervalRef = setInterval(() => {
    if (index < text.length) {
      index++;
      dialogue.textContent = text.slice(0, index);
      return;
    }
    finished = true;
    clearInterval(intervalRef);
  }, 18);

  function skipTyping() {
    if (finished) return;
    finished = true;
    clearInterval(intervalRef);
    dialogue.textContent = text;
  }

  function cleanupAndClose() {
    onDisplayEnd?.();
    dialogueUI.style.display = "none";
    dialogue.textContent = "";
    clearInterval(intervalRef);

    closeBtn.removeEventListener("click", onCloseClick);
    window.removeEventListener("keydown", onKeyDown);
    dialogue.removeEventListener("click", skipTyping);

    for (const b of allBtns) b.removeEventListener("click", onKnowMoreClick);
  }

  function onCloseClick() {
    cleanupAndClose();
  }

  function onKnowMoreClick() {
    // remember where the player was standing so we can restore it
    const state = getPlayerState?.();
    if (state) sessionStorage.setItem("playerState", JSON.stringify(state));

    cleanupAndClose();

    if (action?.url) window.location.href = action.url;
  }

  function onKeyDown(e) {
    if (e.code === "Enter" || e.code === "Escape") {
      if (!finished && e.code === "Enter") {
        skipTyping(); // first Enter reveals the text, second closes
        return;
      }
      cleanupAndClose();
    }
  }

  closeBtn.addEventListener("click", onCloseClick);
  window.addEventListener("keydown", onKeyDown);
  dialogue.addEventListener("click", skipTyping);

  for (const b of allBtns) b.addEventListener("click", onKnowMoreClick);
}

// Adjusts zoom depending on your screen shape
export function setCamScale(k) {
  const resizeFactor = k.width() / k.height();
  if (resizeFactor < 1) {
    k.camScale(k.vec2(1));
  } else {
    k.camScale(k.vec2(1.5));
  }
}
