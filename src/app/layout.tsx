import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';

const sarabun = Sarabun({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  subsets: ["thai", "latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "EasyVote 2026 | Next-Gen Voting",
  description: "Secure, reliable, and anonymous online voting system for the 2026 elections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sarabun.className} bg-gray-50 text-gray-900 antialiased flex flex-col min-h-screen`}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <div className="flex-grow flex flex-col">
            {children}
          </div>
          <footer className="w-full py-6 bg-white border-t border-gray-200 text-center">
            <div className="max-w-7xl mx-auto px-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">EasyVote &copy; {new Date().getFullYear()} v1.0.0</p>
              <p className="text-xs text-gray-500">งานพัฒนาระบบสารสนเทศ สำนักคอมพิวเตอร์ มหาวิทยาลัยมหาสารคาม</p>
              <p className="text-xs text-gray-500">พัฒนาโดย ❤️ <span className="font-bold text-indigo-600">ธนศาสตร์ สุดจริง</span></p>
            </div>
          </footer>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
