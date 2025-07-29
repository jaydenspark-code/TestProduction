import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import EarnProLogo from '../Logo/EarnProLogo';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  value, 
  size = 200, 
  className = "" 
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: '#1E40AF',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H'
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();
  }, [value, size]);

  return (
    <div className={`relative inline-block ${className}`}>
      {qrCodeUrl && (
        <>
          <img 
            src={qrCodeUrl} 
            alt="QR Code" 
            className="rounded-lg shadow-lg"
            style={{ width: size, height: size }}
          />
          {/* Logo overlay in the center */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-lg"
            style={{ 
              width: size * 0.2, 
              height: size * 0.2 
            }}
          >
            <EarnProLogo size={size * 0.15} />
          </div>
        </>
      )}
    </div>
  );
};

export default QRCodeGenerator;
