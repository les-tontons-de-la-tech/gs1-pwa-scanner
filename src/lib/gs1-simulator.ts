import { DigitalLink } from 'digital-link.js';
import { type PersonaType } from '../components/PersonaSelector';

export interface ComplianceCheck {
  label: string;
  valid: boolean;
  value?: string;
}

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
  compliance?: {
    status: 'success' | 'warning' | 'error';
    title: string;
    explanation: string;
    checks: ComplianceCheck[];
  };
  error?: string;
}

export function simulateScan(url: string, persona: PersonaType): SimulationResult {
  let gtin, batch, expiry, serial;
  let simulatedAction = '';
  let actionDetails: any = {};
  let compliance;
  let errorMsg;

  try {
    const parsed = DigitalLink(url);
    
    gtin = parsed.getIdentifier('01')?.['01'] || parsed.getIdentifier('02')?.['02'] || parsed.getIdentifier('00')?.['00'];
    batch = parsed.getKeyQualifier('10');
    expiry = parsed.getKeyQualifier('17');
    serial = parsed.getKeyQualifier('21');

    switch (persona) {
      case 'A':
        simulatedAction = 'Redirection Standard (B2C)';
        actionDetails = {
          scenario: 'Le navigateur demande le lien par défaut.',
          headers: { 'Accept-Language': navigator.language || 'fr-FR' },
          requestedLinkType: 'gs1:defaultLink'
        };
        compliance = {
          status: gtin ? 'success' : 'error',
          title: gtin ? 'Routage B2C Possible' : 'Code B2C Invalide',
          explanation: gtin 
            ? "Le code contient l'identification produit minimale (GTIN), suffisant pour afficher une page web au consommateur final."
            : "Il manque le GTIN (AI 01). Aucune redirection consommateur n'est possible.",
          checks: [
            { label: 'Présence du GTIN', valid: !!gtin, value: gtin },
            { label: 'Lien consommateur accessible', valid: true, value: 'Redirection 307 OK' }
          ]
        };
        break;

      case 'B':
        simulatedAction = 'Traitement POS (Caisse)';
        actionDetails = {
          scenario: 'Le logiciel de caisse extrait les données utiles et interroge les alertes sanitaires.',
          offlineData: { GTIN: gtin, Lot: batch, DLUO: expiry },
          onlineVerification: 'GET /01/'+gtin+'?linkType=gs1:recallStatus'
        };
        
        // Basic expiry check simulation (AI 17 format is YYMMDD)
        let isExpired = false;
        if (expiry && expiry.length === 6) {
          const year = 2000 + parseInt(expiry.substring(0, 2));
          const month = parseInt(expiry.substring(2, 4)) - 1;
          const day = parseInt(expiry.substring(4, 6));
          const expiryDate = new Date(year, month, day);
          isExpired = expiryDate < new Date();
        }

        const missingRequiredPOS = !gtin || !batch;
        
        compliance = {
          status: isExpired ? 'error' : (missingRequiredPOS ? 'warning' : 'success'),
          title: isExpired ? 'Produit Périmé - Vente Bloquée' : (missingRequiredPOS ? 'Informations Incomplètes' : 'Produit Valide'),
          explanation: isExpired 
            ? "La vente est physiquement bloquée à la caisse car la date d'expiration (AI 17) est dépassée par rapport à la date du jour."
            : (missingRequiredPOS ? "Attention, le système de caisse exige normalement un GTIN et un Lot pour une traçabilité parfaite, mais certains éléments sont absents du code." : "Toutes les dates et identifiants (GTIN, Lot) sont présents et valides pour un passage sécurisé en caisse."),
          checks: [
            { label: 'Identification Produit', valid: !!gtin, value: gtin },
            { label: 'Contrôle Lot', valid: !!batch, value: batch || 'Lot Absent' },
            { label: 'Contrôle Péremption (DLUO)', valid: !isExpired, value: expiry ? (isExpired ? 'Périmé !' : 'Bonne') : 'Non fournie' },
            { label: 'Statut de Rappel', valid: true, value: 'Aucun rappel en cours' }
          ]
        };
        break;

      case 'C':
        simulatedAction = 'Vérification Douanes / Logistique (B2B)';
        actionDetails = {
          scenario: 'Validation d\'une cargaison par l\'autorité douanière.',
          headers: { 'Authorization': 'Bearer sim_token_789xyz' },
          requestedLinkType: 'gs1:traceability OR gs1:epcis'
        };
        
        const isStrictOriginCompliant = batch && serial;
        compliance = {
          status: isStrictOriginCompliant ? 'success' : (batch || serial ? 'warning' : 'error'),
          title: isStrictOriginCompliant ? 'Contrôle Douanier Validé' : 'Traçabilité Incomplète',
          explanation: isStrictOriginCompliant
            ? "Le code contient un numéro de série ET un numéro de lot, atteignant le niveau d'exigence logistique maximum. L'accès aux événements EPCIS sécurisés (simulés) valide la provenance Europe."
            : "Le code est incomplet pour une logistique critique. Un numéro de série (AI 21) et de Lot (AI 10) sont requis pour retracer précisément le parcours douanier.",
          checks: [
            { label: 'Authentification (Token Bearer)', valid: true, value: 'Accès B2B Sécurisé OK' },
            { label: 'Traçabilité EPCIS (Lot)', valid: !!batch, value: batch || 'Manquant' },
            { label: 'Numéro de Série Unique', valid: !!serial, value: serial || 'Série Manquant' },
            { label: 'Certificat de Provenance Origin', valid: isStrictOriginCompliant, value: isStrictOriginCompliant ? 'Fabrication: UE (Simulation)' : 'Impossible de prouver' }
          ]
        };
        break;

      case 'D':
        simulatedAction = 'Passeport Produit Numérique (DPP)';
        actionDetails = {
          scenario: 'Extraction du Digital Product Passport et score éco-responsable.',
          requestedLinkType: 'gs1:certificationInfo OR gs1:productSustainabilityInfo'
        };
        compliance = {
          status: gtin ? 'success' : 'error',
          title: gtin ? 'Passeport DP Disponible' : 'Accès au DPP Impossible',
          explanation: gtin 
            ? "Le GTIN est bien identifié, ce qui permet à l'application de récupérer un passeport numérique unifié (DPP) comprenant le bilan carbone et l'éco-score simulés."
            : "Sans GTIN (AI 01), la plateforme ne peut pas associer le produit physique à sa base de données environnementale.",
          checks: [
            { label: 'Liaison GTIN', valid: !!gtin, value: gtin },
            { label: 'Score Réparabilité', valid: !!gtin, value: gtin ? '8.5/10 (Mock)' : 'Échec' },
            { label: 'Empreinte Carbone', valid: !!gtin, value: gtin ? '1.2 kg CO2e (Mock)' : 'Échec' },
            { label: 'Matières Recyclées', valid: !!gtin, value: gtin ? '✅ 100% (Simulation)' : 'Échec' }
          ]
        };
        break;

      case 'DEV':
        simulatedAction = 'Inspection Linkset (Développeur)';
        actionDetails = {
          scenario: 'Vérification technique complète de l\'architecture des liens.',
          headers: { 'Accept': 'application/linkset+json' },
          requestedLinkType: 'all'
        };
        
        let attributesCount = 0;
        try {
          const id = parsed.getIdentifier?.();
          const kq = parsed.getKeyQualifiers?.();
          const attrs = parsed.getAttributes?.();
          attributesCount += id ? Object.keys(id).length : 0;
          attributesCount += kq ? Object.keys(kq).length : 0;
          attributesCount += attrs ? Object.keys(attrs).length : 0;
        } catch(e) {}

        compliance = {
          status: attributesCount > 0 ? 'success' : 'warning',
          title: 'Syntaxe GS1 Digital Link Validée',
          explanation: attributesCount > 0 
           ? "L'URI GS1 Digital Link respecte les standards techniques. Tous les attributs sont décodés. (La requête LinkSet fournirait le JSON-LD global listant tous les comportements possibles)."
           : "Le code est vide d'attributs métier, l'URI pourrait être mal formulée.",
          checks: [
            { label: 'Parsing URI Base', valid: true, value: parsed.getDomain() },
            { label: 'Extraction des AI', valid: attributesCount > 0, value: `${attributesCount} attribut(s) trouvé(s)` },
            { label: 'Requête CORS Accept-Linkset', valid: true, value: 'Réponse JSON-LD HTTP 200' }
          ]
        };
        break;
    }

  } catch (error: any) {
    simulatedAction = 'Erreur de parsing GS1';
    errorMsg = error.message || 'URL invalide ou non conforme GS1 Digital Link';
    actionDetails = null;
    compliance = undefined;
  }

  return {
    persona: persona as PersonaType,
    originalUrl: url,
    decoded: { gtin, batch, expiry, serial },
    simulatedAction,
    actionDetails,
    compliance: compliance as any,
    error: errorMsg
  };
}
