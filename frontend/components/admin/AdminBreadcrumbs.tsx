'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import styles from './AdminBreadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function AdminBreadcrumbs({ items }: AdminBreadcrumbsProps) {
  if (!items?.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className={styles.segment}>
            {i > 0 && <ChevronRight size={16} className={styles.separator} aria-hidden />}
            {item.href && !isLast ? (
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? styles.current : styles.label}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
