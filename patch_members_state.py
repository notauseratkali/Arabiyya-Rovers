import os

with open('src/components/MembersPage.tsx', 'r') as f:
    code = f.read()

target = "  const [newStatus, setNewStatus] = useState<'Active' | 'On Leave' | 'Training'>('Active');"
replacement = "  const [newStatus, setNewStatus] = useState<'Active' | 'On Leave' | 'Training'>('Active');\n  const [newPassword, setNewPassword] = useState('');"

code = code.replace(target, replacement)

with open('src/components/MembersPage.tsx', 'w') as f:
    f.write(code)
