'use client';

import { useEffect, useState } from 'react';
import api, { getImageUrl } from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VotePage() {
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time boundaries and real-time state
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    // Basic auth protection
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    // Redirect non-voters (admin, staff, null)
    if (user?.role !== 'voter') {
      router.push('/dashboard');
      return;
    }

    // Fetch Settings and Candidates
    const fetchData = async () => {
      try {
        const settingsRes = await api.get('/settings');
        const now = new Date();
        const start = settingsRes.data.election_start_time ? new Date(settingsRes.data.election_start_time) : null;
        const end = settingsRes.data.election_end_time ? new Date(settingsRes.data.election_end_time) : null;

        if (start && end) {
          if (now < start || now > end) {
            router.push('/dashboard');
            return;
          }
          setEndTime(end); // Store for real-time monitoring
        }

        const candidatesRes = await api.get('/candidates');
        setCandidates(candidatesRes.data);
      } catch (err) {
        setError('Failed to load election data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, router, user, _hasHydrated]);

  // Real-time Expiration Polling
  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      if (now > endTime) {
        setTimeExpired(true);
        setShowConfirm(false); // Force close confirmation modal
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const handleVoteSubmit = async () => {
    if (!selectedCandidate) return;

    // Local Check just before network request
    if (endTime && new Date() > endTime) {
      setTimeExpired(true);
      setShowConfirm(false);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post('/vote', { candidateId: selectedCandidate });

      // Update local state to reflect voted status
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, has_voted: true } : null
      }));

      router.push('/success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error casting vote. Please try again.');
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Already voted state
  if (user?.has_voted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">You Have Already Voted</h2>
        <p className="text-gray-500 mb-8 max-w-sm">Thank you for participating in the EasyVote 2026 election. Your anonymous ballot has been securely recorded.</p>
        <button onClick={handleLogout} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Voting booth</h1>
            <p className="text-xs text-gray-500">Select one candidate</p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              {user?.faculty_name && <p className="text-xs text-indigo-600">{user.faculty_name}</p>}
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition" title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Candidate List */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {timeExpired ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center shadow-sm">
            <h2 className="text-lg font-bold mb-2">Voting Has Concluded</h2>
            <p className="text-sm">The election time has expired. You can no longer cast a ballot.</p>
            <button onClick={() => router.push('/dashboard')} className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition">
              Return to Dashboard
            </button>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100">
            {error}
          </div>
        ) : null}

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">คูหาเลือกตั้ง (Voting booth)</h1>
          <p className="text text-gray-500">Select one candidate or abstain from voting<br />เลือกผู้สมัคร 1 คน หรือ ไม่ประสงค์ลงคะแนน</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <motion.div
              key={candidate.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCandidate(candidate.id)}
              className={`relative cursor-pointer rounded-3xl border-2 transition-all outline-none overflow-hidden flex flex-col ${selectedCandidate === candidate.id
                ? 'border-indigo-600 bg-indigo-50/20 shadow-xl ring-4 ring-indigo-600/10'
                : 'border-gray-100 bg-white hover:border-indigo-200 hover:shadow-lg'
                }`}
            >
              {/* Image Header */}
              <div className="relative aspect-square w-full bg-gray-50 border-b border-gray-100 flex-shrink-0">
                {candidate.is_no_vote ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400 font-bold text-6xl">X</span>
                  </div>
                ) : (
                  <img
                    src={getImageUrl(candidate.image_url)}
                    alt={candidate.name}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                )}
                {selectedCandidate === candidate.id && (
                  <div className="absolute inset-0 bg-indigo-600/10 flex items-start justify-end p-4">
                    <div className="bg-white rounded-full p-1 shadow-md">
                      <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                    </div>
                  </div>
                )}
              </div>

              {/* Info Body */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1" title={candidate.name}>{candidate.name}</h3>
                {candidate.position && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold mb-3 w-fit border border-indigo-100">
                    {candidate.position}
                  </span>
                )}
                <p className="text-sm text-gray-500 line-clamp-3 mt-auto">{candidate.biography}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <AnimatePresence>
        {selectedCandidate && !timeExpired && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] z-40"
          >
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div className="hidden sm:block">
                <p className="text-sm text-gray-500">Selected Candidate</p>
                <p className="font-semibold text-gray-900">{candidates.find(c => c.id === selectedCandidate)?.name}</p>
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                Review & Confirm <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">ยืนยันการลงคะแนน <br />(Confirm Your Vote)</h3>

              <p className='indent-8'>
                คุณกำลังจะลงคะแนนเสียงอย่างปลอดภัยให้กับ <strong className='text-blue-600'>{candidates.find(c => c.id === selectedCandidate)?.name}</strong>. การดำเนินการนี้ถือเป็นที่สิ้นสุดและเป็นความลับอย่างสมบูรณ์
              </p>

              <p className="indent-8 text-gray-500  mb-6">You are about to securely cast your vote for <strong className='text-blue-600'>{candidates.find(c => c.id === selectedCandidate)?.name}</strong>. This action is final and completely anonymous.</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleVoteSubmit}
                  disabled={submitting}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Cast My Vote'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={submitting}
                  className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-700 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
