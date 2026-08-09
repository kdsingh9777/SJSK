import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, ShieldAlert, X } from 'lucide-react';
import { CSCConfig } from '../types';

interface AdminLockModalProps {
  config: CSCConfig;
  isOpen: boolean;
  isAdminUnlocked: boolean;
  onUnlockSuccess: () => void;
  onClose: () => void;
  onUpdatePin: (newPin: string) => void;
}

export const AdminLockModal: React.FC<AdminLockModalProps> = ({
  config,
  isOpen,
  isAdminUnlocked,
  onUnlockSuccess,
  onClose,
  onUpdatePin,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === config.adminPin || enteredPin === '1234') {
      onUnlockSuccess();
      setEnteredPin('');
      setErrorMsg('');
      onClose();
    } else {
      setErrorMsg('Incorrect PIN! Try default PIN 1234 or enter valid Admin PIN.');
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits!');
      return;
    }
    onUpdatePin(newPin);
    setIsChangingPin(false);
    setNewPin('');
    alert('Admin PIN updated successfully!');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              {isAdminUnlocked ? 'Admin Security Settings' : 'Security PIN Verification'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
            ✕
          </button>
        </div>

        {!isAdminUnlocked ? (
          <form onSubmit={handleVerify} className="space-y-4 text-xs">
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Secure Document Vault Access
              </p>
              <p className="text-[11px] text-amber-800">
                Enter 4-digit PIN to access customer Aadhaar PDFs, PAN & confidential files (Default PIN: 1234).
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Admin Security PIN *</label>
              <input
                type="password"
                maxLength={8}
                required
                autoFocus
                placeholder="Enter 4-digit PIN"
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-amber-500/40"
              />
              {errorMsg && <p className="text-[11px] text-rose-600 font-bold mt-1.5">{errorMsg}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition"
              >
                Unlock
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-bold">Admin Unlocked Active!</p>
                <p className="text-[11px] text-emerald-700">You can now view all Aadhaar PDFs and confidential documents.</p>
              </div>
            </div>

            {!isChangingPin ? (
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setIsChangingPin(true)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4 text-slate-600" />
                  <span>Change Admin Security PIN</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveNewPin} className="space-y-3 pt-1">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Enter New 4-Digit PIN *</label>
                  <input
                    type="password"
                    maxLength={8}
                    required
                    placeholder="e.g. 5678"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center text-base font-mono tracking-widest"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(false)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg"
                  >
                    Save New PIN
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
