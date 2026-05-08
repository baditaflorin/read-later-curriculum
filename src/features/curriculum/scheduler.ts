import type {
  Article,
  FreeSlot,
  ReadingSession,
  TopicCluster,
} from "../../shared/types";
import { stableId } from "../../shared/text";

function nextSlotDates(
  freeSlots: FreeSlot[],
  daysToPlan: number,
  now = new Date(),
) {
  const slots: Array<{ startsAt: Date; slot: FreeSlot }> = [];
  const start = new Date(now);
  start.setSeconds(0, 0);

  for (let offset = 0; offset <= daysToPlan; offset += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);

    for (const slot of freeSlots) {
      if (day.getDay() !== slot.weekday) {
        continue;
      }
      const [hours, minutes] = slot.startTime.split(":").map(Number);
      const startsAt = new Date(day);
      startsAt.setHours(hours, minutes, 0, 0);
      if (startsAt > now) {
        slots.push({ startsAt, slot });
      }
    }
  }

  return slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export function scheduleArticles(
  orderedArticles: Article[],
  topics: TopicCluster[],
  freeSlots: FreeSlot[],
  daysToPlan: number,
) {
  const topicByArticle = new Map<string, string>();
  for (const topic of topics) {
    for (const articleId of topic.articleIds) {
      topicByArticle.set(articleId, topic.id);
    }
  }

  const slots = nextSlotDates(freeSlots, daysToPlan);
  const remaining = [...orderedArticles];
  const sessions: ReadingSession[] = [];

  for (const { startsAt, slot } of slots) {
    if (remaining.length === 0) {
      break;
    }

    const picked: Article[] = [];
    let loadMinutes = 0;

    while (remaining.length > 0) {
      const candidate = remaining[0];
      if (
        picked.length > 0 &&
        loadMinutes + candidate.readingMinutes > slot.minutes
      ) {
        break;
      }
      picked.push(candidate);
      loadMinutes += candidate.readingMinutes;
      remaining.shift();
      if (loadMinutes >= slot.minutes * 0.8) {
        break;
      }
    }

    const first = picked[0];
    sessions.push({
      id: stableId("session"),
      topicId: topicByArticle.get(first.id) ?? topics[0]?.id ?? "topic_misc",
      articleIds: picked.map((article) => article.id),
      startsAt: startsAt.toISOString(),
      durationMinutes: slot.minutes,
      loadMinutes,
      label: `${slot.startTime} reading block`,
      status: "planned",
    });
  }

  return sessions;
}
