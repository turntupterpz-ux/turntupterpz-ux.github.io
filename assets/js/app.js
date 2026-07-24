const vouches = [
  { full: "42.png", thumb: "42.webp" },
  { full: "43.png", thumb: "43.webp" },
  { full: "44.png", thumb: "44.webp" },
  { full: "45.png", thumb: "45.webp" },
  { full: "46.png", thumb: "46.webp" },
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

const gallery = document.querySelector("#vouchGallery");
const loadMoreButton = document.querySelector("#loadMoreButton");
const remainingCount = document.querySelector("#remainingCount");
const vouchDialog = document.querySelector("#vouchDialog");
const fullVouchImage = document.querySelector("#fullVouchImage");
const vouchCounter = document.querySelector("#vouchCounter");
const closeVouchButton = document.querySelector("#closeVouchButton");
const previousVouchButton = document.querySelector("#previousVouchButton");
const nextVouchButton = document.querySelector("#nextVouchButton");
const viewerStage = document.querySelector("#viewerStage");

const pageSize = 10;
let renderedCount = 0;
let currentVouchIndex = 0;
let touchStartX = null;
let touchStartY = null;

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

function createVouchCard(vouch, index) {
  const button = document.createElement("button");
  const image = document.createElement("img");
  const number = document.createElement("span");

  button.className = "vouch-card";
  button.type = "button";
  button.setAttribute("aria-label", `Open customer vouch ${index + 1} of ${vouches.length}`);

  image.src = paths.thumb + vouch.thumb;
  image.alt = `Customer vouch ${index + 1}`;
  image.width = 440;
  image.height = 953;
  image.decoding = "async";
  image.loading = index < 4 ? "eager" : "lazy";

  if (index < 2) {
    image.fetchPriority = "high";
  }

  number.className = "vouch-number";
  number.textContent = String(index + 1).padStart(2, "0");

  button.append(image, number);
  button.addEventListener("click", () => openVouch(index));
  return button;
}

function renderNextVouches() {
  const nextCount = Math.min(renderedCount + pageSize, vouches.length);
  const fragment = document.createDocumentFragment();

  for (let index = renderedCount; index < nextCount; index += 1) {
    fragment.append(createVouchCard(vouches[index], index));
  }

  gallery.append(fragment);
  renderedCount = nextCount;

  const remaining = vouches.length - renderedCount;
  remainingCount.textContent = remaining > 0 ? `${remaining} remaining` : "";
  loadMoreButton.hidden = remaining === 0;
}

function setModalState(isOpen) {
  document.body.classList.toggle("modal-open", isOpen);
}

function updateVouchViewer() {
  const vouch = vouches[currentVouchIndex];
  fullVouchImage.src = paths.full + vouch.full;
  fullVouchImage.alt = `Customer vouch ${currentVouchIndex + 1} of ${vouches.length}`;
  vouchCounter.textContent = `${currentVouchIndex + 1} of ${vouches.length}`;

  const nextIndex = (currentVouchIndex + 1) % vouches.length;
  const previousIndex = (currentVouchIndex - 1 + vouches.length) % vouches.length;

  [nextIndex, previousIndex].forEach((index) => {
    const preload = new Image();
    preload.src = paths.full + vouches[index].full;
  });
}

function openVouch(index) {
  currentVouchIndex = index;
  updateVouchViewer();
  vouchDialog.showModal();
  setModalState(true);
  closeVouchButton.focus();
  track("open_vouch");
}

function closeVouch() {
  vouchDialog.close();
}

function showPreviousVouch() {
  currentVouchIndex = (currentVouchIndex - 1 + vouches.length) % vouches.length;
  updateVouchViewer();
}

function showNextVouch() {
  currentVouchIndex = (currentVouchIndex + 1) % vouches.length;
  updateVouchViewer();
}

loadMoreButton.addEventListener("click", renderNextVouches);
closeVouchButton.addEventListener("click", closeVouch);
previousVouchButton.addEventListener("click", showPreviousVouch);
nextVouchButton.addEventListener("click", showNextVouch);

vouchDialog.addEventListener("close", () => {
  setModalState(false);
  fullVouchImage.removeAttribute("src");
});

vouchDialog.addEventListener("click", (event) => {
  if (event.target === vouchDialog) {
    closeVouch();
  }
});

vouchDialog.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    showPreviousVouch();
  }

  if (event.key === "ArrowRight") {
    showNextVouch();
  }
});

viewerStage.addEventListener("touchstart", (event) => {
  const [touch] = event.changedTouches;
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

viewerStage.addEventListener("touchend", (event) => {
  if (touchStartX === null || touchStartY === null) {
    return;
  }

  const [touch] = event.changedTouches;
  const distanceX = touch.clientX - touchStartX;
  const distanceY = touch.clientY - touchStartY;

  if (Math.abs(distanceX) > 55 && Math.abs(distanceX) > Math.abs(distanceY) * 1.2) {
    if (distanceX > 0) {
      showPreviousVouch();
    } else {
      showNextVouch();
    }
  }

  touchStartX = null;
  touchStartY = null;
}, { passive: true });

const menuButton = document.querySelector("#menuButton");
const menuDialog = document.querySelector("#menuDialog");
const closeMenuButton = document.querySelector("#closeMenuButton");
const menuImage = document.querySelector("#menuImage");
const menuTabs = document.querySelectorAll(".menu-tab");
const inventoryPanel = document.querySelector("#inventoryPanel");
const menuImagePanel = document.querySelector("#menuImagePanel");
const openMenuOriginal = document.querySelector("#openMenuOriginal");

function selectMenuTab(tab, shouldTrack = true) {
  menuTabs.forEach((item) => {
    const isActive = item === tab;
    item.classList.toggle("active", isActive);
    item.setAttribute("aria-selected", String(isActive));
  });

  const showsImage = tab.dataset.menuPanel === "image";
  inventoryPanel.hidden = showsImage;
  menuImagePanel.hidden = !showsImage;
  openMenuOriginal.hidden = !showsImage;

  if (showsImage) {
    menuImage.src = tab.dataset.menuImage;
    menuImage.alt = tab.dataset.menuAlt;
    openMenuOriginal.href = tab.dataset.menuFull;
  }

  if (shouldTrack) {
    track(`menu_tab_${tab.textContent.trim().toLowerCase().replace(" ", "_")}`);
  }
}

menuButton.addEventListener("click", () => {
  selectMenuTab(menuTabs[0], false);
  menuDialog.showModal();
  setModalState(true);
  closeMenuButton.focus();
  track("open_menu");
});

closeMenuButton.addEventListener("click", () => menuDialog.close());

menuDialog.addEventListener("close", () => {
  setModalState(false);
});

menuDialog.addEventListener("click", (event) => {
  if (event.target === menuDialog) {
    menuDialog.close();
  }
});

menuTabs.forEach((tab) => {
  tab.addEventListener("click", () => selectMenuTab(tab));
});

renderNextVouches();
