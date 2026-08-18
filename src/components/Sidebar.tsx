import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare,
  Megaphone,
  BookOpen, 
  Settings, 
  Compass, 
  ChevronRight,
  ShieldCheck,
  X,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Scale,
  Coins,
  Award,
  Calendar,
  Camera,
  Archive
} from 'lucide-react';
import { NavSection } from '../types';
import { RoverLogo } from './RoverLogo';
import { getAuth, signOut } from 'firebase/auth';
import app from '../firebase';

const auth = getAuth(app);

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  notesCount?: number;
  draftsCount?: number;
  portalName?: string;
  portalTagline?: string;
  onLogout?: () => void;
  currentUser?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpen,
  onToggle,
  isCollapsed = false,
  onToggleCollapse,
  isAdmin,
  onToggleAdmin,
  notesCount = 0,
  draftsCount = 0,
  portalName = 'Koshaaru Portal',
  portalTagline = 'Arabiyya Beyond Limits',
  onLogout,
  currentUser
}) => {
  const isAdvisor = currentUser?.role?.toLowerCase().includes('advisor') || currentUser?.title?.toLowerCase().includes('advisor');
  const showSettings = isAdmin || isAdvisor;

  const navItems = [
    {
      id: 'dashboard' as NavSection,
      label: 'Dashboard',
      icon: LayoutDashboard,
      active: currentSection === 'dashboard',
    },
    {
      id: 'chat' as NavSection,
      label: 'Members Chat',
      icon: MessageSquare,
      active: currentSection === 'chat',
    },
    {
      id: 'announcements' as NavSection,
      label: 'Announcements',
      icon: Megaphone,
      active: currentSection === 'announcements',
    },
    {
      id: 'notebook' as NavSection,
      label: 'Notebook',
      icon: BookOpen,
      active: currentSection === 'notebook',
      badge: draftsCount > 0 ? `${draftsCount} Drafts` : `${notesCount}`,
    },
    {
      id: 'members' as NavSection,
      label: 'Members',
      icon: Users,
      active: currentSection === 'members',
    },
    {
      id: 'governance' as NavSection,
      label: 'Governance',
      icon: Scale,
      active: currentSection === 'governance',
    },
    {
      id: 'finance' as NavSection,
      label: 'Finance',
      icon: Coins,
      active: currentSection === 'finance',
    },
    {
      id: 'progress' as NavSection,
      label: 'Progress & Training',
      icon: Award,
      active: currentSection === 'progress',
    },
    {
      id: 'events' as NavSection,
      label: 'Events & Logistics',
      icon: Calendar,
      active: currentSection === 'events',
    },
    {
      id: 'media' as NavSection,
      label: 'Media & Assets',
      icon: Camera,
      active: currentSection === 'media',
    },
    {
      id: 'records' as NavSection,
      label: 'Records Archive',
      icon: Archive,
      active: currentSection === 'records',
    },
    ...(showSettings ? [{
      id: 'settings' as NavSection,
      label: 'Portal Settings',
      icon: Settings,
      active: currentSection === 'settings',
    }] : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          id="sidebar-backdrop"
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white text-slate-800 flex flex-col border-r border-slate-200 shadow-sm transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 w-72' : '-translate-x-full'
        } ${
          isCollapsed ? 'lg:w-20' : 'lg:w-72'
        }`}
      >
        {/* Portal Header / Brand */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200/90 shrink-0">
                <RoverLogo variant="color" className="w-8 h-8" />
              </div>
              
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <h1 className="text-base font-bold tracking-tight text-[#0f1e36] leading-tight truncate">
                    {portalName}
                  </h1>
                  <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                    {portalTagline}
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Collapse Button */}
            {onToggleCollapse && !isCollapsed && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            )}

            {/* Mobile close button */}
            <button
              id="close-sidebar-button"
              onClick={onToggle}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Expand Button when Collapsed */}
          {onToggleCollapse && isCollapsed && (
            <div className="hidden lg:flex justify-center mt-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1.5">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Navigation
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = item.active;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  onSelectSection(item.id);
                  if (window.innerWidth < 1024) {
                    onToggle();
                  }
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3.5 py-2.5'
                } rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1e40af] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                  <Icon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && (
                  item.badge ? (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      isSelected 
                        ? 'bg-white/20 text-white border-white/30' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  ) : isSelected ? (
                    <ChevronRight className="w-4 h-4 text-blue-200" />
                  ) : null
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer / User Profile & Status */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2.5">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div 
                className="w-9 h-9 rounded-full bg-[#800020] flex items-center justify-center font-bold text-white text-xs border border-rose-900/10 shadow-xs cursor-pointer"
                title={isAdmin ? 'Ahmed Nazih Nafiz (Administrator)' : 'Rover Crew Member'}
                onClick={onToggleAdmin}
              >
                {isAdmin ? 'AN' : 'RC'}
              </div>
              <button
                type="button"
                onClick={() => onLogout ? onLogout() : signOut(auth)}
                className="p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#800020] flex items-center justify-center font-bold text-white text-xs border border-rose-900/10 shadow-xs shrink-0">
                  {isAdmin ? 'AN' : 'RC'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {isAdmin ? 'Ahmed Nazih Nafiz' : 'Rover Crew Member'}
                  </p>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                    <ShieldCheck className={`w-3.5 h-3.5 ${isAdmin ? 'text-amber-500' : 'text-[#1e40af]'} inline`} />
                    {isAdmin ? 'Administrator' : 'Rover Scout'}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={onToggleAdmin}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  isAdmin
                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isAdmin ? 'Switch to Member View' : 'Switch to Admin Mode'}
              </button>
              <button
                type="button"
                onClick={() => onLogout ? onLogout() : signOut(auth)}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border bg-slate-800 border-slate-700 text-white hover:bg-slate-900 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
