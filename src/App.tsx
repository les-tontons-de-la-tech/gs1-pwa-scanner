import { useState, useRef } from 'react';
import { Camera, QrCode, RefreshCcw, ShieldCheck } from 'lucide-react';
import { PersonaSelector, type PersonaType } from './components/PersonaSelector';
import { Scanner } from './components/Scanner';
import { simulateScan, type SimulationResult } from './lib/gs1-simulator';

export default function App() {
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('A');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<SimulationResult | null>(null);
  const scannerRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  const handlePersonaSelect = (persona: PersonaType) => {
    setSelectedPersona(persona);
    setTimeout(() => {
      scannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleScan = (decodedText: string) => {
    setIsScanning(false);
    const result = simulateScan(decodedText, selectedPersona);
    setScanResult(result);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      {/* Header */}
      <header className="bg-[var(--color-primary)] text-white p-4 shadow-md sticky top-0 z-10 flex items-center gap-3">
        <QrCode className="w-8 h-8 opacity-90" />
        <div>
          <h1 className="text-xl font-bold leading-tight">GS1 PWA Scanner</h1>
          <p className="text-xs text-white/70">Simulateur de Personas Digital Link</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-8 mt-4">
        
        {/* Step 1: Persona Selection */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--color-secondary)] text-white flex items-center justify-center text-sm font-bold">1</div>
            <h2 className="text-lg font-semibold text-foreground">Choisissez un Persona</h2>
          </div>
          <PersonaSelector selected={selectedPersona} onSelect={handlePersonaSelect} />
        </section>

        {/* Step 2: Scan Action */}
        <section ref={scannerRef} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--color-secondary)] text-white flex items-center justify-center text-sm font-bold">2</div>
            <h2 className="text-lg font-semibold text-foreground">Scanner un GS1 Digital Link</h2>
          </div>
          <button 
            onClick={() => setIsScanning(true)}
            className="w-full sm:w-auto hover:bg-opacity-90 flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-6 py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 text-lg font-medium"
          >
            <Camera className="w-6 h-6" />
            Ouvrir la Caméra / Scanner
          </button>
        </section>

        {/* Scan Result */}
        {scanResult && (
          <section ref={resultRef} className="mt-8 transition-all animate-in zoom-in-95 duration-300">
            <div className="bg-card border border-border shadow-xl rounded-2xl overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-[var(--color-primary)]" />
                <h3 className="text-lg font-bold text-foreground">Résultat de la Simulation</h3>
              </div>
              
              <div className="p-5 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">URL Scannée</h4>
                  <p className="text-sm font-mono bg-muted/50 p-2 rounded-lg break-all text-foreground border">
                    {scanResult.originalUrl}
                  </p>
                </div>

                {scanResult.error ? (
                  <div className="bg-red-50 text-red-700 p-4 border border-red-200 rounded-lg">
                    <p className="font-semibold text-sm">Erreur d'analyse métier :</p>
                    <p className="text-sm mt-1">{scanResult.error}</p>
                    <button 
                     onClick={() => handleScan('https://id.gs1.org/01/01234567890128/10/ABC/17/241231')}
                     className="mt-3 text-sm font-medium underline hover:text-red-900"
                    >
                      Utiliser un lien de test GS1 valide
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <DataCard label="GTIN" value={scanResult.decoded.gtin} />
                      <DataCard label="Lot / Batch" value={scanResult.decoded.batch} />
                      <DataCard label="DLUO / Expiry" value={scanResult.decoded.expiry} />
                      <DataCard label="Serial" value={scanResult.decoded.serial} />
                    </div>

                    {scanResult.compliance && (
                      <div className={`p-4 rounded-xl border mt-4 ${
                        scanResult.compliance.status === 'success' ? 'bg-green-50/50 border-green-200' :
                        scanResult.compliance.status === 'warning' ? 'bg-orange-50/50 border-orange-200' :
                        'bg-red-50/50 border-red-200'
                      }`}>
                        <h4 className={`text-md font-bold mb-1 ${
                          scanResult.compliance.status === 'success' ? 'text-green-800' :
                          scanResult.compliance.status === 'warning' ? 'text-orange-800' :
                          'text-red-800'
                        }`}>
                          {scanResult.compliance.status === 'success' ? '✅ CONFORME : ' :
                           scanResult.compliance.status === 'warning' ? '⚠️ PARTIELLEMENT CONFORME : ' : '❌ NON CONFORME : '}
                          {scanResult.compliance.title}
                        </h4>
                        <p className="text-sm text-slate-700 mb-3 italic">
                          {scanResult.compliance.explanation}
                        </p>
                        <div className="space-y-2">
                          {scanResult.compliance.checks.map((chk, i) => (
                            <div key={i} className="flex items-center justify-between text-sm bg-white p-2 rounded border shadow-sm">
                              <span className="font-medium text-slate-700 flex items-center gap-2">
                                {chk.valid ? '🟢' : '🔴'} {chk.label}
                              </span>
                              {chk.value && <span className="text-slate-500 font-mono text-xs">{chk.value}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-4">
                      <h4 className="text-md font-bold text-[var(--color-primary)] mb-2 border-b border-blue-100 pb-2">
                        Comportement Simulé ({scanResult.persona})
                      </h4>
                      <p className="text-sm font-medium text-slate-800 mb-4">{scanResult.simulatedAction}</p>
                      
                      <div className="space-y-3">
                        {scanResult.actionDetails && Object.entries(scanResult.actionDetails).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-xs font-semibold uppercase text-slate-500 block mb-1">{key}</span>
                            <pre className="text-xs bg-white p-3 rounded-lg border border-blue-100 text-slate-700 whitespace-pre-wrap font-mono relative">
                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                <div className="pt-4 flex justify-end">
                   <button 
                     onClick={() => setScanResult(null)}
                     className="flex flex-row items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                   >
                     <RefreshCcw className="w-4 h-4" />
                     Nouvelle Analyse
                   </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Scanner 
        isActive={isScanning} 
        onClose={() => setIsScanning(false)} 
        onScan={handleScan} 
      />
    </div>
  );
}

function DataCard({ label, value }: { label: string, value?: string }) {
  if (!value) return null;
  return (
    <div className="bg-card border border-border shadow-sm p-3 rounded-xl flex flex-col items-center sm:items-start">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-80">{label}</span>
      <span className="text-sm font-mono font-bold text-foreground">{value}</span>
    </div>
  );
}
