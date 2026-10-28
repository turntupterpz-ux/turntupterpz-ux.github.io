// Homepage · Proof + price (started as /drafts/tiktok/6-proof-price). Data comes from site.js.
//
// Fills these on load:
//   [data-td="menu"]      compact menu, one row per category, tap for prices
//   [data-td="quotes"]    swipeable quote cards (short lines from real vouch screenshots)
//   [data-td="vgrid"]     vouch thumbnails (data-count = how many)
//   [data-td="shipping"]  shipping rows · [data-td="vcount"] number of vouches
//   [data-ship]           live "2h 14m left · ships today" text
//   #stack                five overlapping screenshots on the first screen
//   #scamQuotes           the "Been burned before?" quotes
(function () {
  const T = window.TT;
  const el = T.el;
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  // Short lines copied from real vouch screenshots; i is the screenshot's place in TT.vouches.
  const QUOTES = [
    { i: 30, t: "It just landed after only two damn days" },
    { i: 66, t: "Hands down one of the best rosins I've ever tried" },
    { i: 36, t: "Smell, taste, high are like nothing I've ever had before" },
    { i: 19, t: "It's a breath of fresh air to find someone legit" },
    { i: 57, t: "Great terps, great high, and a clean melt" },
    { i: 45, t: "Wilson Zero, top 5 strains" },
    { i: 40, t: "Damn bruh that was quick, 2 day delivery" },
    { i: 69, t: "I've been scammed before and I'm so glad I got in touch with you" },
    { i: 63, t: "The banana aroma, taste, and high are amazing" },
    { i: 27, t: "You always come thru" }
  ];
  const SCAM_QUOTES = [
    { i: 26, t: "I have been scammed before by people on TikTok… you seem very genuine" },
    { i: 69, t: "I've been scammed before and I'm so glad I got in touch with you" },
    { i: 19, t: "It's a breath of fresh air to find someone legit" },
    { i: 68, t: "It hasn't been easy finding someone legit out here" }
  ];
  const STACK = [30, 66, 36, 19, 57];

  const money = (v) => "$" + v;
  function fromLabel(c) {
    return c.unit === "g" ? money(c.from) + "/g" : c.unit === "ea" ? money(c.from) + " ea" : money(c.from) + " " + c.unit;
  }
  function picture(c) {
    return T.asset(c.photo || "motion/" + c.render + "/poster.webp");
  }

  function tickShip() {
    const s = T.shipStatus();
    const text = s.today ? s.clock + " left · ships today" : "Ships " + s.next;
    $$("[data-ship]").forEach((n) => { n.textContent = text; });
  }

  function renderMenu(box) {
    const W = T.menu.weights;
    T.menu.categories.forEach((c, k) => {
      const prices = el("div", { class: "mprices" });
      if (c.tiers) {
        const row = el("div", { class: "row" }, [el("b", { text: c.strains.map((s) => s.name).join(" · ") })]);
        c.tiers.forEach(([w, p]) => row.appendChild(el("span", { class: "p", text: w + " " + money(p) })));
        prices.appendChild(row);
      } else {
        const groups = c.prices ? [[c.strains.map((s) => s.name).join(" · "), c.prices]] : c.strains.map((s) => [s.name, s.prices]);
        groups.forEach(([name, list]) => {
          const row = el("div", { class: "row" }, [el("b", { text: name })]);
          list.forEach((p, j) => row.appendChild(el("span", { class: "p", text: W[j] + " " + money(p) })));
          prices.appendChild(row);
        });
      }
      const summary = el("summary", {}, [
        el("img", { src: picture(c), alt: c.name, width: "52", height: "52", loading: k < 3 ? "eager" : "lazy", decoding: "async" }),
        el("span", {}, [el("b", { text: c.name }), el("small", { text: c.note + " · " + c.strains.map((s) => s.name).join(", ") })]),
        el("em", { text: fromLabel(c) })
      ]);
      box.appendChild(el("details", { class: "mitem" }, [summary, prices]));
    });
  }

  function quoteCard(q) {
    const v = T.vouches[q.i];
    const b = el("button", { type: "button", class: "quote", "aria-label": "Open the chat this quote is from" }, [
      el("img", { src: v.thumb, alt: "", loading: "lazy", decoding: "async" }),
      el("span", {}, [el("q", { text: q.t }), el("small", { text: "Real chat · tap to read" })])
    ]);
    b.addEventListener("click", () => T.openViewer(q.i));
    return b;
  }
  function renderQuotes(box) {
    const n = Number(box.dataset.count) || QUOTES.length;
    QUOTES.slice(0, n).forEach((q) => box.appendChild(quoteCard(q)));
  }

  // Built here rather than with TT.vouchButton so every thumbnail waits until it's scrolled near.
  function renderGrid(box) {
    const n = Math.min(Number(box.dataset.count) || 8, T.vouches.length);
    for (let i = 0; i < n; i++) {
      const img = el("img", { loading: "lazy", decoding: "async", alt: "Customer vouch " + (i + 1) });
      img.src = T.vouches[i].thumb;
      const b = el("button", { type: "button", "aria-label": "Open customer vouch " + (i + 1) + " of " + T.vouches.length }, [img]);
      b.addEventListener("click", () => T.openViewer(i));
      box.appendChild(b);
    }
  }

  function renderShipping(box) {
    T.shipping.rows.forEach(([name, time, price]) => {
      box.appendChild(el("p", {}, [el("span", { html: name + "<small>" + time + "</small>" }), el("b", { text: price })]));
    });
  }

  const fillers = { menu: renderMenu, quotes: renderQuotes, vgrid: renderGrid, shipping: renderShipping };

  document.addEventListener("DOMContentLoaded", () => {
    $$("[data-td]").forEach((box) => {
      const kind = box.dataset.td;
      if (kind === "vcount") box.textContent = T.vouches.length;
      else if (fillers[kind]) fillers[kind](box);
    });

    const stack = document.querySelector("#stack");
    if (stack) {
      const row = stack.querySelector("span");
      STACK.forEach((i) => row.appendChild(el("img", { src: T.vouches[i].thumb, alt: "", width: "40", height: "56" })));
      stack.addEventListener("click", () => T.openViewer(0));
    }
    const scam = document.querySelector("#scamQuotes");
    if (scam) SCAM_QUOTES.forEach((q) => scam.appendChild(quoteCard(q)));

    $$("[data-open-vouch]").forEach((b) => b.addEventListener("click", () => T.openViewer(Number(b.dataset.openVouch) || 0)));

    tickShip();
    setInterval(tickShip, 30000);
  });
})();
