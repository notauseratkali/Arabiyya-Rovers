import os
import re

files_to_clean = [
    'src/components/FinancePage.tsx',
    'src/components/EventsPage.tsx',
    'src/components/GovernancePage.tsx',
    'src/components/RecordsPage.tsx',
    'src/components/ProgressPage.tsx',
    'src/components/MediaPage.tsx',
    'src/components/CoursesPage.tsx'
]

for filename in files_to_clean:
    if not os.path.exists(filename): continue
    
    with open(filename, 'r') as f:
        content = f.read()
    
    # Looking for a dangling semi-colon because of my previous replace:
    # `const hasRolePermission = pagePermissions?.some(p => \n    p.memberId?.toLowerCase() === currentRole?.toLowerCase() && p.grantedPages.includes('...')\n  ;`
    content = re.sub(r'(\.includes\(\'[^\']+\'\)\s*)\n\s*;', r'\1\n  );', content)
    # also for CoursesPage which might have a slightly different includes
    content = re.sub(r'(\.includes\(\'[^\']+\'\)\s*)\n\s*;', r'\1\n  );', content)
    
    with open(filename, 'w') as f:
        f.write(content)

