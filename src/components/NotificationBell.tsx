"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell({ federationId }: { federationId: number }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/federations/${federationId}/notifications`);
    if (res.ok) setNotifications(await res.json());
  }, [federationId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markRead(id: number) {
    await fetch(`/api/federations/${federationId}/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: true }),
    });
    load();
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md px-2 py-1 text-sm text-slate-600 hover:text-slate-900"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-sm text-slate-400">No notifications.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`block w-full border-b border-slate-100 p-3 text-left text-sm hover:bg-slate-50 ${
                  n.is_read ? "text-slate-400" : "text-slate-800"
                }`}
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-xs">{n.message}</p>
                <p className="mt-1 text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
