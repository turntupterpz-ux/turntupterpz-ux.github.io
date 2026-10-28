// TikTok drafts: shared behaviour. Data (menu, vouches, links, shipping) comes from assets/js/site.js.
// A page sets window.DRAFT = { n, title, idea, points: [[claim, detail, source], …] } before this loads.
//
// Fills these on load:
//   [data-td="menu"]      compact menu, one row per category, tap for prices
//   [data-td="quotes"]    swipeable quote cards (short lines from real vouch screenshots)
//   [data-td="vgrid"]     vouch thumbnails (data-count = how many)
//   [data-td="shipping"]  shipping rows · [data-td="faq"] short FAQ · [data-td="vcount"] number of vouches
//   [data-ship]           live "2h 14m left · ships today" text (data-today is set for styling)
// Also adds the 21+ check, the "Why this draft?" tab, and the vouch viewer markup.
(function () {
  const T = window.TT;
  const D = window.DRAFT || {};
  const el = T.el;
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const DRAFTS = [["1-hook", "Hook"], ["2-proof", "Proof"], ["3-one-tap", "One tap"], ["4-feed", "Feed"], ["5-lite", "Lite"], ["6-proof-price", "Proof + price"]];

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

  const money = (v) => "$" + v;
  function fromLabel(c) {
    return c.unit === "g" ? money(c.from) + "/g" : c.unit === "ea" ? money(c.from) + " ea" : money(c.from) + " " + c.unit;
  }
  function picture(c) {
    return T.asset(c.photo || "motion/" + c.render + "/poster.webp");
  }

  function shipText() {
    const s = T.shipStatus();
    return { today: s.today, text: s.today ? s.clock + " left · ships today" : "Ships " + s.next };
  }
  function tickShip() {
    const s = shipText();
    $$("[data-ship]").forEach((n) => { n.textContent = s.text; n.dataset.today = s.today ? "1" : "0"; });
    $$(".ship").forEach((n) => { n.dataset.today = s.today ? "1" : "0"; });
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
        el("img", { src: picture(c), alt: "", width: "52", height: "52", loading: k < 3 ? "eager" : "lazy", decoding: "async" }),
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

  function renderFaq(box) {
    [
      ["How do I order?", "Tap Public Telegram channel. Stock, prices and ordering are all in there. Orders before 2:30 PM PST ship same day, Mon–Sat."],
      ["Can I see it before I pay?", "Yes. Ask for a FaceTime and watch your order go in the package."],
      ["How do I know you're legit?", "FaceTime, " + T.vouches.length + " real vouches, and answers to anything you ask before you pay."],
      ["Links won't open in TikTok?", "Tap ••• at the top right, choose Open in browser, then tap the button again."]
    ].forEach(([q, a]) => box.appendChild(el("details", {}, [el("summary", { text: q }), el("p", { text: a })])));
  }

  // ------------------------------------------------------------ 21+ check (remembered for the visit)
  function ageGate() {
    let ok = false;
    try { ok = sessionStorage.getItem("tt-21") === "1"; } catch (e) { /* storage blocked: ask */ }
    if (ok && !/[?&]gate=1/.test(location.search)) return;
    const gate = el("div", { class: "age", role: "dialog", "aria-modal": "true", "aria-labelledby": "ageTitle" }, [
      el("div", { class: "age-card" }, [
        el("img", { src: T.asset("images/brand/logo-192.webp"), alt: "", width: "64", height: "64" }),
        el("h2", { id: "ageTitle", text: "Are you 21 or older?" }),
        el("p", { text: "You have to be 21+ to view this site." }),
        el("button", { type: "button", class: "btn", text: "Yes, I'm 21+" }),
        el("a", { href: "https://www.google.com", text: "No, take me back" })
      ])
    ]);
    gate.querySelector("button").addEventListener("click", () => {
      try { sessionStorage.setItem("tt-21", "1"); } catch (e) { /* ignore */ }
      gate.remove();
    });
    document.body.appendChild(gate);
    gate.querySelector("button").focus();
  }

  // ------------------------------------------------------------ "Why this draft?"
  function whyTab() {
    if (!D.title) return;
    const list = el("ol");
    (D.points || []).forEach(([claim, detail, source]) => {
      list.appendChild(el("li", {}, [el("b", { text: claim }), el("span", { text: detail }), el("cite", { text: source })]));
    });
    const nav = el("div", { class: "why-nav" });
    nav.appendChild(el("a", { href: "../", text: "All drafts + evidence" }));
    DRAFTS.forEach(([slug, name], k) => {
      const a = el("a", { href: "../" + slug + "/", text: k + 1 + " · " + name });
      if (k + 1 === D.n) a.setAttribute("aria-current", "page");
      nav.appendChild(a);
    });
    const close = el("button", { type: "button", class: "btn", text: "Back to the draft" });
    const sheet = el("div", { class: "why", hidden: "" }, [
      el("div", { class: "why-card", role: "dialog", "aria-modal": "true", "aria-labelledby": "whyTitle" }, [
        el("p", { class: "sec-k", text: "Draft " + D.n + " of " + DRAFTS.length }),
        el("h2", { id: "whyTitle", text: D.title }),
        el("p", { text: D.idea }), list, nav, close
      ])
    ]);
    const tab = el("button", { type: "button", class: "why-tab", text: "WHY THIS DRAFT?" });
    tab.addEventListener("click", () => { sheet.hidden = false; });
    close.addEventListener("click", () => { sheet.hidden = true; });
    sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.hidden = true; });
    document.body.append(tab, sheet);
  }

  function viewer() {
    if (document.querySelector("#vouchViewer")) return;
    document.body.insertAdjacentHTML("beforeend",
      '<dialog id="vouchViewer"><div class="vv-inner"><span class="vv-count" id="vvCount"></span>' +
      '<button class="vv-close" id="vvClose" aria-label="Close">&times;</button>' +
      '<button class="vv-nav vv-prev" id="vvPrev" aria-label="Previous"></button>' +
      '<img id="vvImg" alt="Customer vouch">' +
      '<button class="vv-nav vv-next" id="vvNext" aria-label="Next"></button></div></dialog>');
  }

  const fillers = { menu: renderMenu, quotes: renderQuotes, vgrid: renderGrid, shipping: renderShipping, faq: renderFaq };

  // site.js wires the viewer on DOMContentLoaded, so the markup has to exist before then.
  viewer();
  document.addEventListener("DOMContentLoaded", () => {
    $$("[data-td]").forEach((box) => {
      const kind = box.dataset.td;
      if (kind === "vcount") box.textContent = T.vouches.length;
      else if (fillers[kind]) fillers[kind](box);
    });
    tickShip();
    setInterval(tickShip, 30000);
    ageGate();
    whyTab();
  });

  window.TD = { QUOTES, quoteCard, shipText, fromLabel, picture };
})();
