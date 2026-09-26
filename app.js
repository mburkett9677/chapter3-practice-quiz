(function () {
  const LETTERS = ["A", "B", "C", "D"];

  const els = {
    start: document.getElementById("screen-start"),
    quiz: document.getElementById("screen-quiz"),
    results: document.getElementById("screen-results"),
    btnStart: document.getElementById("btn-start"),
    btnBonus: document.getElementById("btn-include-bonus"),
    bonusStatus: document.getElementById("bonus-status"),
    progressFill: document.getElementById("progress-fill"),
    qTopic: document.getElementById("q-topic"),
    qCounter: document.getElementById("q-counter"),
    scoreLive: document.getElementById("score-live"),
    questionText: document.getElementById("question-text"),
    questionPrompt: document.getElementById("question-prompt"),
    choices: document.getElementById("choices"),
    feedback: document.getElementById("feedback"),
    btnNext: document.getElementById("btn-next"),
    scoreFinal: document.getElementById("score-final"),
    scoreMessage: document.getElementById("score-message"),
    btnRetry: document.getElementById("btn-retry"),
    btnReview: document.getElementById("btn-review"),
    missedList: document.getElementById("missed-list"),
  };

  const state = {
    includeBonus: false,
    queue: [],
    index: 0,
    score: 0,
    answered: false,
    missed: [],
  };

  function showScreen(name) {
    els.start.hidden = name !== "start";
    els.quiz.hidden = name !== "quiz";
    els.results.hidden = name !== "results";
    els.start.classList.toggle("is-active", name === "start");
    els.quiz.classList.toggle("is-active", name === "quiz");
    els.results.classList.toggle("is-active", name === "results");
  }

  function renderMath(root) {
    if (window.renderMathInElement) {
      window.renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
        throwOnError: false,
      });
    }
  }

  function katexHtml(tex, displayMode) {
    if (!tex) return "";
    if (window.katex) {
      try {
        return window.katex.renderToString(tex, {
          throwOnError: false,
          displayMode: Boolean(displayMode),
        });
      } catch {
        return tex;
      }
    }
    return tex;
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function buildQueue() {
    const base = window.QUIZ_QUESTIONS.map((q) => ({
      ...q,
      choices: shuffle(q.choices.map((c) => ({ ...c }))),
    }));
    if (state.includeBonus && window.BONUS_QUESTION) {
      base.push({
        ...window.BONUS_QUESTION,
        choices: shuffle(window.BONUS_QUESTION.choices.map((c) => ({ ...c }))),
      });
    }
    return base;
  }

  function startQuiz() {
    state.queue = buildQueue();
    state.index = 0;
    state.score = 0;
    state.answered = false;
    state.missed = [];
    els.missedList.hidden = true;
    els.missedList.innerHTML = "";
    showScreen("quiz");
    renderQuestion();
  }

  function current() {
    return state.queue[state.index];
  }

  function updateProgress() {
    const total = state.queue.length;
    const pct = ((state.index) / total) * 100;
    els.progressFill.style.width = `${pct}%`;
    els.qCounter.textContent = `Question ${state.index + 1} of ${total}`;
    els.scoreLive.textContent = `Score: ${state.score}`;
  }

  function renderQuestion() {
    const q = current();
    state.answered = false;
    updateProgress();

    els.qTopic.textContent = q.topic;
    els.feedback.hidden = true;
    els.feedback.className = "feedback";
    els.feedback.innerHTML = "";
    els.btnNext.hidden = true;
    els.btnNext.textContent =
      state.index === state.queue.length - 1 ? "See results" : "Next question";

    // Prefer prompt as the readable stem; math expression as display
    const hasMathQ = Boolean(q.question && q.question.trim());
    const promptHtml = q.prompt || "";

    if (hasMathQ) {
      els.questionText.innerHTML = katexHtml(q.question, true);
      els.questionPrompt.hidden = !promptHtml;
      els.questionPrompt.innerHTML = promptHtml;
    } else {
      els.questionText.innerHTML = promptHtml;
      els.questionPrompt.hidden = true;
      els.questionPrompt.innerHTML = "";
    }

    els.choices.innerHTML = "";
    q.choices.forEach((choice, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.dataset.index = String(i);
      btn.innerHTML = `
        <span class="choice-letter">${LETTERS[i]}</span>
        <span class="choice-body">${katexHtml(choice.text)}</span>
      `;
      btn.addEventListener("click", () => onChoose(i));
      els.choices.appendChild(btn);
    });

    renderMath(els.questionPrompt);
    // Re-trigger panel animation
    const panel = document.getElementById("question-panel");
    panel.style.animation = "none";
    // force reflow
    void panel.offsetWidth;
    panel.style.animation = "";
  }

  function onChoose(choiceIndex) {
    if (state.answered) return;
    state.answered = true;

    const q = current();
    const buttons = [...els.choices.querySelectorAll(".choice")];
    const chosen = q.choices[choiceIndex];
    const correctIndex = q.choices.findIndex((c) => c.correct);

    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === correctIndex) {
        btn.classList.add(i === choiceIndex ? "is-correct" : "is-missed-correct");
      }
      if (i === choiceIndex && !chosen.correct) {
        btn.classList.add("is-wrong");
      }
    });

    if (chosen.correct) {
      state.score += 1;
      els.feedback.className = "feedback is-correct";
      els.feedback.innerHTML = `<strong>Correct!</strong><p class="explain">${q.explain || ""}</p>`;
    } else {
      state.missed.push({
        id: q.id,
        topic: q.topic,
        prompt: q.prompt,
        question: q.question,
        correctText: q.choices[correctIndex].text,
        explain: q.explain,
      });
      els.feedback.className = "feedback is-wrong";
      els.feedback.innerHTML = `<strong>Not quite.</strong><p class="explain">${q.explain || ""}</p>`;
    }

    els.feedback.hidden = false;
    els.btnNext.hidden = false;
    els.scoreLive.textContent = `Score: ${state.score}`;
    renderMath(els.feedback);

    const answeredPct = ((state.index + 1) / state.queue.length) * 100;
    els.progressFill.style.width = `${answeredPct}%`;
  }

  function next() {
    if (state.index >= state.queue.length - 1) {
      showResults();
      return;
    }
    state.index += 1;
    renderQuestion();
  }

  function showResults() {
    const total = state.queue.length;
    const pct = Math.round((state.score / total) * 100);
    els.scoreFinal.textContent = `${state.score} / ${total}`;
    let message = "Keep practicing — review the missed questions and try again.";
    if (pct === 100) message = "Perfect score! You nailed every question.";
    else if (pct >= 80) message = "Strong work — just a few spots to tighten up.";
    else if (pct >= 60) message = "Solid start. Review the ones you missed and retry.";
    els.scoreMessage.textContent = message;
    showScreen("results");
  }

  function reviewMissed() {
    if (!state.missed.length) {
      els.missedList.hidden = false;
      els.missedList.innerHTML = "<li><p class=\"q\">You didn’t miss any questions.</p></li>";
      return;
    }
    els.missedList.hidden = false;
    els.missedList.innerHTML = state.missed
      .map(
        (m) => `
      <li>
        <h3>${m.topic} · Q${m.id}</h3>
        <p class="q">${m.prompt || ""}${m.question ? " " + katexHtml(m.question) : ""}</p>
        <p class="ans">Correct answer: ${katexHtml(m.correctText)}</p>
        <p class="explain">${m.explain || ""}</p>
      </li>`
      )
      .join("");
    renderMath(els.missedList);
  }

  els.btnBonus.addEventListener("click", () => {
    state.includeBonus = !state.includeBonus;
    els.btnBonus.classList.toggle("is-on", state.includeBonus);
    els.btnBonus.setAttribute("aria-pressed", String(state.includeBonus));
    els.bonusStatus.textContent = state.includeBonus
      ? "Bonus question: on (26 questions)"
      : "Bonus question: off (25 questions)";
  });

  els.btnStart.addEventListener("click", startQuiz);
  els.btnNext.addEventListener("click", next);
  els.btnRetry.addEventListener("click", () => {
    showScreen("start");
  });
  els.btnReview.addEventListener("click", reviewMissed);

  // Wait for KaTeX auto-render to load, then idle on start
  function boot() {
    showScreen("start");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
