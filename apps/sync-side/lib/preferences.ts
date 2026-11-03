// User meeting preferences, persisted in localStorage. Read by the meeting
// lobby/session to seed defaults; edited on the Settings page.

export interface MeetingPreferences {
  autoRecord: boolean; // host: start recording automatically once a guest joins
  micOn: boolean; // join meetings with the microphone enabled
  cameraOn: boolean; // join meetings with the camera enabled
}

export const DEFAULT_PREFERENCES: MeetingPreferences = {
  autoRecord: false,
  micOn: true,
  cameraOn: true,
};

const KEY = "syncsides:meeting-prefs";

export const loadPreferences = (): MeetingPreferences => {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<MeetingPreferences>) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

export const savePreferences = (prefs: MeetingPreferences): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(prefs));
};
