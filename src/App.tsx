import { useState, useEffect, useRef, useCallback } from "react";
import { createPopupSession, update } from "./popup-session";
import type { PopupEffect, PopupEvent } from "./popup-session";
import { SORT_ORDER_OPTIONS } from "./ticket-list-view";
import type {
  FilterTab,
  FilterTabView,
  SortOrder,
  SyncState,
  TicketRow as TicketRowData,
} from "./ticket-list-view";
import {
  CONTROLS_DIVIDER_HEIGHT,
  CONTROLS_PADDING_BOTTOM,
  FOOTER_HEIGHT,
  HEADER_HEIGHT,
  LIST_PADDING_Y,
  ROW_HEIGHT,
  SEARCH_HEIGHT,
  SORT_ROW_HEIGHT,
  TABS_HEIGHT,
} from "./popup-layout";
import { statusColor } from "./status";
import { badgeToneColor, groupAccentColor } from "./ui-maps";

// ── Icons ───────────────────────────────────────────────────────────────────

function JiraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
    >
      <rect
        x="1.5"
        y="2"
        width="13"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="4.5"
        y1="6"
        x2="11.5"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="4.5"
        y1="8.5"
        x2="11.5"
        y2="8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="4.5"
        y1="11"
        x2="9.5"
        y2="11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" />
      <path d="M13.5 2.5v5.5h-5.5" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
  );
}

function QuitIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.5 8H2.5M5.5 5l-3 3 3 3" />
      <path d="M8 3h4a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8" />
    </svg>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ArrowUpRightIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 11l6-6M6 5h5v5" />
    </svg>
  );
}

const TRUNCATE = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

function TicketRow({
  row,
  selected,
}: {
  row: TicketRowData;
  selected: boolean;
}) {
  const { ticket, group, badge } = row;
  const statusTint = statusColor(ticket.statusCategory);

  return (
    <button
      onClick={() => window.electronAPI.openUrl(ticket.url)}
      className={`ticket-row focus:outline-none${selected ? " ticket-row-selected" : ""}`}
      data-selected={selected}
      style={{
        display: "flex",
        alignItems: "stretch",
        width: "100%",
        boxSizing: "border-box",
        gap: 10,
        height: ROW_HEIGHT,
        padding: "8px 10px",
        overflow: "hidden",
        position: "relative",
        textAlign: "left",
      }}
    >
      <span
        style={{
          width: 3,
          borderRadius: 2,
          flexShrink: 0,
          backgroundColor: groupAccentColor(group),
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            overflow: "hidden",
            // Room for the hover arrow in the top-right corner of the row.
            paddingRight: 18,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontFamily: "ui-monospace, monospace",
              color: "var(--text-secondary)",
              flexShrink: 0,
              lineHeight: "1.4",
            }}
          >
            {ticket.key}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              flex: 1,
              minWidth: 0,
              lineHeight: "1.4",
              ...TRUNCATE,
            }}
          >
            {ticket.title}
          </span>
          {badge && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: badgeToneColor(badge.tone),
                flexShrink: 0,
                lineHeight: "1.4",
              }}
            >
              {badge.label}
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 2,
            fontSize: 11,
            lineHeight: "1.3",
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ ...TRUNCATE, minWidth: 0 }}>{ticket.board}</span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: statusTint,
              flexShrink: 0,
              maxWidth: "50%",
            }}
          >
            <span
              style={{
                width: 4,
                height: 4,
                marginTop: 1,
                borderRadius: "50%",
                backgroundColor: statusTint,
                flexShrink: 0,
              }}
            />
            <span style={TRUNCATE}>{ticket.status}</span>
          </span>
        </div>
      </div>
      <span
        className="ticket-row-arrow"
        style={{
          position: "absolute",
          top: 9,
          right: 10,
          display: "flex",
          color: "var(--text-secondary)",
        }}
      >
        <ArrowUpRightIcon />
      </span>
    </button>
  );
}

function SearchField({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      style={{
        height: SEARCH_HEIGHT,
        boxSizing: "border-box",
        padding: "12px",
        flexShrink: 0,
      }}
    >
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search tickets…"
          aria-label="Search tickets"
          aria-keyshortcuts="Meta+F"
          spellCheck={false}
          autoComplete="off"
          className="search-input"
          style={{
            width: "100%",
            height: 32,
            boxSizing: "border-box",
            padding: "0 44px 0 10px",
            fontSize: 12,
            color: "var(--text-primary)",
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: 6,
          }}
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="search-clear"
          >
            <ClearIcon />
          </button>
        ) : (
          <kbd className="search-shortcut">⌘F</kbd>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 8,
      }}
    >
      <div className="spinner" />
      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
        Loading…
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        textAlign: "center",
        padding: "0 24px",
        gap: 4,
      }}
    >
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--accent-red)",
          margin: 0,
        }}
      >
        Failed to load tickets
      </p>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          margin: 0,
          wordBreak: "break-all",
        }}
      >
        {message}
      </p>
    </div>
  );
}

function FilterTabRow({
  tabs,
  onSelect,
}: {
  tabs: FilterTabView[];
  onSelect: (tab: FilterTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter tickets"
      style={{
        height: TABS_HEIGHT,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "4px 12px",
        flexShrink: 0,
      }}
    >
      {tabs.map(({ tab, label, count, selected }) => (
        <button
          key={tab}
          role="tab"
          aria-selected={selected}
          onClick={() => onSelect(tab)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            height: 24,
            padding: "0 10px",
            fontSize: 11,
            fontWeight: 400,
            cursor: "pointer",
            color: selected ? "var(--text-primary)" : "var(--text-secondary)",
            backgroundColor: selected ? "var(--surface-1)" : "transparent",
            border: `1px solid ${selected ? "var(--border)" : "transparent"}`,
            borderRadius: 6,
          }}
        >
          {label}
          {count !== null && <span style={{ opacity: 0.7 }}>{count}</span>}
        </button>
      ))}
    </div>
  );
}

function CenteredMessage({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
        {children}
      </p>
    </div>
  );
}

function SyncStateFooter({ syncState }: { syncState: SyncState | null }) {
  const failed = syncState?.failed ?? false;
  return (
    <footer
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
        height: FOOTER_HEIGHT,
        boxSizing: "border-box",
        padding: "0 16px",
        marginLeft: "2px",
        borderTop: "1px solid var(--border)",
        fontSize: 11,
        color: "var(--text-secondary)",
      }}
    >
      {syncState && (
        <>
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              flexShrink: 0,
              backgroundColor: failed
                ? "var(--accent-red)"
                : "var(--accent-green)",
            }}
          />
          <span style={{ fontWeight: 400 }}>{syncState.label}</span>
        </>
      )}
    </footer>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </svg>
  );
}

function ListHeader({
  sortOrder,
  onSortOrderChange,
}: {
  sortOrder: SortOrder;
  onSortOrderChange: (sortOrder: SortOrder) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedLabel =
    SORT_ORDER_OPTIONS.find((option) => option.value === sortOrder)?.label ??
    "";

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    // The Popup hides on blur; make sure a menu left open doesn't reappear.
    function onWindowBlur() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: SORT_ROW_HEIGHT,
        boxSizing: "border-box",
        padding: "0 12px",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-secondary)",
          marginLeft: "4px",
        }}
      >
        My work
      </span>
      <button
        aria-label="Sort Order"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="sort-trigger"
      >
        {selectedLabel}
        <ChevronDownIcon />
      </button>
      {open && (
        <div role="listbox" aria-label="Sort Order" className="sort-menu">
          {SORT_ORDER_OPTIONS.map((option) => {
            const selected = option.value === sortOrder;
            return (
              <button
                key={option.value}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onSortOrderChange(option.value);
                  setOpen(false);
                }}
                className="sort-menu-item"
              >
                <span>{option.label}</span>
                {selected && <CheckIcon />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────────

const SYNC_STATE_TICK_MS = 15_000;

function runEffect(effect: PopupEffect, searchInput: HTMLInputElement | null) {
  switch (effect.type) {
    case "openUrl":
      window.electronAPI.openUrl(effect.url);
      break;
    case "requestRefresh":
      window.electronAPI.refresh();
      break;
    case "focusSearch":
      searchInput?.focus();
      searchInput?.select();
      break;
    case "persistPreferences":
      window.electronAPI.setPreferences(effect.changes);
      break;
    case "blurActiveElement":
      (document.activeElement as HTMLElement)?.blur();
      break;
  }
}

export function App() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Read synchronously from the main process so the first frame already shows
  // the saved Filter Tab and Sort Order.
  const [session, setSession] = useState(() =>
    createPopupSession({
      preferences: window.electronAPI.getPreferences(),
      now: Date.now(),
    }),
  );
  // Always the latest session, so a key press sees the result of the one before it.
  const sessionRef = useRef(session);

  // Returns whether the event was handled, so a key press can preventDefault.
  const dispatch = useCallback((event: PopupEvent): boolean => {
    const result = update(sessionRef.current, event);
    sessionRef.current = result.session;
    setSession(result.session);
    for (const effect of result.effects) {
      runEffect(effect, searchInputRef.current);
    }
    return result.handled;
  }, []);

  useEffect(() => {
    window.electronAPI.onTickets((tickets) => {
      dispatch({ type: "tickets", tickets, now: Date.now() });
    });
    window.electronAPI.onTicketsError((message) => {
      dispatch({ type: "ticketsError", message, now: Date.now() });
    });
    window.electronAPI.onWindowShow(() => {
      dispatch({ type: "windowShow", now: Date.now() });
    });

    function onKeyDown(e: KeyboardEvent) {
      const focus =
        e.target === document.body
          ? "body"
          : e.target === searchInputRef.current
            ? "search"
            : "other";
      const handled = dispatch({
        type: "key",
        input: {
          key: e.key,
          code: e.code,
          ctrl: e.ctrlKey,
          meta: e.metaKey,
          alt: e.altKey,
          shift: e.shiftKey,
          focus,
        },
      });
      if (handled) e.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);

    // Re-evaluate the Sync State label while the Popup is visible so
    // "Synced 2m ago" keeps ageing.
    const ageTimer = setInterval(() => {
      if (!document.hidden) dispatch({ type: "tick", now: Date.now() });
    }, SYNC_STATE_TICK_MS);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearInterval(ageTimer);
    };
  }, [dispatch]);

  const { searchText, sortOrder, activeIndex, error } = session;
  const { rows, tabs, emptyReason, syncState } = session.view;
  const isLoading = session.loading;

  useEffect(() => {
    document
      .querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, rows.length]);

  return (
    <div className="app-container">
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: HEADER_HEIGHT,
          boxSizing: "border-box",
          padding: "0 12px",
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          color: "var(--text-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <JiraIcon />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Jira Tray</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => dispatch({ type: "refresh" })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "inherit",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <RefreshIcon />
            <span style={{ fontSize: 11 }}>⌘R</span>
          </button>
          <button
            onClick={() => window.electronAPI.quit()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "inherit",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <QuitIcon />
            <span style={{ fontSize: 11 }}>⌘Q</span>
          </button>
        </div>
      </header>

      <div
        style={{
          flexShrink: 0,
          borderBottom: `${CONTROLS_DIVIDER_HEIGHT}px solid var(--border)`,
          paddingBottom: CONTROLS_PADDING_BOTTOM,
        }}
      >
        <SearchField
          value={searchText}
          onChange={(text) => dispatch({ type: "searchChanged", text })}
          inputRef={searchInputRef}
        />

        <FilterTabRow
          tabs={tabs}
          onSelect={(tab) => dispatch({ type: "filterTabChosen", tab })}
        />
      </div>

      <ListHeader
        sortOrder={sortOrder}
        onSortOrderChange={(order) =>
          dispatch({ type: "sortOrderChosen", order })
        }
      />

      {isLoading ? (
        <main className="app-main">
          <LoadingState />
        </main>
      ) : (
        <main className="app-main app-main-scroll">
          {error ? (
            <ErrorState message={error} />
          ) : rows.length > 0 ? (
            <ul
              className="ticket-list"
              style={{
                listStyle: "none",
                margin: 0,
                padding: `${LIST_PADDING_Y}px 8px`,
              }}
            >
              {rows.map((row, index) => (
                <li key={row.ticket.key}>
                  <TicketRow row={row} selected={index === activeIndex} />
                </li>
              ))}
            </ul>
          ) : emptyReason.kind === "noSearchMatch" ? (
            <CenteredMessage>No tickets match</CenteredMessage>
          ) : emptyReason.kind === "noTicketsInTab" ? (
            <CenteredMessage>
              {`No tickets ${(tabs.find((t) => t.selected)?.label ?? "").toLowerCase()}`}
            </CenteredMessage>
          ) : (
            <CenteredMessage>You're all caught up</CenteredMessage>
          )}
        </main>
      )}

      <SyncStateFooter syncState={syncState} />
    </div>
  );
}
