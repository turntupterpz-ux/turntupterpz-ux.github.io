// Deferred, so the DOM is parsed. Runs before leave.js so the links built here get its in-app-browser handling.
(function () {
  const { menu, vouches, links, el, vouchButton } = window.TT;

  // lineup cards
  const rail = document.querySelector("#lineupRail");
  menu.categories.filter((c) => c.render).forEach((c) => {
    const img = TT.motionBox(c.render, "x", c.name + ", studio render");
    const strains = el("ul", { class: "strains" }, c.strains.map((s) =>
      el("li", { html: s.name + "<b>" + s.type + "</b>" })));
    const ask = el("a", { class: "ask leaves-site", href: links.ask(c.name) , html: "Ask about " + c.name.toLowerCase() + ' <svg width="15" height="15" aria-hidden="true"><use href="../../assets/images/icons.svg#arrow"/></svg>' });
    rail.appendChild(el("article", { class: "prod" }, [
      el("div", { class: "prod-img" }, [img]),
      el("div", { class: "prod-body" }, [
        el("div", { class: "prod-top" }, [
          el("h3", { text: c.name }),
          el("span", { class: "price", text: "from $" + c.from + "/" + c.unit })
        ]),
        el("p", { class: "note", text: c.note }),
        strains,
        ask
      ])
    ]));
  });

  // vouches: a rail of 12, expandable to the full wall
  const vouchRail = document.querySelector("#vouchRail");
  const allBtn = document.querySelector("#vouchAll");
  document.querySelectorAll("[data-vouch-count]").forEach((n) => { n.textContent = vouches.length; });
  const add = (from, to) => { for (let i = from; i < to; i++) vouchRail.appendChild(vouchButton(i)); };
  add(0, 12);
  allBtn.addEventListener("click", () => {
    add(12, vouches.length);
    vouchRail.classList.add("all");
    allBtn.hidden = true;
  });

  // header hairline + mobile action dock once the hero is gone
  const top = document.querySelector(".top");
  const dock = document.querySelector("#dock");
  const heroActions = document.querySelector(".hero-actions");
  const onScroll = () => top.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  new IntersectionObserver(([entry]) => {
    const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    dock.classList.toggle("show", show);
    dock.setAttribute("aria-hidden", show ? "false" : "true");
    dock.querySelectorAll("a").forEach((a) => a.tabIndex = show ? 0 : -1);
  }).observe(heroActions);

})();
