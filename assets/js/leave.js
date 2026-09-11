(function () {
  const UA = navigator.userAgent || "";
  const simulated = new URLSearchParams(location.search).get("sim");
  const inTikTok = simulated === "tiktok" || /BytedanceWebview|musical_ly|Trill/i.test(UA);
  const inInstagram = simulated === "instagram" || /Instagram/i.test(UA);
  const inFacebook = simulated === "facebook" || /FBAN|FBAV|FB_IAB/i.test(UA);
  const inAppBrowser = inTikTok || inInstagram || inFacebook;
  const isAndroid = /Android/i.test(UA);

  const appName = inTikTok ? "TikTok" : inInstagram ? "Instagram" : inFacebook ? "Facebook" : "This app";
  const menuLabel = inInstagram ? "Open in external browser"
    : inFacebook ? "Open in Safari"
    : "Open in browser";
  const browserName = isAndroid ? "Chrome" : "Safari";

  const leaveDialog = document.querySelector("#leaveDialog");
  const ldCopy = document.querySelector("#ldCopy");
  const ldCopyText = document.querySelector("#ldCopyText");
  const ldCancel = document.querySelector("#ldCancel");

  let pendingHref = "";

  function report(label) {
    if (typeof track === "function") track(label);
  }

  // An sms: URL is meaningless pasted into a browser, so hand over the bare
  // number instead and point people at Messages rather than Safari.
  function isTextLink(href) {
    return href.indexOf("sms:") === 0;
  }

  function copyTarget(href) {
    return isTextLink(href) ? decodeURIComponent(href.slice(4).split("?")[0]) : href;
  }

  function describe(href) {
    return isTextLink(href)
      ? { app: "Messages", button: "Copy my number", pasteInto: "Messages" }
      : { app: "Telegram", button: "Copy my Telegram link", pasteInto: browserName };
  }

  // Android can still hand a tg:// intent to the native app from inside a
  // webview. Every iOS equivalent is blocked, so there is no iOS counterpart.
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

  function openPrompt(wording) {
    if (!leaveDialog || leaveDialog.open) return;
    document.querySelector("#ldSub").textContent = appName
      + "'s built-in browser blocks " + wording.app
      + " from opening. Your real browser works fine.";
    ldCopy.dataset.done = "0";
    ldCopyText.textContent = wording.button;
    leaveDialog.showModal();
    report("leave_prompt_shown");
  }

  if (leaveDialog) {
    document.querySelector("#ldMenuLabel").textContent = menuLabel;

    ldCopy.addEventListener("click", async () => {
      const target = copyTarget(pendingHref || location.href);
      const copied = await copyLink(target);
      ldCopy.dataset.done = copied ? "1" : "0";
      ldCopyText.textContent = copied
        ? "Copied — paste it in " + describe(pendingHref).pasteInto
        : "Press and hold to copy it";
      report(copied ? "leave_copy_ok" : "leave_copy_failed");
    });

    ldCancel.addEventListener("click", () => {
      leaveDialog.close();
      report("leave_continue_anyway");
      if (pendingHref) window.location.href = pendingHref;
    });

    leaveDialog.addEventListener("click", (event) => {
      if (event.target === leaveDialog) leaveDialog.close();
    });
  }

  document.querySelectorAll("a.leaves-site").forEach((link) => {
    link.addEventListener("click", (event) => {
      // Outside an in-app browser the link works, so stay out of the way.
      if (!inAppBrowser || !leaveDialog) return;

      event.preventDefault();
      pendingHref = link.href;

      const wording = describe(pendingHref);

      const intent = telegramIntent(pendingHref);
      if (intent) {
        report("leave_android_intent");
        // If the app handoff does not take, the visitor would otherwise be left
        // with nothing, so fall back to the prompt when we are still here.
        const fallback = setTimeout(() => openPrompt(wording), 1200);
        window.addEventListener("pagehide", () => clearTimeout(fallback), { once: true });
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) clearTimeout(fallback);
        }, { once: true });
        window.location.href = intent;
        return;
      }
      openPrompt(wording);
    });
  });
})();
