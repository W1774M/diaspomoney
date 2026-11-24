/**
 * Branding helper pour les PDFs DiaspoMoney
 * Centralise les couleurs, logos et informations de branding
 */

import { LEGAL_ENTITY } from '@/lib/legal/company';

export const DIASPOMONEY_BRANDING = {
  // Couleurs principales
  colors: {
    primary: '#667eea', // Violet/bleu principal
    primaryDark: '#764ba2', // Violet foncé
    accent: '#FF6B35', // Orange accent
    text: '#000000',
    textLight: '#6B7280',
    border: '#E5E7EB',
    background: '#FAFAFA',
    success: '#059669',
  },
  
  // Informations de l'entreprise : voir lib/legal/company.ts (source unique)
  company: {
    name: LEGAL_ENTITY.brand,
    tagline: 'Plateforme de services pour la diaspora',
    legalName: LEGAL_ENTITY.name,
    legalForm: LEGAL_ENTITY.legalForm,
    email: LEGAL_ENTITY.email,
    website: LEGAL_ENTITY.website,
    address: LEGAL_ENTITY.address.street,
    city: LEGAL_ENTITY.address.city,
    postalCode: LEGAL_ENTITY.address.postalCode,
    country: LEGAL_ENTITY.address.country,
    siren: LEGAL_ENTITY.siren,
    siret: LEGAL_ENTITY.siret,
    vatNumber: LEGAL_ENTITY.vatNumber,
  },
  
  // Chemin du logo (relatif à public/)
  logoPath: '/img/diaspo/Logo_Diaspo_Horizontal_enrichi.webp',
  logoPathWhite: '/img/diaspo/Logo_DispoMoney_horiz_White-r4cjdg7wv320biozt7wn5l3jqbpge79tslitjic064.webp',
  
  // Dimensions du logo pour PDF
  logoDimensions: {
    width: 120,
    height: 40,
  },
} as const;

/**
 * Génère un header de branding pour PDFKit
 */
export function generatePDFKitHeader(doc: any, options?: { includeLogo?: boolean }) {
  const { colors, company } = DIASPOMONEY_BRANDING;
  const includeLogo = options?.includeLogo ?? false;
  
  // Fond coloré en haut
  doc
    .rect(0, 0, doc.page.width, 80)
    .fill(colors.primary);
  
  // Logo ou texte du branding
  if (includeLogo) {
    // Si on peut charger une image, on l'utilise
    // Sinon, on utilise le texte stylisé
    try {
      // Note: Pour PDFKit, il faudrait charger l'image depuis le système de fichiers
      // Pour l'instant, on utilise le texte stylisé
      doc
        .fillColor('#FFFFFF')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('DiaspoMoney', 50, 25, {
          align: 'left',
        });
    } catch {
      // Fallback sur texte
      doc
        .fillColor('#FFFFFF')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('DiaspoMoney', 50, 25, {
          align: 'left',
        });
    }
  } else {
    doc
      .fillColor('#FFFFFF')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('DiaspoMoney', 50, 25, {
        align: 'left',
      });
  }
  
  // Tagline
  doc
    .fillColor('#FFFFFF')
    .fontSize(10)
    .font('Helvetica')
    .text(company.tagline, 50, 55, {
      align: 'left',
      opacity: 0.9,
    });
  
  // Retourner à la couleur normale
  doc.fillColor(colors.text);
  
  return doc.y + 20; // Retourner la position Y après le header
}

/**
 * Génère un footer de branding pour PDFKit
 */
export function generatePDFKitFooter(doc: any, pageNumber: number, totalPages: number) {
  const { colors, company } = DIASPOMONEY_BRANDING;
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 50;
  
  // Ligne de séparation
  doc
    .strokeColor(colors.border)
    .moveTo(50, footerY - 10)
    .lineTo(doc.page.width - 50, footerY - 10)
    .stroke();
  
  // Texte du footer
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor(colors.textLight)
    .text(
      `${company.name} - ${company.tagline}`,
      50,
      footerY,
      {
        align: 'center',
        width: doc.page.width - 100,
      },
    )
    .text(
      `${company.email} | ${company.website}`,
      50,
      footerY + 12,
      {
        align: 'center',
        width: doc.page.width - 100,
      },
    )
    .text(
      `Page ${pageNumber} / ${totalPages}`,
      50,
      footerY + 24,
      {
        align: 'center',
        width: doc.page.width - 100,
      },
    );
  
  // Retourner à la couleur normale
  doc.fillColor(colors.text);
}

/**
 * Styles de branding pour jsPDF
 */
export function applyJSPDFBranding(doc: any) {
  // Ajouter un rectangle coloré en haut de la page
  doc.setFillColor(102, 126, 234); // #667eea en RGB (couleur primaire DiaspoMoney)
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, 'F');
  
  // Texte du branding
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('DiaspoMoney', 20, 20);
  
  // Tagline
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Plateforme de services pour la diaspora', 20, 26);
  
  // Retourner à la couleur normale
  doc.setTextColor(0, 0, 0);
  
  return 40; // Retourner la position Y après le header
}

/**
 * Génère un footer pour jsPDF
 */
export function generateJSPDFFooter(doc: any, pageNumber: number) {
  const { company } = DIASPOMONEY_BRANDING;
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 20;
  
  // Ligne de séparation
  doc.setDrawColor(229, 231, 235); // #E5E7EB (couleur border DiaspoMoney)
  doc.line(20, footerY - 10, doc.internal.pageSize.getWidth() - 20, footerY - 10);
  
  // Texte du footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128); // #6B7280
  doc.text(
    `${company.name} - ${company.tagline}`,
    doc.internal.pageSize.getWidth() / 2,
    footerY,
    { align: 'center' },
  );
  doc.text(
    `${company.email} | ${company.website}`,
    doc.internal.pageSize.getWidth() / 2,
    footerY + 6,
    { align: 'center' },
  );
  doc.text(
    `Page ${pageNumber}`,
    doc.internal.pageSize.getWidth() / 2,
    footerY + 12,
    { align: 'center' },
  );
  
  // Retourner à la couleur normale
  doc.setTextColor(0, 0, 0);
}
