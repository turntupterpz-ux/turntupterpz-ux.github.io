// "Coach": helps visitors get out of TikTok / Instagram / Facebook's built-in browser,
// which blocks Telegram and WhatsApp links. (Replaces leave.js on the homepage, menu and FAQ.)
//
// Inside those apps only:
//   · a hint chip near the top points at the app's ••• button the whole visit
//   · tapping any Telegram or WhatsApp button (a.leaves-site) opens a coach card: a looping mini phone acts out
//     the taps (••• → Open in browser → Order), with the steps listed and a Copy link fallback
//   · "Got it" points an arrow at the real ••• button for a few seconds
//   · on Android the link is first handed straight to the Telegram / WhatsApp app (same trick leave.js used)
// Everyone else never sees any of it. Test in a normal browser with ?sim=tiktok, ?sim=instagram or
// ?sim=facebook on the end of the URL (add &os=android for the Android wording).
(function () {
  const qs = new URLSearchParams(location.search);
  const UA = navigator.userAgent || "";
  const sim = qs.get("sim");
  const app = sim === "tiktok" || /BytedanceWebview|musical_ly|Trill|TikTok|ByteLocale/i.test(UA) ? "tiktok"
    : sim === "instagram" || /Instagram/i.test(UA) ? "instagram"
    : sim === "facebook" || /FBAN|FBAV|FB_IAB/i.test(UA) ? "facebook" : null;
  if (!app) return;

  const android = qs.get("os") === "android" || (qs.get("os") !== "ios" && /Android/i.test(UA));
  const browser = android ? "Chrome" : "Safari";
  const appName = { tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook" }[app];
  const menu = app === "tiktok" ? (android ? "Open in external browser" : "Open in browser")
    : app === "instagram" ? "Open in external browser"
    : (android ? "Open in Chrome" : "Open in Safari");
  const report = (label) => { if (typeof window.track === "function") window.track(label); };
  let href = "https://t.me/addlist/u3J2k7PsK3w5MzQx";

  const html = `
    <button class="cc-hint" type="button" aria-label="How to open Telegram and WhatsApp links">
      <span class="cc-hint-up" aria-hidden="true">&uarr;</span>
      <span>Tap <b>&#8943;</b> &rarr; <b data-cc="menu"></b> to order</span>
    </button>
    <div class="cc-up" aria-hidden="true"><span>&uarr;</span><b>&#8943; is up here</b></div>
    <div class="cc" hidden>
      <div class="cc-dim"></div>
      <section class="cc-card" role="dialog" aria-modal="true" aria-labelledby="ccTitle">
        <p class="cc-k"><span data-cc="app"></span> won't open <span data-cc-target>Telegram</span></p>
        <h3 id="ccTitle">Copy these 3 taps</h3>
        <div class="cc-body">
          <div class="cc-phone" aria-hidden="true">
            <div class="m-bar"><span>&#10005;</span><i></i><span class="m-dots">&#8943;</span></div>
            <div class="m-page"><i></i><i></i><i class="s"></i><i></i><i class="s"></i><span class="m-order">Order</span></div>
            <div class="m-sheet"><span class="m-open" data-cc="menu"></span><span>Copy link</span><span>Refresh</span></div>
            <div class="m-safari"><span class="m-compass"></span><i></i></div>
            <div class="m-tg"><svg class="m-wa" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.9 5-1.3A9.8 9.8 0 1 0 12 2.2ZM8.5 7.2c.3-.4.7-.4 1-.1l1.2 1.9c.2.3.1.7-.2 1l-.6.6c.6 1.3 1.6 2.3 2.9 2.9l.6-.6c.3-.3.7-.4 1-.2l1.9 1.2c.3.2.3.7-.1 1l-.9.9c-.6.6-1.6.7-2.4.3-2.3-1.1-4.2-3-5.3-5.3-.4-.8-.3-1.8.3-2.4Z"/></svg><svg class="m-tgi" viewBox="0 0 24 24"><path fill="currentColor" d="M21.4 4.1 2.9 11.3c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.8.8s.6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.8-1.3-1.4Z"/></svg></div>
            <span class="m-finger"></span>
          </div>
          <ol class="cc-steps">
            <li><b>1</b><span>Tap <span class="cc-chip">&#8943;</span> top right</span></li>
            <li><b>2</b><span>Tap <span class="cc-chip" data-cc="menu"></span></span></li>
            <li><b>3</b><span>Tap it again. <span data-cc-target>Telegram</span> opens.</span></li>
          </ol>
        </div>
        <div class="cc-btns">
          <button class="cc-go" type="button">Got it, show me &uarr;</button>
          <button class="cc-copy" type="button">Copy link instead</button>
        </div>
      </section>
    </div>`;

  // Android can still hand a link to the Telegram / WhatsApp app from inside the webview.
  function intentFor(link) {
    if (!android || sim) return null;
    const wa = link.match(/^https:\/\/(chat\.whatsapp\.com|wa\.me)\/(.+)$/);
    if (wa) return "intent://" + wa[1] + "/" + wa[2] + "#Intent;scheme=https;package=com.whatsapp;S.browser_fallback_url=" + encodeURIComponent(link) + ";end";
    const folder = link.match(/^https:\/\/t\.me\/addlist\/([^?#/]+)/);
    if (folder) return "intent://addlist?slug=" + folder[1] + "#Intent;scheme=tg;package=org.telegram.messenger;S.browser_fallback_url=" + encodeURIComponent(link) + ";end";
    const user = link.match(/^https:\/\/t\.me\/([A-Za-z0-9_]+)(?:\?text=(.*))?$/);
    if (user) return "intent://resolve?domain=" + user[1] + (user[2] ? "&text=" + user[2] : "") + "#Intent;scheme=tg;package=org.telegram.messenger;S.browser_fallback_url=" + encodeURIComponent(link) + ";end";
    return null;
  }

  function copy(text) {
    const legacy = () => {
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
    };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(() => true, legacy);
    return Promise.resolve(legacy());
  }

  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;

  function placeHint() {
    const bar = document.querySelector("header.bar");
    const top = bar && getComputedStyle(bar).position === "fixed" ? bar.getBoundingClientRect().bottom + 6 : 10;
    $(".cc-hint").style.top = "calc(" + Math.round(top) + "px + " + (bar ? "0px" : "env(safe-area-inset-top)") + ")";
  }

  function open(link) {
    if (link) href = link.href;
    const target = /whatsapp\.com|wa\.me/.test(href) ? "WhatsApp" : "Telegram";
    document.querySelectorAll("[data-cc-target]").forEach((n) => { n.textContent = target; });
    $(".cc").dataset.target = target.toLowerCase();
    $(".cc-copy").textContent = "Copy link instead";
    const box = $(".cc");
    box.hidden = false;
    root.classList.add("cc-open");
    requestAnimationFrame(() => box.classList.add("on"));
    $(".cc-go").focus({ preventScroll: true });
    report("coach_open");
  }

  function close(point) {
    const box = $(".cc");
    box.classList.remove("on");
    root.classList.remove("cc-open");
    setTimeout(() => { box.hidden = true; }, 300);
    if (point) {
      root.classList.add("cc-spot");
      clearTimeout(close.t);
      close.t = setTimeout(() => root.classList.remove("cc-spot"), 7000);
    }
  }

  function start() {
    root.classList.add("cc-inapp");
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    while (wrap.firstElementChild) document.body.appendChild(wrap.firstElementChild);
    document.querySelectorAll("[data-cc]").forEach((n) => { n.textContent = n.dataset.cc === "app" ? appName : menu; });
    placeHint();
    window.addEventListener("resize", placeHint);

    $(".cc-hint").addEventListener("click", () => { open(null); report("coach_hint"); });
    $(".cc-go").addEventListener("click", () => { close(true); report("coach_got_it"); });
    $(".cc-dim").addEventListener("click", () => close(false));
    $(".cc-copy").addEventListener("click", (e) => {
      const b = e.currentTarget;
      copy(href).then((ok) => {
        b.textContent = ok ? "Copied ✓ Paste it in " + browser : "Couldn't copy, use the 3 taps";
        report(ok ? "coach_copy" : "coach_copy_failed");
      });
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("cc-open")) close(false); });

    // every Telegram and WhatsApp button, including ones pages build later
    document.addEventListener("click", (event) => {
      const link = event.target.closest && event.target.closest("a.leaves-site");
      if (!link) return;
      event.preventDefault();
      const intent = intentFor(link.href);
      if (intent) {
        report("coach_android_intent");
        const fallback = setTimeout(() => open(link), 1200);
        window.addEventListener("pagehide", () => clearTimeout(fallback), { once: true });
        document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(fallback); }, { once: true });
        location.href = intent;
        return;
      }
      open(link);
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
