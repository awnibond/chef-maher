"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ModerationMessage = {
  id: string;
  name: string | null;
  message: string | null;
  audio_path: string | null;
  audio_duration: number | null;
  status: string | null;
  created_at: string | null;
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ModerationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});

  const loadMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_messages")
      .select("id,name,message,audio_path,audio_duration,status,created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMessages(data as ModerationMessage[]);
      const urlMap: Record<string, string> = {};

      for (const row of data) {
        if (row.audio_path) {
          const { data: signed } = await supabase.storage
            .from("support-audio")
            .createSignedUrl(row.audio_path, 60 * 60);
          if (signed?.signedUrl) {
            urlMap[row.id] = signed.signedUrl;
          }
        }
      }

      setAudioUrls(urlMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    const { error } = await supabase.from("support_messages").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) {
      alert(`Failed to update message: ${error.message}`);
      return;
    }
    await loadMessages();
  };

  const pending = messages.filter((m) => m.status === "pending");
  const approved = messages.filter((m) => m.status === "approved");

  return (
    <main className="min-h-screen bg-[#fff7f4] px-4 py-8 text-[#3c2c2c] md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[28px] border border-[#ffd1dc] bg-white p-6 shadow-[0_12px_30px_rgba(242,106,75,0.10)]">
          <h1 className="text-4xl font-black text-[#ef5d46]">Chef Maher Admin Messages</h1>
          <p className="mt-2 text-[#7a5d5d]">
            Review pending yummy wall submissions, listen to voice notes, and approve or reject them.
          </p>
        </div>

        <section className="rounded-[28px] border border-[#ffd1dc] bg-white p-6 shadow-[0_12px_30px_rgba(242,106,75,0.10)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#ef5d46]">Pending messages ({pending.length})</h2>
            <button
              type="button"
              onClick={loadMessages}
              className="rounded-full bg-[#fff1f5] px-4 py-2 text-sm font-bold text-[#d24e6e]"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-[#7a5d5d]">Loading messages...</p>
          ) : pending.length === 0 ? (
            <div className="rounded-2xl bg-[#fff7f1] p-4 text-[#7a5d5d]">No pending messages right now.</div>
          ) : (
            <div className="space-y-4">
              {pending.map((entry) => (
                <div key={entry.id} className="rounded-[24px] border border-[#ffe0e8] bg-[#fffafc] p-5">
                  <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-xl font-black text-[#3c2c2c]">{entry.name || "A kind neighbor"}</div>
                      <div className="text-sm text-[#8b6b6b]">
                        {entry.created_at ? new Date(entry.created_at).toLocaleString() : "No date"}
                      </div>
                    </div>
                    <div className="rounded-full bg-[#fff1f5] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#d24e6e]">
                      {entry.status}
                    </div>
                  </div>

                  <div className="mb-4 rounded-2xl bg-white px-4 py-3 text-[#6f5656]">
                    {entry.message || "No text message"}
                  </div>

                  {entry.audio_path ? (
                    <div className="mb-4 rounded-2xl bg-[#fff7f1] p-4">
                      <div className="mb-2 text-sm font-bold text-[#c95b52]">Voice note</div>
                      {audioUrls[entry.id] ? (
                        <audio controls src={audioUrls[entry.id]} className="w-full" />
                      ) : (
                        <p className="text-sm text-[#8b6b6b]">Loading audio...</p>
                      )}
                      {entry.audio_duration ? (
                        <p className="mt-2 text-xs text-[#8b6b6b]">Duration: {entry.audio_duration}s</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mb-4 rounded-2xl bg-[#fff7f1] p-4 text-sm text-[#8b6b6b]">No audio attached.</div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busyId === entry.id}
                      onClick={() => updateStatus(entry.id, "approved")}
                      className="rounded-full bg-[#25D366] px-5 py-3 font-bold text-white disabled:opacity-70"
                    >
                      {busyId === entry.id ? "Working..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === entry.id}
                      onClick={() => updateStatus(entry.id, "rejected")}
                      className="rounded-full bg-[#ef5d46] px-5 py-3 font-bold text-white disabled:opacity-70"
                    >
                      {busyId === entry.id ? "Working..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-[#ffd1dc] bg-white p-6 shadow-[0_12px_30px_rgba(242,106,75,0.10)]">
          <h2 className="mb-4 text-2xl font-black text-[#ef5d46]">Approved messages ({approved.length})</h2>
          {approved.length === 0 ? (
            <div className="rounded-2xl bg-[#fff7f1] p-4 text-[#7a5d5d]">No approved messages yet.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {approved.map((entry) => (
                <div key={entry.id} className="rounded-[24px] border border-[#ffe0e8] bg-[#fffafc] p-4">
                  <div className="mb-2 font-black text-[#3c2c2c]">{entry.name || "A kind neighbor"}</div>
                  <p className="text-sm text-[#6f5656]">{entry.message || "No text message"}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
