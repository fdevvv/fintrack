import { useState, useCallback } from 'react';
import { useStore } from '@/stores/useStore';

const storageKey = (uid) => `ft_icons_${uid}`;

export function useItemIcons() {
  const { userId } = useStore();

  const [icons, setIcons] = useState(() => {
    if (!userId) return {};
    try { return JSON.parse(localStorage.getItem(storageKey(userId)) || '{}'); } catch { return {}; }
  });

  const setIcon = useCallback((itemName, emoji) => {
    if (!userId) return;
    setIcons(prev => {
      const next = { ...prev };
      if (emoji) next[itemName] = emoji;
      else delete next[itemName];
      try { localStorage.setItem(storageKey(userId), JSON.stringify(next)); } catch {}
      return next;
    });
  }, [userId]);

  return { icons, setIcon };
}
