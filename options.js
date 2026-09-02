const API_KEY_KEY = "openAiApiKey";
const AI_ENABLED_KEY = "aiCheckingEnabled";
const AI_STATUS_KEY = "lastRelevanceCheck";

const enableAi = document.querySelector("#enableAi");
const aiSettings = document.querySelector("#aiSettings");
const apiKeyForm = document.querySelector("#apiKeyForm");
const apiKeyInput = document.querySelector("#apiKey");
const deleteKeyButton = document.querySelector("#deleteKey");
const saveStatus = document.querySelector("#saveStatus");
const lastCheck = document.querySelector("#lastCheck");

function showLastCheck(status) {
  if (!status) {
    lastCheck.textContent = "No tab has been judged yet.";
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

  await chrome.storage.session.set({
    [AI_ENABLED_KEY]: true,
    [API_KEY_KEY]: apiKey
  });
  await chrome.storage.local.remove(AI_STATUS_KEY);
  saveStatus.textContent = "API key saved for this browser session.";
  showLastCheck(null);
});

enableAi.addEventListener("change", async () => {
  const enabled = enableAi.checked;
  aiSettings.hidden = !enabled;
  await chrome.storage.session.set({ [AI_ENABLED_KEY]: enabled });
  saveStatus.textContent = enabled
    ? "AI checking is enabled for this browser session."
    : "AI checking is off. Keyword matching will be used.";
});

deleteKeyButton.addEventListener("click", async () => {
  await chrome.storage.session.remove(API_KEY_KEY);
  apiKeyInput.value = "";
  saveStatus.textContent = "API key deleted.";
  apiKeyInput.focus();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[AI_STATUS_KEY]) {
    showLastCheck(changes[AI_STATUS_KEY].newValue);
  }
});

async function initialise() {
  await chrome.storage.local.remove(API_KEY_KEY);
  const [sessionSettings, localSettings] = await Promise.all([
    chrome.storage.session.get([AI_ENABLED_KEY, API_KEY_KEY]),
    chrome.storage.local.get(AI_STATUS_KEY)
  ]);
  const enabled = sessionSettings[AI_ENABLED_KEY] === true;
  enableAi.checked = enabled;
  aiSettings.hidden = !enabled;
  if (sessionSettings[API_KEY_KEY]) {
    apiKeyInput.value = sessionSettings[API_KEY_KEY];
  }
  showLastCheck(localSettings[AI_STATUS_KEY]);
}

initialise();
