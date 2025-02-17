import { useState } from 'react';
import styles from "../pages/Profile/Profile.module.css";
import { useTranslation } from "react-i18next";

const TwoFactorSetup = ({ onClose, onSuccess, authTokens, noModal }) => {
  const [step, setStep] = useState('initial');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const { t, i18n } = useTranslation();

  const getQRCode = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/2fa/setup/`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + String(authTokens.access)
        }
      });

      const data = await response.json();
      if (response.ok) {
        setQrCode(data.qr_code);
        setSecret(data.secret);
        setStep('verify');
      } else {
        setError(data.detail || t('Failed to get QR code'));
      }
    } catch (error) {
      setError(t('Failed to communicate with server'));
    }
  };

  const verifySetup = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/2fa/setup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + String(authTokens.access)
        },
        body: JSON.stringify({ verification_code: verificationCode })
      });

      const data = await response.json();
      if (response.ok) {
        setStep('success');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.detail || t('Invalid verification code'));
      }
    } catch (error) {
      setError(t('Failed to verify code'));
    }
  };

  const content = (
    <div>
      {step === 'initial' && (
        <div className={styles.qr_code_container}>
          <p className={styles.verification_message}>
            {t("To enable 2FA, you'll need an authenticator app like Google Authenticator or Authy (for 42 accounts, 2FA can't be activated here but can by going on the intra to settings -> privacy")}).
          </p>
          <button
            onClick={getQRCode}
            className={styles.verification_button}
          >
            Start Setup
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div className={styles.qr_code_container}>
          <p className={styles.verification_message}>1. {t("Scan this QR code with your authenticator app")}:</p>
          <img src={qrCode} alt="2FA QR Code" className={styles.qr_code}/>
          <p className={styles.secret}>
            {t("Can't scan? Use this code")}: {secret}
          </p>
          <p className={styles.verification_message}>2. {t("Enter the verification code from your app")}:</p>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className={styles.verification_input}
            maxLength={6}
            placeholder="Enter 6-digit code"
          />
          <button
            onClick={verifySetup}
            className={styles.verification_button}
          >
            {t("Verify and Enable 2FA")}
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className={styles.qr_code_container}>
          <p className={`${styles.verification_message} ${styles.success}`}>
            ✓ {t("Two-factor authentication has been successfully enabled!")}
          </p>
          <button
            onClick={onClose}
            className={styles.verification_button}
          >
            {t("Close")}
          </button>
        </div>
      )}
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );

  if (noModal) {
    return content;
  }

  return (
    <div className={styles.edit_profile_modal}>
      <div className={styles.edit_profile_content}>
        <button 
          className={styles.edit_profile_content_b}
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className={styles.edit_profile_title}>{t("Two-Factor Authentication Setup")}</h2>
        {content}
      </div>
    </div>
  );
};

export default TwoFactorSetup;