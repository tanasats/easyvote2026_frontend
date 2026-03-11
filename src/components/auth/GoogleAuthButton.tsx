'use client';

import { useGoogleLogin } from '@react-oauth/google';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function GoogleAuthButton() {
  const { login, isAuthenticated, user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setError(null);
        // We send the access_token to our backend
        const res = await api.post('/auth/google', {
          token: tokenResponse.access_token,
        });

        const { token, user: loggedInUser } = res.data;
        login(token, loggedInUser);

        if (loggedInUser.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google Login failed.');
      setIsLoading(false);
    }
  });

  if (_hasHydrated && isAuthenticated) {
    return (
      <button
        onClick={() => router.push(user?.role === 'admin' ? '/admin' : '/dashboard')}
        className="px-6 py-2 bg-white text-indigo-700 font-bold rounded-full shadow-lg hover:bg-gray-50 transition-all active:scale-95 border border-indigo-100"
      >
        Return to Dashboard
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={() => loginWithGoogle()}
        disabled={isLoading}
        className="flex items-center gap-3 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-full shadow-lg border border-gray-200 transition-all active:scale-95 disabled:opacity-70"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
        )}
        <span>Sign in with Google</span>
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}

