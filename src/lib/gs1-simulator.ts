import { DigitalLink } from 'digital-link.js';
import { type PersonaType } from '../components/PersonaSelector';

export interface SimulationResult {
  persona: PersonaType;
  originalUrl: string;
  decoded: {
    gtin?: string;
    batch?: string;
    expiry?: string;
    serial?: string;
  };
  simulatedAction: string;
  actionDetails: any;
  error?: string;
}

export function simulateScan(url: string, persona: PersonaType): SimulationResult {
  let gtin, batch, expiry, serial;
  let simulatedAction = '';
  let actionDetails: any = {};
  let errorMsg;

  try {
    // digital-link.js standard parsing approach: we construct from URI
    // Actually the standard usage is DigitalLink(url)
    const parsed = DigitalLink(url);
    
    gtin = parsed.getIdentifier('01')?.['01'] || parsed.getIdentifier('02')?.['02'] || parsed.getIdentifier('00')?.['00'];
    batch = parsed.getKeyQualifier('10');
    expiry = parsed.getKeyQualifier('17');
    serial = parsed.getKeyQualifier('21');

    switch (persona) {
      case 'A':
        simulatedAction = 'Redirection Standard (B2C)';
        actionDetails = {
          scenario: 'Le smartphone demande le lien par défaut.',
          headers: { 'Accept-Language': navigator.language || 'fr-FR' },
          requestedLinkType: 'gs1:defaultLink',
          expectedResult: 'Redirection 307 vers la page produit locale.'
        };
        break;
      case 'B':
        simulatedAction = 'Traitement POS (Caisse)';
        actionDetails = {
          scenario: 'Le lecteur laser ou douchette décode le code hors ligne pour le prix, puis interroge le rappel en asynchrone.',
          offlineData: { GTIN: gtin, Lot: batch, DLUO: expiry },
          onlineVerification: 'GET /01/'+gtin+'?linkType=gs1:recallStatus',
          expectedResult: 'Le système bloque la vente en cas d\'erreur de statut.'
        };
        break;
      case 'C':
        simulatedAction = 'Vérification Douanes / B2B';
        actionDetails = {
          scenario: 'Un agent scanne pour vérifier la provenance logistique.',
          headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1Ni... (token simulé)' },
          requestedLinkType: 'gs1:traceability OR gs1:epcis',
          expectedResult: 'Le résolveur valide le token CORS et renvoie les JSON des événements logistiques.'
        };
        break;
      case 'D':
        simulatedAction = 'Passeport Produit Numérique (DPP)';
        actionDetails = {
          scenario: 'Accès aux preuves de durabilité.',
          requestedLinkType: 'gs1:certificationInfo OR gs1:productSustainabilityInfo',
          expectedResult: 'Affiche le passeport numérique (DPP) avec éco-score.'
        };
        break;
      case 'DEV':
        simulatedAction = 'Inspection Linkset (Développeur)';
        actionDetails = {
          scenario: 'Le client souhaite le catalogue complet des liens.',
          headers: { 'Accept': 'application/linkset+json' },
          requestedLinkType: 'all',
          expectedResult: 'Le serveur renvoie HTTP 200 + le gros JSON-LD documentant la conf du GTIN '+gtin
        };
        break;
    }

  } catch (error: any) {
    simulatedAction = 'Erreur de parsing';
    errorMsg = error.message || 'URL invalide ou non conforme GS1 Digital Link';
    actionDetails = null;
  }

  return {
    persona,
    originalUrl: url,
    decoded: { gtin, batch, expiry, serial },
    simulatedAction,
    actionDetails,
    error: errorMsg
  };
}
