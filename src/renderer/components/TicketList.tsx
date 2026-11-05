import { useEffect, useRef } from 'react';
import { LIST_PADDING_Y } from '../../shared/popup-layout';
import type { TicketRow as TicketRowData } from '../../shared/ticket-list-view';
import { TicketRow } from './TicketRow';

export function TicketList({
  rows,
  activeIndex,
  onOpen,
}: {
  rows: TicketRowData[];
  activeIndex: number;
  onOpen: (url: string) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);

  // Keep the keyboard-selected row in view.
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, rows.length]);

  return (
    <ul
      ref={listRef}
      className="ticket-list"
      style={{
        listStyle: 'none',
        margin: 0,
        padding: `${LIST_PADDING_Y}px 8px`,
      }}
    >
      {rows.map((row, index) => (
        <li key={row.ticket.key}>
          <TicketRow
            row={row}
            selected={index === activeIndex}
            onOpen={onOpen}
          />
        </li>
      ))}
    </ul>
  );
}
