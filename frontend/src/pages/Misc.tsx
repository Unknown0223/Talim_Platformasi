import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Badge, Button, Card, NameWithEmoji } from "../components/ui";
import {
  ITrophy,
  IUsers,
} from "../components/icons";
import { messages as messagesApi, subjects as subjectsApi, tests as testsApi, studyPlan as studyPlanApi, attendance as attendanceApi, dashboard as dashboardApi, courses as coursesApi, rankings as rankingsApi, teachers as teachersApi, feedback as feedbackApi, type FeedbackItem } from "../services/api";
import { hasPermission } from "../utils/permissions";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../services/socket";

/* ==================== MESSAGES ==================== */
export function Messages() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [invites, setInvites] = useState<any>({ incoming: [], outgoing: [], pendingCount: 0 });
  const [activeId, setActiveId] = useState<string>("");
  const [history, setHistory] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [call, setCall] = useState<any | null>(null);
  const [callInfoOpen, setCallInfoOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const lastSeenHistoryLenRef = useRef(0);
  const wasAtBottomRef = useRef(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const reload = () => {
    setLoading(true);
    Promise.all([messagesApi.contacts().catch(() => []), messagesApi.invites().catch(() => ({ incoming: [], outgoing: [], pendingCount: 0 }))])
      .then(([list, inviteData]) => {
        const arr = Array.isArray(list) ? list : [];
        setContacts(arr);
        setInvites(inviteData || { incoming: [], outgoing: [], pendingCount: 0 });
        setActiveId((prev) => prev || arr[0]?.conversationId || arr[0]?.id || "");
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Kontaktlar yuklanmadi"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () => reload();
    const onMessage = (payload: any) => {
      if (payload?.conversationId === activeId) setHistory((prev) => [...prev, payload.message]);
      refresh();
    };
    const onMessageUpdate = (payload: any) => {
      if (payload?.conversationId === activeId && payload?.message?.id) {
        setHistory((prev) => prev.map((m) => (m.id === payload.message.id ? payload.message : m)));
      }
      refresh();
    };
    const isOwnSignal = (payload: any) => payload?.fromUserId && payload.fromUserId === user?.id;
    const onCall = (payload: any) => {
      if (isOwnSignal(payload)) return;
      refresh();
      setCall((prev: any) => ({ ...(prev || {}), ...payload, incoming: true, status: payload.status || "ringing" }));
    };
    const onOffer = async (payload: any) => {
      if (isOwnSignal(payload)) return;
      setCall((prev: any) => ({ ...(prev || {}), ...payload, incoming: true, status: "offer" }));
    };
    const onAnswer = async (payload: any) => {
      if (isOwnSignal(payload)) return;
      if (payload.answer && peerRef.current && peerRef.current.signalingState === "have-local-offer") {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer)).catch(() => {});
      }
      refresh();
      setCall((prev: any) => ({ ...(prev || {}), ...payload, status: "connected" }));
    };
    const onIce = async (payload: any) => {
      if (isOwnSignal(payload)) return;
      if (payload.candidate && peerRef.current) await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => {});
    };
    socket.on("message:new", onMessage);
    socket.on("message:update", onMessageUpdate);
    socket.on("invite:new", refresh);
    socket.on("invite:accepted", refresh);
    socket.on("invite:rejected", refresh);
    socket.on("presence:update", refresh);
    socket.on("call:ring", onCall);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice", onIce);
    const onCallEnd = () => {
      refresh();
      endCall(false);
    };
    socket.on("call:end", onCallEnd);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("message:update", onMessageUpdate);
      socket.off("invite:new", refresh);
      socket.off("invite:accepted", refresh);
      socket.off("invite:rejected", refresh);
      socket.off("presence:update", refresh);
      socket.off("call:ring", onCall);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice", onIce);
      socket.off("call:end", onCallEnd);
    };
  }, [activeId, user?.id]);

  // Optional deep-link: /messages?to=<userId>&text=<draft>
  useEffect(() => {
    if (!contacts.length) return;
    const sp = new URLSearchParams(window.location.search);
    const to = sp.get("to") || "";
    const text = sp.get("text") || "";
    if (to) setActiveId(to);
    if (text) setMsg(text);
  }, [contacts.length]);

  useEffect(() => {
    if (!activeId) return;
    setHistory([]);
    lastSeenHistoryLenRef.current = 0;
    wasAtBottomRef.current = true;
    setUnreadCount(0);
    messagesApi
      .history(activeId)
      .then((list) => setHistory(Array.isArray(list) ? list : []))
      .catch(() => setHistory([]));
  }, [activeId]);

  const scrollChatToBottom = (smooth = true) => {
    const el = chatScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    });
  };

  const handleChatScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance < 120;
    wasAtBottomRef.current = atBottom;
    if (atBottom && unreadCount) setUnreadCount(0);
  };

  useEffect(() => {
    const query = searchQ.trim();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = window.setTimeout(() => {
      messagesApi.searchUsers(query).then((list) => setSearchResults(Array.isArray(list) ? list : [])).catch(() => setSearchResults([]));
    }, 250);
    return () => window.clearTimeout(t);
  }, [searchQ]);

  const current = contacts.find((c) => (c.conversationId || c.id) === activeId);
  const activeConversationId = current?.conversationId || current?.id || activeId;
  const activeCall = current?.activeCall && !["ended", "rejected"].includes(String(current.activeCall.status || ""))
    ? current.activeCall
    : null;
  const visibleHistory = useMemo(() => {
    const rows: any[] = [];
    const callRowIndex = new Map<string, number>();
    for (const item of history) {
      const callPayload = parseCallMessage(item?.text);
      if (callPayload?.callId) {
        const existingIndex = callRowIndex.get(String(callPayload.callId));
        if (existingIndex != null) rows[existingIndex] = item;
        else {
          callRowIndex.set(String(callPayload.callId), rows.length);
          rows.push(item);
        }
      } else {
        rows.push(item);
      }
    }
    return rows;
  }, [history]);

  // Auto-scroll on initial chat load and on new messages.
  useEffect(() => {
    const len = visibleHistory.length;
    const prev = lastSeenHistoryLenRef.current;
    if (len === 0) {
      lastSeenHistoryLenRef.current = 0;
      return;
    }
    const last = visibleHistory[len - 1];
    const isOwn = last?.senderId === user?.id;
    if (prev === 0) {
      scrollChatToBottom(false);
      setUnreadCount(0);
    } else if (len > prev) {
      if (wasAtBottomRef.current || isOwn) {
        scrollChatToBottom(true);
        setUnreadCount(0);
      } else {
        setUnreadCount((c) => c + (len - prev));
      }
    }
    lastSeenHistoryLenRef.current = len;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleHistory.length, user?.id]);

  const roleLabel = (role?: string) => {
    const map: Record<string, string> = {
      student: "Talaba",
      teacher: "Ustoz",
      cashier: "Kassir",
      admin: "Admin",
      receptionist: "Qabulxona",
      parent: "Ota-ona",
      group: "Guruh",
    };
    return map[String(role || "")] || role || "Foydalanuvchi";
  };
  const callPeer = call
    ? contacts.find((c) => {
        const memberMatch = Array.isArray(c.members) && c.members.some((m: any) => m?.id === call.fromUserId || m?.id === call.toUserId || m?.id === call.calleeId);
        return (c.conversationId || c.id) === call.conversationId || memberMatch;
      }) || current
    : current;

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    if (remoteVideoRef.current && remoteStreamRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
  }, [call?.id, call?.status]);

  const sendCurrent = async () => {
    if (!activeConversationId || (!msg.trim() && !attachments.length) || sending) return;
    const text = msg.trim();
    const payloadAttachments = attachments;
    try {
      setSending(true);
      setError("");
      setMsg("");
      setAttachments([]);
      await messagesApi.send({ conversationId: activeConversationId, content: text, attachments: payloadAttachments });
      const h = await messagesApi.history(activeConversationId);
      setHistory(Array.isArray(h) ? h : []);
      reload();
    } catch (e: any) {
      setMsg(text);
      setAttachments(payloadAttachments);
      setError(e?.message || "Xabar yuborilmadi");
    } finally {
      setSending(false);
    }
  };
  const attachLocalStream = (stream: MediaStream) => {
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
  };

  const createPeer = (callPayload: any) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peerRef.current = pc;
    remoteStreamRef.current = new MediaStream();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
    localStreamRef.current?.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current as MediaStream));
    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => remoteStreamRef.current?.addTrack(track));
      if (remoteVideoRef.current && remoteStreamRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) getSocket()?.emit("call:ice", { ...callPayload, candidate: event.candidate });
    };
    return pc;
  };

  const getDirectCalleeId = () => {
    if (!current || current.type === "group") return null;
    const other = (current.members || []).find((m: any) => m?.id && m.id !== user?.id);
    return other?.id || null;
  };

  const startCall = async (type: "audio" | "video") => {
    if (!current || !activeConversationId) return;
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "video" });
      attachLocalStream(stream);
      setMicMuted(false);
      setCameraOff(false);
      const callSession = await messagesApi.createCall({ conversationId: activeConversationId, calleeId: getDirectCalleeId(), type });
      const callPayload = { ...callSession, conversationId: activeConversationId, toUserId: getDirectCalleeId(), type };
      setCall({ ...callPayload, incoming: false, status: "calling" });
      const pc = createPeer(callPayload);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (callSession.id) await messagesApi.updateCall(callSession.id, { offer }).catch(() => {});
      getSocket()?.emit("call:offer", { ...callPayload, offer });
      reload();
    } catch (e: any) {
      setError(e?.message || "Qo‘ng‘iroq boshlanmadi. Kamera/mikrofonga ruxsat bering.");
      endCall(false);
    }
  };

  const acceptCall = async () => {
    if (!call) return;
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call.type === "video" });
      attachLocalStream(stream);
      setMicMuted(false);
      setCameraOff(false);
      const pc = createPeer(call);
      if (call.offer) await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      getSocket()?.emit("call:answer", { ...call, answer, toUserId: call.fromUserId });
      if (call.id) await messagesApi.updateCall(call.id, { status: "accepted", answer }).catch(() => {});
      setCall((prev: any) => ({ ...(prev || call), incoming: false, status: "connected" }));
    } catch (e: any) {
      setError(e?.message || "Qo‘ng‘iroq qabul qilinmadi.");
      endCall(true);
    }
  };

  const joinActiveCall = async (targetCall = activeCall) => {
    if (!targetCall) return;
    try {
      setCallInfoOpen(false);
      setError("");
      const nextCall = { ...targetCall, conversationId: activeConversationId, incoming: false, status: "connected" };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: nextCall.type === "video" });
      attachLocalStream(stream);
      setMicMuted(false);
      setCameraOff(false);
      if (nextCall.offer) {
        const pc = createPeer(nextCall);
        await pc.setRemoteDescription(new RTCSessionDescription(nextCall.offer)).catch(() => {});
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer).catch(() => {});
        getSocket()?.emit("call:answer", { ...nextCall, answer, toUserId: nextCall.callerId || nextCall.fromUserId });
        await messagesApi.updateCall(nextCall.id, { status: "accepted", answer }).catch(() => {});
      } else {
        await messagesApi.updateCall(nextCall.id, { status: "accepted" }).catch(() => {});
      }
      setCall(nextCall);
      reload();
    } catch (e: any) {
      setError(e?.message || "Qo‘ng‘iroqqa qo‘shilib bo‘lmadi. Kamera/mikrofonga ruxsat bering.");
    }
  };

  const endCall = (notify = true) => {
    if (notify && call) {
      getSocket()?.emit("call:end", { ...call, toUserId: call.fromUserId || getDirectCalleeId() });
      if (call.id) messagesApi.updateCall(call.id, { status: "ended" }).catch(() => {});
    }
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setCall(null);
    if (notify) reload();
  };

  const toggleMic = () => {
    const next = !micMuted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setMicMuted(next);
  };

  const toggleCamera = () => {
    const next = !cameraOff;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !next;
    });
    setCameraOff(next);
  };

  return (
    <div className="mx-auto max-w-7xl animate-fade-in">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Xabarlar & Chat</h1>
          <p className="mt-1 text-sm text-slate-400">
            {error ? <span className="text-rose-300">{error}</span> : `${contacts.length} ta kontakt`}
          </p>
        </div>
        <Button variant="gradient" onClick={() => setShowNew(true)}>
          + Yangi suhbat yaratish
          {invites.pendingCount > 0 && <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px]">{invites.pendingCount}</span>}
        </Button>
      </div>
      {showNew && (
        <Card className="mb-5 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">User qidirish va invite</div>
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Ism, email yoki student ID..."
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-200 focus:border-primary-500/60 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Group chat</div>
              <input
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="Guruh nomi..."
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-200 focus:border-primary-500/60 focus:outline-none"
              />
            </div>
            <Button
              disabled={!groupTitle.trim() || selectedMembers.length === 0}
              onClick={async () => {
                await messagesApi.createGroup({ title: groupTitle, memberIds: selectedMembers });
                setGroupTitle("");
                setSelectedMembers([]);
                setShowNew(false);
                reload();
              }}
            >
              Group yaratish
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="soft" onClick={() => setSelectedMembers((prev) => prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id])}>
                      {selectedMembers.includes(u.id) ? "Tanlandi" : "Groupga"}
                    </Button>
                    <Button size="sm" onClick={async () => { await messagesApi.createInvite({ receiverId: u.id, message: "Suhbatlashamizmi?" }); reload(); }}>
                      Invite
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {(invites.incoming?.length || invites.outgoing?.length) ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Kelgan takliflar</div>
                {(invites.incoming || []).map((i: any) => (
                  <div key={i.id} className="mb-2 flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
                    <span className="text-sm text-slate-200">{i.requester?.name}</span>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={async () => { await messagesApi.respondInvite(i.id, "accept"); reload(); }}>Qabul</Button>
                      <Button size="sm" variant="danger" onClick={async () => { await messagesApi.respondInvite(i.id, "reject"); reload(); }}>Rad</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Yuborilgan takliflar</div>
                {(invites.outgoing || []).map((i: any) => <div key={i.id} className="mb-2 rounded-xl bg-white/[0.03] p-3 text-sm text-slate-300">{i.receiver?.name} - kutilmoqda</div>)}
              </div>
            </div>
          ) : null}
        </Card>
      )}
      <Card className="grid h-[calc(100vh-220px)] min-h-[560px] grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr]">
        <div className="flex min-h-0 flex-col border-b border-white/[0.05] md:border-b-0 md:border-r">
          <div className="border-b border-white/[0.05] p-3">
            <input
              placeholder="Ism yoki guruh nomi..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-primary-500/60 focus:outline-none"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="p-4 text-sm text-slate-400">Yuklanmoqda...</div>
            ) : contacts.length === 0 ? (
              <div className="p-4 text-sm text-slate-400">
                Hozircha kontakt yo‘q. Admin yoki ustoz bilan yozishishni boshlang.
              </div>
            ) : (
            contacts.map((c) => (
              <button
                key={c.conversationId || c.id}
                onClick={() => setActiveId(c.conversationId || c.id)}
                className={`flex w-full items-center gap-3 border-b border-white/[0.04] p-3.5 text-left transition ${
                  activeId === (c.conversationId || c.id) ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                }`}
              >
                <Avatar initials={(c?.name || "?").slice(0, 2).toUpperCase()} imageUrl={c?.avatar || undefined} online={!!c?.lastSeen} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                      <NameWithEmoji name={c.name} emoji={c.nameEmoji} anim={c.nameEmojiAnim} />
                    </span>
                    <span className="text-[10px] text-slate-500">{c.role || ""}</span>
                    {c.unreadCount > 0 && <span className="rounded-full bg-primary-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{c.unreadCount}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="truncate text-xs text-slate-500">
                      {c.email || ""}
                    </span>
                  </div>
                </div>
              </button>
            )))}
          </div>
        </div>
        
        {/* Active conversation */}
        <div className="flex h-full min-h-0 flex-col bg-ink-900/40">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-5 py-4">
            <div className="flex items-center gap-3">
              <Avatar initials={(current?.name || "?").slice(0, 2).toUpperCase()} imageUrl={current?.avatar || undefined} online={!!current?.lastSeen} />
              <div>
                <div className="text-sm font-bold text-white">
                  {current ? <NameWithEmoji name={current.name} emoji={current.nameEmoji} anim={current.nameEmojiAnim} /> : "Chat"}
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className={`h-1.5 w-1.5 rounded-full ${current?.lastSeen ? "bg-emerald-400" : "bg-slate-500"}`} />
                  <span className={current?.lastSeen ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                    {current?.lastSeen ? "Onlayn" : "—"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => startCall("audio")}>📞</Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => startCall("video")}>📹</Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">⋯</Button>
            </div>
          </div>
          {activeCall ? (
            <div className="border-b border-emerald-500/20 bg-emerald-500/10 px-5 py-3">
              <button
                type="button"
                onClick={() => setCallInfoOpen(true)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-left hover:bg-emerald-400/15"
              >
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-emerald-100">
                    {activeCall.type === "video" ? "Video suhbat davom etmoqda" : "Audio suhbat davom etmoqda"}
                  </div>
                  <div className="mt-0.5 text-xs text-emerald-200/75">
                    {activeCall.participantsCount || activeCall.participants?.length || 1} ta akkaunt qo‘shilgan · ustiga bosib qo‘shiling
                  </div>
                </div>
                <span className="rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-black text-ink-950">Qo‘shilish</span>
              </button>
            </div>
          ) : null}
          <div className="relative min-h-0 flex-1">
            <div
              ref={chatScrollRef}
              onScroll={handleChatScroll}
              className="absolute inset-0 space-y-4 overflow-y-auto overscroll-contain p-5"
            >
              <DateLabel>Chat tarixi</DateLabel>
              {visibleHistory.map((m, i) => (
                <MessageRow
                  key={m.id || i}
                  message={m}
                  mine={m.senderId === user?.id}
                  canJoinCall={!!activeCall}
                  onJoinCall={(payload) => void joinActiveCall({ ...activeCall, ...payload })}
                />
              ))}
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  scrollChatToBottom(true);
                  setUnreadCount(0);
                }}
                className="absolute bottom-4 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary-500/40 transition hover:bg-primary-400 active:scale-95"
              >
                ↓ {unreadCount} ta yangi xabar
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-2 border-t border-white/[0.05] p-3.5 bg-ink-950/50">
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={async (e) => {
                const input = e.currentTarget;
                const files = Array.from(input.files || []);
                if (!files.length) return;
                try {
                  setError("");
                  const uploaded: any[] = [];
                  for (const file of files) {
                    uploaded.push(await messagesApi.upload(file));
                  }
                  setAttachments((prev) => [...prev, ...uploaded]);
                } catch (err: any) {
                  setError(err?.message || "Fayl yuklanmadi");
                } finally {
                  input.value = "";
                }
              }}
            />
            <button onClick={() => fileRef.current?.click()} className="rounded-xl p-2.5 text-slate-400 hover:bg-white/5 hover:text-white transition">📎</button>
            <div className="flex-1">
              {attachments.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((a, idx) => (
                    <span key={`${a.url}-${idx}`} className="inline-flex max-w-[220px] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-200">
                      <span className="truncate">📎 {a.name}</span>
                      <button type="button" className="text-slate-500 hover:text-rose-300" onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}>×</button>
                    </span>
                  ))}
                </div>
              ) : null}
              <input
                placeholder={attachments.length ? `${attachments.length} ta fayl biriktirildi. Xabar yozing...` : "Xabar yozish..."}
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-primary-500/60 focus:bg-white/[0.04] focus:outline-none"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) void sendCurrent(); }}
              />
            </div>
            <button className="rounded-xl p-2.5 text-slate-400 hover:bg-white/5 hover:text-white transition">😀</button>
            <Button
              variant="gradient"
              disabled={!activeId || (!msg.trim() && !attachments.length) || sending}
              onClick={() => void sendCurrent()}
            >
              {sending ? "Yuborilmoqda..." : "Yuborish"}
            </Button>
          </div>
        </div>
      </Card>
      {callInfoOpen && activeCall ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4">
          <Card className="w-full max-w-md p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold text-white">
                  {activeCall.type === "video" ? "Video suhbat" : "Audio suhbat"}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {current?.name} · {activeCall.participantsCount || activeCall.participants?.length || 1} ta akkaunt
                </div>
              </div>
              <button className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white" onClick={() => setCallInfoOpen(false)}>
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {(activeCall.participants || []).length ? (
                activeCall.participants.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
                    <Avatar initials={(p.name || "?").slice(0, 2).toUpperCase()} size="sm" />
                    <div>
                      <div className="text-sm font-bold text-white">{p.name}</div>
                      <div className="text-xs text-slate-500">{roleLabel(p.role)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-white/[0.04] p-3 text-sm text-slate-400">Qo‘ng‘iroq egasi suhbatda.</div>
              )}
            </div>
            <Button variant="gradient" className="mt-5 w-full" onClick={() => void joinActiveCall(activeCall)}>
              Qo‘shilish
            </Button>
          </Card>
        </div>
      ) : null}
      {call && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <Card className="w-full max-w-xl overflow-hidden p-0 text-center">
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 text-left">
              <Avatar initials={(callPeer?.name || "?").slice(0, 2).toUpperCase()} online={!!callPeer?.lastSeen} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-white">{callPeer?.name || "Suhbatdosh"}</div>
                <div className="text-xs text-slate-500">
                  {roleLabel(callPeer?.role)} · {call.status === "connected" ? "Ulandi" : call.incoming ? "Kiruvchi qo‘ng‘iroq" : "Qo‘ng‘iroq qilinmoqda"}
                </div>
              </div>
              <div className="text-2xl">{call.type === "video" ? "📹" : "📞"}</div>
            </div>

            <div className="relative h-[360px] bg-black">
              {call.type === "video" ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full bg-black object-cover" />
              ) : (
                <div className="grid h-full place-items-center">
                  <div className="text-center">
                    <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-accent-600 text-3xl font-extrabold text-white">
                      {(callPeer?.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="mt-3 text-lg font-bold text-white">{callPeer?.name || "Suhbatdosh"}</div>
                    <div className="text-sm text-slate-400">{roleLabel(callPeer?.role)}</div>
                  </div>
                </div>
              )}

              {call.type === "video" ? (
                <div className="absolute bottom-3 right-3 h-24 w-36 overflow-hidden rounded-xl border border-white/20 bg-black shadow-2xl">
                  <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                  {cameraOff ? (
                    <div className="absolute inset-0 grid place-items-center bg-black/80 text-xs font-bold text-slate-300">Kamera off</div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-center gap-3 bg-ink-950/95 px-4 py-4">
              {call.incoming && call.status !== "connected" ? (
                <button
                  type="button"
                  onClick={() => void acceptCall()}
                  className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 text-lg text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
                  title="Qabul qilish"
                >
                  📞
                </button>
              ) : null}
              <button
                type="button"
                onClick={toggleMic}
                className={`grid h-11 w-11 place-items-center rounded-full text-lg text-white ${micMuted ? "bg-amber-500 hover:bg-amber-400" : "bg-white/10 hover:bg-white/20"}`}
                title={micMuted ? "Mikrofonni yoqish" : "Mikrofonni o‘chirish"}
              >
                {micMuted ? "🔇" : "🎙️"}
              </button>
              {call.type === "video" ? (
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`grid h-11 w-11 place-items-center rounded-full text-lg text-white ${cameraOff ? "bg-amber-500 hover:bg-amber-400" : "bg-white/10 hover:bg-white/20"}`}
                  title={cameraOff ? "Kamerani yoqish" : "Kamerani o‘chirish"}
                >
                  {cameraOff ? "🚫" : "📹"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => endCall(true)}
                className="grid h-12 w-12 place-items-center rounded-full bg-rose-500 text-lg text-white shadow-lg shadow-rose-500/25 hover:bg-rose-400"
                title="Yakunlash"
              >
                ✕
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function parseCallMessage(text?: string) {
  const raw = String(text || "");
  if (!raw.startsWith("__CALL__:")) return null;
  try {
    return JSON.parse(raw.slice("__CALL__:".length));
  } catch {
    return null;
  }
}

function formatCallDuration(seconds?: number | null) {
  const total = Number(seconds || 0);
  if (!total) return "";
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return mins ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs} soniya`;
}

function MessageRow({
  message,
  mine,
  canJoinCall,
  onJoinCall,
}: {
  message: any;
  mine: boolean;
  canJoinCall?: boolean;
  onJoinCall: (payload: any) => void;
}) {
  const callPayload = parseCallMessage(message.text);
  const time = message.createdAt ? new Date(message.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : "";
  const sender = message.sender;
  const senderName = sender?.name;
  const senderAvatar = sender?.avatar;
  const senderEmoji = sender?.nameEmoji;
  const senderEmojiAnim = sender?.nameEmojiAnim;
  const senderInitials = (senderName || "?").slice(0, 2).toUpperCase();

  if (callPayload) {
    const active = !["ended", "rejected"].includes(String(callPayload.status || ""));
    const duration = formatCallDuration(callPayload.durationSeconds);
    const title = callPayload.type === "video" ? "Video qo‘ng‘iroq" : "Audio qo‘ng‘iroq";
    return (
      <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
        {!mine && (
          <Avatar size="sm" initials={senderInitials} imageUrl={senderAvatar || undefined} />
        )}
        <div
          className={`max-w-[320px] rounded-2xl px-3.5 py-3 shadow-md ring-1 ${
            mine
              ? "rounded-br-none bg-primary-500/18 text-white ring-primary-400/20"
              : "rounded-bl-none bg-white/[0.06] text-slate-100 ring-white/10"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${active ? "bg-emerald-500/18 text-emerald-300" : "bg-rose-500/14 text-rose-300"}`}>
              {callPayload.type === "video" ? "📹" : "📞"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold">{title}</div>
              <div className={`mt-0.5 text-xs font-semibold ${active ? "text-emerald-300" : "text-slate-400"}`}>
                {active ? "Suhbat davom etmoqda" : duration ? `Yakunlandi · ${duration}` : "Yakunlandi"}
              </div>
            </div>
          </div>
          {active && canJoinCall ? (
            <Button size="sm" className="mt-3 h-8 w-full" onClick={() => onJoinCall(callPayload)}>
              Qo‘shilish
            </Button>
          ) : null}
          <div className={`mt-1.5 px-1 text-[10px] font-semibold text-slate-500 ${mine ? "text-right" : "text-left"}`}>{time}</div>
        </div>
      </div>
    );
  }
  return (
    <Bubble
      who={mine ? "me" : "them"}
      time={time}
      avatar={mine ? null : { initials: senderInitials, url: senderAvatar }}
      name={mine ? null : senderName}
      emoji={mine ? null : senderEmoji}
      emojiAnim={mine ? null : senderEmojiAnim}
    >
      <div>{message.text}</div>
      {(message.attachments || []).map((a: any) => (
        <MessageAttachment key={a.id || a.url} attachment={a} />
      ))}
    </Bubble>
  );
}

function DateLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center">
      <div className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {children}
      </div>
    </div>
  );
}

function MessageAttachment({ attachment }: { attachment: any }) {
  const url = String(attachment?.url || "");
  const name = String(attachment?.name || "file");
  const mime = String(attachment?.mimeType || "");
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isAudio = mime.startsWith("audio/");

  return (
    <div className="mt-2 overflow-hidden rounded-xl bg-black/15 ring-1 ring-white/10">
      {isImage ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={name} className="max-h-64 w-full object-cover" />
        </a>
      ) : isVideo ? (
        <video controls src={url} className="max-h-64 w-full" />
      ) : isAudio ? (
        <audio controls src={url} className="w-full px-2 py-2" />
      ) : null}
      <a href={url} target="_blank" rel="noreferrer" className="block px-3 py-2 text-xs font-semibold underline">
        📎 {name}
      </a>
    </div>
  );
}

function Bubble({
  who,
  children,
  time,
  avatar,
  name,
  emoji,
  emojiAnim,
}: {
  who: "me" | "them";
  children: React.ReactNode;
  time?: string;
  avatar?: { initials: string; url?: string | null } | null;
  name?: string | null;
  emoji?: string | null;
  emojiAnim?: string | null;
}) {
  return (
    <div className={`flex items-end gap-2 ${who === "me" ? "justify-end" : "justify-start"}`}>
      {who === "them" && avatar ? (
        <Avatar size="sm" initials={avatar.initials} imageUrl={avatar.url || undefined} />
      ) : null}
      <div className="max-w-[75%]">
        {who === "them" && name ? (
          <div className="mb-1 px-1 text-[11px] font-semibold text-primary-300">
            <NameWithEmoji name={name} emoji={emoji} anim={emojiAnim} />
          </div>
        ) : null}
        <div
          className={`rounded-2xl px-4 py-3 text-sm shadow-md leading-relaxed ${
            who === "me"
              ? "rounded-br-none bg-gradient-to-br from-primary-500 to-indigo-600 text-white"
              : "rounded-bl-none bg-white/[0.06] text-slate-200 border border-white/[0.05]"
          }`}
        >
          {children}
        </div>
        {time && (
          <div className={`mt-1.5 px-1 text-[10px] font-semibold text-slate-500 ${who === "me" ? "text-right" : "text-left"}`}>
            {time} {who === "me" && "✓✓"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== TESTS ==================== */
export function Tests() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectId, setSubjectId] = useState<string>("");
  const [qs, setQs] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [result, setResult] = useState<any | null>(null);
  const [answerSummary, setAnswerSummary] = useState<{ unknown: number; partial: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teacherRank, setTeacherRank] = useState<any[]>([]);
  const [studentRank, setStudentRank] = useState<any[]>([]);
  const [studentRankMode, setStudentRankMode] = useState<"overall" | "subject" | "course">("overall");
  const [studentRankSubjectId, setStudentRankSubjectId] = useState<string>("");
  const [studentRankCourseId, setStudentRankCourseId] = useState<string>("");
  const [studentRankError, setStudentRankError] = useState<string>("");
  const [courses, setCourses] = useState<any[]>([]);
  const [mode, setMode] = useState<"subject" | "placement">("placement");
  const [placement, setPlacement] = useState<any | null>(null);
  const [placementSubjects, setPlacementSubjects] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(20);
  const dontKnowOption = "Javobini bilmayman";

  useEffect(() => {
    setLoading(true);
    subjectsApi
      .list()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setSubjects(arr);
        setSubjectId(arr[0]?.id || arr[0]?._id || "");
        setStudentRankSubjectId(arr[0]?.id || arr[0]?._id || "");
        // default: top 4 subjects for placement (or all if few)
        const ids = arr.map((s) => String(s.id || s._id || "")).filter(Boolean);
        setPlacementSubjects(ids.slice(0, Math.min(4, ids.length)));
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Fanlar yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    rankingsApi
      .teachers()
      .then((list) => setTeacherRank(Array.isArray(list) ? list : []))
      .catch(() => setTeacherRank([]));
  }, []);

  useEffect(() => {
    rankingsApi
      .students({ limit: 10 })
      .then((list) => setStudentRank(Array.isArray(list) ? list : []))
      .catch(() => setStudentRank([]));
  }, []);

  useEffect(() => {
    // guest can see courses list; course leaderboard itself needs auth (will show error if not logged in)
    coursesApi
      .list()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setCourses(arr);
        if (!studentRankCourseId) {
          const first = arr[0];
          const id = String(first?.id || first?._id || "");
          if (id) setStudentRankCourseId(id);
        }
      })
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    setStudentRankError("");
    if (studentRankMode === "overall") {
      rankingsApi
        .students({ limit: 10 })
        .then((list) => setStudentRank(Array.isArray(list) ? list : []))
        .catch((e: any) => {
          setStudentRank([]);
          setStudentRankError(e?.message || "Reyting yuklanmadi");
        });
      return;
    }
    if (studentRankMode === "subject") {
      if (!studentRankSubjectId) return;
      rankingsApi
        .students({ limit: 10, subjectId: studentRankSubjectId })
        .then((list) => setStudentRank(Array.isArray(list) ? list : []))
        .catch((e: any) => {
          setStudentRank([]);
          setStudentRankError(e?.message || "Reyting yuklanmadi");
        });
      return;
    }
    // course mode (requires auth)
    if (!studentRankCourseId) return;
    rankingsApi
      .course(studentRankCourseId)
      .then((list) => setStudentRank(Array.isArray(list) ? list : []))
      .catch((e: any) => {
        setStudentRank([]);
        setStudentRankError(e?.message || "Kurs reytingi uchun login kerak bo‘lishi mumkin");
      });
  }, [studentRankMode, studentRankSubjectId, studentRankCourseId]);

  useEffect(() => {
    setError("");
    setResult(null);
    setPlacement(null);
    setAnswers({});
    setAnswerSummary(null);
    setActiveQuestionIndex(0);

    if (mode === "placement") {
      testsApi
        .placementQuestions({
          count: questionCount,
          subjectIds: placementSubjects.length ? placementSubjects : undefined,
        })
        .then((list) => setQs(Array.isArray(list) ? list : []))
        .catch((e: any) => {
          setQs([]);
          setError(e?.message || "Savollar yuklanmadi");
        });
      return;
    }

    if (!subjectId) return;
    testsApi
      .guestSubject(subjectId, { count: questionCount })
      .then((list) => setQs(Array.isArray(list) ? list : []))
      .catch((e: any) => {
        setQs([]);
        setError(e?.message || "Savollar yuklanmadi");
      });
  }, [subjectId, mode, placementSubjects.join(","), questionCount]);

  const currentQuestion = qs[activeQuestionIndex];
  const currentOptions = useMemo(() => {
    const rawOptions = Array.isArray(currentQuestion?.options) ? currentQuestion.options : [];
    const hasDontKnow = rawOptions.some((opt: string) => String(opt).trim().toLowerCase() === dontKnowOption.toLowerCase());
    return hasDontKnow ? rawOptions : [...rawOptions, dontKnowOption];
  }, [currentQuestion?.id]);
  const selectedForCurrent = currentQuestion ? answers[currentQuestion.id] || [] : [];
  const isMultiQuestion = !!(currentQuestion?.allowMultiple || currentQuestion?.multiple || Number(currentQuestion?.answerCount || 1) > 1);

  const questionStatus = (q: any) => {
    const selected = answers[q.id] || [];
    const multi = !!(q?.allowMultiple || q?.multiple || Number(q?.answerCount || 1) > 1);
    if (multi && selected.length > 0 && selected.length < Number(q?.answerCount || 2)) return "partial";
    return selected.length > 0 ? "answered" : "empty";
  };

  const setQuestionAnswer = (questionId: string, option: string, multi: boolean) => {
    setAnswers((prev) => {
      if (!multi || option === dontKnowOption) return { ...prev, [questionId]: [option] };
      const current = (prev[questionId] || []).filter((x) => x !== dontKnowOption);
      const next = current.includes(option) ? current.filter((x) => x !== option) : [...current, option];
      return { ...prev, [questionId]: next };
    });
  };

  const submitCurrentTest = async () => {
    const questionIds = qs.map((q) => q.id);
    const ans = questionIds.map((id) => {
      const selected = answers[id] || [];
      return selected.length ? selected.join(" | ") : dontKnowOption;
    });
    setAnswerSummary({
      unknown: ans.filter((a) => a === dontKnowOption).length,
      partial: qs.filter((q) => questionStatus(q) === "partial").length,
    });
    if (mode === "placement") {
      const r = await testsApi.placementSubmit({ questionIds, answers: ans });
      setPlacement(r);
    } else {
      const r = await testsApi.guestSubmit({
        testType: "guest",
        subjectId,
        questionIds,
        answers: ans,
      });
      setResult(r);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <div>
        <Badge variant="warning" dot className="mb-3">
          🏆 Quiz Battle 2.0 Jonli Musobaqa
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Bilimlar Janggi va Testlar
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          O'z bilimingizni sinab ko'ring, boshqalar bilan bellashing va ball yig'ing.
        </p>
        {loading ? (
          <p className="mt-1 text-xs text-slate-500">Fanlar va savollar yuklanmoqda…</p>
        ) : null}
      </div>

      {/* Diagnostic / Subject test */}
      <Card glow className="p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="primary" dot>
              {mode === "placement" ? "Diagnostika (aralash test)" : "Tanlangan fan testi"}
            </Badge>
            {error && <span className="text-xs text-rose-300">{error}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={mode === "placement" ? "gradient" : "outline"}
              size="sm"
              onClick={() => setMode("placement")}
            >
              Aralash
            </Button>
            <Button
              variant={mode === "subject" ? "gradient" : "outline"}
              size="sm"
              onClick={() => setMode("subject")}
            >
              Fan bo‘yicha
            </Button>
            {mode === "subject" ? (
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="h-9 cursor-pointer rounded-xl border border-white/10 bg-ink-950 px-3 text-[13px] text-slate-200 hover:bg-white/[0.05] focus:border-primary-500/60 focus:outline-none"
              >
                {subjects.map((s) => {
                  const id = String(s.id || s._id || "");
                  return (
                    <option key={id} value={id}>
                      {s.name}
                    </option>
                  );
                })}
              </select>
            ) : null}
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="h-9 cursor-pointer rounded-xl border border-white/10 bg-ink-950 px-3 text-[13px] text-slate-200 hover:bg-white/[0.05] focus:border-primary-500/60 focus:outline-none"
              title="Savollar soni"
            >
              {[10, 20, 30, 40, 50, 60].map((count) => (
                <option key={count} value={count}>
                  {count} ta savol
                </option>
              ))}
            </select>
          </div>
        </div>
        {mode === "placement" ? (
          <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Qaysi fanlar bo‘yicha diagnostika?
            </div>
            <div className="flex flex-wrap gap-2">
              {subjects.slice(0, 10).map((s) => {
                const id = String(s.id || s._id || "");
                const active = placementSubjects.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setPlacementSubjects((prev) => {
                        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
                        return next.slice(0, 6); // keep it small for UX
                      });
                    }}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? "border-primary-500/50 bg-primary-500/10 text-primary-300"
                        : "border-white/[0.08] bg-white/[0.01] text-slate-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
              {subjects.length > 10 ? (
                <span className="self-center text-[11px] text-slate-500">
                  (+ yana {subjects.length - 10} ta fan)
                </span>
              ) : null}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Tanlangan fanlar: <span className="text-slate-300 font-semibold">{placementSubjects.length || "hammasi"}</span>
            </div>
          </div>
        ) : null}

        {mode === "placement" && placement ? (
          <div className="space-y-4">
            <div className="text-xl font-bold text-white">
              Natija: {placement.score}% · Daraja: <strong>{placement.level}</strong>
            </div>
            {answerSummary ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm text-slate-300">
                “Javobini bilmayman”: <strong className="text-white">{answerSummary.unknown}</strong> ta · qisman belgilangan:{" "}
                <strong className="text-amber-300">{answerSummary.partial}</strong> ta. Bu tahlil fan, mavzu va ustoz tavsiyalarini aniqlashga yordam beradi.
              </div>
            ) : null}
            <div className="text-sm text-slate-300">
              Tavsiya fan:{" "}
              <strong className="text-white">{placement?.recommendedSubject?.name || "—"}</strong>
            </div>

            {Array.isArray(placement.subjects) && placement.subjects.length ? (
              <Card className="p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Tahlil (fanlar kesimida)
                </div>
                <div className="space-y-2">
                  {placement.subjects.slice(0, 6).map((s: any) => (
                    <div key={s?.subject?.id || s?.subject?.name} className="grid grid-cols-[1fr_auto] gap-3 items-center">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">
                          {s?.subject?.name || "Fan"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          To‘g‘ri: {s.correct} / {s.total}
                        </div>
                      </div>
                      <div className="text-sm font-extrabold text-primary-300">{s.score}%</div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {Array.isArray(placement.recommendedTopics) && placement.recommendedTopics.length ? (
              <Card className="p-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Qayta ko‘rish kerak bo‘lgan mavzular/darajalar
                </div>
                <div className="flex flex-wrap gap-2">
                  {placement.recommendedTopics.map((t: any) => (
                    <Badge key={t.topic} variant="warning">
                      {t.topic} · {t.missed} xato
                    </Badge>
                  ))}
                </div>
              </Card>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <Card className="p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Tavsiya kurslar
                </div>
                {Array.isArray(placement.recommendedCourses) && placement.recommendedCourses.length ? (
                  <div className="space-y-2">
                    {placement.recommendedCourses.map((c: any) => (
                      <div key={c.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="text-sm font-semibold text-white">{c.title}</div>
                        <div className="text-xs text-slate-500">
                          {c.subject?.name || ""} · {c.level} · {c.teacher?.name || "Ustoz"}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              window.location.href = `/courses/${c.id}`;
                            }}
                          >
                            Kursni ochish
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              const qs = new URLSearchParams();
                              if (c?.subject?.id) qs.set("subjectId", String(c.subject.id));
                              if (c?.level) qs.set("level", String(c.level));
                              if (c?.type) qs.set("type", String(c.type));
                              window.location.href = `/courses${qs.toString() ? `?${qs.toString()}` : ""}`;
                            }}
                          >
                            Katalogda ko‘rish
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">Tavsiya kurs topilmadi.</div>
                )}
              </Card>

              <Card className="p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Tavsiya ustozlar
                </div>
                {Array.isArray(placement.recommendedTeachers) && placement.recommendedTeachers.length ? (
                  <div className="space-y-2">
                    {placement.recommendedTeachers.map((t: any) => (
                      <div key={t.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="text-sm font-semibold text-white">{t.name}</div>
                        <div className="text-xs text-slate-500">
                          ★ {typeof t.rating === "number" ? t.rating.toFixed(1) : "—"} · {t.reviewsCount || 0} sharh
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">Tavsiya ustoz topilmadi.</div>
                )}
              </Card>
            </div>

            <Button variant="outline" onClick={() => setMode("placement")}>
              Qayta diagnostika
            </Button>
          </div>
        ) : result ? (
          <div className="space-y-3">
            <div className="text-xl font-bold text-white">Natija: {result.score}%</div>
            <div className="text-sm text-slate-300">
              To'g'ri: {result.correct} / {result.total} · Daraja: <strong>{result.level}</strong>
            </div>
            {answerSummary ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm text-slate-300">
                “Javobini bilmayman”: <strong className="text-white">{answerSummary.unknown}</strong> ta · qisman belgilangan:{" "}
                <strong className="text-amber-300">{answerSummary.partial}</strong> ta. Shu ma’lumot keyingi fan/mavzu/ustoz tavsiyalarida hisobga olinadi.
              </div>
            ) : null}
            {Array.isArray(result.recommendedTopics) && result.recommendedTopics.length ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Tavsiya mavzular</div>
                <div className="flex flex-wrap gap-2">
                  {result.recommendedTopics.map((t: any) => (
                    <Badge key={t.topic} variant="warning">{t.topic} · {t.missed} xato</Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {Array.isArray(result.recommendedCourses) && result.recommendedCourses.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Card className="p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Tavsiya kurslar</div>
                  <div className="space-y-2">
                    {result.recommendedCourses.map((c: any) => (
                      <div key={c.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="text-sm font-semibold text-white">{c.title}</div>
                        <div className="text-xs text-slate-500">{c.subject?.name || ""} · {c.level} · {c.teacher?.name || "Ustoz"}</div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Tavsiya ustozlar</div>
                  <div className="space-y-2">
                    {(result.recommendedTeachers || []).map((t: any) => (
                      <div key={t.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="text-sm font-semibold text-white">{t.name}</div>
                        <div className="text-xs text-slate-500">★ {typeof t.rating === "number" ? t.rating.toFixed(1) : "—"} · {t.reviewsCount || 0} sharh</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ) : null}
            <Button variant="outline" onClick={() => setResult(null)}>
              Qayta topshirish
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Savollar navigatori · {qs.length} ta
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Belgilangan</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" /> Belgilanmagan</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Qisman</span>
                </div>
              </div>
              <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(2.5rem,1fr))]">
                {qs.map((q, idx) => {
                  const status = questionStatus(q);
                  const active = idx === activeQuestionIndex;
                  const color =
                    status === "answered"
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                      : status === "partial"
                        ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
                        : "border-rose-500/50 bg-rose-500/10 text-rose-200";
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setActiveQuestionIndex(idx)}
                      className={`h-10 rounded-xl border text-sm font-extrabold transition ${color} ${active ? "ring-2 ring-primary-400/60" : ""}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {currentQuestion ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="primary">
                    {activeQuestionIndex + 1} / {qs.length}
                  </Badge>
                  {isMultiQuestion ? (
                    <Badge variant="warning">Bir nechta javob tanlanadi</Badge>
                  ) : (
                    <Badge variant="outline">Bitta javob tanlanadi</Badge>
                  )}
                </div>
                <div className="text-base font-bold leading-relaxed text-white">{currentQuestion.question}</div>
                <div className="mt-4 grid auto-rows-fr gap-3 sm:grid-cols-2">
                  {currentOptions.map((opt: string, optIdx: number) => {
                    const picked = selectedForCurrent.includes(opt);
                    const optionLetter = opt === dontKnowOption ? "?" : String.fromCharCode(65 + optIdx);
                    return (
                      <button
                        key={opt}
                        className={`flex min-h-[86px] items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold leading-relaxed whitespace-normal break-words transition ${
                          picked
                            ? opt === dontKnowOption
                              ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                              : "border-primary-500/50 bg-primary-500/10 text-primary-300"
                            : "border-white/[0.08] bg-white/[0.02] text-slate-100 hover:bg-white/[0.06]"
                        }`}
                        onClick={() => setQuestionAnswer(currentQuestion.id, opt, isMultiQuestion)}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                          picked ? "bg-primary-500 text-white" : "bg-white/[0.08] text-slate-200"
                        }`}>
                          {optionLetter}
                        </span>
                        <span className="break-words text-[13px] sm:text-sm">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-slate-400">
                Savollar yuklanmoqda yoki topilmadi.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                disabled={activeQuestionIndex === 0}
                onClick={() => setActiveQuestionIndex((i) => Math.max(0, i - 1))}
              >
                Oldingi savol
              </Button>
              <div className="text-xs text-slate-500">
                Belgilangan: {qs.filter((q) => questionStatus(q) !== "empty").length} / {qs.length}
              </div>
              {activeQuestionIndex < qs.length - 1 ? (
                <Button
                  variant="gradient"
                  disabled={!qs.length}
                  onClick={() => setActiveQuestionIndex((i) => Math.min(qs.length - 1, i + 1))}
                >
                  Keyingi savol
                </Button>
              ) : (
                <Button variant="gradient" disabled={!qs.length} onClick={submitCurrentTest}>
                  Testni yakunlash
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Leaderboard */}
      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Ustozlar Reytingi · Real
            </h2>
            <p className="text-xs text-slate-500">
              Reyting o'rtacha sharh (review) bahosi asosida.
            </p>
          </div>
          <ITrophy className="h-6 w-6 text-amber-400" />
        </div>
        <div className="space-y-2.5">
          {teacherRank.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-slate-400">
              Hozircha reyting ma'lumoti yo'q (review bo'lmasligi mumkin).
            </div>
          ) : teacherRank.slice(0, 8).map((t: any, i) => (
            <div
              key={t.id || i}
              className={`flex items-center gap-3 rounded-2xl border p-3.5 transition hover:bg-white/[0.04] ${
                i === 0
                  ? "border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent"
                  : "border-white/[0.05] bg-white/[0.01]"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold ${
                  i === 0
                    ? "bg-amber-500/20 text-amber-300"
                    : i === 1
                      ? "bg-slate-400/20 text-slate-200"
                      : i === 2
                        ? "bg-orange-700/30 text-orange-300"
                        : "bg-white/[0.05] text-slate-400"
                }`}
              >
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </span>
              <Avatar initials={String(t?.name || "?").slice(0, 2).toUpperCase()} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-bold text-white">
                  {t?.name || "Ustoz"}
                </div>
                <div className="text-[11px] text-slate-500">
                  {typeof t?.rating === "number" ? `★ ${t.rating.toFixed(2)}` : "★ —"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-extrabold text-primary-300">
                  {typeof t?.rating === "number" ? t.rating.toFixed(2) : "—"}
                </div>
                <div className="text-[10px] text-slate-500">rating</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Students ranking */}
      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Talabalar Reytingi · Real</h2>
            <p className="text-xs text-slate-500">
              Overall / fan bo‘yicha / kurs bo‘yicha ko‘rishingiz mumkin.
            </p>
          </div>
          <ITrophy className="h-6 w-6 text-primary-300" />
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={studentRankMode === "overall" ? "gradient" : "outline"}
            onClick={() => setStudentRankMode("overall")}
          >
            Umumiy
          </Button>
          <Button
            size="sm"
            variant={studentRankMode === "subject" ? "gradient" : "outline"}
            onClick={() => setStudentRankMode("subject")}
          >
            Fan bo‘yicha
          </Button>
          <Button
            size="sm"
            variant={studentRankMode === "course" ? "gradient" : "outline"}
            onClick={() => setStudentRankMode("course")}
          >
            Kurs bo‘yicha
          </Button>
          {studentRankMode === "subject" ? (
            <select
              value={studentRankSubjectId}
              onChange={(e) => setStudentRankSubjectId(e.target.value)}
              className="h-9 cursor-pointer rounded-xl border border-white/10 bg-ink-950 px-3 text-[13px] text-slate-200 hover:bg-white/[0.05] focus:border-primary-500/60 focus:outline-none"
            >
              {subjects.map((s) => {
                const id = String(s.id || s._id || "");
                return (
                  <option key={id} value={id}>
                    {s.name}
                  </option>
                );
              })}
            </select>
          ) : null}
          {studentRankMode === "course" ? (
            <select
              value={studentRankCourseId}
              onChange={(e) => setStudentRankCourseId(e.target.value)}
              className="h-9 cursor-pointer rounded-xl border border-white/10 bg-ink-950 px-3 text-[13px] text-slate-200 hover:bg-white/[0.05] focus:border-primary-500/60 focus:outline-none"
            >
              {courses.map((c) => {
                const id = String(c.id || c._id || "");
                return (
                  <option key={id} value={id}>
                    {c.title}
                  </option>
                );
              })}
            </select>
          ) : null}
        </div>
        {studentRankError ? (
          <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
            {studentRankError}
          </div>
        ) : null}
        {studentRank.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-slate-400">
            Hozircha reyting ma'lumoti yo'q.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="py-3 pr-3 font-semibold">#</th>
                  <th className="py-3 pr-3 font-semibold">Talaba</th>
                  <th className="py-3 pr-3 font-semibold">Test avg</th>
                  <th className="py-3 pr-3 font-semibold">Davomat</th>
                  <th className="py-3 pr-3 font-semibold text-right">Ball</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {studentRank.map((s: any, i: number) => (
                  <tr key={s.id || i} className="transition hover:bg-white/[0.02]">
                    <td className="py-3 pr-3 font-bold text-slate-400">{i + 1}</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={String(s?.name || "?").slice(0, 2).toUpperCase()} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-white">{s?.name || "—"}</div>
                          <div className="text-[11px] text-slate-500">{s?.rank || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-slate-300">{typeof s?.avgScore === "number" ? `${s.avgScore}%` : "—"}</td>
                    <td className="py-3 pr-3 text-slate-300">{typeof s?.attendanceRate === "number" ? `${s.attendanceRate}%` : "—"}</td>
                    <td className="py-3 pr-3 text-right font-extrabold text-primary-300">
                      {typeof s?.rankScore === "number" ? s.rankScore : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ==================== STUDY PLAN ==================== */
export function StudyPlan() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    studyPlanApi
      .get()
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Reja yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  const weekPlan = Array.isArray(data?.weekPlan) ? data.weekPlan : [];
  const weekStart = useMemo(() => {
    const now = new Date();
    const day = now.getDay() || 7;
    const start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }, []);
  const dayNames = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
  const days = dayNames.map((name, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { key: name, name, label: d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" }) };
  });
  const slots = ["09:00", "11:00", "14:00", "16:00", "19:00"];
  const colors = ["from-primary-500 to-indigo-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600", "from-rose-500 to-pink-600", "from-cyan-500 to-blue-600"];
  const events = weekPlan.reduce((acc: Record<string, { t: string; c: string; e: string }>, p: any, i: number) => {
    const day = dayNames.includes(p.day) ? p.day : dayNames[i % dayNames.length];
    const slot = p.time || slots[i % slots.length];
    acc[`${day}-${slot}`] = { t: p.subject || p.title || "Mustaqil ta'lim", c: colors[i % colors.length], e: p.icon || "📚" };
    return acc;
  }, {});
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="primary" dot className="mb-3">
            Haftalik dars taqvimi
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Shaxsiy O'quv Rejasi
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Joriy hafta · {weekStart.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" })} - {weekEnd.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" })} · Jami {weekPlan.length} ta tavsiya
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">‹</Button>
          <Button variant="outline" size="sm">Bugun</Button>
          <Button variant="outline" size="icon">›</Button>
          <Button variant="gradient" disabled>+ Dars qo'shish</Button>
        </div>
      </div>

      <Card className="overflow-x-auto p-4 sm:p-6">
        {error ? (
          <div className="text-sm text-rose-300">{error}</div>
        ) : loading ? (
          <div className="text-sm text-slate-400">Yuklanmoqda...</div>
        ) : (
          <>
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[76px_repeat(7,minmax(110px,1fr))] gap-2">
                <div />
                {days.map((d) => (
                  <div key={d.key} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                    <div className="text-sm font-bold text-white">{d.name}</div>
                    <div className="text-xs text-slate-500">{d.label}</div>
                  </div>
                ))}
                {slots.map((slot) => (
                  <SlotRow key={slot} slot={slot} days={dayNames} events={events} />
                ))}
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {weekPlan.slice(0, 6).map((p: any, i: number) => (
                <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <Badge variant="primary" dot className="mb-2">{p.day || dayNames[i % dayNames.length]}</Badge>
                  <div className="text-base font-bold text-white">{p.subject || "Tavsiya"}</div>
                  <div className="mt-1 text-xs text-slate-400">{p.recommendation}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function SlotRow({
  slot,
  days,
  events,
}: {
  slot: string;
  days: string[];
  events: Record<string, { t: string; c: string; e: string }>;
}) {
  return (
    <>
      <div className="flex items-center justify-end pr-3 font-mono text-[11px] text-slate-500">
        {slot}
      </div>
      {days.map((d) => {
        const ev = events[`${d}-${slot}`];
        return (
          <div
            key={d}
            className="min-h-[72px] rounded-xl border border-dashed border-white/[0.05] bg-white/[0.01] p-1.5 transition hover:bg-white/[0.02]"
          >
            {ev && (
              <div
                className={`flex h-full flex-col gap-1 rounded-lg bg-gradient-to-br ${ev.c} p-2 text-[11px] font-bold text-white shadow-md cursor-pointer transition hover:scale-[1.02] active:scale-[0.98] duration-150`}
              >
                <div className="text-base leading-none">{ev.e}</div>
                <div className="leading-tight truncate">{ev.t}</div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ==================== ATTENDANCE ==================== */
export function Attendance() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"my" | "mark">("my");
  const [courses, setCourses] = useState<any[]>([]);
  const [courseId, setCourseId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    setLoading(true);
    attendanceApi
      .my()
      .then((d) => {
        setList(Array.isArray(d) ? d : []);
        setError("");
      })
      .catch((e: any) => setError(e?.message || "Davomat yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.role || !["teacher", "admin"].includes(String(user.role))) return;
    dashboardApi
      .teacher()
      .then((d) => {
        const cs = Array.isArray(d?.courses) ? d.courses : [];
        setCourses(cs);
        if (!courseId && cs[0]?.id) setCourseId(cs[0].id);
      })
      .catch(() => {});
  }, [user?.role]);

  useEffect(() => {
    if (!courseId || !user?.role || !["teacher", "admin"].includes(String(user.role))) return;
    setStudents([]);
    setPicked({});
    coursesApi
      .students(courseId)
      .then((d) => setStudents(Array.isArray(d) ? d : []))
      .catch((e: any) => setError(e?.message || "Talabalar yuklanmadi"));
  }, [courseId, user?.role]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <div>
        <Badge variant="ustoz" dot className="mb-3">
          Ustoz paneli dars jarayoni
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Davomat — {user?.name || "Foydalanuvchi"}
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          {user?.role === "teacher" || user?.role === "admin"
            ? "O'zingizning tarixingiz va talabalar davomatini belgilash."
            : "Sizning davomat tarixingiz."}
        </p>
      </div>

      {(user?.role === "teacher" || user?.role === "admin") && (
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={mode === "my" ? "gradient" : "outline"}
                size="sm"
                onClick={() => setMode("my")}
              >
                Mening tarixim
              </Button>
              <Button
                variant={mode === "mark" ? "gradient" : "outline"}
                size="sm"
                onClick={() => setMode("mark")}
              >
                Talaba davomat belgilash
              </Button>
            </div>

            {mode === "mark" && (
              <div className="flex items-center gap-2">
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="h-9 rounded-xl border border-white/[0.08] bg-ink-950/40 px-3 text-sm text-slate-200"
                >
                  {courses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <Button
                  disabled={marking || !courseId}
                  onClick={async () => {
                    setMarking(true);
                    try {
                      const date = new Date().toISOString().slice(0, 10);
                      const ids = students.map((s) => s.id).filter(Boolean);
                      for (const id of ids) {
                        await attendanceApi.mark({
                          userId: id,
                          status: picked[id] ? "present" : "absent",
                          date,
                          courseId,
                          type: "student",
                        });
                      }
                      setError("");
                    } catch (e: any) {
                      setError(e?.message || "Saqlanmadi");
                    } finally {
                      setMarking(false);
                    }
                  }}
                >
                  Saqlash
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {mode === "mark" && (user?.role === "teacher" || user?.role === "admin") ? (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3.5 bg-ink-950/40">
            <div className="flex items-center gap-2">
              <IUsers className="h-4.5 w-4.5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-300">
                {students.length} ta talaba
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Bugun uchun belgilash
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {error ? (
              <div className="p-4 text-sm text-rose-300">{error}</div>
            ) : students.length === 0 ? (
              <div className="p-4 text-sm text-slate-400">Talaba topilmadi</div>
            ) : (
              students.map((s: any, i: number) => (
                <div key={s.id || i} className="flex items-center gap-3.5 p-4">
                  <span className="w-6 text-center font-mono text-xs text-slate-500 font-semibold">
                    {i + 1}
                  </span>
                  <Avatar initials={(s?.name || "T").slice(0, 2).toUpperCase()} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{s.name}</div>
                    <div className="text-[11px] text-slate-500">{s.studentId || ""}</div>
                  </div>
                  <Button
                    size="sm"
                    variant={picked[s.id] ? "gradient" : "outline"}
                    onClick={() => setPicked((p) => ({ ...p, [s.id]: !p[s.id] }))}
                  >
                    {picked[s.id] ? "Kelgan" : "Kelmadi"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : (
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3.5 bg-ink-950/40">
          <div className="flex items-center gap-2">
            <IUsers className="h-4.5 w-4.5 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">
              {loading ? "Yuklanmoqda..." : `${list.length} ta yozuv`}
            </span>
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {error ? (
            <div className="p-4 text-sm text-rose-300">{error}</div>
          ) : (
            list.map((a, i) => (
              <div key={a.id || i} className="flex items-center gap-3.5 p-4">
                <span className="w-6 text-center font-mono text-xs text-slate-500 font-semibold">{i + 1}</span>
                <Avatar initials={(user?.name || "U").slice(0, 2).toUpperCase()} />
                <span className="flex-1 text-sm font-semibold text-white">{user?.name || "—"}</span>
                <Badge variant={String(a.status) === "+" || String(a.status) === "present" ? "success" : "danger"} dot>
                  {String(a.status) === "+" || String(a.status) === "present" ? "Kelgan" : "Kelmadi"}
                </Badge>
                <span className="text-xs text-slate-500">
                  {a.createdAt ? new Date(a.createdAt).toLocaleString("uz-UZ") : ""}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
      )}
    </div>
  );
}

/* ==================== FEEDBACK (TAKLIF VA SHIKOYATLAR) ==================== */

const FEEDBACK_TYPES: { value: FeedbackItem["type"]; label: string; icon: string; color: string }[] = [
  { value: "suggestion", label: "Taklif", icon: "💡", color: "primary" },
  { value: "complaint", label: "Shikoyat", icon: "⚠️", color: "danger" },
  { value: "question", label: "Savol", icon: "❓", color: "warning" },
  { value: "praise", label: "Maqtov", icon: "🎉", color: "success" },
];

const FEEDBACK_CATEGORIES: { value: FeedbackItem["category"]; label: string }[] = [
  { value: "general", label: "Umumiy" },
  { value: "teacher", label: "O'qituvchi haqida" },
  { value: "course", label: "Kurs haqida" },
  { value: "center", label: "O'quv markaz" },
  { value: "system", label: "Tizim/dastur" },
  { value: "payment", label: "To'lov" },
];

const FEEDBACK_STATUSES: { value: FeedbackItem["status"]; label: string; variant: "primary" | "warning" | "success" | "danger" }[] = [
  { value: "new", label: "Yangi", variant: "primary" },
  { value: "in_review", label: "Ko'rib chiqilmoqda", variant: "warning" },
  { value: "resolved", label: "Hal qilindi", variant: "success" },
  { value: "rejected", label: "Rad etildi", variant: "danger" },
];

function feedbackTypeMeta(type: string) {
  return FEEDBACK_TYPES.find((t) => t.value === type) || FEEDBACK_TYPES[0];
}
function feedbackStatusMeta(status: string) {
  return FEEDBACK_STATUSES.find((s) => s.value === status) || FEEDBACK_STATUSES[0];
}
function feedbackCategoryLabel(value: string) {
  return FEEDBACK_CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function Feedback() {
  const { user } = useAuth();
  const isAdmin = String(user?.role || "") === "admin";
  const canManage = hasPermission(user, "feedback.manage");
  const canSubmit = hasPermission(user, "feedback.submit");

  const [tab, setTab] = useState<"submit" | "manage">(isAdmin ? "manage" : "submit");

  useEffect(() => {
    if (!isAdmin && tab === "manage") setTab("submit");
  }, [isAdmin, tab]);

  if (!user) {
    return (
      <Card className="p-6 text-sm text-slate-300">
        Taklif yoki shikoyat yuborish uchun tizimga kiring.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Taklif va shikoyatlar</h1>
            <p className="mt-1 text-sm text-slate-400">
              {canManage
                ? "Foydalanuvchilardan kelgan murojaatlarni boshqaring va javob bering."
                : "Bizga taklifingizni, shikoyatingizni yoki savollaringizni yuboring — har bir murojaat ko'rib chiqiladi."}
            </p>
          </div>
          {canManage ? (
            <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
              <button
                type="button"
                onClick={() => setTab("submit")}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  tab === "submit" ? "bg-primary-500/20 text-primary-200" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Yangi yuborish
              </button>
              <button
                type="button"
                onClick={() => setTab("manage")}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  tab === "manage" ? "bg-primary-500/20 text-primary-200" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Boshqaruv
              </button>
            </div>
          ) : null}
        </div>
      </Card>

      {tab === "submit" && canSubmit ? <FeedbackSubmitView /> : null}
      {tab === "manage" && canManage ? <FeedbackManageView /> : null}
    </div>
  );
}

function FeedbackSubmitView() {
  const [type, setType] = useState<FeedbackItem["type"]>("suggestion");
  const [category, setCategory] = useState<FeedbackItem["category"]>("general");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [targetCourseId, setTargetCourseId] = useState<string>("");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    teachersApi
      .list()
      .then((d) => setTeachers(Array.isArray(d) ? d : []))
      .catch(() => setTeachers([]));
    coursesApi
      .list()
      .then((d) => setCourses(Array.isArray(d) ? d : []))
      .catch(() => setCourses([]));
  }, []);

  const submit = async () => {
    setError("");
    setOkMsg("");
    if (!subject.trim()) {
      setError("Mavzu kiriting");
      return;
    }
    if (!body.trim()) {
      setError("Matn kiriting");
      return;
    }
    try {
      setSending(true);
      await feedbackApi.create({
        type,
        category,
        subject: subject.trim(),
        body: body.trim(),
        isAnonymous,
        targetUserId: category === "teacher" && targetUserId ? targetUserId : null,
        targetCourseId: category === "course" && targetCourseId ? targetCourseId : null,
      });
      setSubject("");
      setBody("");
      setIsAnonymous(false);
      setTargetUserId("");
      setTargetCourseId("");
      setOkMsg("Murojaatingiz qabul qilindi. Tez orada admin ko'rib chiqadi.");
    } catch (e: any) {
      setError(e?.message || "Yuborib bo'lmadi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card className="p-6">
        <h2 className="text-lg font-bold text-white">Yangi murojaat</h2>
        <p className="mt-1 text-xs text-slate-500">Taklif, shikoyat, savol yoki minnatdorchilik bildiring.</p>

        <div className="mt-4 space-y-4">
          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-300">Murojaat turi</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FEEDBACK_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`rounded-xl border px-3 py-3 text-xs font-semibold transition ${
                    type === t.value
                      ? "border-primary-500/50 bg-primary-500/15 text-primary-100"
                      : "border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="mr-1.5 text-base">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-300">Toifa</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackItem["category"])}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200"
            >
              {FEEDBACK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {category === "teacher" ? (
            <div>
              <span className="mb-2 block text-xs font-semibold text-slate-300">O'qituvchini tanlang (ixtiyoriy)</span>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200"
              >
                <option value="">— Aniq o'qituvchi tanlanmagan —</option>
                {teachers.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {category === "course" ? (
            <div>
              <span className="mb-2 block text-xs font-semibold text-slate-300">Kursni tanlang (ixtiyoriy)</span>
              <select
                value={targetCourseId}
                onChange={(e) => setTargetCourseId(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200"
              >
                <option value="">— Aniq kurs tanlanmagan —</option>
                {courses.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-300">Mavzu</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="Qisqa sarlavha..."
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-primary-500/60 focus:outline-none"
            />
          </div>

          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-300">Batafsil ({body.length}/5000)</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 5000))}
              placeholder="Murojaatingizni iloji boricha aniq tasvirlang..."
              className="h-36 w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-primary-500/60 focus:outline-none"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5"
            />
            Anonim sifatida yuborish (ismingiz adminga ko'rinmaydi)
          </label>

          {error ? <div className="text-xs text-rose-300">{error}</div> : null}
          {okMsg ? <div className="text-xs text-emerald-300">{okMsg}</div> : null}

          <Button variant="gradient" onClick={submit} disabled={sending}>
            {sending ? "Yuborilmoqda..." : "Yuborish"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function FeedbackManageView() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>("");
  const [responseDraft, setResponseDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string>("");

  const reload = () => {
    setLoading(true);
    Promise.all([
      feedbackApi.list({ status: statusFilter || undefined, type: typeFilter || undefined, q: q || undefined }),
      feedbackApi.stats().catch(() => null),
    ])
      .then(([list, st]) => {
        setItems(Array.isArray(list) ? list : []);
        setStats(st);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  const updateStatus = async (id: string, status: FeedbackItem["status"]) => {
    try {
      setSavingId(id);
      await feedbackApi.update(id, { status });
      reload();
    } catch (e: any) {
      alert(e?.message || "Yangilab bo'lmadi");
    } finally {
      setSavingId("");
    }
  };

  const sendResponse = async (id: string) => {
    const text = (responseDraft[id] || "").trim();
    if (!text) return;
    try {
      setSavingId(id);
      await feedbackApi.update(id, { adminResponse: text, status: "resolved" });
      setResponseDraft((d) => ({ ...d, [id]: "" }));
      reload();
    } catch (e: any) {
      alert(e?.message || "Javob yuborilmadi");
    } finally {
      setSavingId("");
    }
  };

  const removeItem = async (id: string) => {
    if (!window.confirm("Haqiqatan o'chirib yuborilsinmi?")) return;
    try {
      await feedbackApi.remove(id);
      reload();
    } catch (e: any) {
      alert(e?.message || "O'chirib bo'lmadi");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Jami" value={stats?.total ?? items.length} tone="slate" />
        <StatTile label="Yangi" value={stats?.newCount ?? 0} tone="info" />
        <StatTile label="Ko'rib chiqilmoqda" value={stats?.inReviewCount ?? 0} tone="warning" />
        <StatTile label="Hal qilindi" value={stats?.resolvedCount ?? 0} tone="success" />
        <StatTile label="Rad etildi" value={stats?.rejectedCount ?? 0} tone="danger" />
      </div>

      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-slate-400">Holat</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200"
            >
              <option value="">Barchasi</option>
              {FEEDBACK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-slate-400">Turi</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200"
            >
              <option value="">Barchasi</option>
              {FEEDBACK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-slate-400">Qidiruv</span>
            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") reload();
                }}
                placeholder="Mavzu yoki matn bo'yicha..."
                className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200 placeholder:text-slate-500"
              />
              <Button variant="outline" size="sm" onClick={reload}>
                Qidirish
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-slate-400">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">Murojaat topilmadi.</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {items.map((it) => {
              const tMeta = feedbackTypeMeta(it.type);
              const sMeta = feedbackStatusMeta(it.status);
              const isOpen = activeId === it.id;
              return (
                <div key={it.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base">{tMeta.icon}</span>
                    <span className="text-sm font-bold text-white">{it.subject}</span>
                    <Badge variant={sMeta.variant} dot>{sMeta.label}</Badge>
                    <Badge>{tMeta.label}</Badge>
                    <Badge variant="primary">{feedbackCategoryLabel(it.category)}</Badge>
                    <span className="ml-auto text-[11px] text-slate-500">
                      {new Date(it.createdAt).toLocaleString("uz-UZ")}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Yuboruvchi:{" "}
                    <span className="font-semibold text-slate-200">
                      {it.user ? (
                        <NameWithEmoji name={it.user.name || "—"} emoji={(it.user as any)?.nameEmoji} anim={(it.user as any)?.nameEmojiAnim} />
                      ) : "—"}
                    </span>
                    {it.isAnonymous ? <span className="ml-1 text-amber-300">(anonim)</span> : null}
                    {it.user?.email && !it.isAnonymous ? (
                      <span className="ml-2 text-slate-500">{it.user.email}</span>
                    ) : null}
                    {it.user?.role && !it.isAnonymous ? (
                      <span className="ml-2 text-slate-500">· {it.user.role}</span>
                    ) : null}
                  </div>
                  {it.targetUser ? (
                    <div className="mt-1 text-xs text-slate-500">
                      Belgilangan: <span className="text-slate-200">
                        <NameWithEmoji name={it.targetUser.name} emoji={(it.targetUser as any)?.nameEmoji} anim={(it.targetUser as any)?.nameEmojiAnim} />
                      </span>
                    </div>
                  ) : null}
                  {it.targetCourse ? (
                    <div className="mt-1 text-xs text-slate-500">
                      Kurs: <span className="text-slate-200">{it.targetCourse.title}</span>
                    </div>
                  ) : null}
                  <div className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{it.body}</div>

                  {it.adminResponse ? (
                    <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-100">
                      <div className="mb-1 font-semibold">Javob:</div>
                      <div className="whitespace-pre-wrap">{it.adminResponse}</div>
                      {it.respondedBy ? (
                        <div className="mt-1 text-[10px] text-emerald-300/80">
                          {it.respondedBy.name}
                          {it.respondedAt ? ` · ${new Date(it.respondedAt).toLocaleString("uz-UZ")}` : ""}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={isOpen ? "outline" : "ghost"}
                      onClick={() => setActiveId(isOpen ? "" : it.id)}
                    >
                      {isOpen ? "Yopish" : it.adminResponse ? "Javobni o'zgartirish" : "Javob yozish"}
                    </Button>
                    <select
                      value={it.status}
                      onChange={(e) => updateStatus(it.id, e.target.value as FeedbackItem["status"])}
                      disabled={savingId === it.id}
                      className="h-9 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-slate-200"
                    >
                      {FEEDBACK_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="ml-auto text-xs text-rose-400 hover:text-rose-300"
                      onClick={() => removeItem(it.id)}
                    >
                      O'chirish
                    </button>
                  </div>

                  {isOpen ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={responseDraft[it.id] ?? it.adminResponse ?? ""}
                        onChange={(e) =>
                          setResponseDraft((d) => ({ ...d, [it.id]: e.target.value.slice(0, 5000) }))
                        }
                        placeholder="Javobingizni yozing..."
                        className="h-28 w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-primary-500/60 focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="gradient"
                          onClick={() => sendResponse(it.id)}
                          disabled={savingId === it.id || !(responseDraft[it.id] || "").trim()}
                        >
                          {savingId === it.id ? "Yuborilmoqda..." : "Javobni yuborish"}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number | string; tone: "slate" | "info" | "warning" | "success" | "danger" }) {
  const toneCls = {
    slate: "border-white/10 bg-white/[0.03] text-slate-200",
    info: "border-sky-500/20 bg-sky-500/10 text-sky-100",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-100",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
    danger: "border-rose-500/20 bg-rose-500/10 text-rose-100",
  }[tone];
  return (
    <div className={`rounded-2xl border p-4 ${toneCls}`}>
      <div className="text-[11px] uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
    </div>
  );
}
