"use client";

import { useEffect, useState } from "react";
import { ensureAnon, auth, db } from "@/lib/firebase";
import { ref, set } from "firebase/database";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HomePage() {
  const [name, setName] = useState("My Counter");
  const [isReady, setIsReady] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const router = useRouter();

  const addDebug = (msg: string) => {
    console.log(msg);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    addDebug("認証を開始しています...");
    ensureAnon()
      .then(() => {
        addDebug(`認証成功: ${auth.currentUser?.uid}`);
        setIsReady(true);
      })
      .catch((error) => {
        addDebug(`認証エラー: ${error.message}`);
        console.error("認証エラー:", error);
        alert("認証に失敗しました: " + error.message);
      });
  }, []);

  const createGroup = async () => {
    if (!isReady || isCreating) return;

    setIsCreating(true);
    addDebug("カウンター作成を開始...");

    try {
      const uid = auth.currentUser?.uid;
      addDebug(`UID: ${uid}`);

      if (!uid) {
        addDebug("エラー: UIDが取得できませんでした");
        alert("認証に失敗しました。ページを再読み込みしてください。");
        setIsCreating(false);
        return;
      }

      const gid = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
      addDebug(`生成されたグループID: ${gid}`);

      const groupData = {
        name: name || "Counter",
        count: 0,
        createdBy: uid,
        members: { [uid]: true }
      };
      addDebug("Firebaseに書き込み中...");

      await set(ref(db, `groups/${gid}`), groupData);
      addDebug("書き込み成功！リダイレクト中...");

      router.push(`/g/${gid}`);
    } catch (error: any) {
      addDebug(`エラー発生: ${error.message} (コード: ${error.code})`);
      console.error("Error creating group:", error);
      alert(`カウンターの作成に失敗しました:\n${error.message}\n\nコード: ${error.code || 'unknown'}`);
      setIsCreating(false);
    }
  };

  return (
    <main style={styles.container}>
      <div style={styles.contentWrapper}>
        {/* ヒーロー画像 */}
        <div style={styles.heroImageContainer}>
          <Image
            src="/images/hero-image.svg"
            alt="Counter App Hero"
            width={400}
            height={300}
            style={styles.heroImage}
            priority
          />
        </div>

        <div style={styles.card}>
          {/* アイコン */}
          <div style={styles.iconContainer}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="2">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </div>

          {/* タイトル */}
          <h1 style={styles.title}>新しいカウンターを作成</h1>
          <p style={styles.subtitle}>
            グループで共有できるリアルタイムカウンターを作成しましょう
          </p>

        {/* 入力フォーム */}
        <div style={styles.formGroup}>
          <label style={styles.label}>カウンター名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: イベント参加者数"
            style={styles.input}
            maxLength={50}
          />
          <div style={styles.charCount}>{name.length}/50</div>
        </div>

        {/* 作成ボタン */}
        <button
          onClick={createGroup}
          style={{
            ...styles.createButton,
            opacity: !isReady || isCreating ? 0.5 : 1,
            cursor: !isReady || isCreating ? 'not-allowed' : 'pointer'
          }}
          disabled={!isReady || isCreating}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          {isCreating ? "作成中..." : !isReady ? "準備中..." : "カウンターを作成"}
        </button>

        {/* 機能説明 */}
        <div style={styles.features}>
          <div style={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <div>
              <div style={styles.featureTitle}>複数人で共有</div>
              <div style={styles.featureDesc}>リンクで簡単に共有</div>
            </div>
          </div>

          <div style={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <div>
              <div style={styles.featureTitle}>リアルタイム更新</div>
              <div style={styles.featureDesc}>即座に同期される</div>
            </div>
          </div>

          <div style={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <div>
              <div style={styles.featureTitle}>匿名で使える</div>
              <div style={styles.featureDesc}>登録不要で簡単</div>
            </div>
          </div>
        </div>
      </div>

      {/* フィーチャー画像セクション */}
      <div style={styles.featureImagesSection}>
        <div style={styles.featureImageCard}>
          <Image
            src="/images/feature-1.png"
            alt="Feature 1"
            width={200}
            height={200}
            style={styles.featureImage}
          />
          <p style={styles.featureImageCaption}>シンプルで使いやすい</p>
        </div>
        <div style={styles.featureImageCard}>
          <Image
            src="/images/feature-2.svg"
            alt="Feature 2"
            width={200}
            height={200}
            style={styles.featureImage}
          />
          <p style={styles.featureImageCaption}>リアルタイム同期</p>
        </div>
      </div>

      {/* デバッグ情報 (開発用) */}
      {debugInfo.length > 0 && (
        <div style={styles.debugPanel}>
          <h3 style={styles.debugTitle}>デバッグ情報</h3>
          {debugInfo.map((info, idx) => (
            <div key={idx} style={styles.debugLine}>{info}</div>
          ))}
        </div>
      )}
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
  },
  contentWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "32px",
    maxWidth: "900px",
    width: "100%",
  },
  heroImageContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "16px",
  },
  heroImage: {
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    maxWidth: "100%",
    height: "auto",
  },
  card: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "24px",
    padding: "48px 32px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  },
  iconContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 800,
    color: "#1f2937",
    marginBottom: "12px",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
    textAlign: "center",
    marginBottom: "32px",
    lineHeight: 1.6,
  },
  formGroup: {
    marginBottom: "24px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "2px solid #e5e7eb",
    fontSize: "16px",
    color: "#1f2937",
    background: "#ffffff",
    transition: "all 0.2s ease",
    outline: "none",
    boxSizing: "border-box",
  },
  charCount: {
    fontSize: "12px",
    color: "#9ca3af",
    textAlign: "right",
    marginTop: "4px",
  },
  createButton: {
    width: "100%",
    padding: "16px 24px",
    borderRadius: "14px",
    border: "none",
    fontSize: "18px",
    fontWeight: 700,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#ffffff",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 8px 20px rgba(102, 126, 234, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "32px",
  },
  features: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  feature: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  featureTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "2px",
  },
  featureDesc: {
    fontSize: "13px",
    color: "#6b7280",
  },
  featureImagesSection: {
    display: "flex",
    gap: "24px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "16px",
  },
  featureImageCard: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
    textAlign: "center",
    transition: "transform 0.3s ease",
  },
  featureImage: {
    borderRadius: "12px",
    maxWidth: "100%",
    height: "auto",
  },
  featureImageCaption: {
    marginTop: "12px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#1f2937",
  },
  debugPanel: {
    marginTop: "24px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    padding: "16px",
    maxWidth: "600px",
    width: "100%",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
    maxHeight: "300px",
    overflowY: "auto",
  },
  debugTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: "12px",
    borderBottom: "2px solid #667eea",
    paddingBottom: "8px",
  },
  debugLine: {
    fontSize: "12px",
    color: "#4b5563",
    fontFamily: "monospace",
    padding: "4px 0",
    borderBottom: "1px solid #e5e7eb",
  },
};