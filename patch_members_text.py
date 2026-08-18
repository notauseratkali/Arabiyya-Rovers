import os
import re

with open('src/components/MembersPage.tsx', 'r') as f:
    code = f.read()

code = code.replace("<span>Arabiyya Rover Directory</span>", "<span>Arabiyya Leaders and Rovers Directory</span>")
code = code.replace("Crew & Leadership Directory", "Arabiyya Leaders and Rovers Directory")

pattern = r"<p className=\"text-sm text-slate-500 mt-1\">\s*Manage normal rover members, council members, and Rover Advisors/Leaders. Editing and deletion is restricted to council members, leaders, and admin.\s*</p>"
code = re.sub(pattern, "", code, flags=re.DOTALL)

with open('src/components/MembersPage.tsx', 'w') as f:
    f.write(code)
