const vouchGrid = document.querySelector("#vouchGrid");
const gridMore = document.querySelector("#gridMore");
const PAGE_SIZE = 16;
let shown = 0;

function renderMore() {
  const next = Math.min(shown + PAGE_SIZE, vouches.length);
  for (let i = shown; i < next; i++) {
    const button = document.createElement("button");
    const image = document.createElement("img");
    button.type = "button";
    button.setAttribute("aria-label", "Open customer vouch " + (i + 1) + " of " + vouches.length);
    image.src = paths.thumb + vouches[i].thumb;
    image.alt = "Customer vouch " + (i + 1);
    image.loading = i < 16 ? "eager" : "lazy";
    button.appendChild(image);
    button.addEventListener("click", () => openVouch(i));
    vouchGrid.appendChild(button);
  }
  shown = next;
  gridMore.hidden = shown >= vouches.length;
}

gridMore.addEventListener("click", renderMore);
renderMore();
