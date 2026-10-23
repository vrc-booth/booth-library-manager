import { useCallback, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLibraryFetcher } from "../../hooks/useLibraryFetcher.ts";
import { useUserPreferences } from "../../hooks/useUserPreferences.ts";
import { useLibrarySearch } from "../../hooks/useLibrarySearch.ts";
import { useLoginStatus } from "../../hooks/useLoginStatus.ts";
import FloatingButton from "./components/FloatingButton.tsx";
import LibraryPanel from "./components/LibraryPanel.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AppContent() {
  const [isOpen, setIsOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(384);

  const { items, syncProgress, isSyncing, sync, error } = useLibraryFetcher({
    isPanelOpen: isOpen,
  });
  const {
    preferences,
    toggleFavorite,
    toggleHidden,
    isFavorite,
  } = useUserPreferences();
  const {
    searchQuery,
    setSearchQuery,
    activeSourceTab,
    setActiveSourceTab,
    activeTab,
    setActiveTab,
    filteredItems,
    libraryCount,
    giftsCount,
    favoritesCount,
    hiddenCount,
    totalCount,
    filteredCount,
  } = useLibrarySearch({
    items,
    favorites: preferences.favorites,
    hidden: preferences.hidden,
  });

  const handleToggle = () => setIsOpen((prev) => !prev);
  const handleClose = () => setIsOpen(false);
  const handlePanelWidthChange = useCallback((width: number) => {
    setPanelWidth(width);
  }, []);
  const handleSync = useCallback(() => {
    sync({ includeGifts: true });
  }, [sync]);

  return (
    <>
      {!isOpen && <FloatingButton onClick={handleToggle} isOpen={isOpen} />}
      <LibraryPanel
        isOpen={isOpen}
        onClose={handleClose}
        items={filteredItems}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeSourceTab={activeSourceTab}
        onSourceTabChange={setActiveSourceTab}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        libraryCount={libraryCount}
        giftsCount={giftsCount}
        totalCount={totalCount}
        filteredCount={filteredCount}
        favoritesCount={favoritesCount}
        hiddenCount={hiddenCount}
        syncProgress={syncProgress}
        isSyncing={isSyncing}
        onSync={handleSync}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onToggleHidden={toggleHidden}
        error={error}
        panelWidth={panelWidth}
        onPanelWidthChange={handlePanelWidthChange}
      />
    </>
  );
}

export default function App() {
  const loginStatus = useLoginStatus();

  // 로그인하지 않았으면 버튼도 띄우지 않고, 동기화·자동 새로고침도 시작하지 않는다.
  if (loginStatus !== "logged-in") {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
