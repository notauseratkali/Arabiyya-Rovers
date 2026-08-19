import React, { useState, useEffect } from 'react';
import { Menu, Compass, MapPin, Cloud, X, Check, Navigation, UserCheck, Globe, RefreshCw, Database, CheckCircle, Wifi, ShieldCheck } from 'lucide-react';
import { NavSection } from '../types';
import { updateMember, subscribeToMembers } from '../services/membersService';
import { MemberItem } from './MembersPage';
import { RoverLogo } from './RoverLogo';
import { MALDIVES_ATOLLS, WORLD_COUNTRIES } from '../data/maldivesLocations';

interface HeaderProps {
  currentSection: NavSection;
  onToggleSidebar: () => void;
  syncStatus?: 'synced' | 'syncing' | 'error';
  portalName?: string;
  isAdmin?: boolean;
  currentUser?: any;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentSection, 
  onToggleSidebar, 
  syncStatus = 'synced',
  portalName = 'Arabiyya Rover Network',
  isAdmin = false,
  currentUser = null
}) => {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [isVerifyingSync, setIsVerifyingSync] = useState(false);
  const [verifySuccessToast, setVerifySuccessToast] = useState(false);

  const handleVerifySync = () => {
    setIsVerifyingSync(true);
    setTimeout(() => {
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsVerifyingSync(false);
      setVerifySuccessToast(true);
      setTimeout(() => setVerifySuccessToast(false), 3000);
    }, 600);
  };

  const ADMIN_DEFAULT_ADDRESS = "Al Madarsathul Arabiyyathul Islamiyya / Boduthakurufaanu Magu / K. Male'";

  const [currentAddress, setCurrentAddress] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('koshaaru_user_address_v1');
      if (saved) return saved;
      return isAdmin ? ADMIN_DEFAULT_ADDRESS : 'M. Koshaaru, Handhuvaree Hingun, Kaafu / Malé Region, Malé, Maldives';
    } catch {
      return isAdmin ? ADMIN_DEFAULT_ADDRESS : 'M. Koshaaru, Handhuvaree Hingun, Kaafu / Malé Region, Malé, Maldives';
    }
  });

  // Active Logged-In User ID (defaults to 'admin_nazih' for admin or 'm1')
  const [activeUserId] = useState<string>(() => {
    try {
      return localStorage.getItem('koshaaru_active_user_id') || (isAdmin ? 'admin_nazih' : 'm1');
    } catch {
      return isAdmin ? 'admin_nazih' : 'm1';
    }
  });

  // Address Form States
  const [countryInput, setCountryInput] = useState<string>('Maldives');
  const [houseInput, setHouseInput] = useState<string>(isAdmin ? 'Al Madarsathul Arabiyyathul Islamiyya' : 'M. Koshaaru');
  const [roadInput, setRoadInput] = useState<string>(isAdmin ? 'Boduthakurufaanu Magu' : 'Handhuvaree Hingun');
  const [districtInput, setDistrictInput] = useState<string>('');
  
  // Maldives Atoll & Island Dropdowns
  const [selectedAtollCode, setSelectedAtollCode] = useState<string>('K');
  const [selectedIsland, setSelectedIsland] = useState<string>('Malé');

  // Non-Maldives State & City Inputs
  const [stateProvinceInput, setStateProvinceInput] = useState<string>('');
  const [cityTownInput, setCityTownInput] = useState<string>('');

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [activeMember, setActiveMember] = useState<MemberItem | null>(null);
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Active Atoll Object
  const currentAtollObj = MALDIVES_ATOLLS.find(a => a.code === selectedAtollCode) || MALDIVES_ATOLLS[0];

  // Handle Atoll change -> Instantly update island options and select first island
  const handleAtollChange = (code: string) => {
    setSelectedAtollCode(code);
    const atoll = MALDIVES_ATOLLS.find(a => a.code === code);
    if (atoll && atoll.islands.length > 0) {
      setSelectedIsland(atoll.islands[0]);
    }
  };

  // Helper to parse address string into form fields
  const parseAndPopulateAddress = (locStr: string) => {
    if (!locStr) return;
    const trimmed = locStr.trim();
    if (!trimmed) return;

    // Special check for Administrator's address
    if (trimmed.includes('Al Madarsathul Arabiyyathul Islamiyya') || trimmed.includes('Boduthakurufaanu Magu')) {
      setHouseInput('Al Madarsathul Arabiyyathul Islamiyya');
      setRoadInput('Boduthakurufaanu Magu');
      setDistrictInput('');
      setCountryInput('Maldives');
      setSelectedAtollCode('K');
      setSelectedIsland('Malé');
      return;
    }

    const parts = trimmed.includes('/')
      ? trimmed.split('/').map(s => s.trim())
      : trimmed.split(',').map(s => s.trim());

    if (parts.length === 1) {
      setHouseInput(trimmed);
      setRoadInput(trimmed.toLowerCase().includes('hq') || trimmed.toLowerCase().includes('crew') ? 'Handhuvaree Hingun' : '');
      setDistrictInput(trimmed.toLowerCase().includes('hq') ? 'Henveiru' : '');
      setCountryInput('Maldives');
      setSelectedAtollCode('K');
      setSelectedIsland('Malé');
      return;
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart === 'Maldives' || trimmed.toLowerCase().includes('maldives') || trimmed.toLowerCase().includes('malé') || trimmed.toLowerCase().includes('male') || trimmed.toLowerCase().includes('k.')) {
      setCountryInput('Maldives');
      if (parts.length >= 2) {
        setHouseInput(parts[0] || '');
        setRoadInput(parts[1] || '');
        
        let islandName = '';
        let atollName = '';
        
        if (parts.length >= 5) {
          setDistrictInput(parts[2] || '');
          islandName = parts[3] || '';
          atollName = parts[4] || '';
        } else if (parts.length === 4) {
          setDistrictInput('');
          islandName = parts[2] || '';
          atollName = parts[3] || '';
        } else if (parts.length === 3) {
          setDistrictInput('');
          islandName = parts[2] || '';
        }

        const aNameLower = (atollName || '').toLowerCase();
        // Match Atoll Code
        const matchedAtoll = MALDIVES_ATOLLS.find(a => {
          const nameLower = (a.name || '').toLowerCase();
          const codeLower = (a.code || '').toLowerCase();
          return (
            nameLower === aNameLower ||
            (aNameLower && nameLower.includes(aNameLower)) ||
            (codeLower && aNameLower.includes(codeLower))
          );
        });

        if (matchedAtoll) {
          setSelectedAtollCode(matchedAtoll.code);
          if (matchedAtoll.islands.includes(islandName)) {
            setSelectedIsland(islandName);
          } else if (matchedAtoll.islands.length > 0) {
            setSelectedIsland(matchedAtoll.islands[0]);
          }
        } else {
          setSelectedAtollCode('K');
          setSelectedIsland('Malé');
        }
      }
    } else if (WORLD_COUNTRIES.includes(lastPart)) {
      setCountryInput(lastPart);
      if (parts.length >= 4) {
        setHouseInput(parts[0] || '');
        setRoadInput(parts[1] || '');
        if (parts.length === 6) {
          setDistrictInput(parts[2] || '');
          setCityTownInput(parts[3] || '');
          setStateProvinceInput(parts[4] || '');
        } else {
          setDistrictInput('');
          setCityTownInput(parts[2] || '');
          setStateProvinceInput(parts[3] || '');
        }
      } else {
        setHouseInput(parts[0] || '');
        setRoadInput(parts[1] || '');
      }
    } else {
      setHouseInput(parts[0] || '');
      if (parts[1]) setRoadInput(parts[1]);
    }
  };

  useEffect(() => {
    const handleAddressEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.address) {
        setCurrentAddress(customEvent.detail.address);
        parseAndPopulateAddress(customEvent.detail.address);
      }
    };
    window.addEventListener('koshaaru_address_updated', handleAddressEvent);

    const unsub = subscribeToMembers(
      (mList) => {
        setMembers(mList);
        const targetId = currentUser?.id || (isAdmin ? 'admin_nazih' : activeUserId);
        const current = mList.find((x) => x.id === targetId || (currentUser?.username && x.username === currentUser.username) || (currentUser?.idCard && x.idCard === currentUser.idCard)) || (isAdmin ? mList.find(x => x.role === 'Administrator' || x.name === 'Ahmed Nazih Nafiz') : mList[0]);
        
        if (current) {
          setActiveMember(current);
          const addr = current.currentAddress || current.location;
          if (addr) {
            setCurrentAddress(addr);
            parseAndPopulateAddress(addr);
          }
        } else if (currentUser?.currentAddress || currentUser?.location) {
          const addr = currentUser.currentAddress || currentUser.location;
          setCurrentAddress(addr);
          parseAndPopulateAddress(addr);
        }
      },
      (err) => console.error('Failed to load members in header:', err)
    );
    return () => {
      window.removeEventListener('koshaaru_address_updated', handleAddressEvent);
      unsub();
    };
  }, [activeUserId, isAdmin, currentUser]);

  const getSectionTitle = (section: NavSection) => {
    switch (section) {
      case 'dashboard':
        return 'Dashboard';
      case 'chat':
        return 'Members Chat';
      case 'notebook':
        return 'Notebook';
      case 'members':
        return 'Members Directory';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMember) return;

    let fullLoc = '';

    if (countryInput === 'Maldives') {
      const formattedParts = [
        houseInput.trim(),
        roadInput.trim(),
        districtInput.trim(),
        selectedIsland,
        currentAtollObj.name,
        'Maldives'
      ].filter(Boolean);
      fullLoc = formattedParts.join(', ');
    } else {
      const formattedParts = [
        houseInput.trim(),
        roadInput.trim(),
        districtInput.trim(),
        cityTownInput.trim(),
        stateProvinceInput.trim(),
        countryInput.trim()
      ].filter(Boolean);
      fullLoc = formattedParts.join(', ');
    }

    const targetId = isAdmin ? 'admin_nazih' : (activeMember?.id || currentUser?.id || activeUserId || 'm1');

    setCurrentAddress(fullLoc);

    try {
      localStorage.setItem('koshaaru_user_address_v1', fullLoc);
      localStorage.setItem('koshaaru_active_user_id', targetId);
      window.dispatchEvent(new CustomEvent('koshaaru_address_updated', { detail: { address: fullLoc, memberId: targetId } }));
    } catch (err) {
      console.error(err);
    }

    try {
      await updateMember(targetId, { 
        location: fullLoc,
        currentAddress: fullLoc,
        name: isAdmin ? 'Ahmed Nazih Nafiz' : (activeMember?.name || currentUser?.name || 'Rover Scout'),
        role: isAdmin ? 'Administrator' : (activeMember?.role || 'Rover Scout'),
        crew: isAdmin ? 'Administration' : (activeMember?.crew || 'Alpha Crew')
      });
    } catch (err) {
      console.error('Failed to update member location in Firestore:', err);
    }

    setIsSavedToast(true);
    setTimeout(() => {
      setIsSavedToast(false);
      setIsLocationModalOpen(false);
    }, 1200);
  };

  return (
    <>
      <header 
        id="portal-header"
        className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs"
      >
        <div className="flex items-center gap-3">
          <button
            id="toggle-sidebar-button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-white border border-slate-200/90 items-center justify-center p-0.5 shadow-xs shrink-0">
              <RoverLogo variant="color" className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm font-bold text-[#0f1e36] truncate block">
                {portalName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Cloud Sync Status Indicator Button */}
          <button 
            type="button"
            id="cloud-status"
            onClick={() => setIsSyncModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border bg-slate-50 hover:bg-slate-100 border-slate-200 transition-all cursor-pointer group shadow-2xs"
            title="Click to view Cloud Sync Status"
            aria-label="Cloud Sync Status"
          >
            {syncStatus === 'synced' ? (
              <>
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                </div>
                <Cloud className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline text-[11px] font-bold text-emerald-800">Synced</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <Cloud className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline text-[11px] font-bold text-rose-700">Connecting</span>
              </>
            )}
          </button>

          {/* Location SVG Icon Button */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 shadow-2xs transition-all cursor-pointer group flex items-center justify-center"
            title={`Update Current Address (${currentAddress})`}
            aria-label="Update Current Address"
          >
            <MapPin className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      {/* UPDATE CURRENT ADDRESS MODAL */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f1e36]">Update My Current Address</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Address Form */}
            <form onSubmit={handleSaveAddress} className="space-y-4">
              {/* Logged-In User Profile Display */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#800020] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {isAdmin ? 'AN' : activeMember ? activeMember.name.slice(0, 2).toUpperCase() : (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'ME')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {isAdmin ? 'Ahmed Nazih Nafiz' : (activeMember?.name || currentUser?.name || 'My Profile')}
                    </span>
                    <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {isAdmin ? 'Administrator' : (activeMember?.role || currentUser?.role || 'Rover Scout')} • {isAdmin ? 'Administration' : (activeMember?.crew || currentUser?.crew || 'Alpha Crew')}
                  </p>
                </div>
              </div>

              {/* Country Selection Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>Country</span> <span className="text-rose-500">*</span>
                </label>
                <select
                  value={countryInput}
                  onChange={(e) => setCountryInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af] bg-slate-50/50 cursor-pointer"
                >
                  {WORLD_COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* House / Flat Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  House / Flat Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={houseInput}
                  onChange={(e) => setHouseInput(e.target.value)}
                  placeholder="e.g. M. Koshaaru, Flat 4B"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              {/* Road Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Road Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={roadInput}
                  onChange={(e) => setRoadInput(e.target.value)}
                  placeholder="e.g. Handhuvaree Hingun / Ameenee Magu"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              {/* District (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={districtInput}
                  onChange={(e) => setDistrictInput(e.target.value)}
                  placeholder="e.g. Henveiru / Galolhu / Phase 1 / Phase 2"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              {/* Conditional Atoll/Island (Maldives) vs State/City (Overseas) */}
              {countryInput === 'Maldives' ? (
                <div className="grid grid-cols-2 gap-3">
                  {/* Atoll Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Atoll <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedAtollCode}
                      onChange={(e) => handleAtollChange(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af] bg-white cursor-pointer truncate font-medium"
                    >
                      {MALDIVES_ATOLLS.map((atoll) => (
                        <option key={atoll.code} value={atoll.code}>
                          {atoll.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Island Dropdown (Instantly filter islands by selected Atoll) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Island <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedIsland}
                      onChange={(e) => setSelectedIsland(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af] bg-white cursor-pointer truncate font-medium"
                    >
                      {currentAtollObj.islands.map((island) => (
                        <option key={island} value={island}>
                          {island}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* State / Province */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      State / Province <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={stateProvinceInput}
                      onChange={(e) => setStateProvinceInput(e.target.value)}
                      placeholder="e.g. Western Province"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                    />
                  </div>

                  {/* City / Town */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City / Town <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={cityTownInput}
                      onChange={(e) => setCityTownInput(e.target.value)}
                      placeholder="e.g. Colombo"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                    />
                  </div>
                </div>
              )}

              {/* Success Toast Banner */}
              {isSavedToast && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in-50">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Your address details were updated successfully!</span>
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" /> Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOUD SYNC STATUS MODAL */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Cloud className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f1e36]">Cloud Sync Status</h3>
                  <p className="text-xs text-slate-500">Realtime Cloud database connection</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Status Banner */}
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950">Cloud Database Connected</div>
                  <div className="text-[11px] text-emerald-700 font-medium">All changes automatically saved to Cloud</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-200 text-emerald-900">
                ACTIVE
              </span>
            </div>

            {/* Technical Connection Details */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-400" /> Database Provider
                </span>
                <span className="font-bold text-slate-800">Cloud Database</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-slate-400" /> Connection Mode
                </span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Realtime Sync Engine
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Last Synchronized
                </span>
                <span className="font-bold text-slate-800 font-mono text-[11px]">{lastSyncTime}</span>
              </div>
            </div>

            {/* Synced Data Collections */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">Synchronized Cloud Modules</div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] max-h-[180px] overflow-y-auto pr-1">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-slate-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Members & Directory</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-slate-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Announcements</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-slate-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Logbook & Notes</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-slate-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Chat & Messaging</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-slate-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Courses & Badges</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-slate-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Events & Calendar</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-slate-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Finance & Ledger</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-slate-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Governance & Goals</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-slate-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Media & Gallery</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-slate-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Scout Progress</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-slate-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Service Records</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-slate-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Settings & Identity</span>
                </div>
              </div>
            </div>

            {/* Success Toast */}
            {verifySuccessToast && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in-50">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cloud connection verified successfully!</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleVerifySync}
                disabled={isVerifyingSync}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingSync ? 'animate-spin' : ''}`} />
                {isVerifyingSync ? 'Checking...' : 'Re-verify Connection'}
              </button>

              <button
                type="button"
                onClick={() => setIsSyncModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
