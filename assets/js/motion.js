// Scroll-driven product motion.
//
// <div class="motion" data-seq="diamonds" data-mode="view"><img src="…/poster.webp" alt="…"></div>
//
// The poster (the settled last frame) shows straight away and is what no-JS and reduced-motion
// visitors see. Once frames arrive, a canvas takes over and scrubs the Blender sequence:
//   view  – plays in as the element scrolls up into the viewport, settled by the time it's centred
//   hero  – plays with the first ~60% of a screen of scrolling from the top of the page
//   x     – plays in as a card snaps to the centre of a horizontal scroller (falls back to view)
//   play  – time-based; call el.motion.play() (tabs, sheets)
(function () {
  const ROOT = new URL("../motion/", document.currentScript.src).href;
  const FRAMES = 32;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const players = new Set();
  const cache = new Map(); // "diamonds/640" -> { images: [], loaded: Set }

  const clamp = (v) => Math.max(0, Math.min(1, v));

  // Load frames in an order that fills the timeline evenly: ends first, then halves, quarters…
  function frameOrder(n) {
    const order = [n - 1, 0];
    const seen = new Set(order);
    for (let step = (n - 1) / 2; step >= 1; step /= 2) {
      for (let x = step; x < n; x += step) {
        const i = Math.round(x);
        if (!seen.has(i)) { seen.add(i); order.push(i); }
      }
    }
    for (let i = 0; i < n; i++) if (!seen.has(i)) order.push(i);
    return order;
  }

  function sequence(name, size, onFrame) {
    const key = name + "/" + size;
    if (cache.has(key)) {
      const entry = cache.get(key);
      entry.listeners.push(onFrame);
      if (entry.loaded.size) setTimeout(onFrame, 0); // already have frames: go live now
      return entry;
    }
    const entry = { images: new Array(FRAMES), loaded: new Set(), listeners: [onFrame] };
    cache.set(key, entry);
    let next = 0;
    const order = frameOrder(FRAMES);
    const pump = () => {
      if (next >= order.length) return;
      const i = order[next++];
      const img = new Image();
      img.decoding = "async";
      img.src = ROOT + name + "/" + size + "/" + String(i).padStart(2, "0") + ".webp";
      const done = () => {
        entry.images[i] = img;
        entry.loaded.add(i);
        entry.listeners.forEach((fn) => fn());
        pump();
      };
      (img.decode ? img.decode() : Promise.resolve()).then(done, () => pump());
    };
    for (let k = 0; k < 4; k++) pump(); // a few requests in flight
    return entry;
  }

  function nearest(entry, i) {
    if (entry.loaded.has(i)) return entry.images[i];
    for (let d = 1; d < FRAMES; d++) {
      if (entry.loaded.has(i - d)) return entry.images[i - d];
      if (entry.loaded.has(i + d)) return entry.images[i + d];
    }
    return null;
  }

  class Player {
    constructor(el) {
      this.el = el;
      this.name = el.dataset.seq;
      this.mode = el.dataset.mode || "view";
      this.poster = el.querySelector("img");
      this.t = this.mode === "play" ? 1 : 0;
      this.target = this.t;
      this.visible = false;
      this.canvas = document.createElement("canvas");
      this.canvas.setAttribute("aria-hidden", "true");
      this.ctx = this.canvas.getContext("2d");
      el.appendChild(this.canvas);
      el.motion = this;

      new ResizeObserver(() => this.resize()).observe(el);
      new IntersectionObserver(([e]) => {
        this.visible = e.isIntersecting;
        if (!this.visible) return;
        if (!this.entry) this.start();
        this.measure();
        this.kick();
      }, { rootMargin: "25% 0px" }).observe(el);

      this.scroller = this.mode === "x" ? el.closest("[data-motion-scroller]") : null;
      if (this.scroller) this.scroller.addEventListener("scroll", () => this.measure(), { passive: true });
      players.add(this);
    }

    // frames only start downloading once the element is near the screen
    start() {
      const box = this.el.getBoundingClientRect();
      const px = Math.max(box.width, box.height) * Math.min(window.devicePixelRatio || 1, 2);
      this.size = px > 380 ? 640 : 360;
      this.entry = sequence(this.name, this.size, () => this.ready());
    }

    ready() {
      if (!this.live && this.entry.loaded.has(FRAMES - 1) && this.entry.loaded.has(0)) {
        this.live = true;
        this.el.classList.add("is-live");
        this.resize();
        this.measure();
        this.t = this.target;
        if (this.mode === "play") this.play(0);
      }
      this.draw();
    }

    resize() {
      const r = this.el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(r.width * dpr);
      this.canvas.height = Math.round(r.height * dpr);
      this.draw();
    }

    measure() {
      if (this.mode === "play") return;
      const vh = window.innerHeight;
      const r = this.el.getBoundingClientRect();
      let t;
      if (this.mode === "hero") {
        t = window.scrollY / (vh * 0.6);
      } else if (this.scroller && this.scroller.scrollWidth > this.scroller.clientWidth + 4) {
        const s = this.scroller.getBoundingClientRect();
        const off = Math.abs((r.left + r.width / 2) - (s.left + s.width / 2));
        t = 1 - off / (s.width * 0.75);
      } else {
        t = (vh - r.top) / (vh * 0.55 + r.height / 2);
      }
      this.target = clamp(t);
      this.kick();
    }

    play(from = 0) {
      this.t = from;
      this.target = from;
      const start = performance.now();
      const dur = 1300;
      const step = (now) => {
        const k = clamp((now - start) / dur);
        this.target = from + (1 - from) * (1 - Math.pow(1 - k, 3));
        this.kick();
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    kick() {
      if (this.raf) return;
      const tick = () => {
        this.raf = null;
        const d = this.target - this.t;
        this.t = Math.abs(d) < 0.001 ? this.target : this.t + d * 0.2;
        this.draw();
        if (this.t !== this.target) this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }

    draw() {
      if (!this.live || !this.canvas.width) return;
      const { ctx, canvas } = this;
      const pos = this.t * (FRAMES - 1);
      const i = Math.floor(pos);
      const f = pos - i;
      const a = nearest(this.entry, i);
      const b = f > 0.01 ? nearest(this.entry, Math.min(i + 1, FRAMES - 1)) : null;
      const side = Math.min(canvas.width, canvas.height);
      const x = (canvas.width - side) / 2;
      const y = (canvas.height - side) / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      if (a) {
        ctx.globalAlpha = b && b !== a ? 1 - f : 1;
        ctx.drawImage(a, x, y, side, side);
      }
      if (b && b !== a) {
        // additive blend of two premultiplied frames = a true crossfade
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = f;
        ctx.drawImage(b, x, y, side, side);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function init(root) {
    if (reduce) return;
    (root || document).querySelectorAll(".motion[data-seq]").forEach((el) => {
      if (!el.motion) new Player(el);
    });
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      players.forEach((p) => { if (p.visible || p.mode === "hero") p.measure(); });
    });
  }, { passive: true });
  window.addEventListener("resize", () => players.forEach((p) => p.measure()));

  window.TTMotion = { init };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init());
  else init();
})();
