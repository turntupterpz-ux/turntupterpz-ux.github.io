// Shared bits for the "escape TikTok's browser" drafts (/drafts/escape/).
//
// Each draft is the live homepage with leave.js swapped for one new idea (escape.js in its folder).
// This file works out where the visitor is and hands each draft the same small toolkit:
//
//   ESC.app        "tiktok" | "instagram" | "facebook" | null (a real browser)
//   ESC.appName    "TikTok" …           ESC.menu   the menu item to tap, e.g. "Open in browser"
//   ESC.os         "ios" | "android"    ESC.browser "Safari" | "Chrome"
//   ESC.onTap(fn)  fn(link) runs when an in-app visitor taps a Telegram link (the tap is held back)
//   ESC.dots()     where the in-app ••• button is on screen (to point at it)
//   ESC.copy(text) copies, resolves true/false        ESC.toast(html)   small message up top
//
// Previews: on a normal phone the drafts PRETEND to be inside TikTok so you can see the idea.
// A fake TikTok browser bar is drawn at the top; its ••• menu really "escapes" (reloads as Safari).
// ?sim=tiktok|instagram|facebook|none and ?os=ios|android pick what to pretend; the DRAFT tab on the
// right edge switches them.
(function () {
  const qs = new URLSearchParams(location.search);
  const UA = navigator.userAgent || "";
  const real = /BytedanceWebview|musical_ly|Trill|TikTok|ByteLocale/i.test(UA) ? "tiktok"
    : /Instagram/i.test(UA) ? "instagram"
    : /FBAN|FBAV|FB_IAB/i.test(UA) ? "facebook" : null;
  const want = qs.get("sim");
  const sim = real ? null : (want === "none" ? null : (["tiktok", "instagram", "facebook"].includes(want) ? want : "tiktok"));
  const app = real || sim;
  const os = qs.get("os") === "android" || (!qs.get("os") && /Android/i.test(UA)) ? "android" : "ios";
  const browser = os === "android" ? "Chrome" : "Safari";
  const appName = { tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook" }[app] || "";
  const menu = !app ? ""
    : app === "tiktok" ? (os === "android" ? "Open in external browser" : "Open in browser")
    : app === "instagram" ? "Open in external browser"
    : (os === "android" ? "Open in Chrome" : "Open in Safari");
  const root = document.documentElement;
  if (app) root.classList.add("esc-inapp", "esc-" + app);
  if (sim) root.classList.add("esc-fake");

  const handlers = [];
  const ESC = {
    app, appName, menu, os, browser, sim: !!sim, real: !!real,
    onTap(fn) { handlers.push(fn); },
    dots() {
      const d = document.querySelector(".fx-dots");
      if (d) return d.getBoundingClientRect();
      // the real ••• lives in the app's own bar, just above the page, top right
      const w = window.innerWidth;
      return { left: w - 44, right: w - 8, top: -40, bottom: -4, width: 36, height: 36 };
    },
    copy(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(() => true, () => legacyCopy(text));
      }
      return Promise.resolve(legacyCopy(text));
    },
    toast(html, ms) {
      const t = document.createElement("div");
      t.className = "fx-toast";
      t.setAttribute("role", "status");
      t.innerHTML = html;
      document.body.appendChild(t);
      requestAnimationFrame(() => t.classList.add("on"));
      setTimeout(() => { t.classList.remove("on"); setTimeout(() => t.remove(), 400); }, ms || 3200);
    },
    fill(scope) {
      (scope || document).querySelectorAll("[data-esc]").forEach((n) => {
        n.textContent = { app: appName, menu, browser }[n.dataset.esc] || n.textContent;
      });
    },
    track(label) { if (typeof window.track === "function") window.track(label); }
  };
  window.ESC = ESC;

  function legacyCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  // Android can still hand a link to the Telegram app from inside the webview (same trick as leave.js).
  function intentFor(href) {
    if (!real || os !== "android") return null;
    const folder = href.match(/^https:\/\/t\.me\/addlist\/([^?#/]+)/);
    if (folder) return "intent://addlist?slug=" + folder[1] + "#Intent;scheme=tg;package=org.telegram.messenger;S.browser_fallback_url=" + encodeURIComponent(href) + ";end";
    const user = href.match(/^https:\/\/t\.me\/([A-Za-z0-9_]+)(?:\?text=(.*))?$/);
    if (user) return "intent://resolve?domain=" + user[1] + (user[2] ? "&text=" + user[2] : "") + "#Intent;scheme=tg;package=org.telegram.messenger;S.browser_fallback_url=" + encodeURIComponent(href) + ";end";
    return null;
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest && event.target.closest("a.leaves-site");
    if (!link || !app) return;
    event.preventDefault();
    const run = () => handlers.forEach((fn) => fn(link));
    const intent = intentFor(link.href);
    if (intent) {
      const fallback = setTimeout(run, 1200);
      window.addEventListener("pagehide", () => clearTimeout(fallback), { once: true });
      document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(fallback); }, { once: true });
      location.href = intent;
      return;
    }
    run();
  }, true);

  // ------------------------------------------------------------------ preview helpers (drafts only)
  function withParams(changes) {
    const u = new URL(location.href);
    Object.entries(changes).forEach(([k, v]) => (v === null ? u.searchParams.delete(k) : u.searchParams.set(k, v)));
    u.hash = "";
    return u.href;
  }

  function fakeChrome() {
    const bar = document.createElement("div");
    bar.className = "fx-chrome";
    bar.setAttribute("aria-label", "Pretend " + appName + " browser bar (draft preview)");
    bar.innerHTML = '<span class="fx-x" aria-hidden="true">&#10005;</span>'
      + '<span class="fx-url"><b>TurntUpTerpz</b><small>turntupterpz.com</small></span>'
      + '<button class="fx-dots" type="button" aria-label="' + appName + ' menu">&#8943;</button>';
    document.body.prepend(bar);

    const sheet = document.createElement("div");
    sheet.className = "fx-sheet";
    sheet.hidden = true;
    sheet.innerHTML = '<div class="fx-sheet-in">'
      + '<button type="button" data-fx="open"><span>&#129517;</span>' + menu + '</button>'
      + '<button type="button" data-fx="copy"><span>&#128279;</span>Copy link</button>'
      + '<button type="button" data-fx="refresh"><span>&#8635;</span>Refresh</button>'
      + '<button type="button" data-fx="cancel" class="fx-cancel">Cancel</button></div>';
    document.body.appendChild(sheet);

    const close = () => { sheet.classList.remove("on"); setTimeout(() => { sheet.hidden = true; }, 250); };
    bar.querySelector(".fx-dots").addEventListener("click", () => {
      sheet.hidden = false;
      requestAnimationFrame(() => sheet.classList.add("on"));
      document.dispatchEvent(new CustomEvent("esc:dots"));
    });
    sheet.addEventListener("click", (e) => {
      const b = e.target.closest("[data-fx]");
      if (e.target === sheet) return close();
      if (!b) return;
      const act = b.dataset.fx;
      if (act === "open") location.href = withParams({ sim: "none", escaped: "1" });
      else if (act === "copy") ESC.copy(withParams({ sim: null, os: null })).then(() => { close(); ESC.toast("Link copied"); });
      else if (act === "refresh") location.reload();
      else close();
    });
  }

  function draftTab() {
    const tab = document.createElement("div");
    tab.className = "fx-tab";
    const pick = (key, val, label) => {
      const on = key === "sim" ? (val === "none" ? !app : app === val) : os === val;
      return '<a class="' + (on ? "on" : "") + '" href="' + withParams({ [key]: val, escaped: null }) + '">' + label + "</a>";
    };
    tab.innerHTML = '<button type="button" class="fx-tab-btn" aria-expanded="false">Draft</button>'
      + '<div class="fx-tab-panel" hidden><b>Preview as</b>'
      + '<div>' + pick("sim", "tiktok", "TikTok") + pick("sim", "instagram", "Instagram") + pick("sim", "none", browser) + "</div>"
      + '<div>' + pick("os", "ios", "iPhone") + pick("os", "android", "Android") + "</div>"
      + '<a class="fx-replay" href="' + withParams({ replay: Date.now() }) + '">&#8635; Replay from the start</a>'
      + '<a class="fx-all" href="../">All escape drafts</a></div>';
    document.body.appendChild(tab);
    const btn = tab.querySelector(".fx-tab-btn");
    const panel = tab.querySelector(".fx-tab-panel");
    btn.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", String(!panel.hidden));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (qs.get("replay")) { try { sessionStorage.clear(); localStorage.removeItem("esc-seen"); } catch (e) { /* ignore */ } }
    if (sim) fakeChrome();
    draftTab();
    ESC.fill();
    if (!app && qs.get("escaped")) {
      ESC.toast("&#10003; You're in " + browser + " now. Telegram buttons open normally here.", 4200);
    }
  });
})();
