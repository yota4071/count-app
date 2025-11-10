"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { db, ensureAnon, auth } from "@/lib/firebase";
import {
  ref, onValue, runTransaction, set
} from "firebase/database";
import Image from "next/image";

export default function GroupPage() {
  const params = useParams<{ gid: string }>();
  const gid = params.gid;
  const [name, setName] = useState<string>("Counter");
  const [count, setCount] = useState<number>(0);
  const [owner, setOwner] = useState<string | null>(null);
  const [url, setUrl] = useState<string>("");

  const groupRef = useMemo(() => ref(db, `groups/${gid}`), [gid]);
  const countRef = useMemo(() => ref(db, `groups/${gid}/count`), [gid]);

  useEffect(() => {
    (async () => {
      await ensureAnon();
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // 初回訪問者を members に登録
      await set(ref(db, `groups/${gid}/members/${uid}`), true).catch(() => {});

      // リアルタイム購読
      onValue(groupRef, (snap) => {
        const data = snap.val();
        if (!data) return;
        setName(data.name ?? "Counter");
        setCount(data.count ?? 0);
        setOwner(data.createdBy ?? null);
      });
    })();

    // クライアント側でURLを設定
    if (typeof window !== "undefined") {
      setUrl(window.location.href);
    }
  }, [groupRef, gid]);

  const inc = (delta: number) => {
    // 衝突に強い原子的更新
    runTransaction(countRef, (cur) => (cur || 0) + delta);
  };

  const reset = async () => {
    // 確認ダイアログを表示
    const confirmed = window.confirm("カウントを0にリセットしますか？\nこの操作は元に戻せません。");
    if (!confirmed) return;

    // リセットは単純上書き（オーナーのみなどの権限を後で足せる）
    await set(countRef, 0);
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: "このカウンターを一緒に使おう！", url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("共有URLをコピーしました");
      }
    } catch {}
  };

  return (
    <main style={styles.container}>
      {/* 背景装飾画像 */}
      <div style={styles.backgroundPattern}></div>

      <div style={styles.card}>
        {/* 装飾画像 */}
        <div style={styles.decorativeImageContainer}>
          <Image
            src="/images/feature-1.png"
            alt="Counter Icon"
            width={120}
            height={120}
            style={styles.decorativeImage}
          />
        </div>

        {/* ヘッダー */}
        <div style={styles.header}>
          <div style={styles.groupIdBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>ID: {gid.slice(0, 8)}...</span>
          </div>
          {owner && auth.currentUser?.uid === owner && (
            <div style={styles.ownerBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              オーナー
            </div>
          )}
        </div>

        {/* タイトル */}
        <h1 style={styles.title}>{name}</h1>

        {/* カウント表示 */}
        <div style={styles.countContainer}>
          <div style={styles.countDisplay}>{count}</div>
          <div style={styles.countLabel}>Current Count</div>
        </div>

        {/* コントロールボタン */}
        <div style={styles.controls}>
          <button onClick={() => inc(-10)} style={{...styles.button, ...styles.buttonSecondary}}>
            -10
          </button>
          <button onClick={() => inc(-1)} style={{...styles.button, ...styles.buttonSecondary}}>
            -1
          </button>
          <button onClick={() => inc(1)} style={{...styles.button, ...styles.buttonPrimary}}>
            +1
          </button>
          <button onClick={() => inc(10)} style={{...styles.button, ...styles.buttonPrimary}}>
            +10
          </button>
        </div>

        <div style={styles.resetRow}>
          <button onClick={reset} style={{...styles.button, ...styles.buttonDanger}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            リセット
          </button>
        </div>

        {/* 共有セクション */}
        <div style={styles.shareSection}>
          <button onClick={share} style={{...styles.button, ...styles.buttonShare}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            共有リンクを送る
          </button>
          {url && (
            <div style={styles.urlDisplay}>
              <input
                type="text"
                value={url}
                readOnly
                style={styles.urlInput}
                onClick={(e) => e.currentTarget.select()}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  backgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "url(/images/background-pattern.svg)",
    backgroundRepeat: "repeat",
    opacity: 0.1,
    pointerEvents: "none",
  },
  card: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "24px",
    padding: "32px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    position: "relative",
    zIndex: 1,
  },
  decorativeImageContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "16px",
    marginTop: "-16px",
  },
  decorativeImage: {
    borderRadius: "16px",
    maxWidth: "100%",
    height: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "8px",
  },
  groupIdBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#6b7280",
    background: "#f3f4f6",
    padding: "6px 12px",
    borderRadius: "12px",
    fontWeight: 500,
  },
  ownerBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#059669",
    background: "#d1fae5",
    padding: "4px 10px",
    borderRadius: "12px",
    fontWeight: 600,
  },
  title: {
    fontSize: "32px",
    fontWeight: 800,
    color: "#1f2937",
    marginBottom: "24px",
    textAlign: "center",
  },
  countContainer: {
    textAlign: "center",
    marginBottom: "32px",
    padding: "24px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)",
  },
  countDisplay: {
    fontSize: "80px",
    fontWeight: 900,
    color: "#ffffff",
    lineHeight: 1,
    marginBottom: "8px",
    textShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
  },
  countLabel: {
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  controls: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "8px",
    marginBottom: "12px",
  },
  resetRow: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "24px",
  },
  button: {
    padding: "14px 20px",
    borderRadius: "14px",
    border: "none",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  buttonPrimary: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
  },
  buttonSecondary: {
    background: "#f3f4f6",
    color: "#4b5563",
  },
  buttonDanger: {
    background: "#fee2e2",
    color: "#dc2626",
    minWidth: "140px",
  },
  buttonShare: {
    background: "#1f2937",
    color: "#ffffff",
    width: "100%",
  },
  shareSection: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "24px",
  },
  urlDisplay: {
    marginTop: "12px",
  },
  urlInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "2px solid #e5e7eb",
    fontSize: "13px",
    color: "#6b7280",
    background: "#f9fafb",
    fontFamily: "monospace",
    textAlign: "center",
  },
};