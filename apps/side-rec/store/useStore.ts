import { create } from 'zustand';

type State = {
  user: {
    userId: string;
    email: string;
  } | null;
  meetings: any[];
  meetingId: string | null;
  setUser: (user: { userId: string; email: string }) => void;
  setMeetings: (meetings: any[]) => void;
  setMeetingId: (id: string) => void;
  clearState: () => void;
};

export const useStore = create<State>((set) => ({
  meetings: [],
  user: null,
  meetingId: null,
  setUser: (user) => set({ user }),
  setMeetingId: (id) => set({ meetingId: id }),
  setMeetings: (meetings) => set({ meetings }),
  clearState: () =>
    set({
      user: null,
      meetingId: null,
      meetings: [],
    }),
}));