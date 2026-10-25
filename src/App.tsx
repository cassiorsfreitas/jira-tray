export function App() {
  function handleQuit() {
    window.electronAPI.quit();
  }

  function handleRefresh() {
    window.electronAPI.refresh();
  }

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800 select-none">
      <header className="px-4 py-3 border-b border-gray-200">
        <h1 className="text-sm font-semibold">Jira Tray</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-xs text-gray-500">Loading issues…</p>
      </main>

      <footer className="flex items-center justify-between px-4 py-2 border-t border-gray-200">
        <button
          onClick={handleRefresh}
          className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
        >
          Refresh
        </button>
        <button
          onClick={handleQuit}
          className="text-xs text-red-600 hover:text-red-800 focus:outline-none"
        >
          Quit
        </button>
      </footer>
    </div>
  );
}
