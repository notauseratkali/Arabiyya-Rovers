import os
import re

with open('src/components/Dashboard.tsx', 'r') as f:
    code = f.read()

# Fix space-y-8 to space-y-6 for the wrapper
code = code.replace(
    '<div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">',
    '<div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">'
)

code = code.replace(
    '<div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">',
    '<div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">'
)

# Remove the extra save button from the bottom of the second block (which I accidentally left)
extra_button = """            <button
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
              Save All Settings
            </button>
          </div>
        </div>

        {/* Edit Council Role Modal */}"""

extra_button_replacement = """          </div>
        </div>

        {/* Edit Council Role Modal */}"""

code = code.replace(extra_button, extra_button_replacement)

# Make sure we show "Settings Saved" above the first button
first_save_btn_target = """          <div className="pt-6 flex justify-end">
            <button
              id="save-all-settings-btn\""""

first_save_btn_replacement = """          <div className="pt-6 flex justify-end items-center">
            {combinedSavedSuccess && (
              <div className="mr-4 text-emerald-600 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4" />
                Settings Saved!
              </div>
            )}
            <button
              id="save-all-settings-btn\""""

code = code.replace(first_save_btn_target, first_save_btn_replacement)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(code)
