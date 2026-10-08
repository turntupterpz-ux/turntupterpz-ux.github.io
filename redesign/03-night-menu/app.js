// Deferred, so the DOM is parsed. Runs before leave.js so the links built here get its in-app-browser handling.
(function () {
  const { menu, vouches, links, el, vouchButton } = window.TT;
  const tabs = document.querySelector("#tabs");
  const panels = document.querySelector("#panels");

  function priceGrid(labels, prices, perGram) {
    return el("div", { class: "prices" + (labels.length === 3 ? " tiers" : "") }, labels.map((label, i) => {
      const last = i === labels.length - 1;
      const cell = el("div", { class: last ? "best" : "" }, [
        el("span", { text: label }),
        el("b", { text: "$" + prices[i] })
      ]);
      if (perGram && last) cell.appendChild(el("small", { text: "$" + (prices[i] / 28.5).toFixed(2) + "/g" }));
      return cell;
    }));
  }

  function rosinTable(c) {
    const head = el("tr", {}, [el("th", { text: "Strain", scope: "col" })].concat(menu.weights.map((w) => el("th", { text: w, scope: "col" }))));
    const body = c.strains.map((s) => el("tr", {}, [
      el("th", { scope: "row", html: s.name + ' <span class="type">' + s.type + "</span><small>" + s.micron + "</small>" })
    ].concat(s.prices.map((p) => el("td", { text: "$" + p })))));
    return el("table", { class: "rosin-table" }, [el("thead", {}, [head]), el("tbody", {}, body)]);
  }

  menu.categories.forEach((c, index) => {
    const tabId = "tab-" + c.id;
    const panelId = "panel-" + c.id;
    const tab = el("button", {
      type: "button", role: "tab", id: tabId, "aria-controls": panelId,
      "aria-selected": index === 0 ? "true" : "false", tabindex: index === 0 ? "0" : "-1",
      text: c.name
    });
    tabs.appendChild(tab);

    const art = c.render
      ? el("div", { class: "panel-art" }, [TT.motionBox(c.render, "play", c.name + ", studio render")])
      : el("div", { class: "panel-art" }, [el("span", { class: "noart", text: "2G" })]);

    const info = el("div", { class: "panel-info" }, [
      el("h3", { text: c.name }),
      el("p", { class: "note", text: c.note }),
      el("p", { class: "blurb", text: c.blurb })
    ]);

    if (c.id === "rosin") {
      info.appendChild(rosinTable(c));
    } else {
      info.appendChild(el("ul", { class: "strain-list" }, c.strains.map((s) =>
        el("li", { html: s.name + '<span class="type">' + s.type + "</span>" }))));
      if (c.prices) info.appendChild(priceGrid(menu.weights, c.prices, true));
      if (c.tiers) info.appendChild(priceGrid(c.tiers.map((t) => t[0]), c.tiers.map((t) => t[1]), false));
    }
    info.appendChild(el("a", {
      class: "order-this leaves-site", href: links.ask(c.name),
      html: "Order " + c.name.toLowerCase() + ' on Telegram <svg width="16" height="16" aria-hidden="true"><use href="../../assets/images/icons.svg#arrow"/></svg>'
    }));

    const panel = el("div", { class: "panel", role: "tabpanel", id: panelId, "aria-labelledby": tabId }, [art, info]);
    panel.hidden = index !== 0;
    panels.appendChild(panel);
  });

  function select(tab) {
    tabs.querySelectorAll("[role=tab]").forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      const wasHidden = panel.hidden;
      panel.hidden = !on;
      const m = panel.querySelector(".motion");
      if (on && wasHidden && m && m.motion && m.motion.live) m.motion.play(0);
    });
    tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }
  tabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[role=tab]");
    if (tab) select(tab);
  });
  tabs.addEventListener("keydown", (event) => {
    const all = [...tabs.querySelectorAll("[role=tab]")];
    const i = all.indexOf(document.activeElement);
    if (i < 0) return;
    let next = null;
    if (event.key === "ArrowRight") next = all[(i + 1) % all.length];
    if (event.key === "ArrowLeft") next = all[(i - 1 + all.length) % all.length];
    if (next) { event.preventDefault(); next.focus(); select(next); }
  });

  // two-row vouch strip
  const strip = document.querySelector("#strip");
  document.querySelectorAll("[data-vouch-count]").forEach((n) => { n.textContent = vouches.length; });
  vouches.forEach((_, i) => strip.appendChild(vouchButton(i)));
})();
