import { create } from 'zustand';

type State = {
  user: {
    userId: string;
    username: string;
  } | null;
  meetings: any[];
  meetingId: string | null;
  setUser: (user: { userId: string; username: string }) => void;
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