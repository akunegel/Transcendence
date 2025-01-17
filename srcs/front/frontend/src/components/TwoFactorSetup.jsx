import { useState } from 'react';

const TwoFactorSetup = ({ onClose, authTokens }) => {
  const [step, setStep] = useState('initial');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

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
        setError(data.detail || 'Failed to get QR code');
      }
    } catch (error) {
      setError('Failed to communicate with server');
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
      } else {
        setError(data.detail || 'Invalid verification code');
      }
    } catch (error) {
      setError('Failed to verify code');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Two-Factor Authentication Setup</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 'initial' && (
          <div>
            <p className="mb-4">To enable 2FA, you'll need an authenticator app like Google Authenticator or Authy.</p>
            <button
              onClick={getQRCode}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Start Setup
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div>
            <div className="mb-4">
              <p className="mb-2">1. Scan this QR code with your authenticator app:</p>
              <img src={qrCode} alt="2FA QR Code" className="mx-auto"/>
              <p className="mt-2 text-sm text-gray-600">
                Can't scan? Use this code: {secret}
              </p>
            </div>
            <div className="mb-4">
              <p className="mb-2">2. Enter the verification code from your app:</p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                maxLength={6}
                placeholder="Enter 6-digit code"
              />
            </div>
            <button
              onClick={verifySetup}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Verify and Enable 2FA
            </button>
          </div>
        )}

        {step === 'success' && (
          <div>
            <p className="mb-4 text-green-600">
              ✓ Two-factor authentication has been successfully enabled!
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup