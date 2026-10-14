// Tiny scroll-motion engine (homepage and the /drafts motion pages). No libraries, works in every browser.
//
//   <section data-scene="pin" data-steps="0,.3,.6,1">   tall section with a sticky stage inside.
//        Sets --p (0→1 while pinned), --s0, --s1… (progress inside each step) and data-step.
//   <div data-scene="view">                               plain section. --p runs 0→1 from the moment
//        it enters at the bottom of the screen until it leaves at the top.
//   <svg data-float="0.3" data-spin="20">                 parallax: drifts up (positive) or down
//        (negative) against the scroll, optionally turning as it goes.
//   data-reveal                                           gets .in once it scrolls into view
//   data-split                                            letters wrapped in <span style="--i">
//   data-count="64"                                       counts up when revealed
//
// Values ease toward the scroll position instead of jumping, which gives the motion its weight.
// "Reduce motion" visitors get every scene in its finished state and nothing moving.
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) root.classList.add("rm");

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const span = (p, a, b) => clamp((p - a) / (b - a));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2)
  };

  const scenes = [];
  const floats = [];
  let vh = window.innerHeight;
  let lastY = window.scrollY;
  let vel = 0;
  let queued = false;

  function addScene(el) {
    if (el._scene) return el._scene;
    const steps = (el.dataset.steps || "").split(",").filter(Boolean).map(Number);
    const s = { el, mode: el.dataset.scene || "pin", steps, fns: [], cur: null, target: 0, step: -1, seg: [] };
    el._scene = s;
    scenes.push(s);
    return s;
  }

  function addFloat(el) {
    if (el._float) return;
    el._float = { el, speed: Number(el.dataset.float) || 0, spin: Number(el.dataset.spin) || 0, cur: 0, target: 0 };
    floats.push(el._float);
  }

  function split(el) {
    if (el._split) return;
    el._split = true;
    const text = el.textContent;
    el.setAttribute("aria-label", text.trim());
    el.textContent = "";
    let i = 0;
    text.split(/(\s+)/).forEach((word) => {
      if (!word) return;
      if (/^\s+$/.test(word)) { el.appendChild(document.createTextNode(" ")); return; }
      const w = document.createElement("span");
      w.className = "w";
      w.setAttribute("aria-hidden", "true");
      [...word].forEach((ch) => {
        const c = document.createElement("span");
        c.className = "ch";
        c.textContent = ch;
        c.style.setProperty("--i", i++);
        w.appendChild(c);
      });
      el.appendChild(w);
    });
    el.style.setProperty("--n", i);
  }

  function countUp(el) {
    const end = Number(el.dataset.count);
    if (reduce || !end) { el.textContent = end; return; }
    const t0 = performance.now();
    const tick = (now) => {
      const k = clamp((now - t0) / 1400);
      el.textContent = Math.round(end * ease.out(k));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      if (e.target.dataset.count) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -12% 0px" }) : null;

  function scan(scope) {
    const base = scope || document;
    base.querySelectorAll("[data-scene]").forEach(addScene);
    base.querySelectorAll("[data-float]").forEach(addFloat);
    base.querySelectorAll("[data-split]").forEach(split);
    base.querySelectorAll("[data-reveal],[data-count]").forEach((el) => {
      if (el._seen) return;
      el._seen = true;
      if (io && !reduce) io.observe(el);
      else { el.classList.add("in"); if (el.dataset.count) el.textContent = el.dataset.count; }
    });
    schedule();
  }

  function read() {
    scenes.forEach((s) => {
      const r = s.el.getBoundingClientRect();
      s.target = s.mode === "pin"
        ? clamp(-r.top / Math.max(1, r.height - vh))
        : clamp((vh - r.top) / (vh + r.height));
      s.near = r.bottom > -vh * 0.5 && r.top < vh * 1.5;
      if (reduce) s.target = 1;
    });
    floats.forEach((f) => {
      const r = f.el.getBoundingClientRect();
      const centre = r.top + r.height / 2 - f.cur; // where it would sit with no parallax
      f.near = centre > -vh && centre < vh * 2;
      f.target = reduce ? 0 : (vh / 2 - centre) * f.speed;
    });
  }

  function apply(s) {
    const p = s.cur;
    s.el.style.setProperty("--p", p.toFixed(4));
    let step = 0;
    for (let i = 0; i < s.steps.length - 1; i++) {
      const v = span(p, s.steps[i], s.steps[i + 1]);
      s.seg[i] = v;
      s.el.style.setProperty("--s" + i, v.toFixed(4));
      if (p >= s.steps[i]) step = i;
    }
    if (step !== s.step) {
      s.step = step;
      s.el.dataset.step = step;
    }
    s.fns.forEach((fn) => fn(p, s));
  }

  function frame() {
    queued = false;
    read();
    const y = window.scrollY;
    vel += ((y - lastY) - vel) * 0.12;
    lastY = y;
    let moving = Math.abs(vel) > 0.05;
    if (!moving) vel = 0;

    scenes.forEach((s) => {
      const k = Number(s.el.dataset.lerp) || 0.16;
      if (s.cur === null || !s.near || reduce) s.cur = s.target;
      else {
        s.cur += (s.target - s.cur) * k;
        if (Math.abs(s.target - s.cur) < 0.0004) s.cur = s.target;
        else moving = true;
      }
      apply(s);
    });

    floats.forEach((f) => {
      if (!f.near) { f.cur = f.target; return; }
      f.cur += (f.target - f.cur) * 0.1;
      if (Math.abs(f.target - f.cur) < 0.2) f.cur = f.target;
      else moving = true;
      const turn = f.spin ? " rotate(" + (f.cur * f.spin / 100).toFixed(2) + "deg)" : "";
      f.el.style.transform = "translate3d(0," + f.cur.toFixed(1) + "px,0)" + turn;
    });

    const max = document.documentElement.scrollHeight - vh;
    root.style.setProperty("--page", max > 0 ? clamp(y / max).toFixed(4) : "0");
    root.style.setProperty("--vel", clamp(vel / 40, -1, 1).toFixed(3));
    if (moving) schedule();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  }

  function on(el, fn) {
    const s = addScene(el);
    s.fns.push(fn);
    if (s.cur !== null) fn(s.cur, s);
    schedule();
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", () => { vh = window.innerHeight; schedule(); });
  window.addEventListener("load", schedule);

  // The dab icon sprite (assets/images/dab-icons.svg) is pulled into the page so <use href="#drop"> works and picks up page colours.
  fetch(new URL("../images/dab-icons.svg", document.currentScript.src).href).then((r) => r.text()).then((svg) => {
    const holder = document.createElement("div");
    holder.setAttribute("aria-hidden", "true");
    holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    holder.innerHTML = svg;
    document.body.prepend(holder);
  }).catch(() => {});

  window.TTScroll = { scan, on, clamp, span, mix, ease, reduce, refresh: schedule };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => scan());
  else scan();
})();
