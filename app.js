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
    includeBonus: false,
    queue: [],
    index: 0,
    score: 0,
    answered: false,
    answers: {}, // index -> { choiceIndex, correct }
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
    const base = shuffle(
      window.QUIZ_QUESTIONS.map((q) => ({
        ...q,
        choices: shuffle(q.choices.map((c) => ({ ...c }))),
      }))
    );
    if (state.includeBonus && window.BONUS_QUESTION) {
      // Keep bonus at the end so it stays optional extra credit
      base.push({
        ...window.BONUS_QUESTION,
        choices: shuffle(window.BONUS_QUESTION.choices.map((c) => ({ ...c }))),
      });
    }
    return base;
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

    if (prior) {
      showAnswerState(prior.choiceIndex);
    }

    renderMath(els.questionPrompt);
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

  els.btnBonus.addEventListener("click", () => {
    state.includeBonus = !state.includeBonus;
    els.btnBonus.classList.toggle("is-on", state.includeBonus);
    els.btnBonus.setAttribute("aria-pressed", String(state.includeBonus));
    els.bonusStatus.textContent = state.includeBonus
      ? "Bonus question: on (51 questions)"
      : "Bonus question: off (50 questions)";
  });

  els.btnStart.addEventListener("click", startQuiz);
  els.btnBack.addEventListener("click", back);
  els.btnRestart.addEventListener("click", startOver);
  els.btnNext.addEventListener("click", next);
  els.btnRetry.addEventListener("click", startOver);
  els.btnReview.addEventListener("click", reviewMissed);

  function boot() {
    showScreen("start");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
