import React from 'react';
import { toPng } from 'html-to-image';
import { QRCode } from 'react-qrcode-logo';

interface ReferralTemplateProps {
  user: {
    referralCode: string;
  };
  onClose: () => void;
}

const ReferralTemplate: React.FC<ReferralTemplateProps> = ({ user, onClose }) => {
  const referralLink = `https://earnpro.org/register?ref=${user.referralCode}`;

  const downloadTemplate = () => {
    const node = document.getElementById('referral-template-content');
    if (node) {
      toPng(node, { quality: 0.95, pixelRatio: 2 })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'earnpro-referral-guide.png';
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error('Oops, something went wrong!', err);
        });
    }
  };

  const steps = [
    { number: 1, text: 'Visit our website' },
    { number: 2, text: 'Click on Register' },
    { number: 3, text: 'Fill in your details' },
    { number: 4, text: 'Verify your email' },
    { number: 5, text: 'Start Earning' },
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ position: 'relative', background: 'white', borderRadius: '10px', padding: '20px' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', color: '#333', cursor: 'pointer' }}>&times;</button>
        <div id="referral-template-content" style={{ width: 400, background: 'linear-gradient(145deg, #6d28d9, #4f46e5)', color: 'white', fontFamily: '"Poppins", sans-serif', padding: '30px', borderRadius: '10px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>HOW TO GET STARTED</h1>
            <p style={{ fontSize: '16px', opacity: 0.9 }}>on <span style={{ fontWeight: 'bold' }}>EarnPro</span></p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
            {steps.map(step => (
              <div key={step.number} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '15px', fontWeight: 'bold' }}>{step.number}</div>
                <div style={{ fontSize: '16px' }}>{step.text}</div>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#333' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 15px 0' }}>Use my referral code to sign up!</h2>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              <QRCode value={referralLink} size={120} qrStyle="dots" eyeRadius={5} />
            </div>
            <p style={{ fontSize: '12px', wordBreak: 'break-all', background: '#e0e0e0', padding: '8px', borderRadius: '5px' }}>{referralLink}</p>
          </div>

        </div>
        <button onClick={downloadTemplate} style={{ display: 'block', width: '100%', marginTop: '20px', padding: '12px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>Download Guide</button>
      </div>
    </div>
  );
};

export default ReferralTemplate;