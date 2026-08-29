const vouchGrid = document.querySelector("#vouchGrid");
vouches.forEach((vouch, index) => {
  const button = document.createElement("button");
  const image = document.createElement("img");
  button.type = "button";
  button.setAttribute("aria-label", "Open customer vouch " + (index + 1) + " of " + vouches.length);
  image.src = paths.thumb + vouch.thumb;
  image.alt = "Customer vouch " + (index + 1);
  image.loading = index < 24 ? "eager" : "lazy";
  button.appendChild(image);
  button.addEventListener("click", () => openVouch(index));
  vouchGrid.appendChild(button);
});
