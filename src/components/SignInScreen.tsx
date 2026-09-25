"use client";

import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, Heart } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface SignInScreenProps {
  onSignedIn: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ onSignedIn }) => {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Supabase's shared email service is rate limited per project, so every
  // extra tap costs one of a very small hourly budget. Block the button for
  // a minute after each attempt rather than letting someone burn the quota
  // in ten seconds and lock both of them out for an hour.
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    // Check URL query parameters for auth error handling
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      if (error === 'auth_failed') {
        setErrorMessage('Authentication failed or link expired. Please request a new magic link below.');
      } else if (error === 'missing_code') {
        setErrorMessage('The login link was invalid or incomplete. Please request a fresh magic link.');
      }
    }
  }, []);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || loading) return;
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setSubmittedEmail(email.trim());
    } catch (err: unknown) {
      // Never fall through to the "check your email" screen on a failure:
      // a link that was never sent must not look like one that was.
      const raw = err instanceof Error ? err.message : '';
      if (/rate limit|too many requests|over_email_send_rate/i.test(raw)) {
        // Supabase's built-in mail service, not our server. Waiting is the
        // only fix from in here; custom SMTP is the fix in the dashboard.
        setErrorMessage(
          'Too many sign-in emails were sent from this app recently. The limit is on the mail service, not your address. Wait about an hour and try again.',
        );
      } else if (/failed to fetch|networkerror|load failed/i.test(raw)) {
        setErrorMessage('Could not reach the server. Check your connection and try again.');
      } else {
        setErrorMessage(raw || 'Could not send the link. Check the address and try again.');
      }
    } finally {
      setLoading(false);
      setCooldown(60);
    }
  };

  return (
    <div
      id="screen-sign-in"
      className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto"
    >
      {/* Brand Icon */}
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 flex items-center justify-center text-white shadow-xl shadow-rose-500/20 mb-6">
        <Heart className="w-10 h-10 fill-white stroke-none" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-serif-name font-bold text-[#2b1b24] dark:text-[#f5edf2]">
        Baby Names
      </h1>
      <p className="text-sm text-[#6e5966] dark:text-[#bda9b7] mt-2 mb-8 leading-relaxed">
        Tinder for baby names for couples. Swipe together, find your perfect match.
      </p>

      {/* Error Banner */}
      {errorMessage && (
        <div className="w-full p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 mb-5 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!submittedEmail ? (
        <form onSubmit={handleSendMagicLink} className="w-full space-y-4">
          <div className="relative text-left">
            <label
              htmlFor="signin-email-input"
              className="block text-xs font-semibold uppercase tracking-wider text-[#796270] dark:text-[#ad9ba6] mb-1.5"
            >
              Your Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9e8898]" />
              <input
                id="signin-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="merel@example.com"
                className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white dark:bg-[#251b22] border border-[#ebdcd4] dark:border-[#382b35] text-sm text-[#2b1b24] dark:text-[#f5edf2] focus:outline-none focus:ring-2 focus:ring-[#e25567] placeholder:text-[#9e8898]"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-send-magic-link"
            disabled={loading || cooldown > 0 || !email.trim()}
            className="w-full py-3.5 px-4 rounded-xl font-bold bg-[#e25567] hover:bg-[#d24255] text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <span>
              {loading
                ? 'Sending link...'
                : cooldown > 0
                  ? `Wait ${cooldown}s before trying again`
                  : 'Send Magic Link'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        /* Sent Confirmation Screen */
        <div className="w-full p-6 rounded-3xl bg-white dark:bg-[#251b22] border border-[#ebdcd4] dark:border-[#382b35] shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-serif-name font-bold text-[#2b1b24] dark:text-[#f5edf2]">
            Check your email
          </h3>

          <p className="text-sm text-[#6e5966] dark:text-[#bda9b7] mt-2 mb-4 leading-relaxed">
            We sent a secure magic sign-in link to:
            <br />
            <strong className="text-[#2b1b24] dark:text-white break-all">{submittedEmail}</strong>
          </p>

          <p className="text-xs text-[#8c7483] dark:text-[#9e8b98] mb-5">
            Click the link in your email on your phone to open the app automatically.
          </p>

          <div className="space-y-2">
            <button
              type="button"
              id="btn-correct-email-typo"
              onClick={() => setSubmittedEmail(null)}
              className="text-xs font-semibold text-[#e25567] hover:underline"
            >
              Correct a typo in email address
            </button>

            <div className="pt-3">
              <button
                type="button"
                id="btn-recheck-session"
                onClick={onSignedIn}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#f4e8e1] dark:bg-[#332530] text-[#2b1b24] dark:text-[#f5edf2] hover:bg-[#ebdcd4]"
              >
                I clicked the link, check again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
