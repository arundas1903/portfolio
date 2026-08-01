import mixpanel from 'mixpanel-browser';

const TOKEN = process.env.REACT_APP_MIXPANEL_TOKEN?.trim() ?? '';

let initialized = false;

export function initMixpanel(): void {
  if (!TOKEN || initialized || typeof window === 'undefined') {
    return;
  }

  mixpanel.init(TOKEN, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: false,
    persistence: 'localStorage',
  });

  mixpanel.register({
    app: 'portfolio',
    site: 'arundas.me',
  });

  initialized = true;
}

export function isMixpanelEnabled(): boolean {
  return initialized;
}

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!initialized) {
    return;
  }
  mixpanel.track(event, properties);
}

export function trackPageView(path: string, properties?: Record<string, unknown>): void {
  trackEvent('Page View', {
    path,
    url: window.location.href,
    title: document.title,
    ...properties,
  });
}

export function identifyUser(distinctId: string, properties?: Record<string, unknown>): void {
  if (!initialized) {
    return;
  }
  mixpanel.identify(distinctId);
  if (properties && Object.keys(properties).length > 0) {
    mixpanel.people.set(properties);
  }
}

export function resetUser(): void {
  if (!initialized) {
    return;
  }
  mixpanel.reset();
}

export function trackWebVital(
  name: string,
  value: number,
  id: string,
  path: string = window.location.pathname,
): void {
  trackEvent('Web Vital', {
    metric: name,
    value,
    id,
    path,
  });
}
