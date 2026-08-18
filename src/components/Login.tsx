import React, { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { Compass, Mail } from 'lucide-react';
import { RoverLogo } from './RoverLogo';
import { sendWelcomeMessageForMember } from '../services/chatService';
import app, { db } from '../firebase';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

interface LoginProps {
  onLoginSuccess: (memberData?: any) => void;
  portalName?: string;
  portalTagline?: string;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, portalName = 'Koshaaru Portal', portalTagline = 'Arabiyya Beyond Limits' }) => {
  const [idCard, setIdCard] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const searchId = idCard.trim().toUpperCase();
      const membersRef = collection(db, 'members');
      
      // Query by uppercase ID Card
      let q = query(membersRef, where('idCard', '==', searchId));
      let querySnapshot = await getDocs(q);

      // Fallback: Check username if ID card not matched directly
      if (querySnapshot.empty) {
        const usernameQuery = searchId.startsWith('@') ? searchId.toLowerCase() : `@${searchId.toLowerCase()}`;
        q = query(membersRef, where('username', '==', usernameQuery));
        querySnapshot = await getDocs(q);
      }

      // Fallback: Check email
      if (querySnapshot.empty) {
        q = query(membersRef, where('email', '==', idCard.trim().toLowerCase()));
        querySnapshot = await getDocs(q);
      }

      if (querySnapshot.empty) {
        setError('No member account found with this ID Card Number.');
        setLoading(false);
        return;
      }

      let matchedMember = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const memberPwd = data.password || '123456';
        if (memberPwd === password.trim()) {
          matchedMember = { id: doc.id, ...data };
        }
      });

      if (matchedMember) {
        const isFirstLogin = !(matchedMember as any).hasLoggedInBefore && !(matchedMember as any).welcomedToChat;

        // Update presence and last login in Firestore
        try {
          const nowIso = new Date().toISOString();
          const memberDocRef = doc(db, 'members', (matchedMember as any).id);
          setDoc(memberDocRef, {
            lastActive: nowIso,
            lastSeen: nowIso,
            lastLogin: nowIso,
            hasLoggedInBefore: true
          }, { merge: true }).catch(() => {});

          // Trigger administrator welcome message if first time logging in
          if (isFirstLogin) {
            sendWelcomeMessageForMember(matchedMember).catch((err) => {
              console.error('Failed to send auto welcome message:', err);
            });
          }
        } catch (e) {
          // ignore background update error
        }

        // Log in as member successfully via custom auth
        onLoginSuccess(matchedMember);
      } else {
        setError('Incorrect password. Please check your credentials.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to log in. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email === 'nazihnafiz@gmail.com') {
        onLoginSuccess(); // Admin login
      } else {
        setError('Unauthorized administrator email.');
        auth.signOut();
      }
    } catch (err: any) {
      console.error(err);
      setError('Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-br from-[#800020] to-[#1e40af] p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-2 flex items-center justify-center shadow-inner mb-4 border border-white/20">
            <RoverLogo variant="color" className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{portalName}</h1>
          <p className="text-white/80 text-sm">{portalTagline}</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6 text-center">Member Authentication</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg border border-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleMemberLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">ID Card Number</label>
              <input
                type="text"
                required
                value={idCard}
                onChange={(e) => setIdCard(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] transition-all uppercase"
                placeholder="A123456"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md mt-6 ${
                loading ? 'bg-[#800020]/70 cursor-not-allowed' : 'bg-[#800020] hover:bg-[#6b1426]'
              }`}
            >
              {loading ? 'Authenticating...' : 'Sign In as Member'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4 text-slate-500" />
              Sign in as Portal Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
