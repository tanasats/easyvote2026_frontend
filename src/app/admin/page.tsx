'use client';

import { useEffect, useState } from 'react';
import api, { getImageUrl } from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import CandidateModal from '@/components/admin/CandidateModal';
import BannerModal from '@/components/admin/BannerModal';
import { BarChart3, LogOut, Loader2, Users, Settings as SettingsIcon, Clock, Save, UserCheck, Plus, Edit2, Trash2, Image as ImageIcon, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layout State
  const [activeTab, setActiveTab] = useState<'results' | 'settings' | 'candidates' | 'banners'>('results');

  // Filter State for Results
  const [facultyFilter, setFacultyFilter] = useState<'all' | 'with_candidates'>('all');

  // Settings State
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Candidate Modal State
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);

  // Banner Modal State
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  const fetchCandidates = async () => {
    try {
      const res = await api.get('/candidates');
      setCandidates(res.data);
    } catch (err) {
      console.error('Failed to fetch candidates', err);
    }
  };

  const fetchBanners = async () => {
    try {
      const res = await api.get('/admin/banners');
      setBanners(res.data);
    } catch (err) {
      console.error('Failed to fetch banners', err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await api.get('/admin/reports/faculties');
      setReports(res.data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push('/');
      } else {
        setError('Failed to load election reports.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.election_start_time) {
        // Format for datetime-local input: YYYY-MM-DDTHH:mm
        const startRaw = new Date(res.data.election_start_time);
        startRaw.setMinutes(startRaw.getMinutes() - startRaw.getTimezoneOffset());
        setStartTime(startRaw.toISOString().slice(0, 16));
      }
      if (res.data.election_end_time) {
        const endRaw = new Date(res.data.election_end_time);
        endRaw.setMinutes(endRaw.getMinutes() - endRaw.getTimezoneOffset());
        setEndTime(endRaw.toISOString().slice(0, 16));
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    setSettingsMessage(null);

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setSettingsMessage({ type: 'error', text: 'Election end time must be after the start time.' });
      setSavingSettings(false);
      return;
    }

    try {
      await api.put('/settings', {
        election_start_time: start.toISOString(),
        election_end_time: end.toISOString()
      });
      setSettingsMessage({ type: 'success', text: 'Election settings saved successfully.' });
    } catch (err: any) {
      setSettingsMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save settings.' });
    } finally {
      setSavingSettings(false);
    }
  };

  const deleteCandidate = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this candidate? This might affect existing votes.")) return;
    try {
      await api.delete(`/candidates/${id}`);
      fetchCandidates();
      fetchReports();
    } catch (err) {
      alert("Failed to delete candidate.");
    }
  };

  const deleteBanner = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    try {
      await api.delete(`/admin/banners/${id}`);
      fetchBanners();
    } catch (err) {
      alert("Failed to delete banner.");
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return; // Wait for auth store to load

    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchReports();
    fetchSettings();
    fetchCandidates();
    fetchBanners();

    // Poll every 10 seconds for live updates
    const interval = setInterval(() => {
      if (activeTab === 'results') {
        fetchReports();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, router, user, activeTab]);

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

  const overallEligible = reports.reduce((sum, r) => sum + parseInt(r.total_eligible || '0'), 0);
  const overallVoted = reports.reduce((sum, r) => sum + parseInt(r.total_voted || '0'), 0);
  const overallPercentage = overallEligible > 0 ? ((overallVoted / overallEligible) * 100).toFixed(1) : '0.0';

  const filteredReports = reports.filter((report) => {
    if (facultyFilter === 'all') return true;
    return report.candidates && report.candidates.length > 0;
  });

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-indigo-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-800 rounded-lg">
              <BarChart3 className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h1 className="text-lg font-bold"><Link href="/">Election Control Center</Link></h1>
              <p className="text-xs text-indigo-300">Live Results Dashboard</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 text-indigo-300 hover:text-white rounded-full hover:bg-indigo-800 transition">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 max-w-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('results')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${activeTab === 'results' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <BarChart3 className="w-4 h-4" /> Turnout Results
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${activeTab === 'candidates' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <UserCheck className="w-4 h-4" /> Candidates
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'banners' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <ImageIcon className="w-4 h-4" /> Banners
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <SettingsIcon className="w-4 h-4" /> Settings
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {activeTab === 'results' ? (
          <div className="space-y-6">
            {/* Overall Turnout Widget */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Overall Election Turnout</h2>
                  <p className="text-sm font-medium text-gray-500 mt-1">
                    <span className="font-bold text-gray-800">{overallVoted}</span> votes cast out of <span className="font-bold text-gray-800">{overallEligible}</span> eligible voters
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-indigo-600">{overallPercentage}%</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Total Turnout</div>
              </div>
            </div>

            {/* Faculty Level Turnout Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-lg font-bold text-gray-900">Turnout by Faculty</h2>
                </div>
                <select 
                  value={facultyFilter} 
                  onChange={(e) => setFacultyFilter(e.target.value as 'all' | 'with_candidates')}
                  className="bg-white border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm cursor-pointer"
                >
                  <option value="all">แสดงทั้งหมด (All Faculties)</option>
                  <option value="with_candidates">เฉพาะคณะที่มีผู้สมัคร (With Candidates)</option>
                </select>
              </div>

              <div className="p-6 grid gap-6 md:grid-cols-2">
                {filteredReports.map((report) => (
                  <div key={report.faculty_code} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white hover:shadow-md transition-shadow">
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{report.faculty_name || 'Unknown Faculty'}</h3>
                          <p className="text-xs text-gray-500 font-mono">CODE: {report.faculty_code}</p>
                        </div>
                        <div className="text-right">
                          <span className="block text-2xl font-black text-indigo-600">{report.turnout_percentage}%</span>
                          <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Turnout</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Users className="w-4 h-4 text-indigo-400" />
                          <span className="font-semibold text-gray-900">{report.total_voted}</span> / {report.total_eligible} Voted
                        </div>
                      </div>
                    </div>

                    <div className="p-4 flex-1 space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Candidate Popularity</h4>
                      {report.candidates && report.candidates.length > 0 ? (
                        report.candidates.map((c: any) => {
                          const percentage = report.total_voted > 0
                            ? ((c.vote_count / report.total_voted) * 100).toFixed(1)
                            : '0.0';

                          return (
                            <div key={c.id} className="flex items-center justify-between text-sm">
                              <span className={`truncate mr-2 ${c.is_no_vote ? 'text-gray-500 italic' : 'text-gray-800'}`}>
                                {c.name} {c.is_no_vote && '(Abstain)'}
                              </span>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${c.is_no_vote ? 'bg-gray-400' : 'bg-indigo-500'}`} style={{ width: `${percentage}%` }}></div>
                                </div>
                                <span className="w-8 text-right font-medium text-gray-600">{c.vote_count}</span>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-gray-400 italic">No candidate maps found for this faculty.</p>
                      )}
                    </div>
                  </div>
                ))}

                {filteredReports.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-500">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>ไม่มีข้อมูลคณะที่ตรงตามตัวกรอง (No faculty reports matching your filter)</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'candidates' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-gray-900">Manage Candidates</h2>
              </div>
              <button onClick={() => { setEditingCandidate(null); setShowCandidateModal(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm text-center rounded-xl shadow-sm transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Candidate
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-900 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Candidate</th>
                    <th className="px-6 py-4">Title / Position</th>
                    <th className="px-6 py-4">Faculty</th>
                    <th className="px-6 py-4 text-center">Sort Order</th>
                    <th className="px-6 py-4 text-center">Type</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {candidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-4">
                        {candidate.is_no_vote ? (
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                            <span className="text-gray-400 font-bold">X</span>
                          </div>
                        ) : (
                          <img src={getImageUrl(candidate.image_url)} alt={candidate.name} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-200" />
                        )}
                        <div className="font-semibold text-gray-900">{candidate.name}</div>
                      </td>
                      <td className="px-6 py-4">{candidate.position || '-'}</td>
                      <td className="px-6 py-4">
                        {candidate.faculty_code ? (
                          <span className="inline-flex px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">{candidate.faculty_code}</span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-medium text-gray-500">
                        {candidate.display_order ?? 0}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {candidate.is_no_vote ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wide">Abstain</span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wide">Standard</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setEditingCandidate(candidate); setShowCandidateModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteCandidate(candidate.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {candidates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No candidates available. Click "Add Candidate" to create one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'banners' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-gray-900">Manage Banners</h2>
              </div>
              <button onClick={() => { setEditingBanner(null); setShowBannerModal(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm text-center rounded-xl shadow-sm transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Banner
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-900 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Image</th>
                    <th className="px-6 py-4 text-center">Order</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {banners.map((banner) => (
                    <tr key={banner.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <img src={getImageUrl(banner.image_url)} alt="Banner" className="h-16 w-32 object-cover rounded shadow-sm border border-gray-200" />
                      </td>
                      <td className="px-6 py-4 text-center font-mono">
                        {banner.display_order}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {banner.is_active ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wide">Active</span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide">Hidden</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setEditingBanner(banner); setShowBannerModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteBanner(banner.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {banners.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No banners available. Click "Add Banner" to upload one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <Clock className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-gray-900">Election Timing Configurations</h2>
            </div>

            <div className="p-6 space-y-6">
              {settingsMessage && (
                <div className={`p-4 rounded-xl text-sm ${settingsMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {settingsMessage.text}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Voting Opens At</label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="text-black w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">Voting Closes At</label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="text-black w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={saveSettings}
                  disabled={savingSettings || !startTime || !endTime}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-sm rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CandidateModal
        isOpen={showCandidateModal}
        onClose={() => { setShowCandidateModal(false); setEditingCandidate(null); }}
        onSuccess={() => { fetchCandidates(); fetchReports(); }}
        candidate={editingCandidate}
      />
      <BannerModal
        isOpen={showBannerModal}
        onClose={() => { setShowBannerModal(false); setEditingBanner(null); }}
        onSuccess={() => fetchBanners()}
        banner={editingBanner}
      />
    </main>
  );
}
