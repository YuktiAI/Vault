import { useCallback, useEffect, useRef, useState } from "react";
import { isAuthorized, extractToken, setAuthCookie } from "../lib/auth";

async function readApiResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned an invalid response (${response.status}).`);
  }
}

export async function getServerSideProps({ req, res, query }) {
  const authReq = { ...req, query };
  const authed = isAuthorized(authReq);
  if (!authed) {
    const token = extractToken(authReq);
    // Wrong or missing token — show the locked state, no redirect needed.
    return { props: { justAuthed: false, locked: true } };
  }
  // If they arrived via ?key=, set the cookie so future visits need no query param.
  const queryToken = query && query.key;
  if (queryToken) {
    setAuthCookie(res, Array.isArray(queryToken) ? queryToken[0] : queryToken);
  }
  return { props: { locked: false } };
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

export default function Home({ locked }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [queue, setQueue] = useState([]); // items currently uploading
  const [linkValue, setLinkValue] = useState("");
  const [linkNote, setLinkNote] = useState("");
  const [message, setMessage] = useState(null);
  const inputRef = useRef(null);

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
    if (!locked) refresh();
  }, [locked, refresh]);

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

  if (locked) {
    return (
      <div className="locked">
        <div className="lockedCard">
          <div className="mark" />
          <h1>Not authorized</h1>
          <p>Open this page with your access link, the one with <code>?key=</code> in it.</p>
        </div>
        <style jsx>{`
          .locked {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #101115;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .lockedCard {
            text-align: center;
            color: #d5d7dc;
            max-width: 320px;
            padding: 40px;
          }
          .mark {
            width: 28px;
            height: 28px;
            margin: 0 auto 20px;
            border-radius: 6px;
            background: #e8a33d;
          }
          h1 {
            font-size: 20px;
            margin: 0 0 10px;
            font-weight: 600;
          }
          p {
            font-size: 14px;
            line-height: 1.6;
            color: #8a8f98;
            margin: 0;
          }
          code {
            background: #1c1e24;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 13px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page">
      <header>
        <div className="mark" />
        <div>
          <h1>Vault</h1>
          <p className="sub">Work system → your drive</p>
        </div>
      </header>

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
          <span>size</span>
          <span>sent</span>
        </div>
        {loading && <div className="empty">Loading…</div>}
        {!loading && files.length === 0 && <div className="empty">Nothing here yet.</div>}
        {!loading &&
          files.map((f) => (
            <a
              key={f.id}
              href={f.webViewLink}
              target="_blank"
              rel="noreferrer"
              className="row"
            >
              <span className="fname">{f.name}</span>
              <span className="fsize">{formatSize(f.size)}</span>
              <span className="ftime">{formatTime(f.createdTime)}</span>
            </a>
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
        .linkRow input:focus {
          border-color: #e8a33d;
        }
        .linkRow input[type="url"] {
          flex: 1.4;
        }
        .noteInput {
          flex: 1;
        }
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
          grid-template-columns: 1fr 80px 120px;
          font-size: 11px;
          color: #5c616c;
          padding: 0 4px 10px;
          border-bottom: 1px solid #23252c;
        }
        .empty {
          padding: 20px 4px;
          font-size: 13px;
          color: #6f7480;
        }
        .row {
          display: grid;
          grid-template-columns: 1fr 80px 120px;
          padding: 12px 4px;
          text-decoration: none;
          color: #d5d7dc;
          border-bottom: 1px solid #1c1e24;
          font-size: 13px;
          align-items: center;
        }
        .row:hover {
          background: #16171c;
        }
        .fname {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-right: 10px;
        }
        .fsize,
        .ftime {
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
          font-size: 11.5px;
          color: #8a8f98;
        }
        @media (max-width: 480px) {
          .manifestHead,
          .row {
            grid-template-columns: 1fr 60px;
          }
          .ftime {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
