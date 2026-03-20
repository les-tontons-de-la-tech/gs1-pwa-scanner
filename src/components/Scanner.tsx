import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  isActive: boolean;
  onClose: () => void;
}

export function Scanner({ onScan, isActive, onClose }: ScannerProps) {
  useEffect(() => {
    if (!isActive) return;

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        html5QrcodeScanner.clear().then(() => {
          onScan(decodedText);
        });
      },
      () => {
        // Ignoring background errors
      }
    );

    return () => {
      html5QrcodeScanner.clear().catch(() => {});
    };
  }, [isActive, onScan]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md p-6 rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
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
        
        <div id="qr-reader" className="w-full rounded-lg overflow-hidden border border-border bg-white text-black p-2"></div>
      </div>
    </div>
  );
}
