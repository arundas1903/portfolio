import React, { useEffect, useState } from 'react';
import FaithDiscussChat from './chatbots/FaithDiscussChat';
import A2PRegulatoryChat from './chatbots/A2PRegulatoryChat';
import ChatPasswordGate from './chatbots/ChatPasswordGate';
import { CHATBOTS, ChatbotId } from './chatbots/catalog';
import { clearChatSession, fetchChatAccessStatus, getChatPassword, unlockChat } from '../api/chat';

type WidgetView = 'list' | ChatbotId;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<WidgetView>('list');
  const [unlocked, setUnlocked] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(true);

  const closeWidget = () => {
    setOpen(false);
    setView('list');
  };

  const handleAuthExpired = () => {
    clearChatSession();
    setUnlocked(false);
    setView('list');
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const verifyAccess = async () => {
      setCheckingAccess(true);
      try {
        const status = await fetchChatAccessStatus();
        if (cancelled) return;

        setPasswordRequired(status.required);

        if (!status.required) {
          setUnlocked(true);
          return;
        }

        const storedPassword = getChatPassword();
        if (!storedPassword) {
          setUnlocked(false);
          return;
        }

        try {
          await unlockChat(storedPassword);
          if (!cancelled) setUnlocked(true);
        } catch {
          clearChatSession();
          if (!cancelled) setUnlocked(false);
        }
      } catch {
        if (!cancelled) setUnlocked(false);
      } finally {
        if (!cancelled) setCheckingAccess(false);
      }
    };

    verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const activeChatbot = view !== 'list' ? CHATBOTS.find((b) => b.id === view) : null;

  const headerTitle = !unlocked
    ? 'Assistants'
    : view === 'list'
      ? 'Assistants'
      : activeChatbot?.title;

  const headerSubtitle = !unlocked
    ? passwordRequired ? 'Enter password to continue' : 'Loading…'
    : view === 'list'
      ? 'Choose a conversation'
      : activeChatbot?.subtitle;

  return (
    <div className="chat-widget">
      <div
        className={`chat-widget__panel ios26-liquid-glass-la glass-surface${open ? ' chat-widget__panel--open' : ''}`}
        aria-hidden={!open}
      >
        <header className="chat-widget__header">
          <div className="chat-widget__header-start">
            {unlocked && view !== 'list' && (
              <button
                type="button"
                className="chat-widget__back"
                onClick={() => setView('list')}
                aria-label="Back to assistants"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
              </button>
            )}
            <div>
              <p className="ios26-headline" style={{ margin: 0 }}>
                {headerTitle}
              </p>
              <p className="ios26-caption1" style={{ margin: 0, color: 'var(--color-label-secondary)' }}>
                {headerSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="chat-widget__close"
            onClick={closeWidget}
            aria-label="Close chat"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </header>

        {checkingAccess ? (
          <div className="chat-password-gate chat-password-gate--loading">
            <p className="ios26-footnote" style={{ margin: 0, color: 'var(--color-label-secondary)' }}>
              Checking access…
            </p>
          </div>
        ) : !unlocked ? (
          <ChatPasswordGate onUnlocked={() => setUnlocked(true)} />
        ) : view === 'list' ? (
          <div className="chat-widget__list">
            {CHATBOTS.map((bot) => (
              <button
                key={bot.id}
                type="button"
                className={`chatbot-item${bot.available ? '' : ' chatbot-item--disabled'}`}
                onClick={() => bot.available && setView(bot.id)}
                disabled={!bot.available}
              >
                <span className="chatbot-item__icon" aria-hidden>{bot.icon}</span>
                <span className="chatbot-item__text">
                  <span className="ios26-headline">{bot.title}</span>
                  <span className="ios26-footnote">{bot.subtitle}</span>
                </span>
                {bot.available ? (
                  <svg className="chatbot-item__chevron" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                  </svg>
                ) : (
                  <span className="chatbot-item__badge ios26-caption2">Soon</span>
                )}
              </button>
            ))}
          </div>
        ) : view === 'faith-discuss' ? (
          <FaithDiscussChat onAuthExpired={handleAuthExpired} />
        ) : view === 'a2p-regulatory' ? (
          <A2PRegulatoryChat onAuthExpired={handleAuthExpired} />
        ) : null}
      </div>

      <button
        type="button"
        className="chat-widget__fab ios26-liquid-glass-me glass-surface"
        onClick={() => (open ? closeWidget() : setOpen(true))}
        aria-label={open ? 'Close assistants' : 'Open assistants'}
        aria-expanded={open}
      >
        {open ? (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        )}
      </button>
    </div>
  );
}
