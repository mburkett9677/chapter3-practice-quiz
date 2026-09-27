(function () {
  const S = window.QuizSession;
  const nav = window.QUIZ_NAV || { math: [], history: [], english: [] };

  const els = {
    lede: document.getElementById("admin-lede"),
    assignForm: document.getElementById("assign-form"),
    assignInput: document.getElementById("assign-input"),
    assignStatus: document.getElementById("assign-status"),
    liveBadge: document.getElementById("live-badge"),
    subjectProgress: document.getElementById("subject-progress"),
    quizProgress: document.getElementById("quiz-progress"),
    btnLiveOn: document.getElementById("btn-live-on"),
    btnLiveOff: document.getElementById("btn-live-off"),
    btnClear: document.getElementById("btn-clear-scores"),
    btnLogout: document.getElementById("btn-logout"),
    btnRefresh: document.getElementById("btn-refresh"),
  };

  const SUBJECTS = [
    { id: "math", label: "Math", quizzes: nav.math || [] },
    { id: "history", label: "History", quizzes: nav.history || [] },
    { id: "english", label: "English", quizzes: nav.english || [] },
  ];

  function allQuizzes() {
    return SUBJECTS.flatMap((s) =>
      s.quizzes.map((q) => ({ ...q, subject: s.id, subjectLabel: s.label }))
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render(state) {
    const student = state.assignedUser || "(none)";
    els.assignInput.value = state.assignedUser || "";
    els.assignStatus.textContent = `Assigned student: ${student}`;
    els.lede.textContent = state.liveMode
      ? `Live is ON for ${student}. Each quiz can be taken once.`
      : `Live is off. ${student} can practice freely.`;

    els.liveBadge.textContent = state.liveMode ? "Live: ON" : "Live: off";
    els.liveBadge.classList.toggle("is-on", Boolean(state.liveMode));

    const scores = (state.scores && state.scores[state.studentKey]) || {};
    const catalog = allQuizzes();

    els.subjectProgress.innerHTML = SUBJECTS.map((s) => {
      const total = s.quizzes.length;
      const done = s.quizzes.filter((q) => scores[q.id]).length;
      let earned = 0;
      let possible = 0;
      s.quizzes.forEach((q) => {
        const row = scores[q.id];
        if (!row) return;
        earned += Number(row.score) || 0;
        possible += Number(row.total) || 0;
      });
      const pct = possible ? Math.round((earned / possible) * 100) : null;
      return `
        <article class="subject-card">
          <h3>${escapeHtml(s.label)}</h3>
          <p class="subject-stat">${done} / ${total} quizzes done</p>
          <p class="subject-stat">${
            pct == null ? "No scores yet" : `${earned} / ${possible} points · ${pct}%`
          }</p>
        </article>`;
    }).join("");

    els.quizProgress.innerHTML = catalog
      .map((q) => {
        const row = scores[q.id];
        const status = row
          ? `<span class="quiz-done">${row.score} / ${row.total}</span>`
          : `<span class="quiz-open">Not taken</span>`;
        return `
          <div class="quiz-progress-row">
            <div>
              <p class="quiz-progress-title">${escapeHtml(q.title)}</p>
              <p class="quiz-progress-meta">${escapeHtml(q.subjectLabel)}</p>
            </div>
            ${status}
          </div>`;
      })
      .join("");
  }

  async function refresh() {
    const state = await S.requireRole("admin");
    if (!state) return;
    render(state);
  }

  els.assignForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const state = await S.assignStudent(els.assignInput.value);
      render(state);
    } catch (ex) {
      els.assignStatus.textContent = ex.message || "Could not assign";
    }
  });

  els.btnLiveOn.addEventListener("click", async () => {
    try {
      const state = await S.setLive(true);
      render(state);
    } catch (ex) {
      alert(ex.message || "Could not start live");
    }
  });

  els.btnLiveOff.addEventListener("click", async () => {
    try {
      const state = await S.setLive(false);
      render(state);
    } catch (ex) {
      alert(ex.message || "Could not stop live");
    }
  });

  els.btnClear.addEventListener("click", async () => {
    if (!confirm("Clear all scored attempts for the assigned student?")) return;
    try {
      const state = await S.clearScores();
      render(state);
    } catch (ex) {
      alert(ex.message || "Could not clear scores");
    }
  });

  els.btnLogout.addEventListener("click", () => S.logout());
  els.btnRefresh.addEventListener("click", () => refresh().catch(() => S.logout()));

  refresh().catch(() => S.logout());
  setInterval(() => {
    refresh().catch(() => {});
  }, 8000);
})();
