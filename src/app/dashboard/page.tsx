'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Vote, LogOut, Loader2, ShieldCheck, User as UserIcon, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';

export default function Dashboard() {
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();

  const [electionStatus, setElectionStatus] = useState<'upcoming' | 'active' | 'ended'>('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    if (user?.role === 'admin') {
      router.push('/admin');
      return;
    }

    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        const now = new Date();
        const start = res.data.election_start_time ? new Date(res.data.election_start_time) : null;
        const end = res.data.election_end_time ? new Date(res.data.election_end_time) : null;

        if (start && end) {
          if (now < start) setElectionStatus('upcoming');
          else if (now >= start && now <= end) setElectionStatus('active');
          else setElectionStatus('ended');
        }
      } catch (err) {
        console.error('Failed to fetch settings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isAuthenticated, router, user]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Vote className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight"><Link href="/">Voter Dashboard</Link></h1>
          </div>

          <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-2 transition">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
            <UserIcon className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-500 mb-2">{user.email}</p>

            {user.role === 'voter' ? (
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Eligible Voter
                </span>
                <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                  ID: {user.student_id}
                </span>
                <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full border border-gray-200 truncate max-w-[200px]">
                  {user.faculty_name}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  Role: {user.role || 'Unassigned'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Area */}
        {user.role === 'guest' ? (
          <div className="bg-orange-50 rounded-3xl p-8 border border-orange-200 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto" />
            <h3 className="text-xl font-bold text-orange-900">Access Restricted</h3>
            <p className="text-orange-800 max-w-md mx-auto">
              Your account has not been assigned voting privileges. This may be because your email is not registered as an active 11-digit graduate student in our system. Please contact the system administrator to request access.
            </p>
          </div>
        ) : user.role === 'staff' || !user.role ? (
          <div className="bg-blue-50 rounded-3xl p-8 border border-blue-200 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-blue-500 mx-auto" />
            <h3 className="text-xl font-bold text-blue-900">Staff Access (สิทธิ์บุคลากร)</h3>
            <p className="text-blue-800 max-w-md mx-auto">
              คุณใช้งานในสิทธิ์ของบุคลากรเท่านั้น หากต้องการเพิ่มสิทธิ์การใช้งานระบบกรุณาติดต่อผู้ดูแลระบบ (Administrator)
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6 text-center">

            {user.has_voted ? (
              <>
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">You Have Successfully Voted</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Your anonymous ballot has been securely recorded in the system. Thank you for participating in the EasyVote 2026 election.
                </p>
              </>
            ) : (
              <>
                {electionStatus === 'upcoming' && (
                  <>
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Vote className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Election Has Not Started</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Your eligibility has been confirmed, but the polls are not yet open. Please return to your dashboard when the election period begins.
                    </p>
                  </>
                )}

                {electionStatus === 'active' && (
                  <>
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Vote className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">The Polls Are Open</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      You are eligible to vote. Click the button below to proceed to the secure, anonymous ballot interface.
                    </p>
                    <Link href="/vote" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95">
                      Go to Voting Area <Vote className="w-5 h-5" />
                    </Link>
                  </>
                )}

                {electionStatus === 'ended' && (
                  <>
                    <div className="w-16 h-16 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Election Has Ended</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      The voting period has officially closed. You cannot cast a vote at this time.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
