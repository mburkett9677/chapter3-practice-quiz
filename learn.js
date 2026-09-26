(function () {
  const content = window.LEARN_CONTENT;
  if (!content) return;

  const SECTIONS = [
    { id: "overview", label: "Overview" },
    { id: "timeline", label: "Timeline" },
    { id: "colonies", label: "Colonies" },
    { id: "people", label: "People" },
    { id: "concepts", label: "Concepts" },
    { id: "slavery", label: "Slavery" },
    { id: "review", label: "Review" },
  ];

  const panelsEl = document.getElementById("learn-panels");
  const subnav = document.getElementById("learn-subnav");

  document.getElementById("learn-subtitle").textContent = content.subtitle;
  document.getElementById("learn-hero-intro").textContent =
    "Explore the overview, timeline, colonies, people, concepts, slavery module, and review prompts — then try the History quizzes.";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getSection() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = (params.get("section") || "").toLowerCase();
    const fromHash = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    const raw = fromQuery || fromHash || "overview";
    return SECTIONS.some((s) => s.id === raw) ? raw : "overview";
  }

  function setActiveNav(sectionId) {
    subnav.querySelectorAll("a").forEach((a) => {
      const on = a.dataset.section === sectionId;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function renderOverview() {
    const intro = content.intro;
    return `
      <section class="learn-panel screen" aria-labelledby="overview-heading">
        <h2 id="overview-heading" class="learn-panel-title">${escapeHtml(intro.title)}</h2>
        <p class="learn-panel-lede">${escapeHtml(intro.body)}</p>
        <div class="learn-jump-grid">
          ${SECTIONS.filter((s) => s.id !== "overview")
            .map(
              (s) =>
                `<a class="quiz-link learn-jump" href="?section=${s.id}">
                  <span class="quiz-link-title">${escapeHtml(s.label)}</span>
                  <span class="quiz-link-meta">Open this section</span>
                </a>`
            )
            .join("")}
        </div>
      </section>`;
  }

  function renderTimeline() {
    const cards = content.timeline
      .map(
        (item, i) => `
      <article class="learn-card timeline-card" style="--i:${i}">
        <div class="timeline-year">${escapeHtml(item.year)}</div>
        <div class="timeline-body">
          <p class="learn-chip">${escapeHtml(item.category)}</p>
          <h3 class="learn-card-title">${escapeHtml(item.title)}</h3>
          <p class="learn-card-text">${escapeHtml(item.summary)}</p>
          <p class="learn-why"><strong>Why it matters.</strong> ${escapeHtml(item.whyItMatters)}</p>
          ${
            item.connections && item.connections.length
              ? `<ul class="learn-tags">${item.connections
                  .map((c) => `<li>${escapeHtml(c)}</li>`)
                  .join("")}</ul>`
              : ""
          }
        </div>
      </article>`
      )
      .join("");

    return `
      <section class="learn-panel screen" aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" class="learn-panel-title">Timeline</h2>
        <p class="learn-panel-lede">Key moments from Jamestown through the Stono Rebellion — what happened and why it connects.</p>
        <div class="timeline-list">${cards}</div>
      </section>`;
  }

  function regionKey(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/\s+colonies$/, "")
      .trim();
  }

  function renderColonies() {
    const regions = content.colonialRegions || [];
    const colonies = content.colonies || [];

    const regionSummary = regions
      .map(
        (r) => `
      <article class="learn-card region-card" data-region="${escapeHtml(regionKey(r.name))}">
        <h3 class="learn-card-title">${escapeHtml(r.name)}</h3>
        <p class="learn-card-text"><strong>Geography.</strong> ${escapeHtml(r.geography)}</p>
        <p class="learn-card-text"><strong>Economy.</strong> ${escapeHtml(r.economy)}</p>
        <p class="learn-card-text"><strong>Religion.</strong> ${escapeHtml(r.religion)}</p>
        <p class="learn-card-text"><strong>Settlement.</strong> ${escapeHtml(r.settlementPattern)}</p>
        <p class="learn-why">${escapeHtml(r.keyIdea)}</p>
        <ul class="learn-tags">${(r.colonies || []).map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
      </article>`
      )
      .join("");

    const colonyCards = colonies
      .map((c) => {
        const rk = regionKey(c.region);
        return `
        <article class="learn-card colony-card" data-region="${escapeHtml(rk)}">
          <p class="learn-chip">${escapeHtml(c.region)}</p>
          <h3 class="learn-card-title">${escapeHtml(c.name)}</h3>
          <p class="learn-meta-line">Founded ${escapeHtml(c.founded)}</p>
          <p class="learn-card-text"><strong>Purpose.</strong> ${escapeHtml(c.purpose)}</p>
          <p class="learn-card-text"><strong>Government.</strong> ${escapeHtml(c.government)}</p>
          ${
            c.keyPeople && c.keyPeople.length
              ? `<p class="learn-card-text"><strong>Key people.</strong> ${escapeHtml(c.keyPeople.join(", "))}</p>`
              : ""
          }
          ${
            c.economy && c.economy.length
              ? `<ul class="learn-tags">${c.economy.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>`
              : ""
          }
          <p class="learn-why"><strong>Remember.</strong> ${escapeHtml(c.remember)}</p>
        </article>`;
      })
      .join("");

    return `
      <section class="learn-panel screen" aria-labelledby="colonies-heading">
        <h2 id="colonies-heading" class="learn-panel-title">Colony explorer</h2>
        <p class="learn-panel-lede">Filter by region, then compare founding purpose, economy, and government.</p>
        <div class="learn-filters" role="group" aria-label="Filter by region">
          <button type="button" class="btn btn-ghost is-on" data-filter="all">All</button>
          <button type="button" class="btn btn-ghost" data-filter="new england">New England</button>
          <button type="button" class="btn btn-ghost" data-filter="middle">Middle</button>
          <button type="button" class="btn btn-ghost" data-filter="southern">Southern</button>
        </div>
        <h3 class="learn-subheading">Regions</h3>
        <div class="learn-card-grid region-grid">${regionSummary}</div>
        <h3 class="learn-subheading">Thirteen colonies</h3>
        <div class="learn-card-grid colony-grid">${colonyCards}</div>
      </section>`;
  }

  function renderPeople() {
    const cards = (content.keyPeople || [])
      .map(
        (p) => `
      <article class="learn-card person-card">
        <p class="learn-chip">${escapeHtml(p.associatedWith)}</p>
        <h3 class="learn-card-title">${escapeHtml(p.name)}</h3>
        <p class="learn-card-text">${escapeHtml(p.role)}</p>
        <ul class="learn-bullets">
          ${(p.remember || []).map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
        </ul>
      </article>`
      )
      .join("");

    return `
      <section class="learn-panel screen" aria-labelledby="people-heading">
        <h2 id="people-heading" class="learn-panel-title">Key people</h2>
        <p class="learn-panel-lede">Leaders and figures who shaped settlement, religion, and colonial society.</p>
        <div class="learn-card-grid">${cards}</div>
      </section>`;
  }

  function renderConcepts() {
    const chains = (content.bigPictureConnections || [])
      .map(
        (conn) => `
      <article class="learn-card concept-card">
        <h3 class="learn-card-title">${escapeHtml(conn.title)}</h3>
        <ol class="concept-chain">
          ${(conn.chain || []).map((step) => `<li><span>${escapeHtml(step)}</span></li>`).join("")}
        </ol>
        <p class="learn-why"><strong>Big idea.</strong> ${escapeHtml(conn.bigIdea)}</p>
      </article>`
      )
      .join("");

    const questions = (content.bigQuestions || [])
      .map(
        (q, i) => `
      <details class="learn-expand">
        <summary>${escapeHtml(q.question)}</summary>
        <div class="learn-expand-body">
          <p>${escapeHtml(q.answer)}</p>
          <p class="learn-why"><strong>Lesson.</strong> ${escapeHtml(q.lesson)}</p>
        </div>
      </details>`
      )
      .join("");

    return `
      <section class="learn-panel screen" aria-labelledby="concepts-heading">
        <h2 id="concepts-heading" class="learn-panel-title">Big-picture concepts</h2>
        <p class="learn-panel-lede">Follow the cause-and-effect chains, then open the guiding questions.</p>
        <div class="learn-card-grid">${chains}</div>
        <h3 class="learn-subheading">Big questions</h3>
        <div class="learn-expand-list">${questions}</div>
      </section>`;
  }

  function renderSlavery() {
    const mod = content.slaveryModule;
    const steps = (mod.sequence || [])
      .map(
        (s) => `
      <article class="learn-card sequence-step">
        <p class="sequence-num">Step ${escapeHtml(String(s.step))}</p>
        <h3 class="learn-card-title">${escapeHtml(s.title)}</h3>
        <p class="learn-card-text">${escapeHtml(s.body)}</p>
      </article>`
      )
      .join("");

    const terms = (mod.keyTerms || [])
      .map(
        (t) => `
      <article class="learn-card term-card">
        <h3 class="learn-card-title">${escapeHtml(t.term)}</h3>
        <p class="learn-card-text">${escapeHtml(t.definition)}</p>
      </article>`
      )
      .join("");

    const context = (mod.importantContext || [])
      .map((c) => `<li>${escapeHtml(c)}</li>`)
      .join("");

    return `
      <section class="learn-panel screen" aria-labelledby="slavery-heading">
        <h2 id="slavery-heading" class="learn-panel-title">${escapeHtml(mod.title)}</h2>
        <p class="learn-panel-lede">${escapeHtml(mod.overview)}</p>
        <h3 class="learn-subheading">Sequence</h3>
        <div class="sequence-list">${steps}</div>
        <h3 class="learn-subheading">Key terms</h3>
        <div class="learn-card-grid">${terms}</div>
        <h3 class="learn-subheading">Important context</h3>
        <ul class="learn-bullets learn-context-list">${context}</ul>
      </section>`;
  }

  function renderReview() {
    const framework = content.reviewFramework;
    const mastery = content.masteryCategories || [];

    return `
      <section class="learn-panel screen" aria-labelledby="review-heading">
        <h2 id="review-heading" class="learn-panel-title">${escapeHtml(framework.title)}</h2>
        <p class="learn-panel-lede">Use these prompts to check your understanding before the History quizzes.</p>
        <ol class="review-questions">
          ${(framework.questions || []).map((q) => `<li>${escapeHtml(q)}</li>`).join("")}
        </ol>
        <h3 class="learn-subheading">Mastery categories</h3>
        <ul class="learn-tags mastery-tags">
          ${mastery.map((m) => `<li>${escapeHtml(m.label)}</li>`).join("")}
        </ul>
        <p class="learn-back-links learn-review-cta">
          <a class="btn btn-primary" href="index.html#history-heading">History quizzes</a>
        </p>
      </section>`;
  }

  const renderers = {
    overview: renderOverview,
    timeline: renderTimeline,
    colonies: renderColonies,
    people: renderPeople,
    concepts: renderConcepts,
    slavery: renderSlavery,
    review: renderReview,
  };

  function bindColonyFilters() {
    const filters = panelsEl.querySelector(".learn-filters");
    if (!filters) return;

    filters.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      const filter = btn.dataset.filter;
      filters.querySelectorAll("[data-filter]").forEach((b) => {
        b.classList.toggle("is-on", b === btn);
      });

      panelsEl.querySelectorAll(".region-card, .colony-card").forEach((card) => {
        if (filter === "all") {
          card.hidden = false;
          return;
        }
        const region = (card.dataset.region || "").toLowerCase();
        const match =
          region === filter ||
          region.startsWith(filter) ||
          (filter === "middle" && region.includes("middle")) ||
          (filter === "southern" && region.includes("southern")) ||
          (filter === "new england" && region.includes("new england"));
        card.hidden = !match;
      });
    });
  }

  function render() {
    const section = getSection();
    setActiveNav(section);
    const fn = renderers[section] || renderOverview;
    panelsEl.innerHTML = fn();
    bindColonyFilters();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  subnav.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-section]");
    if (!a) return;
    e.preventDefault();
    const section = a.dataset.section;
    const url = new URL(window.location.href);
    url.searchParams.set("section", section);
    url.hash = "";
    history.pushState({ section }, "", url);
    render();
  });

  window.addEventListener("popstate", render);
  window.addEventListener("hashchange", render);

  render();
})();
