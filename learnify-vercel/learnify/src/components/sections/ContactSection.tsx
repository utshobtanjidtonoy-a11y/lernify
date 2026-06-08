"use client";

import { useState } from "react";

const contactInfo = [
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: "Email",
    value: "hello@learnify.app",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: "Location",
    value: "San Francisco, CA",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: "Response Time",
    value: "Within 24 hours",
  },
];

export default function ContactSection() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  const inputClass = "w-full px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 focus:border-blue-400 dark:focus:border-blue-600 transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-500";

  return (
    <section id="contact" className="py-24 lg:py-32 bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 dark:bg-blue-950/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none opacity-60" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-full border border-blue-100 dark:border-blue-800 mb-4">
            Contact
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
            We'd love to <span className="gradient-text">hear from you</span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
            Have a question, idea, or just want to say hello? Drop us a message and we'll get back to you promptly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start max-w-5xl mx-auto">
          {/* Left info */}
          <div className="lg:col-span-2 space-y-6">
            {contactInfo.map((info) => (
              <div key={info.label} className="flex items-center gap-4 group">
                <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/60 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 flex-shrink-0">
                  {info.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{info.label}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{info.value}</p>
                </div>
              </div>
            ))}

            <div className="mt-8 bg-blue-50 dark:bg-blue-950/40 rounded-2xl p-5 border border-blue-100 dark:border-blue-900">
              <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Looking for quick answers?</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Check out our FAQ for instant answers to common questions.</p>
              <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer">
                Browse FAQ
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Right form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="bg-white dark:bg-slate-900 border border-green-100 dark:border-green-900/40 rounded-2xl p-10 text-center shadow-sm">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Message Sent!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Thanks for reaching out, {formData.name}! We'll be in touch within 24 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", subject: "", message: "" }); }}
                  className="mt-6 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-8 shadow-sm space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Full Name <span className="text-blue-500">*</span>
                    </label>
                    <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Alex Johnson" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Email <span className="text-blue-500">*</span>
                    </label>
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="alex@example.com" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Subject</label>
                  <select name="subject" value={formData.subject} onChange={handleChange} className={inputClass}>
                    <option value="">Select a topic…</option>
                    <option value="general">General Inquiry</option>
                    <option value="feedback">Product Feedback</option>
                    <option value="bug">Report a Bug</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Message <span className="text-blue-500">*</span>
                  </label>
                  <textarea name="message" rows={5} value={formData.message} onChange={handleChange} placeholder="Tell us what's on your mind…" className={`${inputClass} resize-none`} />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.name || !formData.email || !formData.message}
                  className="w-full py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-blue-300/50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      Send Message
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
