'use client';

import { useEffect, useState } from 'react';
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { Vote, ArrowRight, Clock, ShieldCheck, Zap, Users } from "lucide-react";
import api, { getImageUrl } from '@/lib/axios';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Home() {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [timeLeftToStart, setTimeLeftToStart] = useState<TimeLeft | null>(null);
  const [electionStatus, setElectionStatus] = useState<'upcoming' | 'active' | 'ended'>('upcoming');
  const [banners, setBanners] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.election_start_time) setStartTime(new Date(res.data.election_start_time));
        if (res.data.election_end_time) setEndTime(new Date(res.data.election_end_time));
      } catch (err) {
        console.error('Failed to load election settings', err);
      }
    };

    const fetchBanners = async () => {
      try {
        const res = await api.get('/banners');
        setBanners(res.data);
      } catch (err) {
        console.error('Failed to load banners', err);
      }
    };

    fetchSettings();
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!startTime || !endTime) return;

    const calculateTimeLeft = () => {
      const now = new Date();

      if (now < startTime) {
        setElectionStatus('upcoming');
        const difference = startTime.getTime() - now.getTime();
        setTimeLeftToStart({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else if (now >= startTime && now <= endTime) {
        setElectionStatus('active');
        setTimeLeftToStart(null);
      } else {
        setElectionStatus('ended');
        setTimeLeftToStart(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [startTime, endTime]);

  // Auto-slide Banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <main className="min-h-screen bg-white">
      {/* Full Width Hero Banner - Adjusted for 2000x1000 */}
      <div className="relative w-full aspect-[16/9] min-h-[400px] max-h-[500px] sm:max-h-[600px] md:max-h-[800px] lg:max-h-[1000px] bg-indigo-900 border-b-4 sm:border-b-8 border-indigo-500 overflow-hidden flex items-center justify-center">
        {/* MSU Logo in Top Right */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20">
          <img src="/MSULogo02.png" alt="MSU Logo" className="hidden sm:block w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain drop-shadow-md" />
        </div>

        {banners.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <img src={getImageUrl(banners[currentSlide].image_url)} alt="Promotional Banner" className="w-full h-full object-cover object-center" />
            </motion.div>
          </AnimatePresence>
        ) : (
          <>
            <div className="absolute inset-0 opacity-10">
              <svg className="absolute left-0 top-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon fill="currentColor" points="0,100 100,0 100,100" />
              </svg>
            </div>
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 sm:w-96 sm:h-96 bg-blue-500 rounded-full blur-3xl opacity-30 mix-blend-multiply"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-56 h-56 sm:w-80 sm:h-80 bg-indigo-500 rounded-full blur-3xl opacity-30 mix-blend-multiply"></div>
          </>
        )}

        {/* Subtle gradient overlay to ensure text readability if overlaid */}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 via-transparent to-transparent pointer-events-none"></div>

        {/* Content Overlay (Optional, centers Text over banner if needed) */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
          {banners.length === 0 && (
            <div className="hidden sm:block pointer-events-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/20 text-indigo-100 backdrop-blur-sm border border-white/20 mb-4 sm:mb-8">
                <Vote className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase">EasyVote 2026</span>
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-4 sm:mb-6 drop-shadow-lg">
                Graduate Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300"><br className="sm:hidden" />club committee</span>
              </h1>
              <p className="hidden lg:block max-w-2xl mx-auto text-sm sm:text-lg md:text-2xl text-indigo-100 font-medium opacity-90 mb-6 sm:mb-10 px-4">
                Shaping the future of our university together. Secure, transparent, and anonymous voting for all students.
              </p>
            </div>
          )}

          {/* Dynamic Status / Actions */}
          <div className="pointer-events-auto mt-8">
            <div className="flex flex-col items-center justify-center gap-6">
              {electionStatus === 'upcoming' && timeLeftToStart && (
                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl max-w-lg w-full">
                  <div className="flex items-center justify-center gap-2 mb-4 text-indigo-200">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold text-sm uppercase tracking-wider">Voting Opens In <br />(นับถอยหลังการเลือกตั้ง)</span>
                  </div>

                  <div className="grid grid-cols-4 gap-6 text-white">
                    <div className="flex flex-col"><span className="text-4xl sm:text-5xl lg:text-6xl font-bold font-mono">{timeLeftToStart.days}</span><span className="text-xs text-indigo-200 mt-1 uppercase">Days</span></div>
                    <div className="flex flex-col"><span className="text-4xl sm:text-5xl lg:text-6xl font-bold font-mono">{timeLeftToStart.hours.toString().padStart(2, '0')}</span><span className="text-xs text-indigo-200 mt-1 uppercase">Hours</span></div>
                    <div className="flex flex-col"><span className="text-4xl sm:text-5xl lg:text-6xl font-bold font-mono">{timeLeftToStart.minutes.toString().padStart(2, '0')}</span><span className="text-xs text-indigo-200 mt-1 uppercase">Mins</span></div>
                    <div className="flex flex-col"><span className="text-4xl sm:text-5xl lg:text-6xl font-bold font-mono">{timeLeftToStart.seconds.toString().padStart(2, '0')}</span><span className="text-xs text-indigo-200 mt-1 uppercase">Secs</span></div>
                  </div>
                </div>
              )}

              {electionStatus === 'active' && (
                <div className="bg-black/20 backdrop-blur-md p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/20 flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-400 text-green-900 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
                    <Vote className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">The Polls Are Open <br />(เปิดหีบลงคะแนน)</h2>
                  <p className="text-indigo-100 text-center text-sm">It's time to make your voice heard.</p>
                  <div className="mt-4 flex flex-col items-center">
                    <GoogleAuthButton />
                  </div>
                </div>
              )}

              {electionStatus === 'ended' && (
                <div className="bg-black/20 backdrop-blur-md p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/20 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-400 text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-gray-500/30">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Election Concluded <br />(ปิดหีบลงคะแนน)</h2>
                  <p className="text-indigo-100 text-center text-sm">Thank you to everyone who participated. Polls are now officially closed.</p>
                </div>
              )}

              {/* Universal Login Button
            <div className="mt-4 flex flex-col items-center">
              <p className="text-indigo-200 text-sm mb-4 font-medium tracking-wide drop-shadow-md">Log in to view your Voter Dashboard</p>
              <div className="p-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/20 shadow-xl">
                <GoogleAuthButton />
              </div>
            </div> */}
            </div>
          </div>

          {/* Slider Dots */}
          {banners.length > 1 && (
            <div className="mt-4 sm:mt-12 flex items-center justify-center gap-2 pointer-events-auto">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`transition-all rounded-full ${idx === currentSlide ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feature Highlights section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center">
          <img src="/MSULogo02.png" alt="MSU Logo" className="block sm:hidden w-32 mx-auto" />
          <h2 className="text-4xl font-bold text-indigo-900 item-center">
            <p className=''>ระบบลงคะแนนเลือกตั้ง ผู้แทนนิสิตระดับบัณฑิตศึกษา</p>
            <div className='text-slate-600'>Election of the Graduate Student Club Committee</div>
          </h2>
        </div>
      </div>


      {/* Feature Highlights section
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-16">
          <img src="/MSULogo02.png" alt="MSU Logo" className="block sm:hidden w-32 mx-auto" />
          <h2 className="text-3xl font-bold text-indigo-700 item-center">
            <p className=''>ระบบลงคะแนนเลือกตั้ง <br />ผู้แทนนิสิตระดับบัณฑิตศึกษา</p>
            <br />
            <div className='text-slate-800'>Why Use EasyVote?</div>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">ตรวจสอบสิทธิ</h3>
            <p className="text-gray-600">ล็อคอินด้วยบัญชี Google ของมหาวิทยาลัย เพื่อตรวจสอบสิทธิในการลงคะแนนเลือกตั้งของคุณ</p>
            <div className="mt-4">
              <GoogleAuthButton />
            </div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">ข้อมูลผู้สมัคร</h3>
            <p className="text-gray-600">ข้อมูลผู้ลงสมัครรับเลือกตั้งทั้งหมด พร้อมนโยบายที่น่าสนใจ</p>
            <Link href="/candidates" className="border border-indigo-100 rounded-full shadow-lg px-6 py-3 inline-flex items-center font-bold text-indigo-700 hover:text-indigo-500 hover:bg-gray-50 mt-4">
              ดูรายชื่อผู้สมัคร
            </Link>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Vote className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">ลงคะแนน</h3>
            <p className="text-gray-600">เข้าสู่ระบบเพื่อใช้สิทธิลงคะแนนเสียงของคุณอย่างเป็นความลับและปลอดภัย </p>
            <div className="mt-4">
              <GoogleAuthButton />
            </div>
          </div>
        </div>
      </div> */}

      {/* Action Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-12">
        {/* Section 1: ตรวจสอบสิทธิการเลือกตั้ง */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-indigo-50 rounded-3xl p-8 sm:p-12 overflow-hidden relative">
          <div className="md:w-1/2 flex justify-center">
            <div className="w-64 h-64 bg-white rounded-full shadow-2xl flex items-center justify-center relative">
              <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
              <ShieldCheck className="w-32 h-32 text-indigo-600 relative z-10" />
            </div>
          </div>
          <div className="md:w-1/2 text-center md:text-left z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-900 mb-4">ตรวจสอบสิทธิการเลือกตั้ง</h2>
            <p className="text-lg text-indigo-700/80 mb-8">
              ล็อคอินด้วยบัญชี Google ของมหาวิทยาลัย เพื่อตรวจสอบสิทธิในการลงคะแนนเลือกตั้งของคุณ
            </p>
            <div className="inline-block p-1">
              <GoogleAuthButton />
            </div>
          </div>
        </div>

        {/* Section 2: ตรวจสอบข้อมูลผู้ลงสมัคร */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-8 bg-blue-50 rounded-3xl p-8 sm:p-12 overflow-hidden relative">
          <div className="md:w-1/2 flex justify-center">
            <div className="w-64 h-64 bg-white rounded-full shadow-2xl flex items-center justify-center relative">
              <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
              <Users className="w-32 h-32 text-blue-600 relative z-10" />
            </div>
          </div>
          <div className="md:w-1/2 text-center md:text-right z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 mb-4">ตรวจสอบข้อมูลผู้ลงสมัคร</h2>
            <p className="text-lg text-blue-700/80 mb-8">
              ดูรายชื่อและข้อมูลของผู้ลงสมัครรับเลือกตั้งแต่ละทีม พร้อมนโยบายที่น่าสนใจ โดยไม่ต้องล็อคอิน
            </p>
            <Link href="/candidates" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
              ดูรายชื่อผู้สมัคร
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Section 3: ลงคะแนนเลือกตั้ง */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-purple-50 rounded-3xl p-8 sm:p-12 overflow-hidden relative">
          <div className="md:w-1/2 flex justify-center">
            <div className="w-64 h-64 bg-white rounded-full shadow-2xl flex items-center justify-center relative">
              <div className="absolute inset-0 bg-purple-200 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s', animationDelay: '2s' }}></div>
              <Vote className="w-32 h-32 text-purple-600 relative z-10" />
            </div>
          </div>
          <div className="md:w-1/2 text-center md:text-left z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-purple-900 mb-4">ลงคะแนนเลือกตั้ง</h2>
            <p className="text-lg text-purple-700/80 mb-8">
              เข้าสู่ระบบเพื่อใช้สิทธิลงคะแนนเสียงของคุณอย่างเป็นความลับและปลอดภัย
            </p>
            <div className="inline-block p-1">
              <GoogleAuthButton />
            </div>
          </div>
        </div>
      </div>

      {/* Collaboration Section */}
      <div className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          {/* <p className="text-sm font-semibold text-gray-500 tracking-wide mb-8">
          </p> */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-12 sm:gap-24 opacity-90 hover:opacity-100 transition-opacity duration-300">
            <div className="flex flex-col items-center gap-4 group">
              <div className="relative w-64 h-32 flex items-center justify-center p-2 ">
                <img src="/gradmsu_logo.webp" alt="บัณฑิตวิทยาลัย มหาวิทยาลัยมหาสารคาม" className="max-w-full max-h-full object-contain drop-shadow-sm" />
              </div>
              <span className="text-gray-700 font-medium text-sm text-center">
                บัณฑิตวิทยาลัย<br />มหาวิทยาลัยมหาสารคาม<br />ผู้ประสานงาน: นางลภัสรดา นรินยา <br />โทรศัพท์: 0-4375-4412 เบอร์ภายใน 1656
              </span>
            </div>
            <div className="hidden md:block text-gray-700 font-medium text-sm text-center">
              ร่วมกับ
            </div>
            <div className="flex flex-col items-center gap-4 group">
              <div className="relative w-32 h-32 flex items-center justify-center p-2 ">
                <img src="/ccmsu_logo.png" alt="สำนักคอมพิวเตอร์ มหาวิทยาลัยมหาสารคาม" className="max-w-full max-h-full object-contain rounded-xl drop-shadow-sm" />
              </div>
              <span className="text-gray-700 font-medium text-sm text-center">
                สำนักคอมพิวเตอร์<br />มหาวิทยาลัยมหาสารคาม<br />ผู้ประสานงาน: นายธนศาสตร์ สุดจริง <br />โทรศัพท์: 0-4371-9800 เบอร์ภายใน 2458
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
