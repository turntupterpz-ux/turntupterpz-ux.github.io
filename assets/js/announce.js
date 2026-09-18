(function () {
  const dialog = document.querySelector("#announceDialog");
  if (!dialog) return;

  function close() {
    if (dialog.open) dialog.close();
  }

  dialog.showModal();
  if (typeof track === "function") track("announce_shown");

  document.querySelector("#anClose").addEventListener("click", close);
  document.querySelector("#anSkip").addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });

  // Step aside so the in-app browser prompt, if it fires, is the only thing up.
  dialog.querySelector(".an-cta").addEventListener("click", close);
})();
