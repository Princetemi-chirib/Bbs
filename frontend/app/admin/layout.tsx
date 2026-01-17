import AuthGuard from '@/components/AuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="ADMIN">
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        {children}
      </div>
    </AuthGuard>
  );
}
