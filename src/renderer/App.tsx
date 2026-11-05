import { Controls } from './components/Controls';
import { Header } from './components/Header';
import { ListBody } from './components/ListBody';
import { ListHeader } from './components/ListHeader';
import { SyncStateFooter } from './components/SyncStateFooter';
import { usePopupSession } from './hooks/use-popup-session';

export function App() {
  const { session, dispatch, searchInputRef } = usePopupSession();
  const {
    searchText,
    sortOrder,
    activeIndex,
    error,
    loading,
    settingsNeeded,
    view,
  } = session;

  return (
    <div className="app-container">
      <Header
        onRefresh={() => dispatch({ type: 'refresh' })}
        onQuit={() => window.electronAPI.quit()}
      />
      <Controls
        searchText={searchText}
        onSearchChange={(text) => dispatch({ type: 'searchChanged', text })}
        searchInputRef={searchInputRef}
        tabs={view.tabs}
        onTabSelect={(tab) => dispatch({ type: 'filterTabChosen', tab })}
      />
      <ListHeader
        sortOrder={sortOrder}
        onSortOrderChange={(order) =>
          dispatch({ type: 'sortOrderChosen', order })
        }
      />
      <ListBody
        loading={loading}
        error={error}
        settingsNeeded={settingsNeeded}
        view={view}
        activeIndex={activeIndex}
        onOpen={(url) => window.electronAPI.openUrl(url)}
      />
      <SyncStateFooter
        syncState={view.syncState}
        settingsNeeded={settingsNeeded}
        onOpenSettings={() => window.electronAPI.openSettings()}
      />
    </div>
  );
}
