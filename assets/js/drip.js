// Homepage · Drip — scroll choreography (started as /drafts/7-drip).
(function () {
  const { on, span, mix, ease, clamp } = window.TTScroll;
  const T = window.TT;
  const el = T.el;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

  // ------------------------------------------------------------------ 1 · hero
  const hero = $("#hero");
  const stage = $(".hero-stage", hero);
  const stickers = $$(".stk", hero);
  const main = $(".d-main", hero);
  const falling = $(".falling", hero);
  const splash = $(".splash", hero);
  const jar = $(".jar svg", hero);

  on(hero, (p, s) => {
    const [s0, s1, s2] = s.seg;
    const vh = window.innerHeight;

    // stickers float up or sink down through the screen, each at its own speed
    if (!window.TTScroll.reduce) stickers.forEach((st) => {
      const rise = Number(st.dataset.rise);
      const turn = Number(st.dataset.turn);
      st.style.transform = "translate3d(0," + (-p * rise * vh * 0.55).toFixed(1) + "px,0) rotate(" + (p * turn * 3).toFixed(1) + "deg)";
    });

    // the big drip lets go of its drop, which falls into the jar
    const box = stage.getBoundingClientRect();
    const d = main.getBoundingClientRect();
    const j = jar.getBoundingClientRect();
    const x = d.left + d.width / 2 - box.left;
    const fromY = d.bottom - box.top - 6;
    const toY = j.top - box.top + j.height * 0.62;
    const falls = s1 > 0 && s1 < 1;
    falling.style.opacity = falls ? 1 : 0;
    const t = ease.in(s1);
    falling.style.transform = "translate(" + x.toFixed(1) + "px," + mix(fromY, toY - 40, t).toFixed(1) + "px) scale(" + (1 - t * 0.15).toFixed(3) + "," + (1 + t * 0.35).toFixed(3) + ")";
    splash.style.left = x.toFixed(1) + "px";
    splash.style.top = toY.toFixed(1) + "px";
  });

  // ------------------------------------------------------------------ 3 · stacking menu cards
  const stack = $("#stack");
  const colors = { rosin: "#ffd166", diamonds: "#cfe7ff", sift: "#f2d0a9", resin: "#ffbf80", crumble: "#f6e7a8", sugar: "#f9dc8c", disposable: "#d4f59a" };
  const icons = { rosin: "drop", diamonds: "diamond", sift: "leaf", resin: "jar", crumble: "dabber", sugar: "jar", disposable: "pen" };
  const svgUse = (id, cls) => {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", cls);
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(ns, "use");
    use.setAttribute("href", "#" + id);
    svg.appendChild(use);
    return svg;
  };

  function priceRow(c) {
    const cells = c.prices ? c.prices.map((v, i) => [T.menu.weights[i], v]) : c.tiers || null;
    if (!cells) return null;
    return el("div", { class: "prices" }, cells.map(([k, v]) => el("span", {}, [el("small", { text: k }), el("b", { text: "$" + v })])));
  }

  const cards = T.menu.categories.map((c, i) => {
    const card = el("article", { class: "card", style: "--i:" + i + ";--bg:" + (colors[c.id] || "#fffaf1") }, [
      el("div", { class: "card-top" }, [el("span", { text: c.note }), el("span", { text: String(i + 1).padStart(2, "0") })]),
      el("div", { class: "card-art" }, [T.motionBox(c.render, "view", c.name)]),
      svgUse(icons[c.id] || "drop", "card-stk"),
      el("h3", { text: c.name }),
      el("p", { class: "from", html: "from <b>$" + c.from + "</b> / " + c.unit }),
      el("p", { class: "blurb", text: c.blurb }),
      el("ul", { class: "chips" }, c.strains.map((st) => el("li", {}, [
        document.createTextNode(st.name),
        el("small", { text: st.prices ? "$" + st.prices[0] + "/g" : st.type })
      ]))),
      priceRow(c),
      el("div", { class: "card-acts" }, [
        el("a", { class: "btn btn-line leaves-site track-link", "data-label": "home_ask_" + c.id, href: T.links.ask(c.name) }, [document.createTextNode("Ask about this")]),
        el("a", { class: "card-dm leaves-site track-link", "data-label": "home_dm_" + c.id, href: T.links.telegram, text: "or DM me directly →" })
      ])
    ]);
    stack.appendChild(card);
    return card;
  });
  if (window.TTMotion) window.TTMotion.init(stack);

  stack.dataset.scene = "view";
  on(stack, () => {
    if (window.TTScroll.reduce) return;
    const rects = cards.map((c) => c.getBoundingClientRect());
    cards.forEach((card, i) => {
      const next = rects[i + 1];
      const cov = next ? clamp(1 - (next.top - rects[i].top) / rects[i].height) : 0;
      card.style.setProperty("--cov", cov.toFixed(3));
    });
  });

  // ------------------------------------------------------------------ 4 · temperature dial
  const temp = $("#temp");
  const tempOut = $("[data-temp]", temp);
  on(temp, (p) => { tempOut.textContent = Math.round(400 + p * 350); });

  // ------------------------------------------------------------------ 5 · vouch wall, columns drift at different speeds
  const wall = $("#wallCols");
  const speeds = [0.1, -0.08, 0.14, -0.06];
  const cols = speeds.map((sp) => el("div", { class: "wall-col", "data-float": String(sp) }));
  cols.forEach((c) => wall.appendChild(c));
  const tilt = [-3, 2.5, -1.5, 3.5, -2.5, 1.5];
  for (let i = 0; i < 12; i++) {
    const b = T.vouchButton(i, "pol");
    b.setAttribute("data-reveal", "");
    b.style.setProperty("--r", tilt[i % tilt.length] + "deg");
    cols[i % cols.length].appendChild(b);
  }
  $("#wallMore").addEventListener("click", () => T.openViewer(12));

  // ------------------------------------------------------------------ order dock
  // Slides up once the page settles, steps aside while the big footer button is on screen,
  // and its small line counts down to the same-day cutoff.
  const dock = $("#dock");
  const footOrder = $(".foot .order");
  if (dock) {
    let ready = false;
    let footVisible = false;
    const place = () => dock.classList.toggle("away", !ready || footVisible);
    place();
    setTimeout(() => { ready = true; place(); }, 700);
    if (footOrder && "IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { footVisible = e.isIntersecting; place(); }).observe(footOrder);
    }
  }
  const subs = $$("[data-order-sub]");
  const tickSub = () => {
    const st = T.shipStatus();
    subs.forEach((node) => {
      node.innerHTML = st.today
        ? '<i class="live"></i>' + st.clock + " left · ships today"
        : "Tap in · ships " + st.next;
    });
  };
  tickSub();
  setInterval(tickSub, 30000);

  // ------------------------------------------------------------------ shared numbers
  const n = T.vouches.length;
  $$("[data-vouch-count]").forEach((node) => { node.dataset.count = n; node.textContent = n; });
  $$("[data-menu-date]").forEach((node) => { node.textContent = T.menu.updated; });
  const rosin = T.menu.categories.find((c) => c.id === "rosin");
  if (rosin) $$("[data-from-rosin]").forEach((node) => { node.textContent = rosin.from; });

  window.TTScroll.scan();
})();
