import os
import re

with open('src/components/Dashboard.tsx', 'r') as f:
    code = f.read()

# Replace the toggle div with just an empty string
pattern = r"\{/\* Portal Admin Mode Toggle \*/\}.*?</button>\s*</div>"
code = re.sub(pattern, "", code, flags=re.DOTALL)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(code)
