import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Barber Recruit | BBSLimited',
  description: 'Join our elite team of master barbers. Apply to become a barber with BBSLimited.',
};

export default function BarberRecruitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
