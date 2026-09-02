const API_KEY_KEY = "openAiApiKey";
const AI_STATUS_KEY = "lastRelevanceCheck";

const apiKeyForm = document.querySelector("#apiKeyForm");
const apiKeyInput = document.querySelector("#apiKey");
const saveStatus = document.querySelector("#saveStatus");
const lastCheck = document.querySelector("#lastCheck");

function showLastCheck(status) {
  if (!status) {
    lastCheck.textContent = "No tab has been judged since the key was saved.";
    return;
  }

  const decision = status.relevant ? "relevant" : "irrelevant";
  if (status.source === "ai") {
    lastCheck.textContent = `OpenAI was used and judged the tab ${decision}. ${status.detail || ""}`.trim();
    return;
  }

  lastCheck.textContent = `Keyword fallback was used and judged the tab ${decision}. ${status.detail || ""}`.trim();
}

apiKeyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveStatus.textContent = "";

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    saveStatus.textContent = "Paste an API key before saving.";
    apiKeyInput.focus();
    return;
  }

  await chrome.storage.local.set({ [API_KEY_KEY]: apiKey });
  await chrome.storage.local.remove(AI_STATUS_KEY);
  saveStatus.textContent = "API key saved.";
  showLastCheck(null);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[AI_STATUS_KEY]) {
    showLastCheck(changes[AI_STATUS_KEY].newValue);
  }
});

async function initialise() {
  const stored = await chrome.storage.local.get([API_KEY_KEY, AI_STATUS_KEY]);
  if (stored[API_KEY_KEY]) {
    apiKeyInput.value = stored[API_KEY_KEY];
  }
  showLastCheck(stored[AI_STATUS_KEY]);
}

initialise();
