import re

with open('src/components/MembersPage.tsx', 'r') as f:
    code = f.read()

target = "import { createMember, updateMember } from '../services/membersService';"
replacement = "import { createMember, updateMember, subscribeToMembers, deleteMember } from '../services/membersService';"
code = code.replace(target, replacement)

with open('src/components/MembersPage.tsx', 'w') as f:
    f.write(code)
