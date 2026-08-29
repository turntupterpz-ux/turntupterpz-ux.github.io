const strip = document.querySelector("#strip");
vouches.forEach((vouch, index) => {
  const button = document.createElement("button");
  const image = document.createElement("img");
  button.type = "button";
  button.setAttribute("aria-label", "Open customer vouch " + (index + 1) + " of " + vouches.length);
  image.src = paths.thumb + vouch.thumb;
  image.alt = "Customer vouch " + (index + 1);
  image.decoding = "async";
  image.loading = index < 8 ? "eager" : "lazy";
  button.appendChild(image);
  button.addEventListener("click", () => openVouch(index));
  strip.appendChild(button);
});

const stripPrev = document.querySelector("#stripPrev");
const stripNext = document.querySelector("#stripNext");
function scrollStripBy(direction) {
  strip.scrollBy({ left: strip.clientWidth * 0.8 * direction, behavior: "smooth" });
}
stripPrev?.addEventListener("click", () => scrollStripBy(-1));
stripNext?.addEventListener("click", () => scrollStripBy(1));
strip.addEventListener("wheel", (event) => {
  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
    event.preventDefault();
    strip.scrollLeft += event.deltaY;
  }
}, { passive: false });
