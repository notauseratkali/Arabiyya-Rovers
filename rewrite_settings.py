import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# We want to replace the `if (currentSection === 'settings') { return (...) }` block.
# Let's extract everything before it and everything after it.

parts = content.split("  if (currentSection === 'settings') {")
before = parts[0]
after = parts[1].split("  const recentNotes = notes.slice(0, 3);")[1]

settings_code = """  if (currentSection === 'settings') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-[#800020]/10 text-[#800020] border border-[#800020]/20 mb-2">
                <Settings className="w-3.5 h-3.5" />
                <span>Portal Configuration</span>
              </div>
              <h1 className="text-2xl font-bold text-[#0f1e36]">
                Portal Settings
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Customize general portal settings.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <h3 className="text-sm font-bold text-[#0f1e36]">
                Portal Name
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Change the main title of this portal. Changes apply instantly across the sidebar, header, and dashboard.
              </p>
            </div>
            <div className="pt-1">
              <input
                id="portal-name-input"
                type="text"
                value={tempPortalName}
                disabled={!isAdmin}
                onChange={(e) => setTempPortalName(e.target.value)}
                placeholder="Enter portal name..."
                className={`w-full text-sm px-4 py-2.5 rounded-xl border transition-all ${
                  isAdmin 
                    ? 'bg-white border-slate-300 text-slate-900 focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af]' 
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#0f1e36]">
                Portal Tagline / Subtitle
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Change the subtitle or tagline displayed below the portal title and in the sidebar.
              </p>
            </div>
            <div className="pt-1">
              <input
                id="portal-tagline-input"
                type="text"
                value={tempPortalTagline}
                disabled={!isAdmin}
                onChange={(e) => setTempPortalTagline(e.target.value)}
                placeholder="Enter portal tagline..."
                className={`w-full text-sm px-4 py-2.5 rounded-xl border transition-all ${
                  isAdmin 
                    ? 'bg-white border-slate-300 text-slate-900 focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af]' 
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end items-center border-t border-slate-100">
            {combinedSavedSuccess && (
              <div className="mr-4 text-emerald-600 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4" />
                Settings Saved!
              </div>
            )}
            <button
              id="save-all-settings-btn"
              type="button"
              disabled={!isAdmin}
              onClick={handleSaveAllSettings}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isAdmin
                  ? 'bg-[#800020] hover:bg-[#6b1426] text-white shadow-xs' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Save Portal Settings
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-xl font-bold text-[#0f1e36] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#800020]" />
                Roles of Council
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Create specific council member roles (e.g. Council Secretary, Treasurer) and assign rover members to each role.
              </p>
            </div>
            {isAdmin && !isAddingRole && (
              <button
                type="button"
                onClick={() => setIsAddingRole(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f1e36] hover:bg-[#172d4d] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Assign New Council Role
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {councilRoles.map((role) => (
              <div 
                key={role.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#800020]/10 text-[#800020] font-bold text-xs flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0f1e36]">
                      {role.roleName}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Assigned Rover: <strong className="text-slate-800">{role.assignedRoverName}</strong> ({role.patrol})
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(role)}
                      className="p-1.5 text-slate-400 hover:text-[#1e40af] rounded-lg hover:bg-white transition-colors cursor-pointer"
                      title="Edit Role Assignment"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveCouncilRole(role.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                      title="Remove Role Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {isAdmin && isAddingRole && (
            <div className="bg-slate-50/70 border border-dashed border-slate-300 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
              <h4 className="text-xs font-bold text-slate-700">Assign New Council Role</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role Title</label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g. Gear Master / Event Coordinator"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select Rover Member</label>
                  <select
                    value={newSelectedRover}
                    onChange={(e) => setNewSelectedRover(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  >
                    {ROVER_MEMBERS_LIST.map((rover, idx) => (
                      <option key={idx} value={rover}>{rover}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingRole(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 mr-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newRoleName.trim()}
                  onClick={handleAddCouncilRole}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    newRoleName.trim()
                      ? 'bg-[#0f1e36] hover:bg-[#172d4d] text-white shadow-xs'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create & Assign Role
                </button>
              </div>
            </div>
          )}

          {!isAdmin && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl font-medium mt-4">
              Note: You are currently in <strong>Member View</strong>. Switch to <strong>Admin Mode</strong> in the top-right to edit portal parameters and assign council roles.
            </p>
          )}

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              id="back-to-dashboard-btn"
              onClick={() => onNavigateTo('dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>

        {editingRole && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-[#0f1e36]">
                  Edit Council Role Assignment
                </h3>
                <button
                  onClick={() => setEditingRole(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveEditedRole} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title</label>
                  <input
                    type="text"
                    required
                    value={editRoleName}
                    onChange={(e) => setEditRoleName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Rover Member</label>
                  <select
                    value={editSelectedRover}
                    onChange={(e) => setEditSelectedRover(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af] bg-white"
                  >
                    {ROVER_MEMBERS_LIST.map((rover, idx) => (
                      <option key={idx} value={rover}>{rover}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#800020] hover:bg-[#6b1426] transition-colors shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

"""

new_content = before + settings_code + "  const recentNotes = notes.slice(0, 3);" + after

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(new_content)

