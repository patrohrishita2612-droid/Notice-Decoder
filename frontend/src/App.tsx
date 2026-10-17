import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicLanding } from './components/PublicLanding';
import { ProtectedWorkspace } from './components/ProtectedWorkspace';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

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

  // Route protection: Unauthenticated visitors see public landing page with login portal
  if (!isAuthenticated) {
    return <PublicLanding />;
  }

  // Authenticated workspace
  return <ProtectedWorkspace />;
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
