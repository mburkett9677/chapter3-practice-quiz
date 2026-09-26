(function () {
  const LETTERS = ["A", "B", "C", "D"];

  const params = new URLSearchParams(window.location.search);
  const quizId = params.get("id");
  const catalog = window.QUIZ_CATALOG;
  const quizDef = catalog && quizId ? catalog.quizzes[quizId] : null;

  const els = {
    start: document.getElementById("screen-start"),
    quiz: document.getElementById("screen-quiz"),
    results: document.getElementById("screen-results"),
    missing: document.getElementById("screen-missing"),
    btnStart: document.getElementById("btn-start"),
    quizEyebrow: document.getElementById("quiz-eyebrow"),
    quizBrand: document.getElementById("quiz-brand"),
    quizLede: document.getElementById("quiz-lede"),
    quizMeta: document.getElementById("quiz-meta"),
    progressFill: document.getElementById("progress-fill"),
    qTopic: document.getElementById("q-topic"),
    qCounter: document.getElementById("q-counter"),
    scoreLive: document.getElementById("score-live"),
    questionText: document.getElementById("question-text"),
    questionPrompt: document.getElementById("question-prompt"),
    choices: document.getElementById("choices"),
    feedback: document.getElementById("feedback"),
    btnBack: document.getElementById("btn-back"),
    btnRestart: document.getElementById("btn-restart"),
    btnNext: document.getElementById("btn-next"),
    scoreFinal: document.getElementById("score-final"),
    scoreBreakdown: document.getElementById("score-breakdown"),
    scoreMessage: document.getElementById("score-message"),
    btnRetry: document.getElementById("btn-retry"),
    btnReview: document.getElementById("btn-review"),
    missedList: document.getElementById("missed-list"),
  };

  const state = {
    queue: [],
    index: 0,
    score: 0,
    answered: false,
    answers: {},
    missed: [],
  };

  function showScreen(name) {
    const map = {
      start: els.start,
      quiz: els.quiz,
      results: els.results,
      missing: els.missing,
    };
    Object.entries(map).forEach(([key, el]) => {
      if (!el) return;
      el.hidden = key !== name;
      el.classList.toggle("is-active", key === name);
    });
  }

  if (!quizDef) {
    showScreen("missing");
    return;
  }

  document.title = quizDef.title;
  els.quizEyebrow.textContent = quizDef.subject;
  const [brandMain, brandSpan] = splitTitle(quizDef.title);
  els.quizBrand.innerHTML = `${escapeHtml(brandMain)}<br /><span>${escapeHtml(brandSpan)}</span>`;
  els.quizLede.textContent = `${quizDef.count} questions. ${quizDef.blurb}. One at a time — pick an answer and see if you’re right before moving on.`;
  els.quizMeta.textContent = `${quizDef.count} questions · randomized each start`;

  function splitTitle(title) {
    if (title.includes("·")) {
      const [a, b] = title.split("·").map((s) => s.trim());
      return [a, b || "Quiz"];
    }
    const parts = title.split(" ");
    return [parts.slice(0, -1).join(" ") || title, parts.slice(-1)[0] || "Quiz"];
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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

  function looksLikeMath(text) {
    if (!text) return false;
    return /\\[a-zA-Z]+|\$|[_^{}]|\\dfrac|\\frac|\\times|\\div|\\left|\\right|\\overline|\\quad/.test(
      String(text)
    );
  }

  function katexHtml(tex, displayMode) {
    if (!tex) return "";
    const raw = String(tex);
    if (!looksLikeMath(raw)) {
      return escapeHtml(raw);
    }
    if (window.katex) {
      try {
        return window.katex.renderToString(raw, {
          throwOnError: false,
          displayMode: Boolean(displayMode),
        });
      } catch {
        return escapeHtml(raw);
      }
    }
    return escapeHtml(raw);
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
    return shuffle(
      quizDef.questions.map((q) => ({
        ...q,
        choices: shuffle(q.choices.map((c) => ({ ...c }))),
      }))
    );
  }

  function recomputeScoreAndMissed() {
    let score = 0;
    const missed = [];
    state.queue.forEach((q, i) => {
      const ans = state.answers[i];
      if (!ans) return;
      if (ans.correct) {
        score += 1;
        return;
      }
      const correctIndex = q.choices.findIndex((c) => c.correct);
      missed.push({
        id: q.id,
        topic: q.topic,
        prompt: q.prompt,
        question: q.question,
        correctText: q.choices[correctIndex].text,
        explain: q.explain,
      });
    });
    state.score = score;
    state.missed = missed;
  }

  function startQuiz() {
    state.queue = buildQueue();
    state.index = 0;
    state.score = 0;
    state.answered = false;
    state.answers = {};
    state.missed = [];
    els.missedList.hidden = true;
    els.missedList.innerHTML = "";
    showScreen("quiz");
    renderQuestion();
  }

  function startOver() {
    showScreen("start");
    state.queue = [];
    state.index = 0;
    state.score = 0;
    state.answered = false;
    state.answers = {};
    state.missed = [];
    els.missedList.hidden = true;
    els.missedList.innerHTML = "";
  }

  function current() {
    return state.queue[state.index];
  }

  function updateNav() {
    const last = state.index >= state.queue.length - 1;
    els.btnBack.disabled = state.index <= 0;
    els.btnNext.disabled = !state.answered;
    els.btnNext.textContent = last ? "See results" : "Next";
  }

  function updateProgress() {
    const total = state.queue.length;
    const answeredCount = Object.keys(state.answers).length;
    const pct = (answeredCount / total) * 100;
    els.progressFill.style.width = `${pct}%`;
    els.qCounter.textContent = `Question ${state.index + 1} of ${total}`;
    els.scoreLive.textContent = `Score: ${state.score}`;
  }

  function showAnswerState(choiceIndex) {
    const q = current();
    const buttons = [...els.choices.querySelectorAll(".choice")];
    const chosen = q.choices[choiceIndex];
    const correctIndex = q.choices.findIndex((c) => c.correct);

    buttons.forEach((btn, i) => {
      btn.disabled = true;
      btn.classList.remove("is-correct", "is-wrong", "is-missed-correct");
      if (i === correctIndex) {
        btn.classList.add(i === choiceIndex ? "is-correct" : "is-missed-correct");
      }
      if (i === choiceIndex && !chosen.correct) {
        btn.classList.add("is-wrong");
      }
    });

    if (chosen.correct) {
      els.feedback.className = "feedback is-correct";
      els.feedback.innerHTML = `<strong>Correct!</strong><p class="explain">${q.explain || ""}</p>`;
    } else {
      els.feedback.className = "feedback is-wrong";
      els.feedback.innerHTML = `<strong>Not quite.</strong><p class="explain">${q.explain || ""}</p>`;
    }
    els.feedback.hidden = false;
    renderMath(els.feedback);
  }

  function renderQuestion() {
    const q = current();
    const prior = state.answers[state.index];
    state.answered = Boolean(prior);
    updateProgress();
    updateNav();

    els.qTopic.textContent = q.topic;
    els.feedback.hidden = true;
    els.feedback.className = "feedback";
    els.feedback.innerHTML = "";

    const hasMathQ = Boolean(q.question && String(q.question).trim());
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

    if (prior) {
      showAnswerState(prior.choiceIndex);
    }

    renderMath(els.questionPrompt);
    renderMath(els.questionText);
    const panel = document.getElementById("question-panel");
    panel.style.animation = "none";
    void panel.offsetWidth;
    panel.style.animation = "";
  }

  function onChoose(choiceIndex) {
    if (state.answered) return;
    state.answered = true;

    const q = current();
    const chosen = q.choices[choiceIndex];

    state.answers[state.index] = {
      choiceIndex,
      correct: Boolean(chosen.correct),
    };
    recomputeScoreAndMissed();
    showAnswerState(choiceIndex);
    updateNav();
    updateProgress();
  }

  function next() {
    if (!state.answered) return;
    if (state.index >= state.queue.length - 1) {
      showResults();
      return;
    }
    state.index += 1;
    renderQuestion();
  }

  function back() {
    if (state.index <= 0) return;
    state.index -= 1;
    renderQuestion();
  }

  function showResults() {
    recomputeScoreAndMissed();
    const total = state.queue.length;
    const right = state.score;
    const wrong = total - right;
    const pct = Math.round((right / total) * 100);
    els.scoreFinal.textContent = `${right} / ${total}`;
    els.scoreBreakdown.innerHTML =
      `<span class="right">${right} right</span> · <span class="wrong">${wrong} wrong</span>`;
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

  els.btnStart.addEventListener("click", startQuiz);
  els.btnBack.addEventListener("click", back);
  els.btnRestart.addEventListener("click", startOver);
  els.btnNext.addEventListener("click", next);
  els.btnRetry.addEventListener("click", startOver);
  els.btnReview.addEventListener("click", reviewMissed);

  showScreen("start");
})();
