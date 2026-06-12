// Click a thumbnail to show it as the main image
document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector(".main-img");
  const thumbs = document.querySelectorAll(".thumb");
  if (!main || thumbs.length === 0) return;

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      main.src = thumb.src;
      thumbs.forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });
});
