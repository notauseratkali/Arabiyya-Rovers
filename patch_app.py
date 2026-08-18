import re
with open('src/App.tsx', 'r') as f:
    code = f.read()

# Replace the authentication state logic
target_auth = """  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);"""

replacement_auth = """  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (currentUser.email === 'nazihnafiz@gmail.com') {
          setUser(currentUser);
          setIsAdmin(true);
        } else {
          auth.signOut();
        }
      } else {
        setUser((prev: any) => {
          if (prev && prev.email === 'nazihnafiz@gmail.com') return null;
          return prev;
        });
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);"""

code = code.replace(target_auth, replacement_auth)

# Login logic
target_login = """  if (!user) {
    return <Login onLoginSuccess={() => {}} portalName={portalName} portalTagline={portalTagline} />;
  }"""

replacement_login = """  if (!user) {
    return (
      <Login 
        onLoginSuccess={(memberData) => {
          if (memberData) {
            setUser(memberData);
            setIsAdmin(false);
          }
        }} 
        portalName={portalName} 
        portalTagline={portalTagline} 
      />
    );
  }

  // Handle member forced password change
  if (user && !user.email && user.password === '123456') {
    return <ChangePassword member={user} onComplete={(updatedMember) => setUser(updatedMember)} />;
  }"""

code = code.replace(target_login, replacement_login)

# Add imports for ChangePassword
import_target = "import { Login } from './components/Login';"
import_replacement = "import { Login } from './components/Login';\nimport { ChangePassword } from './components/ChangePassword';"
code = code.replace(import_target, import_replacement)

with open('src/App.tsx', 'w') as f:
    f.write(code)
