'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
      setLoading(false);
    });
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link href="/dashboard" className="flex items-center text-gray-900 font-medium">Dashboard</Link>
              <Link href="/dashboard/scores" className="flex items-center text-gray-600 hover:text-gray-900">Scores</Link>
              <Link href="/dashboard/charity" className="flex items-center text-gray-600 hover:text-gray-900">Charity</Link>
              <Link href="/dashboard/winners" className="flex items-center text-gray-600 hover:text-gray-900">Winners</Link>
            </div>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-red-600">Sign Out</button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
