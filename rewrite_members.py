import re

with open('src/components/MembersPage.tsx', 'r') as f:
    code = f.read()

# Add imports for createMember, updateMember
target_imports = "import { Search, Filter, Plus, Shield, ShieldAlert, BadgeInfo, Pencil, Trash2, X } from 'lucide-react';"
replacement_imports = "import { Search, Filter, Plus, Shield, ShieldAlert, BadgeInfo, Pencil, Trash2, X } from 'lucide-react';\nimport { createMember, updateMember } from '../services/membersService';"

if "import { createMember" not in code:
    code = code.replace(target_imports, replacement_imports)

# Replace handleSaveNewMember
target_save = """  const handleSaveNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newItem: MemberItem = {
      id: 'm_' + Date.now(),
      name: newName.trim(),
      idCard: newIdCard.toUpperCase(),
      role: newRole.trim(),
      patrol: newPatrol,
      email: newEmail.trim() || 'member@arabiyyarover.org',
      phone: newPhone.trim() || '+960 700-0000',
      badgeRank: newBadge,
      status: newStatus,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    const updated = [newItem, ...members];
    setMembers(updated);
    try {
      localStorage.setItem('koshaaru_portal_members_v5', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save members:', e);
    }
    
    setNewName('');
    setNewIdCard('');
    setNewEmail('');
    setNewPhone('');
    setIsAddModalOpen(false);
  };"""

replacement_save = """  const handleSaveNewMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newItem: any = {
      id: 'm_' + Date.now(),
      name: newName.trim(),
      idCard: newIdCard.toUpperCase(),
      role: newRole.trim(),
      patrol: newPatrol,
      email: newEmail.trim() || 'member@arabiyyarover.org',
      phone: newPhone.trim() || '+960 700-0000',
      badgeRank: newBadge,
      status: newStatus,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    try {
      await createMember(newItem, newPassword);
      setNewName('');
      setNewIdCard('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('123456');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to save new member:', err);
      alert('Failed to save new member. Please try again.');
    }
  };"""

code = code.replace(target_save, replacement_save)

# Replace handleSaveEditedMember
target_edit = """  const handleSaveEditedMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim()) return;

    const updatedMembers = members.map(m => {
      if (m.id === editingMember.id) {
        return {
          ...m,
          name: editName.trim(),
          role: editRole.trim(),
          patrol: editPatrol,
          email: editEmail.trim(),
          phone: editPhone.trim(),
          badgeRank: editBadge,
          status: editStatus
        };
      }
      return m;
    });

    setMembers(updatedMembers);
    try {
      localStorage.setItem('koshaaru_portal_members_v5', JSON.stringify(updatedMembers));
    } catch (e) {
      console.error('Failed to save members:', e);
    }
    
    setEditingMember(null);
  };"""

replacement_edit = """  const handleSaveEditedMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim()) return;

    try {
      await updateMember(editingMember.id, {
        name: editName.trim(),
        role: editRole.trim(),
        patrol: editPatrol,
        email: editEmail.trim(),
        phone: editPhone.trim(),
        badgeRank: editBadge,
        status: editStatus
      });
      setEditingMember(null);
    } catch (err) {
      console.error('Failed to update member:', err);
      alert('Failed to update member. Please try again.');
    }
  };"""

code = code.replace(target_edit, replacement_edit)

with open('src/components/MembersPage.tsx', 'w') as f:
    f.write(code)
