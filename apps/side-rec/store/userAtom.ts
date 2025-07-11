import { atom } from "recoil";

export const userState = atom({
    key: 'userState',
    default:{
        userId: "",
        fullname: "",
        email: "",
        profilePic: ""
    }
})

interface Meeting {
    id: number;
    meetingId: string;
    title: string;
    hostId: number;
    host: any; // Optional: You can define a proper User interface if needed
    participants: any[]; // Optional: Define Participant type for better typing
    createdAt: string;
    mergedPath?: string;
    durationMs?: number;
    uploaded: boolean;
    status: "uploading" | "processing" | "available";
}

export const meetingsState = atom<Meeting[]>({
    key: 'meetingsState',
    default: []
})