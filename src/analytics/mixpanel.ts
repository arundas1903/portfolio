import mixpanel from 'mixpanel-browser';

const TOKEN = process.env.REACT_APP_MIXPANEL_TOKEN?.trim() ?? '';
const API_HOST = process.env.REACT_APP_MIXPANEL_API_HOST?.trim();

let initialized = false;

function isLocalDevelopment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function isDebugEnabled(): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).has('mp_debug');
}

function buildInitConfig(persistence: 'localStorage' | 'cookie') {
  return {
    debug: isDebugEnabled(),
    track_pageview: false,
    persistence,
    ignore_dnt: true,
    ...(API_HOST ? { api_host: API_HOST } : {}),
  };
}

export function initMixpanel(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (isLocalDevelopment()) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[mixpanel] disabled on localhost during development');
    }
    return;
  }

  if (!TOKEN) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[mixpanel] REACT_APP_MIXPANEL_TOKEN is not set — analytics disabled');
    }
    return;
  }

  if (initialized) {
    return;
  }

  try {
    mixpanel.init(TOKEN, buildInitConfig('localStorage'));
  } catch (error) {
    console.warn('[mixpanel] localStorage init failed, falling back to cookie persistence', error);
    mixpanel.init(TOKEN, buildInitConfig('cookie'));
  }

  if (mixpanel.has_opted_out_tracking()) {
    mixpanel.opt_in_tracking();
  }

  mixpanel.register({
    app: 'portfolio',
    site: 'arundas.me',
  });

  initialized = true;

  if (isDebugEnabled()) {
    console.info('[mixpanel] initialized', { token: `${TOKEN.slice(0, 6)}…`, apiHost: API_HOST || 'default' });
  }
}

export function isMixpanelEnabled(): boolean {
  return initialized;
}

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!initialized) {
    return;
  }

  mixpanel.track(event, properties);

  if (isDebugEnabled()) {
    console.info('[mixpanel] track', event, properties);
  }
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
