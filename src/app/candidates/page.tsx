'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Building2, MapPin, Loader2, AlertCircle } from 'lucide-react';
import api, { getImageUrl } from '@/lib/axios';

interface Candidate {
  id: number;
  name: string;
  position: string;
  biography: string;
  faculty_code: string;
  faculty_name?: string;
  display_order: number;
  image_url: string;
  is_no_vote: boolean;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await api.get('/candidates/public');
        // Filter out "no vote" options as we only want to show real candidates here
        const validCandidates = res.data.filter((c: Candidate) => !c.is_no_vote);

        // Sort candidates by display order
        validCandidates.sort((a: Candidate, b: Candidate) => (a.display_order ?? 0) - (b.display_order ?? 0));

        setCandidates(validCandidates);
      } catch (err: any) {
        console.error('Failed to fetch candidates', err);
        setError('ไม่สามารถดาวน์โหลดข้อมูลผู้สมัครได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  // Group candidates by faculty name if available, else faculty code
  // If no faculty specified, they are considered "ผู้สมัครส่วนกลาง" (Central Candidates)
  const groupedCandidates = candidates.reduce((acc, candidate) => {
    const key = candidate.faculty_name || candidate.faculty_code || 'CENTRAL';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(candidate);
    return acc;
  }, {} as Record<string, Candidate[]>);

  // Sort groups: CENTRAL first, then alphabetically by faculty code
  const sortedGroupKeys = Object.keys(groupedCandidates).sort((a, b) => {
    if (a === 'CENTRAL') return -1;
    if (b === 'CENTRAL') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <Link href="/" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-4 bg-indigo-50 py-1.5 px-3 rounded-full transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับสู่หน้าหลัก
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 flex items-center gap-3">
              <span className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
                <Users className="w-8 h-8" />
              </span>
              ข้อมูลผู้ลงสมัครรับเลือกตั้ง
            </h1>
            <p className="mt-3 text-lg text-gray-500 max-w-2xl">
              รายชื่อและนโยบายของผู้ลงสมัครรับเลือกตั้ง จำแนกตามคณะและส่วนกลาง
            </p>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลผู้สมัคร...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">ข้อผิดพลาด</h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">ยังไม่มีข้อมูลผู้สมัคร</h3>
            <p className="text-gray-500">ขณะนี้ยังไม่มีการบันทึกข้อมูลผู้ลงสมัครในระบบ</p>
          </div>
        ) : (
          <div className="space-y-12">
            {sortedGroupKeys.map((groupKey) => {
              const groupCandidates = groupedCandidates[groupKey];
              const isCentral = groupKey === 'CENTRAL';

              return (
                <div key={groupKey} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Group Header */}
                  <div className={`p-6 sm:p-8 flex items-center gap-4 border-b ${isCentral ? 'bg-indigo-900 border-indigo-950 text-white' : 'bg-gray-50/80 border-gray-100 text-gray-900'}`}>
                    <div className={`p-3 rounded-2xl ${isCentral ? 'bg-white/10 text-indigo-200' : 'bg-white shadow-sm text-indigo-600 border border-indigo-50'}`}>
                      {isCentral ? <Users className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${isCentral ? 'text-white' : 'text-gray-900'}`}>
                        {isCentral ? 'ผู้สมัครส่วนกลาง' : `${groupKey.startsWith('คณะ') ? '' : 'คณะ '}${groupKey}`}
                      </h2>
                      <p className={`text-sm mt-1 flex items-center gap-1.5 ${isCentral ? 'text-indigo-200' : 'text-gray-500'}`}>
                        <Users className="w-4 h-4" /> จำนวน {groupCandidates.length} คน
                      </p>
                    </div>
                  </div>

                  {/* Candidate Cards Grid */}
                  <div className="p-6 sm:p-8 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                    {groupCandidates.map((candidate) => (
                      <div key={candidate.id} className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-indigo-100 flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                        <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
                          {/* Profile Image */}
                          <div className="shrink-0 relative">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-md border-4 border-white group-hover:border-indigo-50 transition-colors bg-gray-100 flex items-center justify-center">
                              {candidate.image_url ? (
                                <img
                                  src={getImageUrl(candidate.image_url)}
                                  alt={candidate.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <Users className="w-12 h-12 text-gray-300" />
                              )}
                            </div>
                            <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-center font-bold text-lg ring-4 ring-white">
                              {candidate.display_order ?? '-'}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1 space-y-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors line-clamp-2">
                                {candidate.name}
                              </h3>
                              {candidate.position && (
                                <p className="text-sm font-medium text-indigo-600 mt-1 inline-block bg-indigo-50 px-2.5 py-1 rounded-md">
                                  {candidate.position}
                                </p>
                              )}
                            </div>

                            {candidate.biography ? (
                              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                {candidate.biography}
                              </div>
                            ) : (
                              <p className="text-gray-400 text-sm italic">ไม่มีระบุข้อมูลประวัติส่วนตัว/นโยบาย</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
