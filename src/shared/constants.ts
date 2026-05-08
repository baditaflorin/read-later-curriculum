import type { UserSettings } from "./types";

export const APP_NAME = "Read Later Curriculum";
export const PROJECT_NAME = "read-later-curriculum";
export const REPOSITORY_URL =
  "https://github.com/baditaflorin/read-later-curriculum";
export const PAYPAL_URL = "https://www.paypal.com/paypalme/florinbadita";
export const LIVE_URL = "https://baditaflorin.github.io/read-later-curriculum/";
export const SCHEMA_VERSION = "v1";

export const APP_VERSION = __APP_VERSION__;
export const COMMIT_SHA = __COMMIT_SHA__;
export const BUILT_AT = __BUILT_AT__;

export const DEFAULT_SETTINGS: UserSettings = {
  readingSpeedWpm: 230,
  daysToPlan: 21,
  embeddingMode: "fast",
  freeSlots: [
    { id: "weekday-morning", weekday: 1, startTime: "08:30", minutes: 25 },
    { id: "weekday-lunch", weekday: 3, startTime: "12:30", minutes: 20 },
    { id: "weekend-deep", weekday: 6, startTime: "10:00", minutes: 60 },
  ],
};

export const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;
