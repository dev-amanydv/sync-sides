"use client";

import React, { useEffect, useState } from "react";
import {
  loadPreferences,
  savePreferences,
  DEFAULT_PREFERENCES,
  type MeetingPreferences,
} from "@/lib/preferences";

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<MeetingPreferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setPrefs(loadPreferences());
    setLoaded(true);
  }, []);

  // Persist on every change so preferences are always saved — no separate
  // "Save" button that could leave the UI and storage out of sync.
  const update = (patch: Partial<MeetingPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      savePreferences(next);
      return next;
    });
    setSavedFlash(true);
    window.clearTimeout((update as unknown as { _t?: number })._t);
    (update as unknown as { _t?: number })._t = window.setTimeout(
      () => setSavedFlash(false),
      1500
    );
  };

  const toggles: {
    key: keyof MeetingPreferences;
    title: string;
    desc: string;
  }[] = [
    {
      key: "autoRecord",
      title: "Record automatically",
      desc: "As host, start recording as soon as your guest joins.",
    },
    {
      key: "micOn",
      title: "Join with microphone on",
      desc: "Enable your microphone by default when you join a meeting.",
    },
    {
      key: "cameraOn",
      title: "Join with camera on",
      desc: "Enable your camera by default when you join a meeting.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em] md:text-2xl">Settings</h1>
          <p className="mt-1 text-[13px] text-[#8A8F98] md:text-sm">
            Defaults applied whenever you start or join a meeting.
          </p>
        </div>
        <span
          className={`text-[12px] text-[#4CB782] transition-opacity duration-300 ${
            savedFlash ? "opacity-100" : "opacity-0"
          }`}
        >
          Saved
        </span>
      </div>

      <div className="max-w-2xl rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2">
        {toggles.map((t, i) => (
          <label
            key={t.key}
            className={`flex cursor-pointer items-center justify-between gap-4 px-4 py-4 ${
              i !== toggles.length - 1 ? "border-b border-white/[0.05]" : ""
            }`}
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-[#F7F8F8]">{t.title}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-[#8A8F98]">{t.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[t.key]}
              disabled={!loaded}
              onClick={() => update({ [t.key]: !prefs[t.key] })}
              className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${
                prefs[t.key] ? "bg-[#5E6AD2]" : "bg-white/[0.12]"
              }`}
            >
              <span
                className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  prefs[t.key] ? "translate-x-[19px]" : "translate-x-[3px]"
                }`}
              />
            </button>
          </label>
        ))}
      </div>
    </div>
  );
}
