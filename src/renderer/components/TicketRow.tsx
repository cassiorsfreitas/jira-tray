import { ROW_HEIGHT } from '../../shared/popup-layout';
import { statusColor } from '../../shared/status';
import type { TicketRow as TicketRowData } from '../../shared/ticket-list-view';
import { badgeToneColor, groupAccentColor } from '../ui-maps';
import { ArrowUpRightIcon } from './icons';

const TRUNCATE = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

export function TicketRow({
  row,
  selected,
  onOpen,
}: {
  row: TicketRowData;
  selected: boolean;
  onOpen: (url: string) => void;
}) {
  const { ticket, group, badge } = row;
  const statusTint = statusColor(ticket.statusCategory);

  return (
    <button
      onClick={() => onOpen(ticket.url)}
      className={`ticket-row focus:outline-none${selected ? ' ticket-row-selected' : ''}`}
      data-selected={selected}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        width: '100%',
        boxSizing: 'border-box',
        gap: 10,
        height: ROW_HEIGHT,
        padding: '8px 10px',
        overflow: 'hidden',
        position: 'relative',
        textAlign: 'left',
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
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            overflow: 'hidden',
            // Room for the hover arrow in the top-right corner of the row.
            paddingRight: 18,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontFamily: 'ui-monospace, monospace',
              color: 'var(--text-secondary)',
              flexShrink: 0,
              lineHeight: '1.4',
            }}
          >
            {ticket.key}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-primary)',
              flex: 1,
              minWidth: 0,
              lineHeight: '1.4',
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
                lineHeight: '1.4',
              }}
            >
              {badge.label}
            </span>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 2,
            fontSize: 11,
            lineHeight: '1.3',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ ...TRUNCATE, minWidth: 0 }}>{ticket.board}</span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: statusTint,
              flexShrink: 0,
              maxWidth: '50%',
            }}
          >
            <span
              style={{
                width: 4,
                height: 4,
                marginTop: 1,
                borderRadius: '50%',
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
          position: 'absolute',
          top: 9,
          right: 10,
          display: 'flex',
          color: 'var(--text-secondary)',
        }}
      >
        <ArrowUpRightIcon />
      </span>
    </button>
  );
}
