import os
import re

files_to_clean = [
    'src/services/councilRolesService.ts',
    'src/components/RecordsPage.tsx',
    'src/components/EventsPage.tsx',
    'src/components/MediaPage.tsx',
    'src/components/ProgressPage.tsx'
]

for filename in files_to_clean:
    if not os.path.exists(filename): continue
    
    with open(filename, 'r') as f:
        content = f.read()
    
    content = re.sub(r'console\.warn\(\'Fallback[^\']+\',\s*err(or)?\);', 'console.error("Firebase sync error", err);', content)
    
    with open(filename, 'w') as f:
        f.write(content)

