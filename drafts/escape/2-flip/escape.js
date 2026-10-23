// Escape 2 · Flip — the answer appears exactly where you tapped.
// In-app, every Telegram button wears a small lock sticker. Tapping one flips it over (3D) into a card
// with the two taps, and a dotted line draws itself from the card up to the ••• button.
(function () {
  const E = window.ESC;
  let card, line, from = null, href = "", openY = 0;

  function build() {
    card = document.createElement("div");
    card.className = "c2";
    card.hidden = true;
    card.innerHTML = `
      <div class="c2-in">
        <div class="c2-face c2-front"><span class="c2-label"></span></div>
        <section class="c2-face c2-back" role="dialog" aria-modal="false" aria-labelledby="c2t">
          <p class="esc-k">&#128274; <span data-esc="app"></span> blocks Telegram</p>
          <h3 id="c2t">2 taps and it opens</h3>
          <ol>
            <li><b>1</b>Tap <span class="esc-chip">&#8943;</span> up there <span class="c2-arrow" aria-hidden="true">&nearr;</span></li>
            <li><b>2</b>Tap <span class="esc-chip" data-esc="menu"></span></li>
          </ol>
          <p class="c2-then">Then tap this button again.</p>
          <div class="c2-btns">
            <button type="button" class="c2-copy">Copy link</button>
            <button type="button" class="c2-close" aria-label="Flip back">&#8634; Flip back</button>
          </div>
        </section>
      </div>`;
    document.body.appendChild(card);
    E.fill(card);

    line = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    line.setAttribute("class", "c2-line");
    line.setAttribute("aria-hidden", "true");
    line.innerHTML = '<path/><circle r="7"/>';
    document.body.appendChild(line);

    card.querySelector(".c2-close").addEventListener("click", close);
    card.querySelector(".c2-copy").addEventListener("click", (e) => {
      const b = e.currentTarget;
      E.copy(href).then((ok) => { b.textContent = ok ? "Copied ✓ paste in " + E.browser : "Couldn't copy"; });
      E.track("esc2_copy");
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !card.hidden) close(); });
    document.addEventListener("click", (e) => {
      if (!card.hidden && card.classList.contains("on") && !card.contains(e.target) && !e.target.closest("a.leaves-site")) close();
    });
    // the line is pinned to the screen, so a real scroll puts the card back
    window.addEventListener("scroll", () => { if (from && Math.abs(window.scrollY - openY) > 60) close(); }, { passive: true });
  }

  function rectOf(el) {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }

  function set(box) {
    card.style.left = box.left + "px";
    card.style.top = box.top + "px";
    card.style.width = box.width + "px";
    card.style.height = box.height + "px";
  }

  function open(link) {
    href = link.href;
    from = link;
    openY = window.scrollY;
    const start = rectOf(link);
    const w = Math.min(window.innerWidth - 24, 360);
    const h = 236;
    const chrome = document.querySelector(".fx-chrome");
    const top = Math.max((chrome ? chrome.offsetHeight : 0) + 70,
      Math.min(window.innerHeight - h - 16, start.top + start.height / 2 - h / 2));
    const end = { left: (window.innerWidth - w) / 2, top, width: w, height: h };

    const label = link.querySelector("b") || link;
    card.querySelector(".c2-label").textContent = label.textContent.replace(/\u{1F512}.*$/u, "").trim().replace(/\s+/g, " ").slice(0, 40);
    const cs = getComputedStyle(link);
    card.style.setProperty("--front-bg", cs.backgroundImage !== "none" ? cs.backgroundImage : cs.backgroundColor);
    card.style.setProperty("--front-radius", cs.borderRadius);

    card.querySelector(".c2-copy").textContent = "Copy link";
    card.classList.remove("on", "drawn");
    card.hidden = false;
    set(start);
    link.style.visibility = "hidden";
    void card.offsetWidth; // start from the button's exact spot
    card.classList.add("on");
    set(end);
    setTimeout(() => drawLine(end), 520);
    E.track("esc2_flip");
  }

  function drawLine(end) {
    const d = E.dots();
    const x1 = end.left + end.width - 34;
    const y1 = end.top + 6;
    const x2 = d.left + d.width / 2;
    const y2 = d.bottom + 4;
    const path = line.querySelector("path");
    path.setAttribute("d", `M${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${y1 - 40}, ${x2} ${y2}`);
    const c = line.querySelector("circle");
    c.setAttribute("cx", x2);
    c.setAttribute("cy", Math.max(y2, 10));
    const len = path.getTotalLength();
    line.style.setProperty("--len", len);
    line.classList.remove("draw");
    void line.getBoundingClientRect();
    line.classList.add("draw");
    card.classList.add("drawn");
  }

  function close() {
    if (!from) return;
    const link = from;
    from = null;
    line.classList.remove("draw");
    card.classList.remove("on", "drawn");
    set(rectOf(link));
    setTimeout(() => { card.hidden = true; link.style.visibility = ""; }, 520);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!E.app) return;
    build();
    const mark = () => document.querySelectorAll("a.leaves-site:not(.c2-locked)").forEach((a) => {
      a.classList.add("c2-locked");
      const tag = document.createElement("span");
      tag.className = "c2-tag";
      tag.setAttribute("aria-hidden", "true");
      tag.textContent = a.matches(".order, .btn, .hl") || a.offsetHeight > 44 ? "\u{1F512} 2-tap fix" : "\u{1F512}";
      a.appendChild(tag);
    });
    mark();
    setTimeout(mark, 800);
    E.onTap(open);
  });
})();
