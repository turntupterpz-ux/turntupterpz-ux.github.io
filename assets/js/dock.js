// Homepage: copies the Telegram/WhatsApp pair into a dock at the bottom of the screen (the thumb zone).
// It shows only while neither of the page's own button pairs is visible, so there is never a double.
(function () {
  function start() {
    const pairs = Array.from(document.querySelectorAll("main .ctas"));
    if (!pairs.length) return;
    const dock = document.createElement("div");
    dock.className = "dock-glow";
    const copy = pairs[0].cloneNode(true);
    copy.querySelectorAll("[data-label]").forEach((a) => { a.dataset.label = a.dataset.label.replace(/^home_top/, "home_dock"); });
    dock.appendChild(copy);
    document.body.appendChild(dock);
    const seen = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      dock.classList.toggle("on", seen.size === 0 && window.scrollY > 200);
    });
    pairs.forEach((p) => io.observe(p));
    window.addEventListener("scroll", () => dock.classList.toggle("on", seen.size === 0 && window.scrollY > 200), { passive: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
