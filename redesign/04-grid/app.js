// Deferred, so the DOM is parsed. Runs before leave.js so the links built here get its in-app-browser handling.
(function () {
  const { menu, vouches, links, el, vouchButton } = window.TT;

  // product tiles, numbered
  const tiles = document.querySelector("#tiles");
  menu.categories.forEach((c, i) => {
    const art = c.render
      ? TT.motionBox(c.render, "view", c.name + ", studio render")
      : el("span", { class: "placeholder", text: "2g" });
    const price = "$" + c.from + "/" + c.unit;
    tiles.appendChild(el("a", { class: "tile leaves-site", href: links.ask(c.name) }, [
      el("div", { class: "tile-top" }, [el("span", { text: String(i + 1).padStart(2, "0") }), el("span", { text: "Ask ↗" })]),
      el("div", { class: "tile-img" }, [art]),
      el("h3", { text: c.name }),
      el("p", { class: "from" }, [el("span", { text: c.note }), el("b", { text: price })]),
      el("p", { class: "strains", text: c.strains.map((s) => s.name).join(", ") })
    ]));
  });

  // the wall: 16 up front, the rest on demand
  const wall = document.querySelector("#wall");
  const more = document.querySelector("#wallMore");
  document.querySelectorAll("[data-vouch-count]").forEach((n) => { n.textContent = vouches.length; });
  const add = (from, to) => { for (let i = from; i < to; i++) wall.appendChild(vouchButton(i)); };
  add(0, 16);
  more.addEventListener("click", () => {
    add(16, vouches.length);
    more.hidden = true;
  });
})();
