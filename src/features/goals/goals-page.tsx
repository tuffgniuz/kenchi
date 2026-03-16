import { useState } from "react";
import { TrashIcon } from "../../app/icons";
import { FloatingPanel } from "../../components/floating-panel";
import { ThreeColumnLayout } from "../../components/three-column-layout";
import type { GoalPeriod, Item } from "../../models/item";
import type { Project } from "../../models/project";

type GoalsPageProps = {
  items: Item[];
  projects: Project[];
  todayDate: string;
  selectedGoalId: string;
  onSelectGoal: (goalId: string) => void;
  onUpdateGoal: (goalId: string, updates: Partial<Item>) => void;
  onDeleteGoal: (goalId: string) => void;
};

const periodOptions: Array<{ id: GoalPeriod; label: string }> = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

export function GoalsPage({
  items,
  projects,
  todayDate,
  selectedGoalId,
  onSelectGoal,
  onUpdateGoal,
  onDeleteGoal,
}: GoalsPageProps) {
  const [activePeriod, setActivePeriod] = useState<GoalPeriod>("weekly");
  const [pendingDeleteGoal, setPendingDeleteGoal] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const weekDays = getCurrentWeekDays(todayDate);
  const goals = items.filter((item) => item.kind === "goal" && item.state === "active");
  const filteredGoals = goals.filter((goal) => goal.goalPeriod === activePeriod);
  const taskItems = items.filter((item) => item.kind === "task");
  const dailyGoals = filteredGoals.filter((goal) => goal.goalPeriod === "daily");
  const visibleGoals = activePeriod === "daily" ? dailyGoals : [];

  return (
    <section className="page page--goals" aria-label="Goals">
      <ThreeColumnLayout
        className="goals-layout"
        leftClassName="goals-rail"
        centerClassName="goals-main"
        rightClassName="goals-insights"
        leftLabel="Goal periods"
        centerLabel="Goals"
        rightLabel="Goal insights"
        left={
          <>
            <div className="goals-rail__header">
              <p className="page__eyebrow">Filter</p>
            </div>
            <div className="goals-rail__list">
              {periodOptions.map((period) => (
                <button
                  key={period.id}
                  type="button"
                  className={`goals-rail__item ${activePeriod === period.id ? "is-active" : ""}`}
                  onClick={() => setActivePeriod(period.id)}
                >
                  <span className="goals-rail__name">{period.label}</span>
                </button>
              ))}
            </div>
          </>
        }
        center={
          activePeriod === "daily" ? (
            dailyGoals.length > 0 ? (
              <div className="goals-main__section">
                <header className="goals-main__header">
                  <p className="page__eyebrow">Goals</p>
                  <h1 className="goals-main__title">{labelForPeriod(activePeriod)} goals</h1>
                </header>
                <div className="goals-main__cards">
                  {dailyGoals.map((goal) => {
                    const linkedTasks = (goal.goalScope?.taskIds ?? [])
                      .map((taskId) => taskItems.find((item) => item.id === taskId))
                      .filter((task): task is Item => Boolean(task));
                    const progressByDate = goal.goalProgressByDate ?? {};
                    const todaysProgress = progressByDate[todayDate] ?? goal.goalProgress ?? 0;
                    const manualProgress = Math.max(0, Math.min(todaysProgress, goal.goalTarget));
                    const hasLinkedTasks = linkedTasks.length > 0;
                    const completedCount = hasLinkedTasks
                      ? linkedTasks.filter((task) => task.taskStatus === "done").length
                      : manualProgress;
                    const progressDenominator = hasLinkedTasks ? linkedTasks.length : goal.goalTarget;
                    const progressPercent =
                      progressDenominator > 0
                        ? Math.min(100, Math.max(0, (completedCount / progressDenominator) * 100))
                        : 0;
                    const projectName = goal.goalScope?.projectId
                      ? projects.find((project) => project.id === goal.goalScope?.projectId)?.name ?? ""
                      : "No linked project yet";

                    return (
                      <article
                        key={goal.id}
                        className={`goal-card ${selectedGoalId === goal.id ? "is-active" : ""}`}
                        onClick={() => onSelectGoal(goal.id)}
                      >
                        <div className="goal-card__header">
                          <div>
                            <h2 className="goal-card__title">{goal.title}</h2>
                            {goal.content.trim() ? (
                              <p className="goal-card__description">{goal.content}</p>
                            ) : null}
                            <p className="goal-card__meta">{projectName}</p>
                          </div>
                          <p className="goal-card__progress">
                            {completedCount} / {progressDenominator}
                          </p>
                        </div>
                        {hasLinkedTasks ? (
                          <div className="goal-card__linked-tasks">
                            {linkedTasks.map((task) => (
                              <label key={task.id} className="goal-card__linked-task">
                                <input
                                  type="checkbox"
                                  checked={task.taskStatus === "done"}
                                  readOnly
                                />
                                <span>{task.title}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="goal-card__checklist" aria-label={`${goal.title} progress`}>
                            {Array.from({ length: goal.goalTarget }, (_, index) => {
                              const checked = index < manualProgress;

                              return (
                                <button
                                  key={`${goal.id}-${index}`}
                                  type="button"
                                  className={`goal-card__checkbox ${checked ? "is-checked" : ""}`}
                                  aria-pressed={checked}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    const nextProgress = checked ? index : index + 1;
                                    onUpdateGoal(goal.id, {
                                      goalProgress: nextProgress,
                                      goalProgressByDate: {
                                        ...progressByDate,
                                        [todayDate]: nextProgress,
                                      },
                                    });
                                  }}
                                >
                                  <span className="goal-card__checkbox-mark" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <div className="goal-card__progress-bar" aria-hidden="true">
                          <div
                            className="goal-card__progress-fill"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="goal-card__actions" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            className="goal-card__delete"
                            aria-label={`Delete ${goal.title}`}
                            onClick={() => setPendingDeleteGoal({ id: goal.id, title: goal.title })}
                          >
                            <TrashIcon className="goal-card__delete-icon" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="goals-empty">
                <div className="goals-empty__art" aria-hidden="true">
                  <svg viewBox="0 0 180 180" className="goals-empty__svg">
                    <defs>
                      <linearGradient id="goals-empty-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="var(--color-focus-ring)" stopOpacity="0.75" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="90"
                      cy="90"
                      r="68"
                      fill="url(#goals-empty-gradient)"
                      opacity="0.12"
                    />
                    <circle
                      cx="90"
                      cy="90"
                      r="34"
                      fill="none"
                      stroke="var(--color-border-strong)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="90"
                      cy="90"
                      r="16"
                      fill="none"
                      stroke="var(--color-text-secondary)"
                      strokeWidth="4"
                    />
                    <path
                      d="M90 42v18M90 120v18M42 90h18M120 90h18"
                      fill="none"
                      stroke="var(--color-text-muted)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <circle cx="132" cy="56" r="12" fill="var(--color-panel-bg)" />
                    <path
                      d="M132 50v12M126 56h12"
                      fill="none"
                      stroke="var(--color-accent)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <header className="goals-main__header">
                  <p className="page__eyebrow">Goals</p>
                  <h1 className="goals-main__title">{labelForPeriod(activePeriod)} goals</h1>
                </header>
                <p className="goals-empty__title">No daily goals yet</p>
                <p className="goals-empty__copy">Create a daily goal to give today a target.</p>
              </div>
            )
          ) : (
            <div className="goals-empty">
              <div className="goals-empty__art" aria-hidden="true">
                <svg viewBox="0 0 180 180" className="goals-empty__svg">
                  <defs>
                    <linearGradient id="goals-empty-future-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="var(--color-focus-ring)" stopOpacity="0.75" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="90"
                    cy="90"
                    r="68"
                    fill="url(#goals-empty-future-gradient)"
                    opacity="0.12"
                  />
                  <path
                    d="M54 64h72v52H54z"
                    fill="none"
                    stroke="var(--color-border-strong)"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M68 80h44M68 94h28M68 108h36"
                    fill="none"
                    stroke="var(--color-text-secondary)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <header className="goals-main__header">
                <p className="page__eyebrow">Goals</p>
                <h1 className="goals-main__title">{labelForPeriod(activePeriod)} goals</h1>
              </header>
              <p className="goals-empty__title">{labelForPeriod(activePeriod)} goals coming next</p>
              <p className="goals-empty__copy">This draft only renders daily goals for now.</p>
            </div>
          )
        }
        right={
          <div className="goals-insights__section">
            <header className="goals-insights__header">
              <p className="page__eyebrow">Overview</p>
              <h2 className="goals-insights__title">{labelForPeriod(activePeriod)} goals</h2>
            </header>
            {visibleGoals.length > 0 ? (
              <div className="goals-insights__list">
                {visibleGoals.map((goal) => {
                  const linkedTasks = (goal.goalScope?.taskIds ?? [])
                    .map((taskId) => taskItems.find((item) => item.id === taskId))
                    .filter((task): task is Item => Boolean(task));
                  const progressByDate = goal.goalProgressByDate ?? {};

                  return (
                    <button
                      key={goal.id}
                      type="button"
                      className={`goals-insights__item ${
                        selectedGoalId === goal.id ? "is-active" : ""
                      }`}
                      onClick={() => onSelectGoal(goal.id)}
                    >
                      <span className="goals-insights__item-title">{goal.title}</span>
                      <div className="goals-insights__week" aria-hidden="true">
                        {weekDays.map((day) => {
                          const linkedCompletedCount =
                            linkedTasks.length > 0
                              ? linkedTasks.filter((task) => task.completedAt === day.date).length
                              : 0;
                          const loggedProgress =
                            linkedTasks.length > 0
                              ? linkedCompletedCount
                              : Math.max(
                                  0,
                                  Math.min(
                                    progressByDate[day.date] ??
                                      (day.date === todayDate ? goal.goalProgress ?? 0 : 0),
                                    goal.goalTarget,
                                  ),
                                );
                          const progressDenominator =
                            linkedTasks.length > 0 ? linkedTasks.length : goal.goalTarget;
                          const state =
                            day.date > todayDate
                              ? "upcoming"
                              : loggedProgress >= progressDenominator
                                ? "done"
                                : day.date === todayDate
                                  ? "upcoming"
                                  : "missed";

                          return (
                            <div key={day.key} className="goals-insights__day">
                              <span className="goals-insights__day-label">{day.label}</span>
                              <span className={`goals-insights__day-state is-${state}`}>
                                {state === "done" ? "✓" : state === "missed" ? "×" : "—"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="goals-insights__empty">
                {activePeriod === "daily"
                  ? "No daily goals to show yet."
                  : `${labelForPeriod(activePeriod)} goals will appear here next.`}
              </p>
            )}
          </div>
        }
      />

      {pendingDeleteGoal ? (
        <GoalDeleteConfirmModal
          goalTitle={pendingDeleteGoal.title}
          onClose={() => setPendingDeleteGoal(null)}
          onConfirm={() => {
            onDeleteGoal(pendingDeleteGoal.id);
            setPendingDeleteGoal(null);
          }}
        />
      ) : null}
    </section>
  );
}

function labelForPeriod(period: GoalPeriod) {
  return period.slice(0, 1).toUpperCase() + period.slice(1);
}

function getCurrentWeekDays(todayDate: string) {
  const current = new Date(`${todayDate}T00:00:00`);
  const mondayOffset = current.getDay() === 0 ? -6 : 1 - current.getDay();
  const monday = shiftDate(current, mondayOffset);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(monday, index);

    return {
      key: labels[index].toLowerCase(),
      label: labels[index],
      date: toDateString(date),
    };
  });
}

function shiftDate(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function GoalDeleteConfirmModal({
  goalTitle,
  onClose,
  onConfirm,
}: {
  goalTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <FloatingPanel
      ariaLabelledBy="goal-delete-confirm-title"
      className="inbox-confirm"
      onClose={onClose}
    >
      <div className="inbox-confirm__content">
        <p id="goal-delete-confirm-title" className="new-task__title">
          Delete goal
        </p>
        <p className="inbox-confirm__item">{goalTitle}</p>
        <p className="inbox-confirm__copy">This will permanently remove the goal.</p>
        <div className="inbox-confirm__actions">
          <button type="button" className="inbox-confirm__button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="inbox-confirm__button inbox-confirm__button--confirm"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </FloatingPanel>
  );
}
