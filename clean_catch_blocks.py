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
    
    # We will look for catch blocks that look like this:
    # catch (err) {
    #   setTransactions(prev => [{ id: Date.now().toString(), ...nextTx } as Transaction, ...prev]);
    #   setIsAddTxOpen(false);
    #   ...
    # }
    # and replace with:
    # catch (err) {
    #   console.error("Failed to perform action", err);
    # }
    
    # Let's replace any `catch (err) { ... setSomething(...prev...)... }`
    content = re.sub(r'catch \([^)]+\) \{\s*set[A-Z][a-zA-Z]+\(prev =>[^}]+\}\s*\}', 'catch (err) { console.error("Error", err); alert("Action failed."); }', content)
    
    # Also handle some non-prev setState calls in catch blocks if they exist:
    content = re.sub(r'catch \([^)]+\) \{\s*set[A-Z][a-zA-Z]+\(\[...prev[^}]+\}\s*\}', 'catch (err) { console.error("Error", err); alert("Action failed."); }', content)

    # In RecordsPage
    content = re.sub(r'catch \([^)]+\) \{\s*const newRec[^}]+setRecords[^}]+setIsSubmitOpen[^}]+\}', 'catch (err) { console.error("Error", err); alert("Action failed."); }', content)

    # And in EventsPage
    content = re.sub(r'catch \([^)]+\) \{\s*setEvents\(prev[^}]+setIsCreateOpen[^}]+\}', 'catch (err) { console.error("Error", err); alert("Action failed."); }', content)

    # Let's just use a more generic replacement. Look for `catch (err)` that contains a `set...` with an array spread `...prev` or `...` to simulate local update
    content = re.sub(r'catch \([^)]+\) \{[^{}]*set[a-zA-Z]+\([^;]*\.\.\.[^;]*\)[^{}]*\}', 'catch (err) { console.error("Error", err); alert("Action failed."); }', content)


    with open(filename, 'w') as f:
        f.write(content)

