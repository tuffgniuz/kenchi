import { useMemo, useState } from "react";
import { ActionBar } from "../../components/ui/action-bar";
import { EmptyState } from "../../components/ui/empty-state";
import { Modal } from "../../components/ui/modal";
import { PageShell } from "../../components/ui/page-shell";
import type { Item } from "../../models/workspace-item";

type PendingInboxAction =
  | { type: "transform"; item: Item; nextKind: Item["kind"] }
  | { type: "state"; item: Item; nextState: Item["state"] }
  | { type: "delete"; item: Item };

export function CaptureInboxPage({
  inboxItems,
  onTransformItem,
  onUpdateItemState,
  onDeleteItem,
  onNotify,
}: {
  inboxItems: Item[];
  onTransformItem: (itemId: string, kind: Item["kind"]) => void;
  onUpdateItemState: (itemId: string, state: Item["state"]) => void;
  onDeleteItem: (itemId: string) => void;
  onNotify: (message: string) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<"all" | Item["state"]>("inbox");
  const [pendingAction, setPendingAction] = useState<PendingInboxAction | null>(null);
  const filteredItems = useMemo(
    () =>
      inboxItems.filter((item) =>
        activeFilter === "all" ? item.state !== "deleted" : item.state === activeFilter,
      ),
    [activeFilter, inboxItems],
  );

  return (
    <PageShell
      ariaLabel="Capture Inbox"
      eyebrow="Inbox"
      className="page--inbox"
      headerActions={
        <div className="inbox-filters" aria-label="Inbox filters">
          <button
            type="button"
            className={`inbox-filter ${activeFilter === "inbox" ? "inbox-filter--active" : ""}`}
            onClick={() => setActiveFilter("inbox")}
          >
            Inbox
          </button>
          <button
            type="button"
            className={`inbox-filter ${activeFilter === "someday" ? "inbox-filter--active" : ""}`}
            onClick={() => setActiveFilter("someday")}
          >
            Someday
          </button>
          <button
            type="button"
            className={`inbox-filter ${activeFilter === "archived" ? "inbox-filter--active" : ""}`}
            onClick={() => setActiveFilter("archived")}
          >
            Archived
          </button>
          <button
            type="button"
            className={`inbox-filter ${activeFilter === "all" ? "inbox-filter--active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All
          </button>
        </div>
      }
    >

      {filteredItems.length > 0 ? (
        <div className="inbox-table-wrap" aria-label="Captured thoughts">
          <table className="inbox-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Created</th>
                <th scope="col">Kind</th>
                <th scope="col">State</th>
                <th scope="col">Project</th>
                <th scope="col">Tags</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="inbox-table__item-cell">
                    <div className="inbox-table__item-content">
                      <span className="inbox-item__marker" aria-hidden="true" />
                      <span className="inbox-item__text">{item.content || item.title}</span>
                    </div>
                  </td>
                  <td>{item.createdAt}</td>
                  <td>{labelForKind(item.kind)}</td>
                  <td>{labelForState(item.state)}</td>
                  <td>{item.project || "None"}</td>
                  <td>{item.tags.length > 0 ? item.tags.join(", ") : "None"}</td>
                  <td className="inbox-table__actions-cell">
                    <div className="inbox-item__actions" aria-label="Inbox item actions">
                      <button
                        type="button"
                        className="inbox-action"
                        onClick={() =>
                          setPendingAction({ type: "transform", item, nextKind: "task" })
                        }
                      >
                        Task
                      </button>
                      <button
                        type="button"
                        className="inbox-action"
                        onClick={() =>
                          setPendingAction({ type: "transform", item, nextKind: "goal" })
                        }
                      >
                        Goal
                      </button>
                      <button
                        type="button"
                        className="inbox-action"
                        onClick={() =>
                          setPendingAction({ type: "transform", item, nextKind: "document" })
                        }
                      >
                        Document
                      </button>
                      <button
                        type="button"
                        className="inbox-action"
                        onClick={() =>
                          setPendingAction({ type: "state", item, nextState: "someday" })
                        }
                      >
                        Someday
                      </button>
                      <button
                        type="button"
                        className="inbox-action"
                        onClick={() =>
                          setPendingAction({ type: "state", item, nextState: "archived" })
                        }
                      >
                        Archive
                      </button>
                      <button
                        type="button"
                        className="inbox-action"
                        onClick={() => setPendingAction({ type: "delete", item })}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          className="inbox-empty"
          badge="Inbox"
          title={emptyTitleForFilter(activeFilter)}
          copy={emptyCopyForFilter(activeFilter)}
        />
      )}

      {pendingAction ? (
        <InboxActionConfirmModal
          pendingAction={pendingAction}
          onClose={() => setPendingAction(null)}
          onConfirm={() => {
            if (pendingAction.type === "transform") {
              onTransformItem(pendingAction.item.id, pendingAction.nextKind);
              onNotify(
                `Converted to ${labelForKind(pendingAction.nextKind).toLowerCase()} successfully.`,
              );
            }

            if (pendingAction.type === "state") {
              onUpdateItemState(pendingAction.item.id, pendingAction.nextState);
              onNotify(
                `Moved to ${labelForState(pendingAction.nextState).toLowerCase()} successfully.`,
              );
            }

            if (pendingAction.type === "delete") {
              onDeleteItem(pendingAction.item.id);
              onNotify("Deleted successfully.");
            }

            setPendingAction(null);
          }}
        />
      ) : null}
    </PageShell>
  );
}

function labelForKind(kind: Item["kind"]) {
  switch (kind) {
    case "document":
      return "Document";
    case "goal":
      return "Goal";
    case "task":
      return "Task";
    default:
      return "Capture";
  }
}

function labelForState(state: Item["state"]) {
  switch (state) {
    case "someday":
      return "Someday";
    case "archived":
      return "Archived";
    case "active":
      return "Active";
    default:
      return "Inbox";
  }
}

function emptyTitleForFilter(filter: "all" | Item["state"]) {
  switch (filter) {
    case "someday":
      return "No someday items";
    case "archived":
      return "No archived items";
    case "all":
      return "No inbox items yet";
    default:
      return "No captured thoughts yet";
  }
}

function emptyCopyForFilter(filter: "all" | Item["state"]) {
  if (filter === "inbox") {
    return "Use `n i` to capture something from anywhere in the app.";
  }

  if (filter === "someday") {
    return "Move ideas here when they are worth keeping but not acting on yet.";
  }

  if (filter === "archived") {
    return "Archived capture items will appear here.";
  }

  return "Capture or process something to populate this view.";
}

function InboxActionConfirmModal({
  pendingAction,
  onClose,
  onConfirm,
}: {
  pendingAction: PendingInboxAction;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const title =
    pendingAction.type === "transform"
      ? `Turn into ${labelForKind(pendingAction.nextKind)}`
      : pendingAction.type === "state"
        ? `Move to ${labelForState(pendingAction.nextState)}`
        : "Delete item";
  const description =
    pendingAction.type === "transform"
      ? `This will keep the same item and change its type to ${labelForKind(
          pendingAction.nextKind,
        ).toLowerCase()}.`
      : pendingAction.type === "state"
        ? `This will move the item into the ${labelForState(
            pendingAction.nextState,
          ).toLowerCase()} state.`
        : "This will permanently remove the item.";

  return (
    <Modal ariaLabelledBy="inbox-confirm-title" className="inbox-confirm" onClose={onClose}>
      <div className="inbox-confirm__content">
        <p id="inbox-confirm-title" className="new-task__title">
          {title}
        </p>
        <p className="inbox-confirm__item">{pendingAction.item.content || pendingAction.item.title}</p>
        <p className="inbox-confirm__copy">{description}</p>
        <ActionBar className="inbox-confirm__actions">
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
        </ActionBar>
      </div>
    </Modal>
  );
}
