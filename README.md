# Improve Focus

Improve Focus is a Chrome extension that runs a timed focus session, checks whether activated tabs match one current task, and nudges you when you drift.

Live site: [https://improvefocus.top/](https://improvefocus.top/)

## What it does

- Starts a timed session for one named task.
- Judges each activated tab once per session as relevant or irrelevant.
- Shows one focus notification for the first irrelevant tab in a session.
- Tracks relevant and irrelevant tab counts and shows a session summary.
- Uses an on-device keyword check by default, with an optional OpenAI relevance check.

## Why it exists

Tab drift can quietly pull attention away from the work someone intended to finish. Improve Focus makes that drift visible without blocking websites.

## Install in Chrome

1. Download `improve-focus.zip` from the [live site](https://improvefocus.top/) and extract it to a folder.
2. Open `chrome://extensions`, then turn **Developer mode** on.
3. Click **Load unpacked**, select the extracted `improve-focus` folder, then click **Select Folder**.
4. Open Improve Focus **Details**. For optional AI checks, allow access to `https://api.openai.com/*` and add your own OpenAI API key in Improve Focus **Options**.
5. On the Details page, turn **Pin to toolbar** on.
6. Click the Improve Focus toolbar icon, enter one task, choose a session length, and click **Start Session**.

Improve Focus is not currently distributed through the Chrome Web Store.

## How to use it

1. Open Improve Focus from the Chrome toolbar.
2. Enter the single task you want to complete.
3. Choose a session length and start the session.
4. Browse normally. The extension checks a tab when you activate it and updates the counts.
5. End the session to see the summary, or wait for the time-up notification.

## AI is optional

Without an API key, relevance is decided by a local keyword check. If a saved OpenAI key is missing, rejected, rate-limited, times out, or does not return a usable result, the extension falls back to that keyword check.

The optional AI request currently uses the OpenAI Responses API with `gpt-5.4-nano`. OpenAI API use may require billing on the user's own OpenAI account.

## Permissions

The extension requests these Chrome permissions in `manifest.json`:

- `alarms`: schedules the session time-up event.
- `notifications`: displays the drift and time-up notifications.
- `storage`: stores the focus session, counts, relevance-check status, and optional API key.
- `tabs`: reads the activated tab's ID, title, and URL so it can judge relevance.

It also requests host access to `https://api.openai.com/*`, used only for the optional OpenAI request.

## Privacy and data handling

The current source contains no analytics and no developer-operated server or backend. Without AI, relevance checks happen inside the extension.

The extension uses `chrome.storage.local` in the current Chrome profile for:

- `focusSession`: the task, timer/session state, keywords, tab IDs and judgments, and counts.
- `lastRelevanceCheck`: the latest check source, result, reason, model, and time.
- `openAiApiKey`: the optional OpenAI API key.

The API key is stored as a plain-text string under `openAiApiKey`; the extension code does not encrypt it. Activated tab titles and URLs are read for relevance checks but are not written to extension storage. The stored session keeps each checked tab's ID and relevant/irrelevant judgment.

During an optional AI check, the extension sends directly to `https://api.openai.com/v1/responses`:

- the API key in the `Authorization: Bearer ...` header;
- the current task text;
- the activated tab title;
- the activated tab URL;
- instructions and a response schema asking for a boolean `relevant` result and a short `reason`.

The request sets `store: false`. The returned relevance result and reason are saved in `chrome.storage.local` as the latest check status.

## Source and development

The source is publicly viewable at [github.com/sumt7/improve-focus](https://github.com/sumt7/improve-focus).

- The Manifest V3 extension source is in the repository root.
- The landing-page source is in `site/`.
- `npm run build` creates `dist/` and regenerates `dist/improve-focus.zip` from the current extension files.
- `npm run preview` builds and serves the landing page locally.

## Current limitations

- Installation uses Chrome's unpacked-extension flow rather than the Chrome Web Store.
- Keyword and AI relevance judgments can be wrong.
- The extension checks activated tabs; it does not block websites.
- OpenAI checks depend on the user's key, API access, billing, rate limits, and network availability.
- Notifications depend on Chrome and operating-system notification permissions.

## Creator

Built by **Sumeet Mahendra** — [@sumt7](https://x.com/sumt7).
