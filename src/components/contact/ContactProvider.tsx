'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';

const ContactContext = createContext<((trigger: HTMLElement) => void) | null>(null);

export function useContact() {
    const open = useContext(ContactContext);
    if (!open) throw new Error('Contact buttons require ContactProvider');
    return open;
}

export function ContactProvider({ children }: { children: ReactNode }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const errorDialog = useRef<HTMLDialogElement>(null);
    const opener = useRef<HTMLElement | null>(null);
    const form = useRef<HTMLFormElement>(null);
    const done = useRef<HTMLButtonElement>(null);
    const pending = useRef(false);
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        dialog.current?.showModal();
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previous; };
    }, [isOpen]);

    useEffect(() => {
        if (status === 'success' && dialog.current?.open) done.current?.focus();
    }, [status]);

    useEffect(() => {
        if (isOpen && status === 'error') {
            if (!errorDialog.current?.open) errorDialog.current?.showModal();
        } else {
            errorDialog.current?.close();
        }
    }, [isOpen, status, error]);

    const openContact = (trigger: HTMLElement) => {
        if (!dialog.current || dialog.current.open) return;
        if (status === 'success') {
            form.current?.reset();
            setStatus('idle');
        }
        opener.current = trigger;
        setIsOpen(true);
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (pending.current) return;
        const fields = new FormData(event.currentTarget);
        pending.current = true;
        setStatus('sending');
        setError('');
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(fields)),
                signal: AbortSignal.timeout(15_000),
            });
            const result: unknown = await response.json();
            if (!response.ok || !result || typeof result !== 'object' || !('ok' in result) || result.ok !== true) {
                const message = response.status === 429
                    ? 'Too many messages. Please try again later.'
                    : response.status === 503
                        ? 'Messages are temporarily unavailable.'
                        : 'Your message could not be sent. Please try again.';
                throw new Error(message);
            }
            form.current?.reset();
            setStatus('success');
        } catch (cause) {
            setError(cause instanceof Error && cause.name === 'Error'
                ? cause.message
                : 'Could not confirm delivery. Please try again.');
            setStatus('error');
        } finally {
            pending.current = false;
        }
    };

    const containTabFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
        if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
        const targets = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, input, textarea, a[href]'))
            .filter((element) => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0);
        const current = targets.indexOf(document.activeElement as HTMLElement);
        const next = event.shiftKey
            ? (current <= 0 ? targets.length - 1 : current - 1)
            : (current + 1) % targets.length;
        event.preventDefault();
        targets[next]?.focus();
    };

    const fieldClass = 'block w-full rounded-lg border border-white/30 bg-[#2d4a57]/20 px-3.5 py-3 text-base text-gray-100 placeholder:text-gray-400 focus:border-[#7bb3d1] focus:outline-none focus:ring-2 focus:ring-[#7bb3d1]/20 disabled:opacity-60';
    const buttonClass = 'w-full cursor-pointer rounded-lg bg-[#7bb3d1] px-4 py-3 text-base font-medium text-gray-900 hover:bg-[#96c5df] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7bb3d1] disabled:cursor-wait disabled:opacity-60';

    return (
        <ContactContext.Provider value={openContact}>
            {children}
            <dialog
                ref={dialog}
                aria-labelledby="contact-title"
                onClose={() => {
                    setIsOpen(false);
                    opener.current?.focus({ preventScroll: true });
                }}
                onKeyDown={containTabFocus}
                className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[520px] overflow-y-auto overscroll-contain rounded-xl border border-white/30 bg-gray-900 p-6 text-gray-100 shadow-xl backdrop:bg-gray-950/80 backdrop:backdrop-blur-sm sm:p-8"
            >
                <div className="mb-6 flex items-start justify-between gap-4">
                    <h2 id="contact-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
                        {status === 'success' ? 'Message sent!' : 'Get in touch'}
                    </h2>
                    <button
                        type="button"
                        onClick={() => dialog.current?.close()}
                        aria-label="Close contact form"
                        className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-2xl text-gray-400 hover:bg-white/10 hover:text-gray-100 focus-visible:outline-2 focus-visible:outline-[#7bb3d1]"
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                </div>
                <div hidden={status !== 'success'}>
                    <p role="status" className="mb-6 text-sm leading-relaxed text-gray-300">Thanks for reaching out. I’ll reply to the email you provided.</p>
                    <button ref={done} type="button" className={buttonClass} onClick={() => dialog.current?.close()}>Done</button>
                </div>
                <form
                    ref={form}
                    onSubmit={submit}
                    hidden={status === 'success'}
                    aria-busy={status === 'sending'}
                >
                    <fieldset disabled={status === 'sending'} className="m-0 min-w-0 space-y-5 border-0 p-0">
                        <div>
                            <label htmlFor="contact-name" className="mb-2 block text-sm text-gray-300">Name</label>
                            <input id="contact-name" name="name" autoComplete="name" autoFocus required maxLength={100} className={fieldClass} />
                        </div>
                        <div>
                            <label htmlFor="contact-email" className="mb-2 block text-sm text-gray-300">Email</label>
                            <input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} className={fieldClass} />
                        </div>
                        <div>
                            <label htmlFor="contact-message" className="mb-2 block text-sm text-gray-300">Message</label>
                            <textarea id="contact-message" name="message" required maxLength={5000} rows={5} className={`${fieldClass} min-h-32 resize-y`} />
                        </div>
                        <div className="hidden" aria-hidden="true">
                            <label htmlFor="contact-website">Leave this blank</label>
                            <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
                        </div>
                        <button type="submit" className={buttonClass}>
                            {status === 'sending' ? 'Sending…' : 'Send message'}
                        </button>
                    </fieldset>
                    <div role="status" aria-live="polite">
                        {status === 'sending' && <span className="sr-only">Sending your message.</span>}
                    </div>
                </form>
            </dialog>
            <dialog
                ref={errorDialog}
                role="alertdialog"
                aria-labelledby="contact-error-title"
                aria-describedby="contact-error-message"
                onKeyDown={containTabFocus}
                onClose={() => {
                    setStatus('idle');
                    if (dialog.current?.open) form.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
                }}
                className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[400px] overflow-y-auto rounded-xl border border-[#7bb3d1]/50 bg-gray-900 p-6 text-gray-100 shadow-xl backdrop:bg-gray-950/70 backdrop:backdrop-blur-sm sm:p-8"
            >
                <h2 id="contact-error-title" className="text-xl font-bold">Message not sent</h2>
                <p id="contact-error-message" className="mt-3 text-sm leading-relaxed text-gray-300">{error}</p>
                <a href="https://www.linkedin.com/in/di-xuan-wang/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-[#7bb3d1] underline focus-visible:outline-2 focus-visible:outline-[#7bb3d1]">Reach out on LinkedIn</a>
                <button autoFocus type="button" className={`${buttonClass} mt-6`} onClick={() => errorDialog.current?.close()}>Back to message</button>
            </dialog>
        </ContactContext.Provider>
    );
}
