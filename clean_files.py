import os
import re

files_to_clean = [
    'src/components/RecordsPage.tsx',
    'src/components/EventsPage.tsx',
    'src/components/MediaPage.tsx',
    'src/components/FinancePage.tsx',
    'src/components/GovernancePage.tsx',
    'src/components/ProgressPage.tsx',
    'src/components/CoursesPage.tsx',
    'src/components/Dashboard.tsx'
]

for filename in files_to_clean:
    with open(filename, 'r') as f:
        content = f.read()
    
    # 1. Remove DEFAULT_ROLE_PERMISSIONS
    content = re.sub(r'const DEFAULT_ROLE_PERMISSIONS: Record<string, string\[\]> = \{[\s\S]*?\};\n+', '', content)

    # 2. Change simulatedRole to currentRole
    # Wait, in some files it might be userRole vs currentRole.
    # Let's replace simulatedRole state declaration:
    content = re.sub(r'// Active simulated role for testing\n\s*const \[simulatedRole, setSimulatedRole\] = useState<string>\(currentRole\);\n*', '', content)
    
    # Let's also remove any other simulatedRole state
    content = re.sub(r'const \[simulatedRole, setSimulatedRole\] = useState<string>\(currentRole\);\n*', '', content)
    
    # In CoursesPage it's `const simulatedRole = currentUser?.role || '';`
    content = re.sub(r'const simulatedRole = currentUser\?.role \|\| \'\';\n*', "const currentRole = currentUser?.role || '';\n", content)

    # Replace simulatedRole with currentRole in the rest of the file
    content = content.replace('simulatedRole?.toLowerCase()', 'currentRole?.toLowerCase()')
    content = content.replace('simulatedRole.toLowerCase()', 'currentRole?.toLowerCase()')
    content = content.replace('[simulatedRole]', '[currentRole]')
    content = content.replace('simulatedRole', 'currentRole')

    # Remove fallback to DEFAULT_ROLE_PERMISSIONS in `hasRolePermission`
    content = re.sub(r'\|\| \(!pagePermissions\?\.some\([^)]+\)\s*&&\s*DEFAULT_ROLE_PERMISSIONS\[currentRole\]\?\.includes\([^)]+\)\)', '', content)
    
    # Also for CoursesPage progress permission
    content = re.sub(r'\|\| \(!pagePermissions\?\.some\([^)]+\)\s*&&\s*DEFAULT_ROLE_PERMISSIONS\[currentRole\]\?\.includes\([^)]+\)\)', '', content)

    # Remove simulatedRolesList
    content = re.sub(r'const simulatedRolesList = \[[\s\S]*?\];\n+', '', content)

    # Remove Simulator Selector block
    content = re.sub(r'\{?/\* Simulator Selector \*/\}?\s*<div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shrink-0">[\s\S]*?</select>\s*</div>', '', content)

    # Remove Impersonate button
    content = re.sub(r'<button\s*onClick=\{[^}]*\}\s*className="px-3.5 py-1.5 bg-\[#[a-f0-9]+\] hover:bg-\[#[a-f0-9]+\] text-white rounded-xl text-\[11px\] font-bold transition-colors cursor-pointer shrink-0"\s*>\s*Impersonate [^<]*\s*</button>', '', content)

    # For Dashboard.tsx specifically, remove role testing state
    if 'Dashboard.tsx' in filename:
        content = re.sub(r'const \[simulatedRole, setSimulatedRole\] = useState<string>\(currentUser\?\.role \|\| \'Normal Rover Member\'\);\n*', '', content)
        content = content.replace('simulatedRole', 'currentRole')
        content = re.sub(r'\|\| \(DEFAULT_ROLE_PERMISSIONS\[currentRole\] \|\| \[\]\)', '', content)
        content = re.sub(r'const \[currentRole, setSimulatedRole\] = useState<string>\(currentUser\?\.role \|\| \'Normal Rover Member\'\);\n*', "const currentRole = currentUser?.role || 'Normal Rover Member';\n", content)

    with open(filename, 'w') as f:
        f.write(content)

