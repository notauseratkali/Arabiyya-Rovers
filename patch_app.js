const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  const draftsCount = notes.filter((n) => n.status === 'draft').length;`;

const replacement1 = `  const toggleAdmin = () => {
    setIsAdmin((prev) => {
      const next = !prev;
      if (!next && currentSection === 'settings') {
        setCurrentSection('dashboard');
      }
      return next;
    });
  };

  const draftsCount = notes.filter((n) => n.status === 'draft').length;`;

code = code.replace(target1, replacement1);

const target2 = `<Sidebar
        currentSection={currentSection}
        onSelectSection={handleSelectSection}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        notesCount={notes.length}
        draftsCount={draftsCount}
        portalName={portalName}
        portalTagline={portalTagline}
      />`;

const replacement2 = `<Sidebar
        currentSection={currentSection}
        onSelectSection={handleSelectSection}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        isAdmin={isAdmin}
        onToggleAdmin={toggleAdmin}
        notesCount={notes.length}
        draftsCount={draftsCount}
        portalName={portalName}
        portalTagline={portalTagline}
      />`;

code = code.replace(target2, replacement2);

const target3 = `<MembersPage />`;
const replacement3 = `<MembersPage isAdmin={isAdmin} />`;
code = code.replace(target3, replacement3);

const target4 = `<Dashboard
              currentSection={currentSection}
              onNavigateTo={handleSelectSection}
              notes={notes}
              onCreateNote={handleCreateNote}
              onEditNote={handleEditNote}
              portalName={portalName}
              portalTagline={portalTagline}
              onUpdatePortalName={handleUpdatePortalName}
              onUpdatePortalTagline={handleUpdatePortalTagline}
            />`;

const replacement4 = `<Dashboard
              currentSection={currentSection}
              onNavigateTo={handleSelectSection}
              notes={notes}
              onCreateNote={handleCreateNote}
              onEditNote={handleEditNote}
              portalName={portalName}
              portalTagline={portalTagline}
              onUpdatePortalName={handleUpdatePortalName}
              onUpdatePortalTagline={handleUpdatePortalTagline}
              isAdmin={isAdmin}
            />`;

code = code.replace(target4, replacement4);

fs.writeFileSync('src/App.tsx', code);
