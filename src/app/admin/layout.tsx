'use client';

import { AdminDashboard } from '@/components/admin/game/AdminDashboard';
import { useCallback } from 'react';
import { format } from 'date-fns';

export default function AdminLayout() {
  const handleGameUpdate = useCallback(async () => {
    try {
      const monthParam = format(new Date(), 'yyyy-MM');
      const response = await fetch(`/api/admin/games?month=${monthParam}`);
      if (!response.ok) throw new Error('Failed to fetch games');
      await response.json();
    } catch (error) {
      console.error('Failed to fetch games:', error);
    }
  }, []);

  return <AdminDashboard onGameUpdate={handleGameUpdate} />;
} 