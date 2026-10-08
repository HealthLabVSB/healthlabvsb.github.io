/* Health Lab VSB - TU Ostrava – Code & Data
   Content lives in data/site.json and data/publications.json.
   Repositories are read live from the GitHub API (public repos only). */
(function () {
  "use strict";

  const TYPE_LABEL = { article: "Paper", dataset: "Dataset", software: "Software" };
  const HIDDEN_REPOS = new Set([".github", "healthlabvsb.github.io"]);
  // Shown only if the GitHub API cannot be reached (offline preview, rate limit).
  const FALLBACK_REPOS = [
    { name: "DARTscope", description: "Tools for inspecting, processing and visualising TI mmWave radar data captured with the DCA1000 EVM.", language: "Python", topics: ["radar"] },
    { name: "osc-aus-bp-validation", description: "MATLAB scripts for preprocessing and technical validation of oscillometric blood pressure measurements against auscultatory reference.", language: "MATLAB", topics: ["blood-pressure"] },
    { name: "Synchronized-multimodal-dataset-for-central-autonomic-coupling-in-meditation-and-rest", description: "Analysis scripts for the synchronized multimodal dataset (EEG, fNIRS, GSR, HR/HRV) in meditation and rest.", language: "MATLAB", topics: ["biosignals"] },
    { name: "physiological-signal-dataset-on-meditation-induced-relaxation", description: "GSR, HR and HRV recordings during meditation in controlled and home environments.", language: "MATLAB", topics: ["biosignals"] },
    { name: "automatic-blood-vessel-segmentation-approach-for-newborn-fundus-images", description: "Automatic retinal blood vessel segmentation for ROP plus form diagnosis.", language: "HTML", topics: ["medical-imaging"] },
    { name: "segmentation-classification-algorithm", description: "Hybrid segmentation–classification of retinal vessel tortuosity in ROP plus disease.", language: "MATLAB", topics: ["medical-imaging"] }
  ];

  const $ = (s, el = document) => el.querySelector(s);
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "style") el.setAttribute("style", v);
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
    return el;
  };

  /* ---------- theme ---------- */
  const root = document.documentElement;
  try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch (e) {}
  $(".theme-toggle").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  });

  /* ---------- data ---------- */
  async function loadData() {
    if (window.__SITE_DATA__) return window.__SITE_DATA__; // bundled preview
    const [site, pubs] = await Promise.all([
      fetch("data/site.json").then(r => r.json()),
      fetch("data/publications.json").then(r => r.json())
    ]);
    return { site, pubs };
  }

  const areaColor = id => `var(--area-${id}, var(--accent))`;
  const shortAuthors = list => {
    const names = list.map(a => {
      const [family, given = ""] = a.split(",").map(s => s.trim());
      return `${family} ${given.split(/[\s-]+/).filter(Boolean).map(g => g[0] + ".").join(" ")}`.trim();
    });
    return names.length > 6 ? names.slice(0, 5).join(", ") + ", … " + names[names.length - 1] : names.join(", ");
  };

  function bibtex(p) {
    // Classic BibTeX types only (@article, @misc) so every journal template accepts it.
    const isArticle = p.type === "article";
    const note = p.type === "dataset" ? "Dataset"
      : p.type === "software" ? "Software" + (p.version ? `, version ${p.version}` : "") : null;
    const f = [
      ["title", `{${p.title}}`],
      ["author", p.authors.join(" and ")],
      isArticle ? ["journal", p.venue] : ["howpublished", p.venue],
      ["year", p.year],
      ["volume", p.volume],
      ["number", p.number],
      ["note", note],
      ["doi", p.doi],
      ["url", p.doi ? `https://doi.org/${p.doi}` : p.code]
    ].filter(([, v]) => v != null && v !== "");
    return `@${isArticle ? "article" : "misc"}{${p.id},\n` + f.map(([k, v]) => `  ${k.padEnd(13)}= {${v}}`).join(",\n") + "\n}";
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* ---------- render ---------- */
  function renderStatic(site, pubs) {
    document.querySelectorAll('[data-bind]').forEach(el => {
      const v = site[el.dataset.bind];
      if (v) el.textContent = v;
    });
    // Keep the name readable when it wraps: break only between its two parts.
    const h1Name = $(".hero h1 [data-bind=name]");
    if (h1Name && site.name.includes(" - ")) {
      const [a, b] = site.name.split(" - ");
      h1Name.replaceChildren(h("span", { class: "nowrap" }, a), " ", h("span", { class: "nowrap" }, "- " + b));
    }
    const L = site.links || {};
    const link = (label, url, primary) => url
      ? h("a", { class: "btn" + (primary ? " primary" : ""), href: url, target: url.startsWith("mailto") ? null : "_blank", rel: "noopener" }, label)
      : null;
    $("#hero-links").append(...[
      link("GitHub organization", L.github, true),
      link("Group website", L.website),
      link("LinkedIn", L.linkedin),
      link("Facebook", L.facebook),
      link("Contact", L.email && "mailto:" + L.email)
    ].filter(Boolean));
    $("#footer-links").append(
      ...[["GitHub", L.github], ["Website", L.website], ["LinkedIn", L.linkedin], ["Facebook", L.facebook], ["Contact", L.email && "mailto:" + L.email]]
        .filter(([, u]) => u).map(([t, u]) => h("a", { href: u }, t))
    );
    $("#funding").textContent = site.funding ? "Funding: " + site.funding : "";

    const count = t => pubs.filter(p => p.type === t).length;
    $("#stats").append(
      ...[["Papers", count("article")], ["Datasets", count("dataset")], ["Software", count("software")], ["Research areas", site.areas.length]]
        .map(([k, v]) => h("div", {}, h("dt", {}, k), h("dd", {}, String(v))))
    );
  }

  function renderAreas(site, pubs, onPick) {
    $("#area-grid").append(...site.areas.map(a => {
      const n = pubs.filter(p => p.area === a.id).length;
      return h("article", { class: "area", id: a.id, style: `--c:${areaColor(a.id)}` },
        h("h3", {}, a.name),
        h("p", {}, a.description),
        h("div", { class: "area-meta" },
          h("button", { type: "button", onclick: () => onPick(a.id) }, `${n} publication${n === 1 ? "" : "s"}`),
          h("a", { href: `https://github.com/orgs/${site.org}/repositories?q=topic%3A${a.topic}`, target: "_blank", rel: "noopener" }, "Repositories ↗")
        )
      );
    }));
  }

  function renderPubs(site, pubs) {
    const state = { area: null, type: null, q: "" };
    const areaName = Object.fromEntries(site.areas.map(a => [a.id, a.name]));

    const chip = (label, group, value, color) => h("button", {
      class: "chip", type: "button", "aria-pressed": "false", "data-group": group, "data-value": value ?? "",
      onclick: () => { state[group] = value; sync(); draw(); }
    }, color ? h("span", { class: "dot", style: `--c:${color}` }) : null, label);

    $("#area-chips").append(chip("All areas", "area", null), ...site.areas.map(a => chip(a.name, "area", a.id, areaColor(a.id))));
    $("#type-chips").append(chip("All types", "type", null), ...Object.entries(TYPE_LABEL).map(([k, v]) => chip(v, "type", k)));
    $("#pub-search").addEventListener("input", e => { state.q = e.target.value.trim().toLowerCase(); draw(); });

    function sync() {
      document.querySelectorAll(".chip").forEach(c => {
        const v = c.dataset.value || null;
        c.setAttribute("aria-pressed", String(state[c.dataset.group] === v));
      });
    }

    function card(p) {
      const actions = [
        p.doi && h("a", { class: "act", href: `https://doi.org/${p.doi}`, target: "_blank", rel: "noopener" }, p.type === "dataset" ? "Dataset DOI" : "Paper"),
        p.code && h("a", { class: "act", href: p.code, target: "_blank", rel: "noopener" }, "Code"),
        p.data && h("a", { class: "act", href: p.data, target: "_blank", rel: "noopener" }, "Data")
      ];
      const li = h("li", { class: "pub" });
      let bibEl = null;
      const bibBtn = h("button", {
        class: "act", type: "button", "aria-expanded": "false", onclick: async () => {
          const text = bibtex(p);
          if (!bibEl) { bibEl = h("pre", { class: "bib" }, text); li.append(bibEl); bibBtn.setAttribute("aria-expanded", "true"); }
          else { bibEl.remove(); bibEl = null; bibBtn.setAttribute("aria-expanded", "false"); return; }
          try { await navigator.clipboard.writeText(text); toast("BibTeX copied to clipboard"); } catch (e) { toast("BibTeX shown below"); }
        }
      }, "BibTeX");
      const venue = [h("em", {}, p.venue), p.volume && p.volume !== String(p.year) ? ` ${p.volume}` : "", p.number ? `, ${p.number}` : "", p.version ? ` (v${p.version})` : ""];
      li.append(...[
        h("div", { class: "pub-year" }, String(p.year)),
        h("div", { class: "pub-title" }, p.title),
        h("div", { class: "pub-authors" }, shortAuthors(p.authors)),
        h("div", {},
          h("span", { class: "pub-venue" }, ...venue),
          h("div", { class: "tags" },
            h("span", { class: "tag" }, h("span", { class: "dot", style: `--c:${areaColor(p.area)}` }), areaName[p.area] || p.area),
            h("span", { class: "tag" }, TYPE_LABEL[p.type] || p.type))
        ),
        p.related && h("div", { class: "related" }, "Related: ", h("a", { href: `https://doi.org/${p.related.doi}`, target: "_blank", rel: "noopener" }, p.related.label)),
        h("div", { class: "pub-actions" }, ...actions, bibBtn)
      ].filter(Boolean));
      return li;
    }

    function draw() {
      const list = pubs
        .filter(p => !state.area || p.area === state.area)
        .filter(p => !state.type || p.type === state.type)
        .filter(p => !state.q || (p.title + " " + p.authors.join(" ") + " " + p.venue).toLowerCase().includes(state.q))
        .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
      $("#pub-list").replaceChildren(...list.map(card));
      $("#pub-empty").hidden = list.length > 0;
    }

    sync(); draw();
    return area => { state.area = area; sync(); draw(); document.getElementById("publications").scrollIntoView(); };
  }

  async function renderRepos(site) {
    const status = $("#repo-status");
    let repos, live = true;
    try {
      const r = await fetch(`https://api.github.com/orgs/${site.org}/repos?type=public&per_page=100&sort=pushed`, { headers: { Accept: "application/vnd.github+json" } });
      if (!r.ok) throw new Error(r.status);
      repos = (await r.json()).filter(x => !x.archived);
    } catch (e) {
      repos = FALLBACK_REPOS; live = false;
    }
    repos = repos.filter(x => !HIDDEN_REPOS.has(x.name.toLowerCase()));
    const areaIds = new Set(site.areas.map(a => a.id));
    $("#repo-grid").replaceChildren(...repos.map(x => {
      const area = (x.topics || []).find(t => areaIds.has(t));
      return h("a", { class: "repo", href: x.html_url || `https://github.com/${site.org}/${x.name}`, target: "_blank", rel: "noopener" },
        h("span", { class: "repo-name" }, x.name),
        h("span", { class: "repo-desc" }, x.description || "No description yet."),
        h("span", { class: "repo-meta" },
          area && h("span", { class: "tag" }, h("span", { class: "dot", style: `--c:${areaColor(area)}` }), site.areas.find(a => a.id === area).name),
          x.language && h("span", {}, x.language),
          x.stargazers_count ? h("span", {}, "★ " + x.stargazers_count) : null,
          x.license && x.license.spdx_id && x.license.spdx_id !== "NOASSERTION" ? h("span", {}, x.license.spdx_id) : null
        )
      );
    }));
    status.textContent = live
      ? `${repos.length} public repositories, updated live from GitHub.`
      : "Showing a cached list — live data from GitHub is unavailable right now.";
  }

  loadData().then(({ site, pubs }) => {
    renderStatic(site, pubs);
    const pick = renderPubs(site, pubs);
    renderAreas(site, pubs, pick);
    renderRepos(site);
  }).catch(err => {
    $("#pub-list").replaceChildren(h("li", { class: "empty" }, "Could not load data: " + err.message));
  });
})();
