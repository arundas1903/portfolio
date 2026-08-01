import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from './mixpanel';

export default function MixpanelPageTracker() {
  const { pathname, hash, search } = useLocation();
  const lastPath = useRef('');

  useEffect(() => {
    const path = `${pathname}${search}${hash}`;
    if (path === lastPath.current) {
      return;
    }
    lastPath.current = path;
    trackPageView(path, {
      pathname,
      hash: hash || undefined,
      search: search || undefined,
    });
  }, [pathname, hash, search]);

  return null;
}
