import os
import re

files_to_clean = [
    'src/components/RecordsPage.tsx',
    'src/components/EventsPage.tsx',
    'src/components/MediaPage.tsx',
    'src/components/FinancePage.tsx',
    'src/components/GovernancePage.tsx',
    'src/components/ProgressPage.tsx',
    'src/components/CoursesPage.tsx'
]

for filename in files_to_clean:
    with open(filename, 'r') as f:
        content = f.read()
    
    # Remove the fallback condition
    content = re.sub(r'\) \|\| \(!pagePermissions\?\.some\(p => p\.memberId\?\.toLowerCase\(\) === currentRole\?\.toLowerCase\(\)( \|\| p\.memberName\?\.toLowerCase\(\) === currentRole\?\.toLowerCase\(\))?\)\s*&&\s*DEFAULT_ROLE_PERMISSIONS\[currentRole\]\?\.includes\(\'[^\']+\'\)\)', '', content)
    
    with open(filename, 'w') as f:
        f.write(content)

