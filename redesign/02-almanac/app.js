// Deferred, so the DOM is parsed. Runs before leave.js so the links built here get its in-app-browser handling.
(function () {
  const { menu, vouches, el, vouchButton } = window.TT;

  // the bill of fare
  const bill = document.querySelector("#bill");
  menu.categories.forEach((c) => {
    const thumb = c.render
      ? el("div", { class: "thumb" }, [el("img", { src: "../motion/" + c.render + "/360/31.webp", alt: "", loading: "lazy", decoding: "async", width: "360", height: "360" })])
      : el("div", { class: "thumb empty", text: "2g" });
    const price = "from $" + c.from + "/" + c.unit;
    bill.appendChild(el("li", {}, [
      thumb,
      el("div", {}, [
        el("div", { class: "row" }, [el("h3", { text: c.name }), el("span", { class: "leader", "aria-hidden": "true" }), el("span", { class: "price", text: price })]),
        el("p", { class: "desc", text: c.blurb }),
        el("p", { class: "strains", text: c.strains.map((s) => s.name).join(" · ") })
      ])
    ]));
  });
  bill.appendChild(el("li", {}, [
    el("div", { class: "thumb empty", text: "flower" }),
    el("div", {}, [
      el("div", { class: "row" }, [el("h3", { text: "Flower" }), el("span", { class: "leader", "aria-hidden": "true" }), el("span", { class: "price", text: "ask" })]),
      el("p", { class: "desc", text: "Message me directly for availability and pricing." })
    ])
  ]));

  // letters
  const grid = document.querySelector("#letterGrid");
  const more = document.querySelector("#letterMore");
  document.querySelectorAll("[data-vouch-count]").forEach((n) => { n.textContent = vouches.length; });
  let shown = 0;
  const page = () => {
    const next = Math.min(shown + 12, vouches.length);
    for (let i = shown; i < next; i++) grid.appendChild(vouchButton(i));
    shown = next;
    more.hidden = shown >= vouches.length;
  };
  page();
  more.addEventListener("click", page);
})();
