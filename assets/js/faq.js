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

