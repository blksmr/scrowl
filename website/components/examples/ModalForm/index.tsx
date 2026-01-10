"use client";

import { useRef, useState } from "react";
import { useDomet } from "domet";

const FORM_SECTIONS = [
  { id: "personal", title: "Personal Info", icon: "👤" },
  { id: "address", title: "Address", icon: "📍" },
  { id: "payment", title: "Payment", icon: "💳" },
  { id: "preferences", title: "Preferences", icon: "⚙️" },
  { id: "review", title: "Review", icon: "✅" },
];

const SECTION_IDS = FORM_SECTIONS.map((s) => s.id);

export function ModalForm() {
  const [isOpen, setIsOpen] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { active, scroll, sections, register, link } = useDomet({
    ids: SECTION_IDS,
    container: scrollContainerRef,
    offset: "10%"
  });

  return (
    <>
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Open Settings Modal
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[80vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Configure your account
                </p>
              </div>

              <nav className="flex-1 overflow-y-auto p-3">
                <div className="flex flex-col gap-1">
                  {FORM_SECTIONS.map(({ id, title, icon }) => {
                    const isActive = active === id;
                    const sectionState = sections[id];
                    const progress = sectionState?.progress ?? 0;

                    return (
                      <button
                        key={id}
                        {...link(id)}
                        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${
                          isActive
                            ? "bg-gray-900 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <span className="text-base">{icon}</span>
                        <span className="flex-1 font-medium">{title}</span>
                        {isActive && (
                          <span className="text-xs opacity-60">
                            {Math.round(progress * 100)}%
                          </span>
                        )}
                        {isActive && (
                          <div
                            className="absolute bottom-0 left-0 h-0.5 bg-white/30"
                            style={{ width: `${progress * 100}%` }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </nav>

              <div className="border-t border-gray-200 p-3">
                <div className="rounded-lg bg-white p-3 text-xs shadow-sm">
                  <div className="mb-2 font-medium text-gray-700">Progress</div>
                  <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full bg-gray-900"
                      style={{ width: `${scroll.progress * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{Math.round(scroll.progress * 100)}% complete</span>
                    <span>{scroll.direction === "down" ? "↓" : scroll.direction === "up" ? "↑" : "—"}</span>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {FORM_SECTIONS.find((s) => s.id === active)?.title ?? "Settings"}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    Step {SECTION_IDS.indexOf(active ?? "") + 1} of {SECTION_IDS.length}
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto"
              >
                <div className="p-6">
                  <section {...register("personal")} className="mb-8">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Personal Information
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            First Name
                          </label>
                          <input
                            type="text"
                            placeholder="John"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Last Name
                          </label>
                          <input
                            type="text"
                            placeholder="Doe"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Phone
                        </label>
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Bio
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Tell us about yourself..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </section>

                  <section {...register("address")} className="mb-8">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Address
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Street Address
                        </label>
                        <input
                          type="text"
                          placeholder="123 Main Street"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Apartment, suite, etc.
                        </label>
                        <input
                          type="text"
                          placeholder="Apt 4B"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            City
                          </label>
                          <input
                            type="text"
                            placeholder="New York"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            State
                          </label>
                          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none">
                            <option>NY</option>
                            <option>CA</option>
                            <option>TX</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            ZIP
                          </label>
                          <input
                            type="text"
                            placeholder="10001"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Country
                        </label>
                        <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none">
                          <option>United States</option>
                          <option>Canada</option>
                          <option>United Kingdom</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  <section {...register("payment")} className="mb-8">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Payment Method
                    </h3>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        {["Visa", "Mastercard", "Amex"].map((card) => (
                          <label
                            key={card}
                            className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-gray-300 p-4 transition-colors hover:border-gray-400"
                          >
                            <input type="radio" name="card" className="sr-only" />
                            <span className="text-sm font-medium text-gray-700">{card}</span>
                          </label>
                        ))}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Card Number
                        </label>
                        <input
                          type="text"
                          placeholder="4242 4242 4242 4242"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            CVC
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Name on Card
                        </label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                        />
                      </div>
                      <div className="rounded-lg bg-gray-50 p-4">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm text-gray-600">
                            Save card for future purchases
                          </span>
                        </label>
                      </div>
                    </div>
                  </section>

                  <section {...register("preferences")} className="mb-8">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Preferences
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="mb-3 text-sm font-medium text-gray-700">
                          Notifications
                        </h4>
                        <div className="space-y-3">
                          {[
                            { label: "Email notifications", desc: "Receive updates via email" },
                            { label: "SMS notifications", desc: "Receive updates via text" },
                            { label: "Push notifications", desc: "Receive push notifications" },
                            { label: "Marketing emails", desc: "Receive promotional content" },
                          ].map((pref) => (
                            <label key={pref.label} className="flex items-start gap-3">
                              <input type="checkbox" className="mt-1 rounded" defaultChecked />
                              <div>
                                <div className="text-sm font-medium text-gray-700">{pref.label}</div>
                                <div className="text-xs text-gray-500">{pref.desc}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="mb-3 text-sm font-medium text-gray-700">
                          Privacy
                        </h4>
                        <div className="space-y-3">
                          {[
                            { label: "Profile visibility", desc: "Make your profile public" },
                            { label: "Show activity status", desc: "Let others see when you're online" },
                            { label: "Data sharing", desc: "Share anonymous usage data" },
                          ].map((pref) => (
                            <label key={pref.label} className="flex items-start gap-3">
                              <input type="checkbox" className="mt-1 rounded" />
                              <div>
                                <div className="text-sm font-medium text-gray-700">{pref.label}</div>
                                <div className="text-xs text-gray-500">{pref.desc}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="mb-3 text-sm font-medium text-gray-700">
                          Language & Region
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Language</label>
                            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                              <option>English</option>
                              <option>French</option>
                              <option>Spanish</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Timezone</label>
                            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                              <option>UTC-5 (Eastern)</option>
                              <option>UTC-8 (Pacific)</option>
                              <option>UTC+0 (GMT)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section {...register("review")} className="mb-8">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Review & Submit
                    </h3>
                    <div className="space-y-4">
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h4 className="mb-3 text-sm font-medium text-gray-700">Summary</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Personal Info</span>
                            <span className="text-green-600">✓ Complete</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Address</span>
                            <span className="text-green-600">✓ Complete</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payment</span>
                            <span className="text-green-600">✓ Complete</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Preferences</span>
                            <span className="text-green-600">✓ Complete</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-4">
                        <label className="flex items-start gap-2">
                          <input type="checkbox" className="mt-1 rounded" />
                          <span className="text-sm text-gray-600">
                            I agree to the Terms of Service and Privacy Policy. I understand that my
                            information will be processed according to the privacy policy.
                          </span>
                        </label>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsOpen(false)}
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            alert("Settings saved!");
                            setIsOpen(false);
                          }}
                          className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
