import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    const { data: me } = await supabase.auth.getUser();
    const uid = me?.user?.id;
    if (!uid) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("id,title,body,read,created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error) {
      setItems(data ?? []);
      setUnread((data ?? []).filter((n) => !n.read).length);
    }
  }

  async function markAllRead() {
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return setOpen(false);

    await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    await load();
    setOpen(false);
  }

  useEffect(() => {
    load();

    // "semi-push": refresca cada 10s mientras la app está abierta
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "relative",
          border: "1px solid #cacbd3",
          background: "transparent",
          color: "#cacbd3",
          borderRadius: 999,
          padding: "6px 10px",
          cursor: "pointer",
        }}
        title="Notificaciones"
      >
        🔔
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              background: "#bc3f4a",
              color: "white",
              borderRadius: 999,
              padding: "2px 6px",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            width: 320,
            background: "#2a2f58",
            border: "1px solid rgba(202,203,211,.25)",
            borderRadius: 14,
            padding: 12,
            color: "#cacbd3",
            boxShadow: "0 12px 28px rgba(0,0,0,.35)",
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b>Notificaciones</b>
            <button
              onClick={markAllRead}
              style={{
                background: "transparent",
                border: "1px solid rgba(202,203,211,.4)",
                color: "#cacbd3",
                borderRadius: 10,
                padding: "4px 8px",
                cursor: "pointer",
              }}
            >
              Marcar leídas
            </button>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10, maxHeight: 360, overflow: "auto" }}>
            {items.length === 0 && <div style={{ opacity: 0.8 }}>Sin notificaciones todavía.</div>}
            {items.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  background: n.read ? "rgba(255,255,255,.05)" : "rgba(188,63,74,.10)",
                  border: "1px solid rgba(202,203,211,.15)",
                }}
              >
                <div style={{ fontWeight: 800 }}>{n.title}</div>
                <div style={{ fontSize: 14, opacity: 0.95 }}>{n.body}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

