// Escape 1 · Coach — show, don't tell.
// A hint chip points at ••• the whole visit. Tapping a Telegram button opens a coach card with a
// looping mini-phone that acts out the exact taps, while rings pulse on the real ••• button.
(function () {
  const E = window.ESC;
  let href = "";

  const html = `
    <button class="c1-hint" type="button" aria-label="How to open Telegram links">
      <span class="c1-hint-up" aria-hidden="true">&uarr;</span>
      <span>Tap <b>&#8943;</b> &rarr; <b data-esc="menu"></b> to order</span>
    </button>
    <div class="c1-rings" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="c1-up" aria-hidden="true"><span>&uarr;</span><b>&#8943; is up here</b></div>
    <div class="c1" hidden>
      <div class="c1-dim"></div>
      <section class="c1-card" role="dialog" aria-modal="true" aria-labelledby="c1t">
        <p class="esc-k c1-k"><span data-esc="app"></span> won't open Telegram</p>
        <h3 id="c1t">Copy these 3 taps</h3>
        <div class="c1-body">
          <div class="c1-phone" aria-hidden="true">
            <div class="m-bar"><span>&#10005;</span><i></i><span class="m-dots">&#8943;</span></div>
            <div class="m-page"><i></i><i></i><i class="s"></i><i></i><i class="s"></i><span class="m-order">Order</span></div>
            <div class="m-sheet"><span class="m-open" data-esc="menu"></span><span>Copy link</span><span>Refresh</span></div>
            <div class="m-safari"><span class="m-compass"></span><i></i></div>
            <div class="m-tg"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M21.4 4.1 2.9 11.3c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.8.8s.6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.8-1.3-1.4Z"/></svg></div>
            <span class="m-finger"></span>
          </div>
          <ol class="c1-steps">
            <li><b>1</b><span>Tap <span class="esc-chip">&#8943;</span> top right</span></li>
            <li><b>2</b><span>Tap <span class="esc-chip" data-esc="menu"></span></span></li>
            <li><b>3</b><span>Tap <b>Order</b> again. Telegram opens.</span></li>
          </ol>
        </div>
        <div class="c1-btns">
          <button class="c1-go" type="button">Got it, show me &uarr;</button>
          <button class="c1-copy" type="button">Copy link instead</button>
        </div>
      </section>
    </div>`;

  function place() {
    const r = E.dots();
    const rings = document.querySelector(".c1-rings");
    rings.style.left = (r.left + r.width / 2) + "px";
    rings.style.top = (r.top + r.height / 2) + "px";
  }

  function open(link) {
    href = link ? link.href : "https://t.me/addlist/u3J2k7PsK3w5MzQx";
    const box = document.querySelector(".c1");
    box.hidden = false;
    document.documentElement.classList.add("c1-open", "c1-spot");
    place();
    requestAnimationFrame(() => box.classList.add("on"));
    box.querySelector(".c1-go").focus({ preventScroll: true });
    E.track("esc1_coach_open");
  }

  function close(keepSpot) {
    const box = document.querySelector(".c1");
    box.classList.remove("on");
    document.documentElement.classList.remove("c1-open");
    setTimeout(() => { box.hidden = true; }, 300);
    if (keepSpot) setTimeout(() => document.documentElement.classList.remove("c1-spot"), 7000);
    else document.documentElement.classList.remove("c1-spot");
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!E.app) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    while (wrap.firstElementChild) document.body.appendChild(wrap.firstElementChild);
    E.fill();

    document.querySelector(".c1-hint").addEventListener("click", () => open(null));
    document.querySelector(".c1-go").addEventListener("click", () => close(true));
    document.querySelector(".c1-dim").addEventListener("click", () => close(false));
    document.querySelector(".c1-copy").addEventListener("click", (e) => {
      const b = e.currentTarget;
      E.copy(href).then((ok) => {
        b.textContent = ok ? "Copied ✓ Paste it in " + E.browser : "Couldn't copy, use the 3 taps";
        E.track("esc1_copy");
      });
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.documentElement.classList.contains("c1-open")) close(false); });
    document.addEventListener("esc:dots", () => close(false));
    E.onTap(open);
    place();
    window.addEventListener("resize", place);
  });
})();
