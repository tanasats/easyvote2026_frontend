'use client';

import { LogOut, Vote } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const { logout } = useAuthStore();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-green-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 mb-6 border-4 border-white relative z-10">
          <Vote className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">หย่อนบัตรเรียบร้อย! <br />Vote Submitted!</h1>
        <p>
          การลงคะแนนแบบไม่ระบุชื่อของคุณได้รับการบันทึกอย่างปลอดภัยแล้ว ขอขอบคุณที่เข้าร่วมการเลือกตั้งครั้งนี้
        </p>
        <p className="text-sm text-gray-500 mb-8 max-w-[280px] mx-auto">
          Your anonymous vote has been securely recorded. Thank you for participating in the EasyVote 2026 election.
        </p>

        <div className="space-y-3">
          <Link href="/" className="block w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition flex items-center justify-center gap-2">
            Return Home
          </Link>
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="w-full py-3.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </motion.div>
    </main>
  );
}
