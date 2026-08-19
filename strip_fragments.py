import os
import re

files_to_clean = [
    'src/components/FinancePage.tsx',
    'src/components/EventsPage.tsx',
    'src/components/GovernancePage.tsx',
    'src/components/RecordsPage.tsx',
    'src/components/ProgressPage.tsx',
    'src/components/MediaPage.tsx'
]

for filename in files_to_clean:
    if not os.path.exists(filename): continue
    
    with open(filename, 'r') as f:
        content = f.read()
    
    # Let's remove ANY orphaned `<>` OR `</>` which is at the root level of the return statement.
    content = content.replace('      <>', '')
    content = content.replace('        <>', '')
    content = content.replace('      </>', '')
    content = content.replace('        </>', '')
    
    with open(filename, 'w') as f:
        f.write(content)

