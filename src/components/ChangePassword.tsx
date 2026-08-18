import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { RoverLogo } from './RoverLogo';
import { Compass } from 'lucide-react';

interface ChangePasswordProps {
  member: any;
  onComplete: (updatedMember: any) => void;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ member, onComplete }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword === '123456') {
      setError('Please choose a password different from the initial password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const memberRef = doc(db, 'members', member.id);
      await updateDoc(memberRef, { password: newPassword });
      onComplete({ ...member, password: newPassword });
    } catch (err: any) {
      console.error(err);
      setError('Failed to update password. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-white rounded-2xl p-1.5 flex items-center justify-center shadow-md border border-slate-200 mb-4">
            <RoverLogo variant="color" className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Change Default Password</h2>
          <p className="text-sm text-slate-500 mt-2">
            Welcome, {member.name}! Please set a new secure password to continue using the portal.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg border border-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] transition-all"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] transition-all"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md mt-6 ${
              loading ? 'bg-[#800020]/70 cursor-not-allowed' : 'bg-[#800020] hover:bg-[#6b1426]'
            }`}
          >
            {loading ? 'Updating...' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};
