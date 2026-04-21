'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (!profile?.is_admin) router.push('/dashboard');
      else setIsAdmin(true);
    };
    checkAdmin();
  }, [router]);

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center">Checking permissions...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-6">
          <Link href="/admin" className="text-gray-700 hover:text-gray-900">Admin Home</Link>
          <Link href="/admin/users" className="text-gray-700 hover:text-gray-900">Users</Link>
          <Link href="/admin/draws" className="text-gray-700 hover:text-gray-900">Draws</Link>
          <Link href="/admin/charities" className="text-gray-700 hover:text-gray-900">Charities</Link>
          <Link href="/admin/winners" className="text-gray-700 hover:text-gray-900">Winners</Link>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}