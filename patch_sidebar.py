import re

with open('src/components/Sidebar.tsx', 'r') as f:
    code = f.read()

# Add onLogout to interface
target_interface = """  portalName?: string;
  portalTagline?: string;
}"""

replacement_interface = """  portalName?: string;
  portalTagline?: string;
  onLogout?: () => void;
}"""

code = code.replace(target_interface, replacement_interface)

# Add onLogout to destructured props
target_props = """  portalName = 'Koshaaru Portal',
  portalTagline = 'Arabiyya Beyond Limits'
}) => {"""

replacement_props = """  portalName = 'Koshaaru Portal',
  portalTagline = 'Arabiyya Beyond Limits',
  onLogout
}) => {"""

code = code.replace(target_props, replacement_props)

# Replace onClick
target_click = """            onClick={() => signOut(auth)}"""
replacement_click = """            onClick={() => onLogout ? onLogout() : signOut(auth)}"""
code = code.replace(target_click, replacement_click)

with open('src/components/Sidebar.tsx', 'w') as f:
    f.write(code)
