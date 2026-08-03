import { useState } from "react";
import { ChevronDown, ChevronUp, CreditCard, ExternalLink } from "lucide-react";

/** 중국 여행의 결제 앱 실행 경로와 출국 전 준비 방법을 안내합니다. */
export function ChinaPaymentHelper() {
  const [showTip, setShowTip] = useState(false);

  const handleAppLaunch = (url: string) => {
    window.location.href = url;
  };

  return (
    <section className="china-payment-helper" aria-labelledby="china-payment-title">
      <div className="china-payment-heading">
        <span className="china-payment-icon" aria-hidden="true">
          <CreditCard size={20} />
        </span>
        <div>
          <span>중국 여행 결제</span>
          <h2 id="china-payment-title">알리페이·위챗 준비</h2>
        </div>
      </div>

      <p className="china-payment-description">
        출국 전에 해외 결제 카드를 연동하고 본인 인증을 마치세요. 현지에서는
        설치된 결제 앱을 바로 열 수 있습니다.
      </p>

      <div className="china-payment-apps">
        <button
          className="payment-app-button alipay"
          onClick={() => handleAppLaunch("alipays://platformapi/startapp")}
          type="button"
        >
          Alipay 열기
          <ExternalLink aria-hidden="true" size={16} />
        </button>

        <button
          className="payment-app-button wechat"
          onClick={() => handleAppLaunch("weixin://")}
          type="button"
        >
          WeChat 열기
          <ExternalLink aria-hidden="true" size={16} />
        </button>
      </div>

      <div className="china-payment-tip">
        <button
          aria-expanded={showTip}
          className="china-payment-tip-toggle"
          onClick={() => setShowTip(!showTip)}
          type="button"
        >
          <span>해외 결제 카드 연동 방법</span>
          {showTip ? (
            <ChevronUp aria-hidden="true" size={18} />
          ) : (
            <ChevronDown aria-hidden="true" size={18} />
          )}
        </button>

        {showTip && (
          <div className="china-payment-tip-content">
            <p>
              <strong>출국 전:</strong> 사용할 해외 결제 카드를 앱에 등록하고
              여권·휴대폰 본인 인증을 마치세요.
            </p>
            <p>
              <strong>앱 실행:</strong> 위 버튼은 스마트폰에 설치된 앱을 엽니다.
              데스크톱에서는 동작하지 않을 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
