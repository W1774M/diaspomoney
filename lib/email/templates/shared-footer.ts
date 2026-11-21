/**
 * Footer partagé pour tous les templates d'email DiaspoMoney
 * Respecte la charte graphique du site https://diaspomoney.fr/
 */

export const emailFooter = `
  <div class="footer">
    <div class="footer-brand">
      <p class="footer-logo"><strong>DiaspoMoney</strong></p>
      <p class="footer-tagline">Transférez des services, pas de l'argent, pour une économie durable.</p>
    </div>
    
    <div class="footer-links">
      <div class="footer-section">
        <p class="footer-section-title">Services</p>
        <ul class="footer-list">
          <li><a href="https://diaspomoney.fr/services/health" style="color: #64748b; text-decoration: none;">Santé</a></li>
          <li><a href="https://diaspomoney.fr/services/edu" style="color: #64748b; text-decoration: none;">Éducation</a></li>
          <li><a href="https://diaspomoney.fr/services/immo" style="color: #64748b; text-decoration: none;">Immobilier & BTP</a></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <p class="footer-section-title">Contact</p>
        <ul class="footer-list">
          <li><a href="https://diaspomoney.fr/hotline" style="color: #64748b; text-decoration: none;">Hotline</a></li>
          <li><a href="mailto:support@diaspomoney.fr" style="color: #2563eb; text-decoration: none;">support@diaspomoney.fr</a></li>
        </ul>
      </div>
    </div>
    
    <div class="footer-address">
      <p class="footer-location-title">📍 Localisation</p>
      <p>Seine Innopolis</p>
      <p>72 Rue de la République</p>
      <p>76140, Le Petit-Quevilly</p>
    </div>
    
    <div class="footer-copyright">
      <p>© 2025 DiaspoMoney. Tous droits réservés.</p>
    </div>
  </div>
`;

export const emailFooterStyles = `
  .footer {
    background: #0f172a;
    color: #e2e8f0;
    padding: 40px 20px 20px;
    border-radius: 0 0 10px 10px;
    font-size: 13px;
    line-height: 1.6;
  }
  .footer-brand {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #1e293b;
  }
  .footer-logo {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 8px 0;
  }
  .footer-tagline {
    color: #94a3b8;
    font-size: 14px;
    margin: 0;
    font-style: italic;
  }
  .footer-links {
    display: flex;
    justify-content: space-around;
    margin-bottom: 25px;
    padding-bottom: 25px;
    border-bottom: 1px solid #1e293b;
  }
  .footer-section {
    flex: 1;
    text-align: center;
  }
  .footer-section-title {
    color: #ff730f;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 12px 0;
  }
  .footer-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .footer-list li {
    margin: 6px 0;
  }
  .footer-address {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #1e293b;
  }
  .footer-location-title {
    color: #ff730f;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 10px 0;
  }
  .footer-address p {
    margin: 4px 0;
    color: #cbd5e1;
  }
  .footer-copyright {
    text-align: center;
    padding-top: 15px;
    border-top: 1px solid #1e293b;
  }
  .footer-copyright p {
    margin: 0;
    color: #64748b;
    font-size: 12px;
  }
`;

