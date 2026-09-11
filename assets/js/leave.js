const UA = navigator.userAgent || "";
const simulated = new URLSearchParams(location.search).get("sim");
const inTikTok = simulated === "tiktok" || /BytedanceWebview|musical_ly|Trill/i.test(UA);
const inInstagram = simulated === "instagram" || /Instagram/i.test(UA);
const inFacebook = simulated === "facebook" || /FBAN|FBAV|FB_IAB/i.test(UA);
const inAppBrowser = inTikTok || inInstagram || inFacebook;
const isAndroid = /Android/i.test(UA);

const appName = inTikTok ? "TikTok" : inInstagram ? "Instagram" : inFacebook ? "Facebook" : "this app";
const menuLabel = inInstagram ? "Open in external browser"
  : inFacebook ? "Open in Safari"
  : "Open in browser";
const browserName = isAndroid ? "Chrome" : "Safari";

const leaveDialog = document.querySelector("#leaveDialog");
const ldCopy = document.querySelector("#ldCopy");
const ldCopyText = document.querySelector("#ldCopyText");
const ldCancel = document.querySelector("#ldCancel");
let pendingHref = "";

// Android can still hand a tg:// intent to the native app from inside a webview,
// which skips the dialog entirely. Every iOS equivalent is blocked.
function telegramIntent(href) {
  const match = href.match(/^https:\/\/t\.me\/(\+?)([^?#]+)/);
  if (!match || !isAndroid) return null;
  const target = match[1] === "+" ? "join?invite=" + match[2] : "resolve?domain=" + match[2];
  return "intent://" + target + "#Intent;scheme=tg;package=org.telegram.messenger;"
    + "S.browser_fallback_url=" + encodeURIComponent(href) + ";end";
}

async function copyLink(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    const field = document.createElement("textarea");
    field.value = text;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (fallbackError) {
      copied = false;
    }
    document.body.removeChild(field);
    return copied;
  }
}

if (leaveDialog) {
  document.querySelector("#ldSub").textContent =
    appName + "'s built-in browser blocks Telegram from opening. Your real browser works fine.";
  document.querySelector("#ldMenuLabel").textContent = menuLabel;

  document.querySelectorAll("a.leaves-site").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (!inAppBrowser) return;
      event.preventDefault();
      pendingHref = link.href;

      const intent = telegramIntent(pendingHref);
      if (intent) {
        window.location.href = intent;
        return;
      }

      ldCopy.dataset.done = "0";
      ldCopyText.textContent = "Copy my link instead";
      leaveDialog.showModal();
    });
  });

  ldCopy.addEventListener("click", async () => {
    const copied = await copyLink(pendingHref || location.href);
    ldCopy.dataset.done = copied ? "1" : "0";
    ldCopyText.textContent = copied
      ? "Copied — paste it in " + browserName
      : "Press and hold the link to copy";
  });

  ldCancel.addEventListener("click", () => {
    leaveDialog.close();
    if (pendingHref) window.location.href = pendingHref;
  });

  leaveDialog.addEventListener("click", (event) => {
    if (event.target === leaveDialog) leaveDialog.close();
  });
}
