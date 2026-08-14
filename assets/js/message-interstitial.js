(() => {
  const messageLinks = document.querySelectorAll('a[href^="mailto:"]');

  if (!messageLinks.length || typeof HTMLDialogElement === "undefined") {
    return;
  }

  const dialog = document.createElement("dialog");
  dialog.className = "message-interstitial";
  dialog.setAttribute("aria-labelledby", "messageInterstitialTitle");
  dialog.innerHTML = `
    <div class="message-interstitial-header">
      <span class="message-interstitial-icon" aria-hidden="true">...</span>
      <button class="icon-button" type="button" data-message-close aria-label="Close message instructions">&times;</button>
    </div>
    <p class="section-kicker">Before you message</p>
    <h2 id="messageInterstitialTitle">Open this page in your browser</h2>
    <p class="message-interstitial-copy">
      Tap the three dots in the top-right corner, then press <strong>Open in browser</strong>.
      This lets your phone open iMessage or email correctly.
    </p>
    <ol class="message-interstitial-steps">
      <li><span>1</span> Tap the three dots in the top-right corner</li>
      <li><span>2</span> Press "Open in browser"</li>
    </ol>
    <div class="message-interstitial-actions">
      <button type="button" data-message-close>Not now</button>
      <a href="mailto:" data-message-continue>Continue to message</a>
    </div>
  `;
  document.body.append(dialog);

  const continueLink = dialog.querySelector("[data-message-continue]");
  const closeButtons = dialog.querySelectorAll("[data-message-close]");
  let returnFocus = null;

  messageLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      returnFocus = link;
      continueLink.href = link.href;
      dialog.showModal();
      continueLink.focus();
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => dialog.close());
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener("close", () => {
    returnFocus?.focus();
  });
})();
