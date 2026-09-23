# Gym Tracker

Personal, offline-first gym app: set/rep logging, an exercise library filtered by equipment
with animated demos, 75-day style challenge tracking, and diet targets. Everything lives in a
local SQLite database on the phone. No accounts, no backend, no cost.

## Run it on your iPhone

1. Install **Expo Go** from the App Store.
2. In this folder:

   ```bash
   npm install
   npx expo start
   ```

3. Scan the QR code with the iPhone camera. The app opens in Expo Go and hot-reloads as you edit.

Phone and Mac must be on the same Wi-Fi. If the QR code does not connect, run `npx expo start --tunnel`.

## Checks

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint
```

## What is in the scaffold

| Tab | What it does |
|---|---|
| Today | Start or resume a workout, tick today's challenge tasks, see diet targets and recent sessions |
| Workout | Session history, live logger with per-set weight/reps/done, add exercises from the library |
| Exercises | 876 exercises from the public-domain Free Exercise DB, search plus equipment filter, detail page with a two-frame animated demo, muscles, step-by-step instructions, and your best set / estimated 1RM |
| Challenge | Presets (75-Day Hard, Soft, Medium), daily checklist, 75-day progress grid, restart rule |
| Diet | Profile form, Mifflin-St Jeor BMR, TDEE, calorie and macro targets |

## Code map

```
src/app/            Expo Router screens (native iOS tabs, a Stack per tab)
src/db/             SQLite schema + migrations, seed, and query modules
src/lib/            Pure logic: nutrition formulas, challenge presets, date helpers
src/components/     Themed UI primitives and the ExerciseFrames demo player
assets/data/        exercises.json seed (see LICENSE-exercises.txt)
```

## Next steps

- Replace the two-frame demo with real GIF/MP4 clips: set `media_url` on an exercise row and
  swap the player in `src/components/exercise-frames.tsx`.
- Rest timer and PR detection in the logger.
- Progress charts (volume per week, e1RM per exercise).
- Food logging against USDA / IFCT data.
- Supabase sync and HealthKit once the app is worth deploying.
