import os

with open('src/components/Dashboard.tsx', 'r') as f:
    code = f.read()

code = code.replace(
    """            <button
              id="quick-settings-btn"
              onClick={() => onNavigateTo('settings')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>""",
    """            {isAdmin && (
              <button
                id="quick-settings-btn"
                onClick={() => onNavigateTo('settings')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            )}"""
)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(code)
