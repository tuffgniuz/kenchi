import type { CaptureItem } from "../../models/capture";

export function CaptureInboxPage({ inboxItems }: { inboxItems: CaptureItem[] }) {
  return (
    <section className="page page--inbox" aria-label="Capture Inbox">
      <div className="page__header page__header--inbox">
        <div>
          <p className="page__eyebrow">Inbox</p>
        </div>
        <div className="inbox-filters" aria-label="Inbox filters">
          <button type="button" className="inbox-filter inbox-filter--active">
            All
          </button>
          <button type="button" className="inbox-filter">
            Unprocessed
          </button>
          <button type="button" className="inbox-filter">
            Archived
          </button>
        </div>
      </div>

      {inboxItems.length > 0 ? (
        <div className="inbox-list" aria-label="Captured thoughts">
          {inboxItems.map((item) => (
            <article key={item.id} className="inbox-item">
              <div className="inbox-item__marker" aria-hidden="true" />
              <div className="inbox-item__body">
                <p className="inbox-item__text">{item.text}</p>
                <div className="inbox-item__meta">
                  <span>{item.createdAt}</span>
                  {item.project ? <span>{item.project}</span> : null}
                  {item.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className="inbox-item__actions" aria-label="Inbox item actions">
                <button type="button" className="inbox-action">
                  Task
                </button>
                <button type="button" className="inbox-action">
                  Note
                </button>
                <button type="button" className="inbox-action">
                  Archive
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="inbox-empty">
          <p className="inbox-empty__title">No captured thoughts yet</p>
          <p className="inbox-empty__copy">
            Use `q c` to open quick capture from anywhere in the app.
          </p>
        </div>
      )}
    </section>
  );
}
