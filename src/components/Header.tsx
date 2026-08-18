import React, { useState, useEffect } from 'react';
import { Menu, Compass, MapPin, Cloud, X, Check, Navigation, UserCheck, Globe } from 'lucide-react';
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
  portalName = 'Koshaaru Portal',
  isAdmin = false,
  currentUser = null
}) => {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>(() => {
    try {
      return localStorage.getItem('koshaaru_user_address_v1') || 'M. Koshaaru, Handhuvaree Hingun, Kaafu / Malé Region, Malé, Maldives';
    } catch {
      return 'M. Koshaaru, Handhuvaree Hingun, Kaafu / Malé Region, Malé, Maldives';
    }
  });

  // Active Logged-In User ID (defaults to 'm1' / Mohamed Naiz)
  const [activeUserId] = useState<string>(() => {
    try {
      return localStorage.getItem('koshaaru_active_user_id') || 'm1';
    } catch {
      return 'm1';
    }
  });

  // Address Form States
  const [countryInput, setCountryInput] = useState<string>('Maldives');
  const [houseInput, setHouseInput] = useState<string>('M. Koshaaru');
  const [roadInput, setRoadInput] = useState<string>('Handhuvaree Hingun');
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
    const parts = locStr.split(',').map(s => s.trim());
    if (parts.length < 2) return;

    const lastPart = parts[parts.length - 1];
    if (lastPart === 'Maldives') {
      setCountryInput('Maldives');
      if (parts.length >= 5) {
        setHouseInput(parts[0] || '');
        setRoadInput(parts[1] || '');
        
        let islandName = '';
        let atollName = '';
        
        if (parts.length === 6) {
          setDistrictInput(parts[2] || '');
          islandName = parts[3] || '';
          atollName = parts[4] || '';
        } else {
          setDistrictInput('');
          islandName = parts[2] || '';
          atollName = parts[3] || '';
        }

        // Match Atoll Code
        const matchedAtoll = MALDIVES_ATOLLS.find(a => 
          a.name.toLowerCase() === atollName.toLowerCase() || 
          a.name.toLowerCase().includes(atollName.toLowerCase()) ||
          atollName.toLowerCase().includes(a.code.toLowerCase())
        );

        if (matchedAtoll) {
          setSelectedAtollCode(matchedAtoll.code);
          if (matchedAtoll.islands.includes(islandName)) {
            setSelectedIsland(islandName);
          } else if (matchedAtoll.islands.length > 0) {
            setSelectedIsland(matchedAtoll.islands[0]);
          }
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
      }
    }
  };

  useEffect(() => {
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
    return () => unsub();
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

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-white border border-slate-200/90 items-center justify-center p-0.5 shadow-xs">
              <RoverLogo variant="color" className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  {portalName}
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-sm font-bold text-[#0f1e36]">
                  {getSectionTitle(currentSection)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Cloud Sync Status Indicator */}
          <div 
            id="firebase-cloud-status"
            className="flex items-center justify-center p-1.5 rounded-lg border bg-slate-50 border-slate-200 transition-colors"
            title={syncStatus === 'synced' ? 'In Sync' : 'Not in sync'}
            aria-label={syncStatus === 'synced' ? 'In Sync' : 'Not in sync'}
          >
            {syncStatus === 'synced' ? (
              <Cloud className="w-4 h-4 text-emerald-600" />
            ) : (
              <Cloud className="w-4 h-4 text-rose-500" />
            )}
          </div>

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
    </>
  );
};
