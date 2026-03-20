import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertTriangle } from 'lucide-react';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  isActive: boolean;
  onClose: () => void;
}

export function Scanner({ onScan, isActive, onClose }: ScannerProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) return;

    setError(null);
    const html5QrCode = new Html5Qrcode("qr-reader");

    // Start picking the back camera automatically
    html5QrCode.start(
      { facingMode: "environment" }, // Focus on back camera natively
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        // Stop scanning after success
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            onScan(decodedText);
          }).catch(() => onScan(decodedText));
        } else {
          onScan(decodedText);
        }
      },
      () => {
        // ignoring frame errors
      }
    ).catch(err => {
      console.error(err);
      setError("Le navigateur bloque l'accès à la caméra ou aucune caméra n'a été détectée. Veuillez autoriser l'accès.");
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [isActive, onScan]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md p-6 rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={() => {
            onClose();
          }}
          className="absolute right-4 top-4 p-2 bg-muted hover:bg-muted text-foreground rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-6 mt-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 text-[var(--color-primary)] rounded-full flex items-center justify-center mb-3">
            <Camera className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold">Scanner un Code GS1</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Placez le code au centre de la zone.
          </p>
        </div>
        
        {/* Le conteneur vidéo pour Html5Qrcode */}
        <div id="qr-reader" className="w-full rounded-lg overflow-hidden border border-border bg-black min-h-[250px] flex items-center justify-center relative"></div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
