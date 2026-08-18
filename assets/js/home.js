const vouches = [
  { full: "53.png", thumb: "53.webp" },
  { full: "52.png", thumb: "52.webp" },
  { full: "51.png", thumb: "51.webp" },
  { full: "42.png", thumb: "42.webp" },
  { full: "43.png", thumb: "43.webp" },
  { full: "44.png", thumb: "44.webp" },
  { full: "45.png", thumb: "45.webp" },
  { full: "46.png", thumb: "46.webp" },
  { full: "47.png", thumb: "47.webp" },
  { full: "48.png", thumb: "48.webp" },
  { full: "49.png", thumb: "49.webp" },
  { full: "50.png", thumb: "50.webp" },
  { full: "41.png", thumb: "41.webp" },
  { full: "40.png", thumb: "40.webp" },
  { full: "39.png", thumb: "39.webp" },
  { full: "38.png", thumb: "38.webp" },
  { full: "37.png", thumb: "37.webp" },
  { full: "36.png", thumb: "36.webp" },
  { full: "35.png", thumb: "35.webp" },
  { full: "34.png", thumb: "34.webp" },
  { full: "32.jpg", thumb: "32.webp" },
  { full: "31.jpg", thumb: "31.webp" },
  { full: "30.jpg", thumb: "30.webp" },
  { full: "29.jpg", thumb: "29.webp" },
  { full: "28.jpg", thumb: "28.webp" },
  { full: "27.jpg", thumb: "27.webp" },
  { full: "26.jpg", thumb: "26.webp" },
  { full: "24.png", thumb: "24.webp" },
  { full: "23.jpg", thumb: "23.webp" },
  { full: "22.jpg", thumb: "22.webp" },
  { full: "20.jpg", thumb: "20.webp" },
  { full: "19.jpg", thumb: "19.webp" },
  { full: "18.jpg", thumb: "18.webp" },
  { full: "1738.JPEG", thumb: "1738.webp" },
  { full: "16.JPEG", thumb: "16.webp" },
  { full: "151.JPEG", thumb: "151.webp" },
  { full: "1412.JPEG", thumb: "1412.webp" },
  { full: "14.jpg", thumb: "14.webp" },
  { full: "13.jpeg", thumb: "13.webp" },
  { full: "12.jpeg", thumb: "12.webp" },
  { full: "11.jpeg", thumb: "11.webp" },
  { full: "10.jpg", thumb: "10.webp" },
  { full: "9.jpg", thumb: "9.webp" },
  { full: "8.jpg", thumb: "8.webp" },
  { full: "7.jpg", thumb: "7.webp" },
  { full: "6.jpg", thumb: "6.webp" },
  { full: "5.jpg", thumb: "5.webp" },
  { full: "4.jpg", thumb: "4.webp" },
  { full: "3.jpg", thumb: "3.webp" },
  { full: "2.jpg", thumb: "2.webp" },
  { full: "1.jpg", thumb: "1.webp" }
];

const paths = {
  full: "assets/images/vouches/full/",
  thumb: "assets/images/vouches/thumbs/"
};

function track(label) {
  if (typeof window.gtag === "function") {
    window.gtag("event", "button_click", {
      event_category: "engagement",
      event_label: label
    });
  }
}

document.querySelectorAll(".track-link").forEach((link) => {
  link.addEventListener("click", () => track(link.dataset.label || "link"));
});

const strip = document.querySelector("#strip");
const stripCaption = document.querySelector("#stripCaption");
if (stripCaption) {
  stripCaption.textContent = vouches.length + " verified conversations";
}

vouches.forEach((vouch, index) => {
  const button = document.createElement("button");
  const image = document.createElement("img");

  button.type = "button";
  button.setAttribute("aria-label", "Open customer vouch " + (index + 1) + " of " + vouches.length);

  image.src = paths.thumb + vouch.thumb;
  image.alt = "Customer vouch " + (index + 1);
  image.width = 220;
  image.height = 391;
  image.decoding = "async";
  image.loading = index < 4 ? "eager" : "lazy";
  if (index < 2) {
    image.fetchPriority = "high";
  }

  button.appendChild(image);
  button.addEventListener("click", () => openVouch(index));
  strip.appendChild(button);
});

const vouchDialog = document.querySelector("#vouchViewer");
const vvImg = document.querySelector("#vvImg");
const vvCount = document.querySelector("#vvCount");
const vvClose = document.querySelector("#vvClose");
const vvPrev = document.querySelector("#vvPrev");
const vvNext = document.querySelector("#vvNext");
let currentIndex = 0;

function renderVouch() {
  const vouch = vouches[currentIndex];
  vvImg.src = paths.full + vouch.full;
  vvImg.alt = "Customer vouch " + (currentIndex + 1) + " of " + vouches.length;
  vvCount.textContent = (currentIndex + 1) + " / " + vouches.length;

  const nextIndex = (currentIndex + 1) % vouches.length;
  const previousIndex = (currentIndex - 1 + vouches.length) % vouches.length;
  [nextIndex, previousIndex].forEach((index) => {
    const preload = new Image();
    preload.src = paths.full + vouches[index].full;
  });
}

function openVouch(index) {
  currentIndex = index;
  renderVouch();
  vouchDialog.showModal();
  track("open_vouch");
}

vvClose.addEventListener("click", () => vouchDialog.close());
vvPrev.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + vouches.length) % vouches.length;
  renderVouch();
});
vvNext.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % vouches.length;
  renderVouch();
});
vouchDialog.addEventListener("click", (event) => {
  if (event.target === vouchDialog) {
    vouchDialog.close();
  }
});
vouchDialog.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    currentIndex = (currentIndex - 1 + vouches.length) % vouches.length;
    renderVouch();
  }
  if (event.key === "ArrowRight") {
    currentIndex = (currentIndex + 1) % vouches.length;
    renderVouch();
  }
});
vouchDialog.addEventListener("close", () => {
  vvImg.removeAttribute("src");
});

let touchStartX = null;
vouchDialog.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });
vouchDialog.addEventListener("touchend", (event) => {
  if (touchStartX === null) return;
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) > 55) {
    if (distance > 0) {
      currentIndex = (currentIndex - 1 + vouches.length) % vouches.length;
    } else {
      currentIndex = (currentIndex + 1) % vouches.length;
    }
    renderVouch();
  }
  touchStartX = null;
}, { passive: true });

const leaveDialog = document.querySelector("#leaveDialog");
const ldContinue = document.querySelector("#ldContinue");
const ldCancel = document.querySelector("#ldCancel");

document.querySelectorAll("a.leaves-site").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    ldContinue.href = link.href;
    leaveDialog.showModal();
  });
});
ldCancel.addEventListener("click", () => leaveDialog.close());
leaveDialog.addEventListener("click", (event) => {
  if (event.target === leaveDialog) {
    leaveDialog.close();
  }
});
