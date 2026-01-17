import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Become a Barber | BBSLimited',
  description: 'Transform your passion into a distinguished career. Master the ancient art of barbering with modern techniques.',
};

export default function BecomeBarberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
