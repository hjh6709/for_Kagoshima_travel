import { useState } from "react";

/**
 * ChinaPaymentHelper
 * 중국 여행(CN) 시 필수적인 모바일 간편 결제(알리페이, 위챗페이)를
 * 모바일 웹 브라우저 환경에서 1-Click 딥링크로 구동하고 관련 팁을 안내하는 컴포넌트입니다.
 */
export function ChinaPaymentHelper() {
  const [showTip, setShowTip] = useState(false);

  /**
   * handleAppLaunch
   * 모바일 앱 딥링크 스키마를 사용하여 사용자 단말기에 설치된 결제 앱을 강제 구동합니다.
   * 모바일이 아닌 환경에서는 동작하지 않거나 아무 반응이 없을 수 있습니다.
   */
  const handleAppLaunch = (url: string) => {
    // window.location.href 변경을 통해 브라우저에게 앱 실행(URL Scheme) 요청 전파
    window.location.href = url;
  };

  return (
    <div
      style={{
        margin: "1.5rem 0",
        padding: "1.25rem",
        borderRadius: "12px",
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        color: "#f3f4f6",
      }}
    >
      {/* 제목 영역 및 중국 국기 이모지 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "1.25rem" }}>🇨🇳</span>
        <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "600", color: "#f9fafb" }}>
          중국 상하이 현지 결제 도우미
        </h4>
      </div>

      <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#9ca3af", lineHeight: "1.4" }}>
        중국은 현금/카드 결제가 어렵고 모바일 페이가 필수입니다. 아래 버튼을 터치하여 현지 결제 앱을 신속하게 기동하세요.
      </p>

      {/* 결제 앱 기동 딥링크 버튼 그룹 */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
        {/* 알리페이 앱 실행: alipays:// 딥링크 포맷 사용 */}
        <button
          onClick={() => handleAppLaunch("alipays://platformapi/startapp")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            background: "#1677ff",
            color: "#ffffff",
            border: "none",
            fontSize: "0.9rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          type="button"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          🔵 Alipay 실행
        </button>
        
        {/* 위챗/위챗페이 앱 실행: weixin:// 딥링크 포맷 사용 */}
        <button
          onClick={() => handleAppLaunch("weixin://")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            background: "#07c160",
            color: "#ffffff",
            border: "none",
            fontSize: "0.9rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          type="button"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          🟢 WeChat 실행
        </button>
      </div>

      {/* 해외 카드 사전 연동 관련 안내 가이드 토글 */}
      <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "0.75rem" }}>
        <button
          onClick={() => setShowTip(!showTip)}
          style={{
            background: "none",
            border: "none",
            color: "#93c5fd",
            fontSize: "0.8rem",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontWeight: "500",
          }}
          type="button"
        >
          💡 {showTip ? "해외 결제 카드 연동 팁 접기" : "해외 결제 카드 연동 팁 보기"}
        </button>

        {showTip && (
          <div
            style={{
              marginTop: "0.5rem",
              padding: "0.75rem",
              borderRadius: "6px",
              background: "rgba(0, 0, 0, 0.2)",
              fontSize: "0.8rem",
              color: "#d1d5db",
              lineHeight: "1.5",
            }}
          >
            • <strong>트래블로그 / 트래블월렛</strong> 등 수수료 무료 카드를 Alipay 및 위챗 앱에 미리 등록하고 인증을 마친 뒤 출국하셔야 현지에서 실시간 외화 충전식 QR 결제가 정상 동작합니다.
            <br />
            • 데스크톱 브라우저에서는 앱이 열리지 않으며, 스마트폰 모바일 웹 브라우저 환경에서 정상 실행됩니다.
          </div>
        )}
      </div>
    </div>
  );
}
