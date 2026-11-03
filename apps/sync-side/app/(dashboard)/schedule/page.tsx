import React from "react";
import { GrSchedule } from "react-icons/gr";

const SchedulePage = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-[-0.01em] md:text-2xl">Schedule</h1>
        <p className="mt-1 text-[13px] text-[#8A8F98] md:text-sm">
          Plan and manage your upcoming meetings.
        </p>
      </div>

      <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-16 text-center">
        <div className="lobby-rise flex max-w-sm flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
            <GrSchedule className="h-5 w-5 text-[#8C93E8]" />
          </div>
          <h2 className="mt-4 text-[15px] font-medium text-[#F7F8F8]">Scheduling is coming soon</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#8A8F98]">
            You&apos;ll be able to schedule meetings in advance, send calendar invites, and get
            reminders here. For now, start an instant meeting from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
