import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicLanding } from './components/PublicLanding';
import { ProtectedWorkspace } from './components/ProtectedWorkspace';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FEFDE6] flex items-center justify-center p-6 font-mono text-black">
        <div className="p-6 bg-white border-[2.5px] border-black shadow-neo flex items-center gap-3">
          <div className="w-8 h-8 bg-black text-[#FCE519] flex items-center justify-center font-bold text-sm">
            ND
          </div>
          <span className="font-bold text-sm">Validating campus authentication session...</span>
        </div>
      </div>
    );
  }

  // Route protection: Unauthenticated visitors must log in first
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
