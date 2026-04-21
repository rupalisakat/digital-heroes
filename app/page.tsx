export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white">
      <h1 className="text-5xl font-bold text-gray-900">Digital Heroes</h1>
      <p className="text-xl text-gray-600 mt-4">Golf for good – subscribe, play, donate, win.</p>
      <div className="mt-8 flex gap-4">
        <a href="/signup" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition">
          Get Started
        </a>
        <a href="/login" className="border border-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition">
          Sign In
        </a>
      </div>
    </main>
  );
}