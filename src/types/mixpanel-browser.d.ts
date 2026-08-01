declare module 'mixpanel-browser' {
  interface MixpanelPeople {
    set(properties: Record<string, unknown>): void;
  }

  interface Mixpanel {
    init(token: string, config?: Record<string, unknown>): void;
    track(event: string, properties?: Record<string, unknown>): void;
    identify(distinctId: string): void;
    people: MixpanelPeople;
    register(properties: Record<string, unknown>): void;
    reset(): void;
  }

  const mixpanel: Mixpanel;
  export default mixpanel;
}
