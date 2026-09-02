# Idea Scope

## 1. One user

Entrepreneurs who spend most of their workday in a browser and regularly get pulled into unrelated tabs or watching youtube/IG videos.They work extensively on laptops for 10-18 hours and at the end of the day, they realize a very few hours or minitues were productivily utlized whereas a large amount of time was wasted on stumbling, reading unwanted or not relevant stuff and digging into the rabbit hole. They face this problem almost on a daily basis and around 40-70% of their working hours are end-up contributing 0 to 30% towards the task/assignment they started.

## 2. One painful moment

It happens mostly after 10-30mins starting their work. And, they end-up reading, exploring less or unnecessary stuff, watching youtube/instagram videos or newsletters or learning no or less important thing. Any task which can be completed in set or stimulated or desired time keep up either pending or takes 2-5x time or sometimes even keep postponed to hours and days.

## 3. One core action

They just set/share the task they intent to complete and in what time by selecing from the dropdown. The first irrelevant tab should trigger the notification.

## 4. V1 includes

- Landing page
- Task and session-duration entry
- Detect the active tab using its title and URL
- Use AI to judge whether that tab is relevant to the task
- Show one notification when the user moves to an irrelevant tab
- Show a basic session result

## 5. V1 excludes

Decision and reason: I'll explore, prioritize and then build/ship in the v2 if needed. They don't seems to be core features needed for the activation and aha movement.

- Manual blocklists and whitelists
- Priority levels
- Background sounds
- Complex dashboards
- Motivation and reflection prompts
- Social features and payments

## 6. Today's acceptance test

1. A stranger installs and opens the extension without my help.
2. They enter one task and choose a session duration.
3. They start the focus session.
4. They switch to a tab unrelated to their task.
5. The extension judges that tab as irrelevant and shows one notification.
6. They can see the remaining session time.

## 7. Fallback cut

- First cut: basic session result.
- Second cut: detailed landing-page content.
- Never cut: task entry, active-tab detection, AI relevance check, or notification.

## 8. Parking lot

- Manual blocklists and whitelists
- Priority levels
- Background sounds
- Complex dashboards
- Motivation and reflection prompts
- Social features and payments
