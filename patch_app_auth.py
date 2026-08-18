import os

with open('src/App.tsx', 'r') as f:
    code = f.read()

# Add imports
imports = """import { Login } from './components/Login';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import app from './firebase';

const auth = getAuth(app);
"""

code = code.replace("const STORAGE_KEY = 'koshaaru_portal_rover_notes_v1';", imports + "\nconst STORAGE_KEY = 'koshaaru_portal_rover_notes_v1';")

# Add auth state
auth_state = """  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);
"""

code = code.replace("  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');", auth_state + "\n  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');")

# Add Login check
login_check = """
  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#800020] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return <Login onLoginSuccess={() => {}} portalName={portalName} portalTagline={portalTagline} />;
  }
"""

code = code.replace("  const draftsCount = notes.filter((n) => n.status === 'draft').length;", "  const draftsCount = notes.filter((n) => n.status === 'draft').length;\n" + login_check)

with open('src/App.tsx', 'w') as f:
    f.write(code)
