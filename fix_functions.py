import os
import re

files_to_clean = [
    'src/components/FinancePage.tsx',
    'src/components/EventsPage.tsx',
    'src/components/GovernancePage.tsx',
    'src/components/RecordsPage.tsx',
    'src/components/ProgressPage.tsx',
    'src/components/MediaPage.tsx'
]

for filename in files_to_clean:
    if not os.path.exists(filename): continue
    
    with open(filename, 'r') as f:
        content = f.read()
    
    # We look for a missing bracket before the NEXT const function declaration
    # `} catch (err) { ... };\n\n  const handle...`
    # That `;` at the end of the catch block is actually the semi-colon of the function block!
    # Wait, the regex `catch (err) { console.error("Error", err); alert("Action failed."); };` has a `;`.
    # Let's replace `};` with `}\n  };` for those specific lines!
    content = re.sub(r'\} catch \(err\) \{ console\.error\("Error", err\); alert\("Action failed\."\); \};\n\s*const', r'} catch (err) { console.error("Error", err); alert("Action failed."); }\n  };\n\n  const', content)
    
    with open(filename, 'w') as f:
        f.write(content)

