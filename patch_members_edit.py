import os

with open('src/components/MembersPage.tsx', 'r') as f:
    code = f.read()

# Add updateMember to import
code = code.replace("import { createMember, deleteMember, subscribeToMembers }", "import { createMember, deleteMember, updateMember, subscribeToMembers }")

# Patch handleSaveEditedMember
old_fn = """  const handleSaveEditedMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim()) return;

    const updated = members.map(m => {
      if (m.id === editingMember.id) {
        return {
          ...m,
          name: editName.trim(),
          role: editRole.trim(),
          patrol: editPatrol,
          email: editEmail.trim(),
          phone: editPhone.trim(),
          badgeRank: editBadge.trim(),
          status: editStatus
        };
      }
      return m;
    });

    setMembers(updated);
    try {
      localStorage.setItem('koshaaru_portal_members_v5', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    setIsEditModalOpen(false);
    setEditingMember(null);
  };"""

new_fn = """  const handleSaveEditedMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim()) return;

    const dataToUpdate = {
      name: editName.trim(),
      role: editRole.trim(),
      patrol: editPatrol,
      email: editEmail.trim(),
      phone: editPhone.trim(),
      badgeRank: editBadge.trim(),
      status: editStatus
    };

    try {
      await updateMember(editingMember.id, dataToUpdate);
    } catch (e) {
      console.error('Failed to update member:', e);
    }

    setIsEditModalOpen(false);
    setEditingMember(null);
  };"""

code = code.replace(old_fn, new_fn)

with open('src/components/MembersPage.tsx', 'w') as f:
    f.write(code)
