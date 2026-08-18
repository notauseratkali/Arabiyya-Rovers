import os

with open('src/components/Dashboard.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if "Return to Dashboard" in line:
        pass
    new_lines.append(line)

