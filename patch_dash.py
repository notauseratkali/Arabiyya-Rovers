import os

with open('src/components/Dashboard.tsx', 'r') as f:
    code = f.read()

code = code.replace(
    "  onUpdatePortalTagline: (tagline: string) => void;\n  onNavigateTo: (section: NavSection) => void;\n}",
    "  onUpdatePortalTagline: (tagline: string) => void;\n  onNavigateTo: (section: NavSection) => void;\n  isAdmin: boolean;\n}"
)

code = code.replace(
    "  onUpdatePortalTagline,\n  onNavigateTo,\n}) => {\n  const [isAdmin, setIsAdmin] = useState<boolean>(true);",
    "  onUpdatePortalTagline,\n  onNavigateTo,\n  isAdmin,\n}) => {"
)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(code)
