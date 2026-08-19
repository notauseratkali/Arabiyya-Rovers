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
    
    # We will remove the error fallback bodies for onSnapshot that sets dummy data.
    # We can match `(error) => { ... }` where it sets dummy data.
    
    # Generic replacement: find `, (error) => { ... console.warn('Fallback to local state ... }`
    content = re.sub(r',\s*\(error\)\s*=>\s*\{[\s\S]*?console\.warn\(\'Fallback to local state[^\n]*\n[\s\S]*?set[A-Z][a-zA-Z]+\(\[[\s\S]*?\]\);?\n\s*\}\)', ')', content)
    
    # Sometimes it sets loading to false as well, so let's use a more robust regex for the onSnapshot fallback.
    content = re.sub(r',\s*\(error\)\s*=>\s*\{[^}]*console\.warn\(\'Fallback to local state[^\n]*\n[\s\S]*?(?=\}\);\n)\}\)', ')', content)
    
    # Alternative robust approach:
    # Just remove any `(error) => { console.warn('Fallback ...'); ... }` entirely.
    content = re.sub(r',\s*\(error\)\s*=>\s*\{\s*console\.warn\(\'Fallback to local state[^\n]*\n(?:[^{}]*|\{[^{}]*\})*\s*\}\)', ')', content)

    with open(filename, 'w') as f:
        f.write(content)

