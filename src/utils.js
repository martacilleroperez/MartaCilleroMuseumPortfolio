export function displayDialogue(text, triggerId, onDisplayEnd, getPlayerState) {
  const dialogueUI = document.getElementById("textbox-container");
  const dialogue = document.getElementById("dialogue");
  const closeBtn = document.getElementById("close");

  // Buttons
  const aboutBtn = document.getElementById("about_me");
  const mod6Btn = document.getElementById("Mod6");
  const mod7Btn = document.getElementById("Mod7");
  const mod8ABtn = document.getElementById("Mod8A");
  const mod8BBtn = document.getElementById("Mod8B");
  const trayBtn = document.getElementById("Tray");

  // Map: triggerId -> which button + which page
  const actions = {
    about_me: { btn: aboutBtn, url: "/extra_pages/about_me.html" },
    Mod6: { btn: mod6Btn, url: "/extra_pages/Mod6.html" },
    Mod7: { btn: mod7Btn, url: "/extra_pages/Mod7.html" },
    Mod8A: { btn: mod8ABtn, url: "/extra_pages/Mod8A.html" },
    Mod8B: { btn: mod8BBtn, url: "/extra_pages/Mod8B.html" },
    tray: { btn: trayBtn, url: "/extra_pages/trayect.html" }, // NOTE: your dialogueData uses "tray" lowercase
  };

  // show dialog
  dialogueUI.style.display = "block";
  closeBtn.style.display = "inline-block";

  // Hide all "know more" buttons first
  const allBtns = [aboutBtn, mod6Btn, mod7Btn, mod8ABtn, mod8BBtn, trayBtn].filter(Boolean);
  for (const b of allBtns) b.style.display = "none";

  // Pick the correct action for this trigger
  const action = actions[triggerId];
  if (action?.btn) action.btn.style.display = "inline-block";

  // typing effect
  let index = 0;
  let currentText = "";
  const intervalRef = setInterval(() => {
    if (index < text.length) {
      currentText += text[index];
      dialogue.innerHTML = currentText;
      index++;
      return;
    }
    clearInterval(intervalRef);
  }, 1);

  function cleanupAndClose() {
    onDisplayEnd?.();
    dialogueUI.style.display = "none";
    dialogue.innerHTML = "";
    clearInterval(intervalRef);

    closeBtn.removeEventListener("click", onCloseClick);
    window.removeEventListener("keypress", onKeyPress);

    // remove button click handlers
    for (const b of allBtns) b.removeEventListener("click", onKnowMoreClick);
  }

  function onCloseClick() {
    cleanupAndClose();
  }

  function onKnowMoreClick() {
    const state = getPlayerState?.();
    if (state) sessionStorage.setItem("playerState", JSON.stringify(state));

    cleanupAndClose();

    if (action?.url) window.location.href = action.url;
  }

  function onKeyPress(e) {
    if (e.code === "Enter") cleanupAndClose();
  }

  closeBtn.addEventListener("click", onCloseClick);
  window.addEventListener("keypress", onKeyPress);

  // Attach the click handler to every "know more" button (only one is visible)
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
