import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicLanding } from './components/PublicLanding';
import { ProtectedWorkspace } from './components/ProtectedWorkspace';

function AppContent() {
  const { isAuthenticated, isLoading, intendedDestination, setIntendedDestination } = useAuth();

  // Current route parsed from URL hash or pathname
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const hash = window.location.hash.replace('#/', '').toLowerCase();
    if (hash) return hash;
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    return path || 'landing';
  });

  const [redirectNotice, setRedirectNotice] = useState<string>('');

  // Handle URL changes & back/forward navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.replace('#/', '').toLowerCase();
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      const route = hash || path || (isAuthenticated ? 'calendar' : 'landing');
      setCurrentRoute(route);
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [isAuthenticated]);

  // Route protection interceptor
  useEffect(() => {
    if (isLoading) return;

    const privateRoutes = ['calendar', 'notices', 'deadlines', 'timetable', 'dashboard', 'workspace'];
    const isPrivate = privateRoutes.includes(currentRoute);

    if (!isAuthenticated && isPrivate) {
      // Intercept direct unauthorized URL access
      setIntendedDestination(currentRoute);
      setRedirectNotice(`Authentication required to access /${currentRoute}. Please sign in to view your private academic data.`);
      window.location.hash = '#/login';
    } else if (isAuthenticated && (currentRoute === 'login' || currentRoute === 'landing' || currentRoute === 'register')) {
      // Redirect authenticated user to destination or calendar
      const target = intendedDestination || 'calendar';
      window.location.hash = `#/${target}`;
      setCurrentRoute(target);
    }
  }, [isAuthenticated, isLoading, currentRoute, intendedDestination, setIntendedDestination]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FEFDE6] flex items-center justify-center p-6 font-mono text-[#172D50]">
        <div className="p-6 bg-[#FAF8DB] border border-[#E8E5BA] rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#172D50] text-[#F2EE98] flex items-center justify-center font-bold text-sm">
            ND
          </div>
          <span className="font-medium text-xs">Validating campus authentication session...</span>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated visitors: strictly restricted to Public Landing & Login
  if (!isAuthenticated) {
    return (
      <PublicLanding 
        initialRedirectReason={redirectNotice}
        onLoginSuccess={(targetRoute) => {
          const dest = targetRoute || 'calendar';
          window.location.hash = `#/${dest}`;
          setCurrentRoute(dest);
          setRedirectNotice('');
        }}
      />
    );
  }

  // 2. Authenticated users: full access to protected academic workspace
  const tab = ['calendar', 'notices', 'deadlines'].includes(currentRoute)
    ? (currentRoute as 'calendar' | 'notices' | 'deadlines')
    : 'calendar';

  return <ProtectedWorkspace initialTab={tab} />;
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
