'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Backwards-compatible route. Admin nav now points to /admin/services.
export default function AdminProductsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/services');
  }, [router]);

  return null;
}

