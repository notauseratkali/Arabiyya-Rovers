import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

# Add handleLogout
target_admin = """  const toggleAdmin = () => {"""

replacement_admin = """  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
  };

  const toggleAdmin = () => {"""

code = code.replace(target_admin, replacement_admin)

# Add to Sidebar
target_sidebar = """        portalName={portalName}
        portalTagline={portalTagline}
      />"""

replacement_sidebar = """        portalName={portalName}
        portalTagline={portalTagline}
        onLogout={handleLogout}
      />"""

code = code.replace(target_sidebar, replacement_sidebar)

with open('src/App.tsx', 'w') as f:
    f.write(code)
