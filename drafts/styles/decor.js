// Style drafts: pulls in the dab sticker sprite and drops stickers + badges into the page sections.
// Each page sets window.DECOR = { top: [ids], sec: { burned: id, menu: id, vouches: id, ship: id }, badges: { key: text } }.
(function () {
  const D = window.DECOR || {};
  const ns = "http://www.w3.org/2000/svg";
  const sprite = new URL("../../assets/images/dab-icons.svg", document.currentScript.src).href;
  const sections = { burned: "#burned", menu: "#menu", vouches: '[aria-labelledby="v-title"]', ship: '[aria-labelledby="s-title"]' };

  function sticker(id, cls) {
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "stk " + cls);
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(ns, "use");
    use.setAttribute("href", "#" + id);
    svg.appendChild(use);
    return svg;
  }

  function place() {
    const top = document.querySelector(".top");
    (D.top || []).forEach((id, i) => top && top.appendChild(sticker(id, "stk-top stk-t" + (i + 1))));
    Object.entries(D.sec || {}).forEach(([key, id]) => {
      const sec = document.querySelector(sections[key]);
      if (sec) sec.appendChild(sticker(id, "stk-sec stk-" + key));
    });
    Object.entries(D.badges || {}).forEach(([key, text]) => {
      const sec = key === "top" ? top : document.querySelector(sections[key]);
      const h = sec && sec.querySelector("h1, h2");
      if (h) h.before(Object.assign(document.createElement("span"), { className: "badge badge-" + key, textContent: text, ariaHidden: "true" }));
    });
  }

  fetch(sprite).then((r) => r.text()).then((svg) => {
    const holder = document.createElement("div");
    holder.setAttribute("aria-hidden", "true");
    holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    holder.innerHTML = svg;
    document.body.prepend(holder);
  }).catch(() => {});
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", place);
  else place();
})();
