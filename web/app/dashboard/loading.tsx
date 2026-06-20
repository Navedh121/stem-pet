// Shown by Next.js while the dashboard Server Component is rendering
// (fetching session, loading children/attempts, etc.). This prevents
// a blank screen during the initial load.

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="w-6 h-6 border-2 border-silk/20 border-t-web-blue rounded-full animate-spin" />
    </div>
  );
}
