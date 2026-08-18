import os

with open('src/components/Header.tsx', 'r') as f:
    code = f.read()

target = """        {/* Rover Network Tag */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0f1e36] text-white">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
          Arabiyya Rover Network
        </div>"""

code = code.replace(target, "")

with open('src/components/Header.tsx', 'w') as f:
    f.write(code)
