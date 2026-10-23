// Escape 3 · Gate — tell them up front, then keep it visible.
// Visitors from TikTok land on a full-screen heads-up (once per visit) with a big arrow at •••.
// After that, ordering reads as "locked": a strip under the header and the Order buttons say
// "Unlock ordering", and any Telegram tap brings up a compact version of the same two steps.
(function () {
  const E = window.ESC;
  const KEY = "esc3-seen";
  let href = "https://t.me/addlist/u3J2k7PsK3w5MzQx";

  const html = `
    <div class="g3" hidden>
      <div class="g3-bg" aria-hidden="true">
        <svg style="left:8%;top:62%;width:64px"><use href="#dabber"/></svg>
        <svg style="left:74%;top:70%;width:58px"><use href="#carbcap"/></svg>
        <svg style="left:12%;top:84%;width:46px"><use href="#diamond"/></svg>
        <svg style="left:82%;top:46%;width:40px"><use href="#pearl"/></svg>
      </div>
      <svg class="g3-arrow" viewBox="0 0 200 200" aria-hidden="true"><path d="M30 190C40 110 90 60 168 34"/><path d="M140 22 172 32 158 62"/></svg>
      <section class="g3-card" role="dialog" aria-modal="true" aria-labelledby="g3t">
        <p class="g3-hey" id="g3t">hold up <span aria-hidden="true">&#9995;</span></p>
        <h2>you're in <span data-esc="app"></span>'s browser</h2>
        <p class="g3-sub">Telegram won't open in here, so you can look around but you can't order. 2 taps fixes it:</p>
        <ol class="g3-steps">
          <li><b>1</b><span>Tap <span class="esc-chip">&#8943;</span> top right</span></li>
          <li><b>2</b><span>Tap <span class="esc-chip" data-esc="menu"></span></span></li>
        </ol>
        <button class="g3-go" type="button">Bet, I'll do it <span aria-hidden="true">&nearr;</span></button>
        <button class="g3-skip" type="button">Nah, just looking for now</button>
      </section>
    </div>

    <button class="g3-strip" type="button" hidden>
      <span class="g3-lock" aria-hidden="true">&#128274;</span>
      <span>Ordering's locked in <span data-esc="app"></span>. <b>Unlock in 2 taps &nearr;</b></span>
    </button>
    <div class="g3-rings" aria-hidden="true"><i></i><i></i></div>

    <div class="g3-mini" hidden>
      <section class="g3-mini-in" role="dialog" aria-modal="true" aria-labelledby="g3m">
        <span class="g3-mini-lock" aria-hidden="true">&#128274;</span>
        <h3 id="g3m">Unlock ordering</h3>
        <p><span data-esc="app"></span> blocks Telegram. Do this once and every button works:</p>
        <ol class="g3-steps">
          <li><b>1</b><span>Tap <span class="esc-chip">&#8943;</span> top right &nearr;</span></li>
          <li><b>2</b><span>Tap <span class="esc-chip" data-esc="menu"></span></span></li>
        </ol>
        <div class="g3-mini-btns">
          <button class="g3-go" type="button">Show me where &nearr;</button>
          <button class="g3-copy" type="button">Copy link</button>
        </div>
      </section>
    </div>`;

  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;

  function spot() {
    const r = E.dots();
    const rings = $(".g3-rings");
    rings.style.left = (r.left + r.width / 2) + "px";
    rings.style.top = (r.top + r.height / 2) + "px";
    root.classList.add("g3-spot");
    clearTimeout(spot.t);
    spot.t = setTimeout(() => root.classList.remove("g3-spot"), 7000);
  }

  function hide(el) {
    el.classList.remove("on");
    setTimeout(() => { el.hidden = true; }, 300);
  }
  function show(el) {
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("on"));
  }

  function afterGate() {
    hide($(".g3"));
    root.classList.remove("g3-gated");
    $(".g3-strip").hidden = false;
    try { sessionStorage.setItem(KEY, "1"); } catch (e) { /* ignore */ }
  }

  function lockButtons() {
    document.querySelectorAll(".order").forEach((o) => {
      const b = o.querySelector(".order-txt b");
      if (b) b.textContent = "Unlock ordering";
      o.querySelector(".order-plane").innerHTML = '<span style="font-size:22px">&#128274;</span>';
      const sub = o.querySelector("[data-order-sub]");
      if (sub) { // swap the node so the homepage's countdown stops writing into it
        const fresh = document.createElement("small");
        fresh.textContent = E.appName + " blocks Telegram · tap for the fix";
        sub.replaceWith(fresh);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!E.app) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    while (wrap.firstElementChild) document.body.appendChild(wrap.firstElementChild);
    E.fill();
    lockButtons();

    let seen = false;
    try { seen = !!sessionStorage.getItem(KEY); } catch (e) { /* ignore */ }
    if (seen) $(".g3-strip").hidden = false;
    else { root.classList.add("g3-gated"); show($(".g3")); E.track("esc3_gate_shown"); }

    $(".g3 .g3-go").addEventListener("click", () => { afterGate(); spot(); E.track("esc3_gate_go"); });
    $(".g3-skip").addEventListener("click", () => { afterGate(); E.track("esc3_gate_skip"); });
    $(".g3-strip").addEventListener("click", () => show($(".g3-mini")));
    $(".g3-mini .g3-go").addEventListener("click", () => { hide($(".g3-mini")); spot(); });
    $(".g3-mini").addEventListener("click", (e) => { if (e.target === $(".g3-mini")) hide($(".g3-mini")); });
    $(".g3-copy").addEventListener("click", (e) => {
      const b = e.currentTarget;
      E.copy(href).then((ok) => { b.textContent = ok ? "Copied ✓ paste in " + E.browser : "Couldn't copy"; });
    });
    document.addEventListener("esc:dots", () => { hide($(".g3-mini")); if (!$(".g3").hidden) afterGate(); });
    E.onTap((link) => {
      href = link.href;
      $(".g3-copy").textContent = "Copy link";
      show($(".g3-mini"));
      E.track("esc3_mini");
    });
  });
})();
