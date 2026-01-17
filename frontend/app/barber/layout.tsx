import AuthGuard from '@/components/AuthGuard';

export default function BarberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="BARBER">
      <div style={{ minHeight: '100vh', background: '#1a1a1a' }}>
        {children}
      </div>
    </AuthGuard>
  );
}
