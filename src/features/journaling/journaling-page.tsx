import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ThreeColumnLayout } from "../../components/three-column-layout";
import type { JournalEntry, JournalEntrySummary } from "../../models/journal";
import type { Item } from "../../models/item";

type JournalingPageProps = {
  todayDate: string;
  selectedDate: string;
  entry: JournalEntry;
  entries: JournalEntrySummary[];
  items: Item[];
  onSelectDate: (date: string) => void;
  onUpdateEntry: (updates: Partial<JournalEntry>) => void;
};

export function JournalingPage({
  todayDate,
  selectedDate,
  entry,
  entries,
  items,
  onSelectDate,
  onUpdateEntry,
}: JournalingPageProps) {
  const [activeMode, setActiveMode] = useState<"intentions" | "diary" | "reflection">(
    "intentions",
  );
  const [intentionDraft, setIntentionDraft] = useState("");
  const [diaryDraft, setDiaryDraft] = useState("");
  const [reflectionDraft, setReflectionDraft] = useState("");
  const dayListRef = useRef<HTMLDivElement | null>(null);
  const diarySectionRef = useRef<HTMLElement | null>(null);
  const reflectionSectionRef = useRef<HTMLElement | null>(null);
  const modeCompletion = useMemo(
    () => ({
      intentions: entry.morningIntention.trim().length > 0,
      diary: entry.diaryEntry.trim().length > 0,
      reflection:
        entry.reflectionEntry.trim().length > 0 ||
        Object.values(entry.reflection).some((value) => value.trim().length > 0),
    }),
    [entry.diaryEntry, entry.morningIntention, entry.reflection, entry.reflectionEntry],
  );
  const dayOptions = useMemo(
    () => buildJournalDayOptions(todayDate, selectedDate, entries),
    [entries, selectedDate, todayDate],
  );
  const context = useMemo(() => buildJournalContext(selectedDate, items), [items, selectedDate]);

  useEffect(() => {
    setIntentionDraft("");
    setDiaryDraft("");
    setReflectionDraft("");
  }, [entry.date]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement) {
        const isTypingTarget =
          event.target.tagName === "INPUT" ||
          event.target.tagName === "TEXTAREA" ||
          event.target.isContentEditable;

        if (isTypingTarget && event.key !== "Escape") {
          return;
        }
      }

      if (event.key.toLowerCase() === "j") {
        event.preventDefault();
        moveSelectedDate(dayOptions, selectedDate, 1, onSelectDate);
        return;
      }

      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        moveSelectedDate(dayOptions, selectedDate, -1, onSelectDate);
        return;
      }

      if (event.key === "Enter" && document.activeElement === dayListRef.current) {
        event.preventDefault();
        onSelectDate(selectedDate);
        return;
      }

      if (event.key.toLowerCase() === "i" && event.altKey) {
        event.preventDefault();
        setActiveMode("intentions");
        return;
      }

      if (event.key.toLowerCase() === "r" && event.altKey) {
        event.preventDefault();
        setActiveMode("reflection");
        reflectionSectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
        return;
      }

      if (event.key.toLowerCase() === "d" && event.altKey) {
        event.preventDefault();
        setActiveMode("diary");
        diarySectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dayOptions, onSelectDate, selectedDate]);

  function submitIntention() {
    const nextIntention = intentionDraft.trim();

    if (!nextIntention) {
      return;
    }

    onUpdateEntry({ morningIntention: nextIntention });
    setIntentionDraft("");
  }

  function submitDiary() {
    const nextDiaryEntry = diaryDraft.trim();

    if (!nextDiaryEntry) {
      return;
    }

    onUpdateEntry({ diaryEntry: nextDiaryEntry });
    setDiaryDraft("");
  }

  function submitReflection() {
    const nextReflectionEntry = reflectionDraft.trim();

    if (!nextReflectionEntry) {
      return;
    }

    onUpdateEntry({ reflectionEntry: nextReflectionEntry });
    setReflectionDraft("");
  }

  return (
    <section className="page page--journaling" aria-label="Journaling">
      <ThreeColumnLayout
        className="journal-console"
        leftClassName="journal-nav"
        centerClassName="journal-daily"
        rightClassName="journal-context"
        leftLabel="Journal days"
        centerLabel="Journal entry"
        rightLabel="Journal context"
        left={
          <>
          <div className="journal-nav__header">
            <p className="page__eyebrow">Days</p>
          </div>
          <div className="journal-nav__list" ref={dayListRef} tabIndex={0}>
            {dayOptions.map((option) => (
              <button
                key={option.date}
                type="button"
                className={`journal-nav__day ${
                  option.date === selectedDate ? "is-active" : ""
                }`}
                onClick={() => onSelectDate(option.date)}
              >
                <span className="journal-nav__day-label">{option.label}</span>
              </button>
            ))}
          </div>
          </>
        }
        center={
          <>
          <header className="journal-daily__header">
            <div className="journal-daily__heading">
              <p className="page__eyebrow">Today</p>
              <h1 className="journal-page__date">{formatJournalDate(entry.date)}</h1>
              <div className="journal-mode-switch" aria-label="Journal mode">
                <button
                  type="button"
                  className={`journal-mode-switch__button ${
                    activeMode === "intentions" ? "is-active" : ""
                  }`}
                  onClick={() => setActiveMode("intentions")}
                >
                  Intentions {modeCompletion.intentions ? "✓" : "○"}
                </button>
                <button
                  type="button"
                  className={`journal-mode-switch__button ${
                    activeMode === "diary" ? "is-active" : ""
                  }`}
                  onClick={() => setActiveMode("diary")}
                >
                  Diary {modeCompletion.diary ? "✓" : "○"}
                </button>
                <button
                  type="button"
                  className={`journal-mode-switch__button ${
                    activeMode === "reflection" ? "is-active" : ""
                  }`}
                  onClick={() => setActiveMode("reflection")}
                >
                  Reflection {modeCompletion.reflection ? "✓" : "○"}
                </button>
              </div>
            </div>
          </header>

          {activeMode === "intentions" ? (
            <JournalPromptThread
              title="Today&apos;s intention"
              value={entry.morningIntention}
              draft={intentionDraft}
              onDraftChange={setIntentionDraft}
              onSubmit={submitIntention}
              placeholder="What do you want to achieve today ..."
              ariaLabel="Today's intention"
              emptyTitle="No intention yet"
              emptyCopy="Write one clear aim for today and it will appear here."
            />
          ) : activeMode === "diary" ? (
            <JournalPromptThread
              sectionRef={diarySectionRef}
              title="Diary"
              value={entry.diaryEntry}
              draft={diaryDraft}
              onDraftChange={setDiaryDraft}
              onSubmit={submitDiary}
              placeholder="What&apos;s on your mind right now ..."
              ariaLabel="Diary entry"
              emptyTitle="No diary entry yet"
              emptyCopy="Write freely and your entry will appear here."
            />
          ) : (
            <JournalPromptThread
              sectionRef={reflectionSectionRef}
              title="Reflection"
              value={entry.reflectionEntry}
              draft={reflectionDraft}
              onDraftChange={setReflectionDraft}
              onSubmit={submitReflection}
              placeholder="What stands out about today ..."
              ariaLabel="Reflection entry"
              emptyTitle="No reflection yet"
              emptyCopy="Capture what stands out from the day and it will appear here."
            />
          )}
          </>
        }
        right={
          <ContextList
            title="Today"
            items={context.tasksForToday}
            emptyMessage="No relevant tasks for today."
          />
        }
      />
    </section>
  );
}

function JournalPromptThread({
  title,
  value,
  draft,
  onDraftChange,
  onSubmit,
  placeholder,
  ariaLabel,
  emptyTitle,
  emptyCopy,
  sectionRef,
}: {
  title: string;
  value: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  ariaLabel: string;
  emptyTitle: string;
  emptyCopy: string;
  sectionRef?: RefObject<HTMLElement | null>;
}) {
  return (
    <section className="journal-section journal-section--chat" ref={sectionRef}>
      <div className="journal-chat">
        {value.trim() ? (
          <article className="journal-chat__message journal-chat__message--user">
            <p className="journal-chat__message-label">{title}</p>
            <p className="journal-chat__message-body">{value}</p>
          </article>
        ) : (
          <JournalChatEmptyState title={emptyTitle} copy={emptyCopy} />
        )}
      </div>

      <form
        className="journal-chat__composer"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          className="journal-chat__input"
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
      </form>
    </section>
  );
}

function JournalChatEmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="journal-chat__empty" role="presentation">
      <div className="journal-chat__empty-art" aria-hidden="true">
        <svg viewBox="0 0 180 180" className="journal-chat__empty-svg">
          <defs>
            <linearGradient
              id="journal-thread-empty-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--color-focus-ring)" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <circle
            cx="90"
            cy="90"
            r="62"
            fill="url(#journal-thread-empty-gradient)"
            opacity="0.12"
          />
          <path
            d="M56 68c0-9.9 8.1-18 18-18h32c9.9 0 18 8.1 18 18v20c0 9.9-8.1 18-18 18H92l-17 16v-16H74c-9.9 0-18-8.1-18-18Z"
            fill="none"
            stroke="var(--color-border-strong)"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M74 72h32M74 86h20"
            fill="none"
            stroke="var(--color-text-secondary)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="124" cy="56" r="10" fill="var(--color-panel-bg)" />
          <path
            d="M124 51v10M119 56h10"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="journal-chat__empty-title">{title}</p>
      <p className="journal-chat__empty-copy">{copy}</p>
    </div>
  );
}

function ContextList({
  title,
  items,
  emptyMessage = "Nothing to surface yet.",
}: {
  title: string;
  items: string[];
  emptyMessage?: string;
}) {
  return (
    <section className="journal-context__section">
      <p className="page__eyebrow">Context</p>
      <h2 className="journal-context__title">{title}</h2>
      {items.length > 0 ? (
        <ul className="journal-context__list">
          {items.map((item) => (
            <li key={item} className="journal-context__card">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="journal-context__empty">{emptyMessage}</p>
      )}
    </section>
  );
}

function buildJournalDayOptions(
  todayDate: string,
  selectedDate: string,
  entries: JournalEntrySummary[],
) {
  const summariesByDate = new Map(entries.map((entry) => [entry.date, entry.preview]));
  const yesterdayDate = shiftDate(todayDate, -1);
  const recentDates = Array.from({ length: 8 }, (_, index) => shiftDate(todayDate, -index));
  const mergedDates = Array.from(
    new Set([todayDate, selectedDate, ...recentDates, ...entries.map((entry) => entry.date)]),
  ).sort((left, right) => {
    if (left === yesterdayDate && right === todayDate) {
      return -1;
    }

    if (left === todayDate && right === yesterdayDate) {
      return 1;
    }

    return right.localeCompare(left);
  });

  return mergedDates.map((date) => ({
    date,
    label: labelForJournalNavDate(date),
    preview: summariesByDate.get(date) ?? "",
  }));
}

function buildJournalContext(selectedDate: string, items: Item[]) {
  const tasksForToday = items
    .filter(
      (item) =>
        item.kind === "task" &&
        item.state !== "deleted" &&
        (item.dueDate === selectedDate || item.taskStatus === "today"),
    )
    .map((item) => item.title)
    .slice(0, 5);

  return {
    tasksForToday,
  };
}

function moveSelectedDate(
  options: Array<{ date: string }>,
  selectedDate: string,
  delta: number,
  onSelectDate: (date: string) => void,
) {
  const currentIndex = options.findIndex((option) => option.date === selectedDate);
  const fallbackIndex = 0;
  const nextIndex = Math.max(
    0,
    Math.min(options.length - 1, (currentIndex === -1 ? fallbackIndex : currentIndex) + delta),
  );
  const nextDate = options[nextIndex]?.date;

  if (nextDate) {
    onSelectDate(nextDate);
  }
}

function shiftDate(date: string, deltaDays: number) {
  const parsedDate = new Date(`${date}T12:00:00`);
  parsedDate.setDate(parsedDate.getDate() + deltaDays);

  return `${parsedDate.getFullYear()}-${`${parsedDate.getMonth() + 1}`.padStart(2, "0")}-${`${parsedDate.getDate()}`.padStart(2, "0")}`;
}

function labelForJournalNavDate(date: string) {
  const todayString = localTodayString();
  const targetDate = new Date(`${date}T12:00:00`);
  const today = new Date(`${todayString}T12:00:00`);
  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === -1) {
    return "Yesterday";
  }

  return formatShortJournalDate(date);
}

function formatJournalDate(date: string) {
  const parsedDate = new Date(`${date}T12:00:00`);

  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

function formatShortJournalDate(date: string) {
  const parsedDate = new Date(`${date}T12:00:00`);

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

function localTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}
