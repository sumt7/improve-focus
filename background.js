const SESSION_KEY = "focusSession";
const SESSION_ALARM = "focus-session-time-up";
const NOTIFICATION_ICON = "icon.png";

const DISTRACTION_DOMAINS = [
  "facebook.com",
  "youtube.com",
  "instagram.com",
  "reddit.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "twitch.tv",
  "netflix.com",
  "hulu.com",
  "pinterest.com",
  "9gag.com",
  "discord.com",
  "onlyfans.com",
  "pornhub.com",
  "xvideos.com",
  "xnxx.com",
  "redtube.com",
  "youporn.com"
];

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in",
  "is", "it", "my", "of", "on", "or", "the", "this", "to", "with"
]);

let lastObservation = null;
let observationQueue = Promise.resolve();

function makeKeywords(task) {
  const words = task.toLowerCase().match(/[a-z0-9]+/g) || [];
  const usefulWords = words.filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
  return [...new Set(usefulWords.length ? usefulWords : words)];
}

function getHostname(rawUrl) {
  try {
    return new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isDistractionDomain(hostname) {
  return DISTRACTION_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
}

function isRelevant(tab, session) {
  const hostname = getHostname(tab.url || "");
  if (isDistractionDomain(hostname)) {
    return false;
  }

  let decodedUrl = tab.url || "";
  try {
    decodedUrl = decodeURIComponent(decodedUrl);
  } catch {
    // Keep the original URL if it contains invalid escape characters.
  }

  const searchableText = `${tab.title || ""} ${decodedUrl}`.toLowerCase();
  return session.keywords.some((keyword) => searchableText.includes(keyword));
}

async function getSession() {
  const result = await chrome.storage.local.get(SESSION_KEY);
  return result[SESSION_KEY] || null;
}

async function showNotification(message) {
  await chrome.notifications.create({
    type: "basic",
    iconUrl: NOTIFICATION_ICON,
    title: "Improve Focus",
    message,
    priority: 2
  });
}

async function observeTab(tab, reason) {
  const session = await getSession();
  if (!session?.running || !tab) {
    return;
  }

  const signature = `${tab.id}|${tab.url || ""}`;
  const now = Date.now();
  if (
    lastObservation?.signature === signature &&
    now - lastObservation.time < 750
  ) {
    return;
  }
  lastObservation = { signature, time: now, reason };

  const relevant = isRelevant(tab, session);
  const latestSession = await getSession();
  if (!latestSession?.running || latestSession.startedAt !== session.startedAt) {
    return;
  }

  if (reason !== "session-start") {
    if (relevant) {
      latestSession.relevantCount += 1;
    } else {
      latestSession.irrelevantCount += 1;
    }
  }

  await chrome.storage.local.set({ [SESSION_KEY]: latestSession });

  if (!relevant) {
    await showNotification(
      `This tab does not look like ${latestSession.task}. Please Stop & FOCUS!`
    );
  }
}

function queueTabObservation(tab, reason) {
  observationQueue = observationQueue
    .then(() => observeTab(tab, reason))
    .catch((error) => console.error("Improve Focus could not check a tab:", error));
}

async function startSession(task, estimatedMinutes) {
  const cleanTask = task.trim();
  const minutes = Number(estimatedMinutes);

  if (!cleanTask || !Number.isFinite(minutes) || minutes <= 0) {
    throw new Error("Enter a task and choose a valid session length.");
  }

  const startedAt = Date.now();
  const session = {
    running: true,
    task: cleanTask,
    keywords: makeKeywords(cleanTask),
    estimatedMinutes: minutes,
    startedAt,
    endsAt: startedAt + minutes * 60 * 1000,
    relevantCount: 0,
    irrelevantCount: 0,
    timeUpNotified: false
  };

  lastObservation = null;
  await chrome.storage.local.set({ [SESSION_KEY]: session });
  await chrome.alarms.clear(SESSION_ALARM);
  await chrome.alarms.create(SESSION_ALARM, { when: session.endsAt });

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab) {
    await observeTab(activeTab, "session-start");
  }

  return (await getSession()) || session;
}

async function endSession() {
  const session = await getSession();
  await chrome.alarms.clear(SESSION_ALARM);
  await chrome.storage.local.remove(SESSION_KEY);
  lastObservation = null;
  return session;
}

async function restoreAlarm() {
  const session = await getSession();
  if (!session?.running || session.timeUpNotified) {
    return;
  }

  if (session.endsAt <= Date.now()) {
    session.timeUpNotified = true;
    await chrome.storage.local.set({ [SESSION_KEY]: session });
    await showNotification("Session time is up.");
    return;
  }

  await chrome.alarms.create(SESSION_ALARM, { when: session.endsAt });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "startSession") {
    startSession(message.task, message.estimatedMinutes)
      .then((session) => sendResponse({ ok: true, session }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "endSession") {
    endSession()
      .then((session) => sendResponse({ ok: true, session }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    queueTabObservation(tab, "tab-switch");
  } catch {
    // The tab may have closed before Chrome returned its details.
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  queueTabObservation(tab, "new-tab");
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    queueTabObservation(tab, "url-change");
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== SESSION_ALARM) {
    return;
  }

  const session = await getSession();
  if (!session?.running || session.timeUpNotified) {
    return;
  }

  session.timeUpNotified = true;
  await chrome.storage.local.set({ [SESSION_KEY]: session });
  await showNotification("Session time is up.");
});

chrome.runtime.onStartup.addListener(restoreAlarm);
chrome.runtime.onInstalled.addListener(restoreAlarm);
restoreAlarm();
