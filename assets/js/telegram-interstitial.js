(() => {
  const telegramLinks = document.querySelectorAll(
    'a[href="https://t.me/TurntUpStoreBot"], a[href="https://t.me/+mu_PtvpRM_QwNWEx"], a[href="https://t.me/TurntUpTerpzdotCom"]'
  );

  if (!telegramLinks.length || typeof HTMLDialogElement === "undefined") {
    return;
  }

  const dialog = document.createElement("dialog");
  dialog.className = "message-interstitial";
  dialog.setAttribute("aria-labelledby", "telegramInterstitialTitle");
  dialog.innerHTML = `
    <div class="message-interstitial-header">
      <span class="message-interstitial-icon" aria-hidden="true">...</span>
      <button class="icon-button" type="button" data-telegram-close aria-label="Close Telegram instructions">&times;</button>
    </div>
    <p class="section-kicker">Before you open Telegram</p>
    <h2 id="telegramInterstitialTitle">Open this page in your browser</h2>
    <p class="message-interstitial-copy">
      If you're viewing this page in TikTok, tap the three dots in the top-right corner,
      then press <strong>Open in browser</strong>. This lets your phone open Telegram correctly.
    </p>
    <ol class="message-interstitial-steps">
      <li><span>1</span> Tap the three dots in the top-right corner</li>
      <li><span>2</span> Press "Open in browser"</li>
    </ol>
    <div class="message-interstitial-actions">
      <button type="button" data-telegram-close>Not now</button>
      <a href="https://t.me/" data-telegram-continue>Continue to Telegram</a>
    </div>
  `;
  document.body.append(dialog);

  const continueLink = dialog.querySelector("[data-telegram-continue]");
  const closeButtons = dialog.querySelectorAll("[data-telegram-close]");
  let returnFocus = null;

  telegramLinks.forEach((link) => {
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
