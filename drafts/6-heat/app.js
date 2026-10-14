// Draft 6 · Heat — scroll choreography.
(function () {
  const { on, span, mix, ease, clamp } = window.TTScroll;
  const T = window.TT;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const vh = () => window.innerHeight;

  // ------------------------------------------------------------------ 1 · the dab
  const dab = $("#dab");
  const torch = $(".torch", dab);
  const flame = $(".flame", dab);
  const tool = $(".tool", dab);
  const globs = $$(".glob", dab);
  const puddle = $(".puddle", dab);
  const cap = $(".cap", dab);
  const pearls = $$(".pearls circle", dab);
  const plume = $$(".plume circle", dab);
  const drift = $$("[data-drift]", dab);
  const smoke = $$(".smoke i", dab);
  const tempEl = $("[data-hud-temp]", dab);
  const labelEl = $("[data-hud-label]", dab);
  const labels = ["Ready", "Heating", "Cooling", "Drop", "Cap + pull", "Taste"];

  const TOOL_FROM = [620, -260];
  const TOOL_AT = [420, 404];

  on(dab, (p, s) => {
    const [s0, s1, s2, s3, s4, s5] = s.seg;

    // stickers drift up or down at their own speed
    if (!window.TTScroll.reduce) drift.forEach((el) => {
      const k = Number(el.dataset.drift);
      el.style.transform = "translate3d(0," + (-p * k * vh() * 0.6).toFixed(1) + "px,0) rotate(" + (p * k * 90).toFixed(1) + "deg)";
    });

    // thermometer: room temp → 900°F with the torch → cools to the low-temp sweet spot
    let temp = 72;
    if (s1 > 0) temp = mix(72, 900, ease.inOut(s1));
    if (s2 > 0) temp = mix(900, 520, ease.out(s2));
    if (s3 > 0) temp = mix(520, 500, s3);
    if (s4 > 0) temp = mix(500, 470, s4);
    tempEl.textContent = Math.round(temp);
    labelEl.textContent = labels[s.step] || "";
    dab.style.setProperty("--temp", (temp / 900).toFixed(3));

    // torch slides in, burns, slides out
    const off = 320 * (1 - ease.out(span(s1, 0, 0.3))) + 360 * ease.in(span(s2, 0, 0.35));
    torch.setAttribute("transform", "translate(" + (480 + off).toFixed(1) + " 470) rotate(30)");
    flame.style.opacity = s1 > 0.02 && s2 < 0.08 ? 1 : 0;

    // dab tool brings the glob down, leaves it in the banger, goes back up
    const down = ease.out(span(s3, 0, 0.5));
    const up = ease.in(span(s3, 0.62, 1));
    const tx = mix(mix(TOOL_FROM[0], TOOL_AT[0], down), TOOL_FROM[0], up);
    const ty = mix(mix(TOOL_FROM[1], TOOL_AT[1], down), TOOL_FROM[1], up);
    tool.setAttribute("transform", "translate(" + tx.toFixed(1) + " " + ty.toFixed(1) + ")");
    const dropped = s3 >= 0.56;
    globs.forEach((g) => { g.style.opacity = dropped ? 0 : 1; });
    puddle.style.opacity = dropped ? (1 - s4 * 0.9).toFixed(3) : 0;
    puddle.setAttribute("rx", (24 * (1 - s4 * 0.75) * (dropped ? ease.back(span(s3, 0.56, 0.7)) : 1)).toFixed(2));

    // carb cap lands, pearls spin
    const capIn = ease.out(span(s4, 0, 0.28));
    const wobble = Math.sin(s4 * 40) * 5 * (1 - s4);
    cap.setAttribute("transform", "translate(412 " + mix(-220, 338, capIn).toFixed(1) + ") rotate(" + wobble.toFixed(2) + ")");
    const spin = s4 > 0.2 && s5 < 0.6;
    pearls.forEach((c, i) => {
      const a = s4 * Math.PI * 10 + i * 2.094;
      c.setAttribute("cx", (412 + Math.cos(a) * 16).toFixed(2));
      c.setAttribute("cy", (428 + Math.sin(a) * 5).toFixed(2));
      c.style.opacity = spin ? 1 : 0;
    });

    // vapor rolls out of the mouthpiece and fills the screen
    const v = clamp(span(s4, 0.35, 1) * 0.55 + s5 * 0.45);
    smoke.forEach((c, i) => c.style.setProperty("--v", clamp(span(v, 0.25 + i * 0.07, 1)).toFixed(3)));
    plume.forEach((c, i) => {
      const t = clamp(v * 1.7 - i * 0.1);
      c.setAttribute("cx", (200 + Math.sin(i * 1.7 + t * 3) * (14 + t * 90)).toFixed(1));
      c.setAttribute("cy", (100 - t * (240 + i * 46)).toFixed(1));
      c.setAttribute("r", ((16 + i * 2) * (1 + t * 4.5)).toFixed(1));
      c.style.opacity = t > 0 ? ((1 - t * 0.85) * 0.6).toFixed(3) : 0;
    });
  });

  // ------------------------------------------------------------------ 2 · the menu run
  const run = $("#menu");
  const track = $("#track");
  const dotsEl = $("#runDots");
  const glow = { rosin: "#f2a33a", diamonds: "#bcd9ff", sift: "#d49a5a", resin: "#ffbf5c", crumble: "#ecd08a", disposable: "#9be15d" };
  const el = T.el;

  function priceRow(c) {
    if (c.prices) return el("div", { class: "prices" }, c.prices.map((v, i) =>
      el("span", {}, [el("small", { text: T.menu.weights[i] }), el("b", { text: "$" + v })])));
    if (c.tiers) return el("div", { class: "prices" }, c.tiers.map(([k, v]) =>
      el("span", {}, [el("small", { text: k }), el("b", { text: "$" + v })])));
    return null;
  }

  T.menu.categories.forEach((c, i) => {
    const strains = el("ul", { class: "chips" }, c.strains.map((st) => el("li", {}, [
      document.createTextNode(st.name),
      el("small", { text: st.prices ? "$" + st.prices[0] + "/g" : st.type })
    ])));
    const panel = el("article", { class: "panel", style: "--glow:" + (glow[c.id] || "#f2a33a") }, [
      el("span", { class: "panel-name", "aria-hidden": "true", text: c.name.split(" ").pop() }),
      el("span", { class: "panel-num", text: String(i + 1).padStart(2, "0") + " / " + String(T.menu.categories.length).padStart(2, "0") }),
      el("div", { class: "panel-art" }, [T.motionBox(c.render, "play", c.name)]),
      el("div", { class: "panel-info" }, [
        el("p", { class: "note", text: c.note }),
        el("h3", { text: c.name }),
        el("p", { class: "from", html: "from <b>$" + c.from + "</b> / " + c.unit }),
        el("p", { class: "blurb", text: c.blurb }),
        strains,
        priceRow(c),
        el("a", { class: "btn btn-hot leaves-site track-link", "data-label": "d6_ask_" + c.id, href: T.links.ask(c.name) }, [document.createTextNode("Ask about " + c.name)])
      ])
    ]);
    track.appendChild(panel);
  });

  track.appendChild(el("article", { class: "panel panel-end" }, [
    el("p", { class: "eyebrow", text: "Every weight, every strain" }),
    el("h2", { html: "The full<br><em>menu card.</em>" }),
    el("a", { href: "../../menu.html", "aria-label": "Open the full menu" }, [
      el("img", { class: "menu-thumb", src: T.links.menuImage, alt: "TurntUpTerpz menu", loading: "lazy", width: "661", height: "1280" })
    ]),
    el("p", { class: "lede", text: "Flower too — message me for what's in right now." })
  ]));

  const panels = [...track.children];
  panels.forEach(() => dotsEl.appendChild(document.createElement("i")));
  const dots = [...dotsEl.children];
  run.style.height = "calc(100svh + " + (panels.length - 1) * 85 + "svh)";
  if (window.TTMotion) window.TTMotion.init(track);

  let active = -1;
  on(run, (p) => {
    if (window.TTScroll.reduce) return;
    const w = window.innerWidth;
    const x = p * Math.max(0, track.scrollWidth - w);
    track.style.transform = "translate3d(" + (-x).toFixed(1) + "px,0,0)";
    panels.forEach((panel, i) => {
      const d = clamp((panel.offsetLeft + panel.offsetWidth / 2 - x - w / 2) / w, -1, 1);
      panel.style.setProperty("--d", d.toFixed(3));
      panel.style.setProperty("--ad", Math.abs(d).toFixed(3));
      dots[i].style.setProperty("--f", (1 - Math.min(1, Math.abs(d) * 2)).toFixed(3));
    });
    const now = Math.round(x / w);
    if (now !== active) {
      active = now;
      const m = panels[now] && panels[now].querySelector(".motion");
      if (m && m.motion && m.motion.live) m.motion.play(0);
    }
  });

  // ------------------------------------------------------------------ 3 · proof rails
  const railA = $("#railA");
  const railB = $("#railB");
  const n = T.vouches.length;
  for (let i = 0; i < 14; i++) {
    railA.appendChild(T.vouchButton(i % n));
    railB.appendChild(T.vouchButton((i + 14) % n));
  }
  $("#openVouches").addEventListener("click", () => T.openViewer(0));
  $$("[data-vouch-count]").forEach((node) => { node.dataset.count = n; node.textContent = n; });

  $$("[data-menu-date]").forEach((node) => { node.textContent = T.menu.updated; });
  window.TTScroll.scan();
})();
