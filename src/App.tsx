import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { SearchModal } from './components/common/SearchModal';
import { GlobalToast } from './components/common/GlobalToast';
import { AuthModal } from './components/common/AuthModal';

// HomeView is loaded eagerly for instant FCP and LCP
import { HomeView } from './components/home/HomeView';

// Route-level code-splitting for secondary/heavy screens
const BrowseView = lazy(() => import('./components/browse/BrowseView').then(m => ({ default: m.BrowseView })));
const AnimeDetailView = lazy(() => import('./components/detail/AnimeDetailView').then(m => ({ default: m.AnimeDetailView })));
const WatchView = lazy(() => import('./components/watch/WatchView').then(m => ({ default: m.WatchView })));

// Schedule & Favorites dedicated views
const ScheduleView = lazy(() => import('./components/schedule/ScheduleView').then(m => ({ default: m.ScheduleView })));
const FavoritesView = lazy(() => import('./components/profile/FavoritesView').then(m => ({ default: m.FavoritesView })));

// Manga views per Version 80
const MangaView = lazy(() => import('./components/manga/MangaView').then(m => ({ default: m.MangaView })));
const MangaDetailView = lazy(() => import('./components/manga/MangaDetailView').then(m => ({ default: m.MangaDetailView })));
const MangaReaderView = lazy(() => import('./components/manga/MangaReaderView').then(m => ({ default: m.MangaReaderView })));

// Profile sub-views
const ProfileShell = lazy(() => import('./components/profile/ProfileShell').then(m => ({ default: m.ProfileShell })));
const EditProfileView = lazy(() => import('./components/profile/EditProfileView').then(m => ({ default: m.EditProfileView })));
const ContinueWatchingView = lazy(() => import('./components/profile/ContinueWatchingView').then(m => ({ default: m.ContinueWatchingView })));
const SettingsView = lazy(() => import('./components/profile/SettingsView').then(m => ({ default: m.SettingsView })));
const NotificationsView = lazy(() => import('./components/profile/NotificationsView').then(m => ({ default: m.NotificationsView })));
const ConnectionsView = lazy(() => import('./components/profile/ConnectionsView').then(m => ({ default: m.ConnectionsView })));

// Authentication pages
const SignInPage = lazy(() => import('./components/auth/SignInPage').then(m => ({ default: m.SignInPage })));
const CreateAccountPage = lazy(() => import('./components/auth/CreateAccountPage').then(m => ({ default: m.CreateAccountPage })));

// Admin Console page
const AdminDashboardView = lazy(() => import('./components/admin/AdminDashboardView').then(m => ({ default: m.AdminDashboardView })));

const MainContent: React.FC = () => {
  const { nav } = useApp();

  const isReader = nav.currentRoute === 'reader';
  const isAdmin = nav.currentRoute === 'admin';

  const renderCurrentView = () => {
    switch (nav.currentRoute) {
      case 'home':
        return <HomeView />;

      case 'manga':
        return <MangaView />;

      case 'manga-detail':
        return <MangaDetailView mangaId={nav.selectedMangaId || 30001} />;

      case 'reader':
        return (
          <MangaReaderView
            mangaId={nav.selectedMangaId || 30001}
            initialChapterNumber={nav.selectedChapterNumber || 1}
          />
        );

      case 'browse':
        return <BrowseView />;

      case 'schedule':
        return <ScheduleView />;

      case 'favorites':
        return <FavoritesView />;

      case 'detail':
        return <AnimeDetailView animeId={nav.selectedAnimeId || 110349} />;

      case 'watch':
        return (
          <WatchView
            animeId={nav.selectedAnimeId || 110349}
            initialEpisodeNumber={nav.selectedEpisodeNumber || 1}
          />
        );

      case 'profile':
        return (
          <ProfileShell>
            {nav.profileTab === 'profile' && <EditProfileView />}
            {nav.profileTab === 'continue' && <ContinueWatchingView />}
            {nav.profileTab === 'favorites' && <FavoritesView />}
            {nav.profileTab === 'notifications' && <NotificationsView />}
            {nav.profileTab === 'connections' && <ConnectionsView />}
            {nav.profileTab === 'settings' && <SettingsView />}
          </ProfileShell>
        );

      case 'signin':
        return <SignInPage />;

      case 'signup':
        return <CreateAccountPage />;

      case 'admin':
        return <AdminDashboardView />;

      default:
        return <HomeView />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-[#f472b6] selection:text-black">
      {!isReader && !isAdmin && <Navbar />}
      <div className="flex-1 w-full">
        <Suspense
          fallback={
            <div className="min-h-[70vh] flex items-center justify-center pt-20">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin" />
            </div>
          }
        >
          {renderCurrentView()}
        </Suspense>
      </div>
      {!isReader && !isAdmin && <Footer />}
      <SearchModal />
      <AuthModal />
      <GlobalToast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
