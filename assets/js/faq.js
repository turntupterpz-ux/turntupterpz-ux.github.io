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
