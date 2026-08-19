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
    
    # If file contains `<>` but doesn't have `</>`, we need to either remove `<>` or add `</>`.
    if '<>' in content and '</>' not in content:
        # Instead of adding </>, let's just remove the orphaned `<>` entirely.
        content = re.sub(r'^\s*<>\s*$', '', content, flags=re.MULTILINE)
        
        # We need to make sure we also removed `</>` if we removed `<>`. Wait, we just checked `</>` is NOT in content.
        # But wait, `<>` might be `<>\n`
        content = content.replace('<>', '')
    
    with open(filename, 'w') as f:
        f.write(content)

