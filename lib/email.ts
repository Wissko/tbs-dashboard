import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// SECURITY: Escape HTML special characters to prevent XSS injection in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function envoyerEmailAcceptation({
  destinataire,
  prenom,
  type,
  dateEvenement,
  prixTotal,
  acompte,
  tenantName,
  tenantEmail,
}: {
  destinataire: string;
  prenom: string;
  type: string;
  dateEvenement: string;
  prixTotal: number;
  acompte: number;
  tenantName: string;
  tenantEmail: string;
}) {
  // SECURITY: Escape all user-controlled strings before HTML interpolation
  const safePprenom = escapeHtml(prenom);
  const safeType = escapeHtml(type);
  const safeDateEvenement = escapeHtml(dateEvenement);
  const safeTenantName = escapeHtml(tenantName).substring(0, 50);
  const safeTenantEmail = escapeHtml(tenantEmail).substring(0, 255);

  return resend.emails.send({
    from: `${safeTenantName} <noreply@tbs-dashboard.fr>`,
    to: destinataire,
    replyTo: tenantEmail,
    subject: `Votre commande a ete acceptee - ${safeTenantName}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1A1410;">
        <h1 style="color: #C9A96E;">Bonne nouvelle, ${safePprenom} !</h1>
        <p>Nous avons le plaisir de vous confirmer l'acceptation de votre commande.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Type de creation</td>
            <td style="padding: 8px 0; font-weight: bold;">${safeType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Date de l'evenement</td>
            <td style="padding: 8px 0; font-weight: bold;">${safeDateEvenement}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Prix total</td>
            <td style="padding: 8px 0; font-weight: bold;">${prixTotal.toFixed(2)} EUR</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Acompte (30%)</td>
            <td style="padding: 8px 0; font-weight: bold; color: #C41E3A;">${acompte.toFixed(2)} EUR</td>
          </tr>
        </table>
        <p>Pour confirmer votre reservation, veuillez regler l'acompte de <strong>${acompte.toFixed(2)} EUR</strong>.</p>
        <p>Notre equipe vous contactera prochainement avec les details de paiement.</p>
        <hr style="border: none; border-top: 1px solid #C9A96E; margin: 32px 0;" />
        <p style="color: #666; font-size: 14px;">${safeTenantName} - ${safeTenantEmail}</p>
      </div>
    `,
  });
}

export async function envoyerEmailRefus({
  destinataire,
  prenom,
  type,
  tenantName,
  tenantEmail,
}: {
  destinataire: string;
  prenom: string;
  type: string;
  tenantName: string;
  tenantEmail: string;
}) {
  // SECURITY: Escape all user-controlled strings before HTML interpolation
  const safePrenom = escapeHtml(prenom);
  const safeType = escapeHtml(type);
  const safeTenantName = escapeHtml(tenantName).substring(0, 50);
  const safeTenantEmail = escapeHtml(tenantEmail).substring(0, 255);

  return resend.emails.send({
    from: `${safeTenantName} <noreply@tbs-dashboard.fr>`,
    to: destinataire,
    replyTo: tenantEmail,
    subject: `Votre demande - ${safeTenantName}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1A1410;">
        <h1 style="color: #1A1410;">Bonjour ${safePrenom},</h1>
        <p>Nous avons bien recu votre demande concernant : <strong>${safeType}</strong>.</p>
        <p>Apres examen, nous ne sommes malheureusement pas en mesure d'honorer cette commande pour le moment.</p>
        <p>Nous vous remercions de votre interet et vous souhaitons bonne chance dans votre recherche.</p>
        <hr style="border: none; border-top: 1px solid #C9A96E; margin: 32px 0;" />
        <p style="color: #666; font-size: 14px;">${safeTenantName} - ${safeTenantEmail}</p>
      </div>
    `,
  });
}
