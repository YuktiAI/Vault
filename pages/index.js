import { useCallback, useEffect, useRef, useState } from "react";

async function readApiResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned an invalid response (${response.status}).`);
  }
}

function formatSize(bytes) {
  if (!bytes) return "—";
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileType(file) {
  const mimeType = (file && file.mimeType) || "";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "DOCX";
  if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "XLSX";
  if (mimeType === "image/png") return "PNG";
  if (mimeType === "image/jpeg") return "JPG";
  if (mimeType === "application/zip") return "ZIP";
  if (mimeType === "text/plain") return "TXT";
  const name = (file && file.name) || "";
  const match = name.match(/\.([A-Za-z0-9]+)$/);
  if (!match) return mimeType ? mimeType.split("/")[1]?.toUpperCase() || "FILE" : "FILE";
  return match[1].toUpperCase();
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [queue, setQueue] = useState([]);
  const [linkValue, setLinkValue] = useState("");
  const [linkNote, setLinkNote] = useState("");
  const [message, setMessage] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const inputRef = useRef(null);

  const refreshAdminStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/session");
      if (!r.ok) {
        setAdminMode(false);
        return;
      }
      const data = await readApiResponse(r);
      setAdminMode(Boolean(data.admin));
    } catch {
      setAdminMode(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/files");
      if (!r.ok) return;
      const data = await readApiResponse(r);
      setFiles(data.files || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    refreshAdminStatus();
  }, [refresh, refreshAdminStatus]);

  const uploadOne = useCallback(
    async (file) => {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      setQueue((q) => [...q, { id, name: file.name, size: file.size, status: "sending" }]);
      const body = new FormData();
      body.append("file", file);
      try {
        const r = await fetch("/api/upload", { method: "POST", body });
        const data = await readApiResponse(r);
        if (!r.ok) throw new Error(data.error || "Upload failed");
        setQueue((q) => q.map((it) => (it.id === id ? { ...it, status: "done" } : it)));
        refresh();
      } catch (e) {
        setQueue((q) => q.map((it) => (it.id === id ? { ...it, status: "error", error: e.message } : it)));
      }
    },
    [refresh]
  );

  const handleFiles = useCallback(
    (fileList) => {
      Array.from(fileList).forEach(uploadOne);
    },
    [uploadOne]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const submitLink = useCallback(
    async (e) => {
      e.preventDefault();
      if (!linkValue.trim()) return;
      setMessage(null);
      try {
        const r = await fetch("/api/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: linkValue.trim(), note: linkNote.trim() }),
        });
        const data = await readApiResponse(r);
        if (!r.ok) throw new Error(data.error || "Could not save link");
        setLinkValue("");
        setLinkNote("");
        setMessage({ type: "ok", text: "Link saved." });
        refresh();
      } catch (e) {
        setMessage({ type: "error", text: e.message });
      }
    },
    [linkValue, linkNote, refresh]
  );

  const handleDownload = useCallback((file) => {
    if (!file || !file.id) return;
    window.location.href = `/api/download?id=${encodeURIComponent(file.id)}`;
  }, []);

  const handleDelete = useCallback(
    async (file) => {
      if (!file || !file.id) return;
      const confirmed = window.confirm(`Delete '${file.name}'?`);
      if (!confirmed) return;

      try {
        const r = await fetch(`/api/files?id=${encodeURIComponent(file.id)}`, { method: "DELETE" });
        const data = await readApiResponse(r);
        if (!r.ok) throw new Error(data.error || "Delete failed.");
        setMessage({ type: "ok", text: `${file.name} deleted.` });
        refresh();
        refreshAdminStatus();
      } catch (e) {
        setMessage({ type: "error", text: e.message });
      }
    },
    [refresh, refreshAdminStatus]
  );

  const handleAdminLogin = useCallback(
    async (e) => {
      e.preventDefault();
      if (!adminKeyInput.trim()) return;

      try {
        const r = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: adminKeyInput.trim() }),
        });
        const data = await readApiResponse(r);
        if (!r.ok) throw new Error(data.error || "Admin login failed.");
        setAdminKeyInput("");
        setShowAdminForm(false);
        setAdminMode(true);
        setMessage({ type: "ok", text: "Owner access enabled." });
      } catch (e) {
        setMessage({ type: "error", text: e.message });
      }
    },
    [adminKeyInput]
  );

  const handleAdminLogout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setAdminMode(false);
      setShowAdminForm(false);
      setMessage({ type: "ok", text: "Owner access ended." });
    } catch {
      setAdminMode(false);
    }
  }, []);

  return (
    <div className="page">
      <header>
        <div className="mark" />
        <div>
          <h1>Vault</h1>
          <p className="sub">Work system → your drive</p>
        </div>
      </header>

      <div className="toolbar">
        <button type="button" className="ghostButton" onClick={refresh}>
          Refresh
        </button>
        {adminMode ? (
          <button type="button" className="ghostButton" onClick={handleAdminLogout}>
            Owner logout
          </button>
        ) : (
          <button type="button" className="ghostButton" onClick={() => setShowAdminForm((value) => !value)}>
            Owner login
          </button>
        )}
      </div>

      {showAdminForm && !adminMode && (
        <form className="adminForm" onSubmit={handleAdminLogin}>
          <input
            type="password"
            placeholder="Admin key"
            value={adminKeyInput}
            onChange={(e) => setAdminKeyInput(e.target.value)}
          />
          <button type="submit">Unlock</button>
        </form>
      )}

      <section
        className={`dropzone ${dragOver ? "over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current && inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="dzLabel">Drop files or a zipped folder here</div>
        <div className="dzSub">or click to browse — anything goes straight to your drive</div>
      </section>

      {queue.length > 0 && (
        <ul className="queue">
          {queue.map((it) => (
            <li key={it.id} className={it.status}>
              <span className="qname">{it.name}</span>
              <span className="qstatus">
                {it.status === "sending" && "sending…"}
                {it.status === "done" && "sent"}
                {it.status === "error" && (it.error || "failed")}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form className="linkRow" onSubmit={submitLink}>
        <input
          type="url"
          placeholder="Paste a link to save"
          value={linkValue}
          onChange={(e) => setLinkValue(e.target.value)}
        />
        <input
          type="text"
          placeholder="note (optional)"
          value={linkNote}
          onChange={(e) => setLinkNote(e.target.value)}
          className="noteInput"
        />
        <button type="submit">Save</button>
      </form>
      {message && <div className={`flash ${message.type}`}>{message.text}</div>}

      <section className="manifest">
        <div className="manifestHead">
          <span>name</span>
          <span>type</span>
          <span>size</span>
          <span>sent</span>
          <span>actions</span>
        </div>
        {loading && <div className="empty">Loading…</div>}
        {!loading && files.length === 0 && <div className="empty">Nothing here yet.</div>}
        {!loading &&
          files.map((f) => (
            <div key={f.id} className="row">
              <span className="fname">{f.name}</span>
              <span className="ftype">{getFileType(f)}</span>
              <span className="fsize">{formatSize(f.size)}</span>
              <span className="ftime">{formatTime(f.createdTime)}</span>
              <span className="actions">
                <button type="button" className="miniButton" onClick={() => handleDownload(f)}>
                  Download
                </button>
                {adminMode && (
                  <button type="button" className="miniButton danger" onClick={() => handleDelete(f)}>
                    Delete
                  </button>
                )}
              </span>
            </div>
          ))}
      </section>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          background: #101115;
        }
      `}</style>
      <style jsx>{`
        .page {
          min-height: 100vh;
          max-width: 640px;
          margin: 0 auto;
          padding: 48px 20px 80px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #edeef0;
        }
        header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 32px;
        }
        .mark {
          width: 30px;
          height: 30px;
          border-radius: 7px;
          background: #e8a33d;
          flex-shrink: 0;
        }
        h1 {
          font-size: 19px;
          margin: 0;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .sub {
          margin: 2px 0 0;
          font-size: 13px;
          color: #8a8f98;
        }
        .toolbar {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-bottom: 16px;
        }
        .ghostButton,
        .miniButton {
          background: #16171c;
          color: #edeef0;
          border: 1px solid #2a2d35;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 12.5px;
          cursor: pointer;
        }
        .miniButton {
          padding: 6px 9px;
          line-height: 1.2;
        }
        .miniButton.danger {
          color: #f7c3b7;
          border-color: #5a2d2a;
        }
        .dropzone {
          border: 1.5px dashed #33363f;
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
          background: #16171c;
        }
        .dropzone.over {
          border-color: #e8a33d;
          background: #1a1712;
        }
        .dzLabel {
          font-size: 15px;
          font-weight: 500;
          color: #edeef0;
          margin-bottom: 6px;
        }
        .dzSub {
          font-size: 13px;
          color: #6f7480;
        }
        .queue {
          list-style: none;
          margin: 16px 0 0;
          padding: 0;
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
          font-size: 12.5px;
        }
        .queue li {
          display: flex;
          justify-content: space-between;
          padding: 7px 2px;
          color: #b4b8c0;
          border-bottom: 1px solid #1c1e24;
        }
        .queue li.done .qstatus {
          color: #6fbf7a;
        }
        .queue li.error .qstatus {
          color: #d9705f;
        }
        .qname {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-right: 12px;
        }
        .qstatus {
          flex-shrink: 0;
          color: #8a8f98;
        }
        .adminForm {
          display: flex;
          gap: 8px;
          margin: 0 0 16px;
        }
        .adminForm input {
          flex: 1;
          background: #16171c;
          border: 1px solid #2a2d35;
          border-radius: 8px;
          padding: 10px 12px;
          color: #edeef0;
          font-size: 13.5px;
          outline: none;
        }
        .adminForm button,
        .linkRow button {
          background: #e8a33d;
          color: #16171c;
          border: none;
          border-radius: 8px;
          padding: 0 18px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
        }
        .linkRow {
          display: flex;
          gap: 8px;
          margin-top: 24px;
        }
        .linkRow input {
          background: #16171c;
          border: 1px solid #2a2d35;
          border-radius: 8px;
          padding: 10px 12px;
          color: #edeef0;
          font-size: 13.5px;
          outline: none;
        }
        .linkRow input:focus,
        .adminForm input:focus {
          border-color: #e8a33d;
        }
        .linkRow input[type="url"] {
          flex: 1.4;
        }
        .noteInput {
          flex: 1;
        }
        .flash {
          margin-top: 10px;
          font-size: 12.5px;
        }
        .flash.ok {
          color: #6fbf7a;
        }
        .flash.error {
          color: #d9705f;
        }
        .manifest {
          margin-top: 40px;
        }
        .manifestHead {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) 80px 80px 110px 170px;
          font-size: 11px;
          color: #5c616c;
          padding: 0 4px 10px;
          border-bottom: 1px solid #23252c;
          gap: 8px;
        }
        .empty {
          padding: 20px 4px;
          font-size: 13px;
          color: #6f7480;
        }
        .row {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) 80px 80px 110px 170px;
          gap: 8px;
          padding: 12px 4px;
          color: #d5d7dc;
          border-bottom: 1px solid #1c1e24;
          font-size: 13px;
          align-items: center;
        }
        .row:hover {
          background: #16171c;
        }
        .fname,
        .ftype,
        .fsize,
        .ftime,
        .actions {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .fname {
          margin-right: 10px;
        }
        .ftype,
        .fsize,
        .ftime {
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
          font-size: 11.5px;
          color: #8a8f98;
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
          min-width: 0;
        }
        @media (max-width: 480px) {
          .manifestHead,
          .row {
            grid-template-columns: minmax(0, 1.4fr) 60px 70px 60px 100px;
          }
          .ftime {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
