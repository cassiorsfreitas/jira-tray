import type { TicketListView } from '../../shared/ticket-list-view';
import { EmptyState, ErrorState, LoadingState } from './ListStates';
import { TicketList } from './TicketList';

/** The only scrolling region: loading, error, empty or the Ticket rows. */
export function ListBody({
  loading,
  error,
  view,
  activeIndex,
  onOpen,
}: {
  loading: boolean;
  error: string | null;
  view: TicketListView;
  activeIndex: number;
  onOpen: (url: string) => void;
}) {
  if (loading) {
    return (
      <main className="app-main">
        <LoadingState />
      </main>
    );
  }

  return (
    <main className="app-main app-main-scroll">
      {error ? (
        <ErrorState message={error} />
      ) : view.rows.length > 0 ? (
        <TicketList
          rows={view.rows}
          activeIndex={activeIndex}
          onOpen={onOpen}
        />
      ) : (
        <EmptyState reason={view.emptyReason} tabs={view.tabs} />
      )}
    </main>
  );
}
