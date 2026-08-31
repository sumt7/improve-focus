const SESSION_KEY = "focusSession";

const setupView = document.querySelector("#setupView");
const runningView = document.querySelector("#runningView");
const summaryView = document.querySelector("#summaryView");
const sessionForm = document.querySelector("#sessionForm");
const taskInput = document.querySelector("#taskInput");
const timeSelect = document.querySelector("#timeSelect");
const formError = document.querySelector("#formError");
const endButton = document.querySelector("#endButton");
const newSessionButton = document.querySelector("#newSessionButton");

let currentSession = null;
let timerId = null;

function showView(view) {
  setupView.hidden = view !== setupView;
  runningView.hidden = view !== runningView;
  summaryView.hidden = view !== summaryView;
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateRunningView() {
  if (!currentSession?.running) {
    return;
  }

  const now = Date.now();
  const remaining = currentSession.endsAt - now;
  document.querySelector("#currentTask").textContent = currentSession.task;
  document.querySelector("#runningTime").textContent = formatDuration(now - currentSession.startedAt);
  document.querySelector("#timeLeft").textContent = remaining >= 0
    ? formatDuration(remaining)
    : `Over ${formatDuration(Math.abs(remaining))}`;
  document.querySelector("#relevantCount").textContent = currentSession.relevantCount;
  document.querySelector("#irrelevantCount").textContent = currentSession.irrelevantCount;
}

function startTimer() {
  clearInterval(timerId);
  updateRunningView();
  timerId = setInterval(updateRunningView, 1000);
}

function showRunningSession(session) {
  currentSession = session;
  showView(runningView);
  startTimer();
}

function showSummary(session) {
  clearInterval(timerId);
  const now = Date.now();
  const difference = session.endsAt - now;

  document.querySelector("#summaryTask").textContent = session.task;
  document.querySelector("#summaryRunning").textContent = formatDuration(now - session.startedAt);
  document.querySelector("#summaryTimeResult").textContent = difference >= 0
    ? `${formatDuration(difference)} left`
    : `${formatDuration(Math.abs(difference))} over`;
  document.querySelector("#summaryRelevant").textContent = session.relevantCount;
  document.querySelector("#summaryIrrelevant").textContent = session.irrelevantCount;
  currentSession = null;
  showView(summaryView);
}

sessionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.textContent = "";

  const task = taskInput.value.trim();
  if (!task) {
    formError.textContent = "Enter the task you want to focus on.";
    taskInput.focus();
    return;
  }

  const startButton = sessionForm.querySelector("button[type='submit']");
  startButton.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: "startSession",
      task,
      estimatedMinutes: Number(timeSelect.value)
    });

    if (!response?.ok) {
      throw new Error(response?.error || "The session could not start.");
    }
    showRunningSession(response.session);
  } catch (error) {
    formError.textContent = error.message;
  } finally {
    startButton.disabled = false;
  }
});

endButton.addEventListener("click", async () => {
  endButton.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({ type: "endSession" });
    if (!response?.ok || !response.session) {
      throw new Error(response?.error || "The session could not end.");
    }
    showSummary(response.session);
  } catch (error) {
    endButton.disabled = false;
    console.error(error);
  }
});

newSessionButton.addEventListener("click", () => {
  sessionForm.reset();
  formError.textContent = "";
  endButton.disabled = false;
  showView(setupView);
  taskInput.focus();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[SESSION_KEY]?.newValue) {
    return;
  }

  currentSession = changes[SESSION_KEY].newValue;
  if (!runningView.hidden) {
    updateRunningView();
  }
});

async function initialise() {
  const result = await chrome.storage.local.get(SESSION_KEY);
  const session = result[SESSION_KEY];
  if (session?.running) {
    showRunningSession(session);
  } else {
    showView(setupView);
    taskInput.focus();
  }
}

initialise();
