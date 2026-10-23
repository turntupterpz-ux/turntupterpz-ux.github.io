// Escape 4 · Plan B — most people won't do the menu dance, so give them other ways out.
// A Telegram-style chat slides up and "texts" the visitor three options:
//   1. Open in Safari / Chrome (the two taps, with rings on •••)
//   2. Copy the link and paste it into the browser
//   3. Skip the browser: copy @TurntUpTerp and search it in the Telegram app
// A small "Telegram not opening?" bubble sits above the Order dock so the chat is always one tap away.
(function () {
  const E = window.ESC;
  let href = "https://t.me/addlist/u3J2k7PsK3w5MzQx";
  let busy = false;

  const html = `
    <button class="p4-bubble" type="button"><span class="p4-ava"><img src="../../../assets/images/brand/logo.webp" alt=""></span><span>Telegram not opening?</span><i>1</i></button>
    <div class="p4-rings" aria-hidden="true"><i></i><i></i></div>
    <div class="p4" hidden>
      <section class="p4-chat" role="dialog" aria-modal="true" aria-labelledby="p4t">
        <header class="p4-head">
          <span class="p4-ava"><img src="../../../assets/images/brand/logo.webp" alt=""></span>
          <span><b id="p4t">TurntUpTerpz</b><small>online</small></span>
          <button class="p4-x" type="button" aria-label="Close">&#10005;</button>
        </header>
        <div class="p4-log" aria-live="polite"></div>
        <div class="p4-replies"></div>
      </section>
    </div>`;

  const $ = (s) => document.querySelector(s);
  const options = () => [
    { id: "open", label: "\u{1F9ED} Open in " + E.browser },
    { id: "copy", label: "\u{1F4CB} Copy the link" },
    { id: "find", label: "\u{1F50E} Find me in Telegram" }
  ];

  function bubble(text, who) {
    const b = document.createElement("div");
    b.className = "p4-msg " + (who || "them");
    b.innerHTML = text;
    $(".p4-log").appendChild(b);
    $(".p4-log").scrollTop = 1e6;
    return b;
  }

  function typing(ms) {
    const t = bubble('<span class="p4-dots"><i></i><i></i><i></i></span>', "them typing");
    const wait = window.TTScroll && window.TTScroll.reduce ? 0 : ms;
    return new Promise((res) => setTimeout(() => { t.remove(); res(); }, wait));
  }

  async function say(lines) {
    busy = true;
    for (const line of lines) {
      await typing(Math.min(900, 380 + line.length * 6));
      bubble(line);
    }
    busy = false;
  }

  function showReplies(list) {
    const box = $(".p4-replies");
    box.innerHTML = "";
    list.forEach((o) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = o.label;
      b.addEventListener("click", () => choose(o));
      box.appendChild(b);
    });
    requestAnimationFrame(() => { $(".p4-log").scrollTop = 1e6; });
  }

  function ringDots() {
    const r = E.dots();
    const rings = $(".p4-rings");
    rings.style.left = (r.left + r.width / 2) + "px";
    rings.style.top = (r.top + r.height / 2) + "px";
    document.documentElement.classList.add("p4-spot");
    setTimeout(() => document.documentElement.classList.remove("p4-spot"), 8000);
  }

  async function choose(o) {
    if (busy) return;
    if (o.id === "done") { close(); return; }
    bubble(o.label, "me");
    $(".p4-replies").innerHTML = "";
    E.track("esc4_" + o.id);
    if (o.id === "open") {
      ringDots();
      await say([
        "Tap <b>&#8943;</b> at the very top right &nearr;",
        "Then <b>" + E.menu + "</b>. Hit Order again over there and Telegram opens right up &#128293;"
      ]);
    } else if (o.id === "copy") {
      const ok = await E.copy(href);
      await say(ok
        ? ["Copied &#9989;", "Open <b>" + E.browser + "</b>, paste it in the address bar and go."]
        : ["Your phone blocked copying &#128580; try opening in " + E.browser + " instead."]);
    } else if (o.id === "find") {
      const ok = await E.copy("@TurntUpTerp");
      await say([
        (ok ? "Copied <b>@TurntUpTerp</b> &#9989;" : "Search <b>@TurntUpTerp</b>"),
        "Open the <b>Telegram app</b> yourself, tap search, paste. I'm the first result. Ask me for the channels link and you're in &#128588;"
      ]);
    }
    showReplies(options().filter((x) => x.id !== o.id).concat([{ id: "done", label: "\u{1F44D} Got it" }]));
  }

  function open(link) {
    if (link) href = link.href;
    const box = $(".p4");
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add("on"));
    $(".p4-bubble").classList.add("read");
    $(".p4-log").innerHTML = "";
    $(".p4-replies").innerHTML = "";
    say([
      "yo &#128075; " + E.appName + " doesn't let Telegram open from in here",
      "no stress, pick whatever's easiest:"
    ]).then(() => showReplies(options()));
    E.track("esc4_open");
  }

  function close() {
    const box = $(".p4");
    box.classList.remove("on");
    setTimeout(() => { box.hidden = true; }, 300);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!E.app) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    while (wrap.firstElementChild) document.body.appendChild(wrap.firstElementChild);

    $(".p4-bubble").addEventListener("click", () => open(null));
    $(".p4-x").addEventListener("click", close);
    $(".p4").addEventListener("click", (e) => { if (e.target === $(".p4")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$(".p4").hidden) close(); });
    document.addEventListener("esc:dots", close);
    E.onTap(open);
  });
})();
