import { forwardRef } from 'react'
import type { Vente } from '@/api/ventes'
import type { Boutique } from '@/contexts/BoutiqueContext'
import { formatDate } from '@/utils/format'

interface Props {
  vente: Vente
  boutique: Boutique
  logoBase64?: string | null
}

const RecuImprimable = forwardRef<HTMLDivElement, Props>(({ vente, boutique, logoBase64 }, ref) => {
  const totalEspeces = vente.paiements?.filter(p => p.mode === 'especes').reduce((s, p) => s + Number(p.montant), 0) ?? 0
  const totalMM      = vente.paiements?.filter(p => p.mode === 'mobile_money').reduce((s, p) => s + Number(p.montant), 0) ?? 0
  const totalCredit  = vente.paiements?.filter(p => p.mode === 'credit').reduce((s, p) => s + Number(p.montant), 0) ?? 0
  const totalPaye    = totalEspeces + totalMM
  const fmt          = (n: number) => n.toLocaleString('fr-FR')
  const lignes       = vente.details ?? []

  return (
    <div
      ref={ref}
      id="recu-print"
      style={{
        width: '148mm',
        minHeight: '210mm',        // hauteur A5
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        color: '#000',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        padding: '5mm 6mm',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* En-tête */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '3mm',
        borderBottom: '2px solid #000',
        paddingBottom: '3mm',
        gap: '4mm',
      }}>
        <div style={{ width: '20mm', flexShrink: 0 }}>
          {logoBase64 ? (
            <img src={logoBase64} alt="Logo" style={{ width: '20mm', height: '20mm', objectFit: 'contain' }} />
          ) : (
            <div style={{
              width: '20mm', height: '20mm', border: '1px solid #ccc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '8px', color: '#aaa',
            }}>Logo</div>
          )}
        </div>
        <div style={{ textAlign: 'right', flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            {boutique.nom.toUpperCase()}
          </div>
          {boutique.adresse && <div style={{ fontSize: '9px', marginTop: '1mm' }}>{boutique.adresse}</div>}
          {boutique.telephone && <div style={{ fontSize: '9px' }}>Tél : {boutique.telephone}</div>}
          {boutique.slogan && <div style={{ fontSize: '9px', fontStyle: 'italic', marginTop: '1mm' }}>{boutique.slogan}</div>}
        </div>
      </div>

      {/* Infos facture */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2mm', fontSize: '10px' }}>
        <div>
          Nom : <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '50mm' }}>
            {vente.client ? [vente.client.prenom, vente.client.nom].filter(Boolean).join(' ') : 'Client'}
          </span>
        </div>
        <div>Facture N° : <strong>{vente.numero_facture}</strong></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3mm', fontSize: '10px' }}>
        <div>Date : <strong>{formatDate(vente.date_validation ?? vente.created_at)}</strong></div>
        <div>Vendeur : <strong>{vente.vendeur?.prenom} {vente.vendeur?.nom}</strong></div>
      </div>

      {/* Tableau articles */}
      <div style={{ flex: 1 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3mm' }}>
        <thead>
          <tr style={{ backgroundColor: '#e8f0fe' }}>
            <th style={thStyle({ width: '5mm' })}>N°</th>
            <th style={thStyle({})}>Article</th>
            <th style={thStyle({ width: '10mm' })}>Qté</th>
            <th style={thStyle({ width: '20mm' })}>P.Unit</th>
            <th style={thStyle({ width: '22mm' })}>Total TTC</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((d, i) => {
            const designation = d.variante?.produit?.designation ?? ''
            const attributs   = d.variante?.attributs && Object.keys(d.variante.attributs).length > 0
              ? Object.values(d.variante.attributs).join(' / ') : ''
            const label = attributs ? `${designation} (${attributs})` : designation
            const total = d.prix_applique * d.quantite - d.remise_montant
            return (
              <tr key={i}>
                <td style={tdStyle({ textAlign: 'center' })}>{i + 1}</td>
                <td style={tdStyle({})}>{label}</td>
                <td style={tdStyle({ textAlign: 'center' })}>{d.quantite}</td>
                <td style={tdStyle({ textAlign: 'right' })}>{fmt(d.prix_applique)}</td>
                <td style={tdStyle({ textAlign: 'right' })}>{fmt(total)}</td>
              </tr>
            )
          })}
          {/* Zone vide fixe */}
          <tr>
            <td colSpan={5} style={{
              border: '1px solid #aaa',
              height: '40mm',
              verticalAlign: 'top',
              padding: '2px',
            }}>&nbsp;</td>
          </tr>
          {/* Total */}
          <tr>
            <td colSpan={4} style={{ ...tdStyle({}), textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #000' }}>
              Total Facture
            </td>
            <td style={{ ...tdStyle({ textAlign: 'right' }), fontWeight: 'bold', borderTop: '2px solid #000' }}>
              {fmt(vente.total_net)}
            </td>
          </tr>
        </tbody>
      </table>
      </div>


      {/* Pied — collé en bas, ne se coupe pas */}
      <div style={{
        fontSize: '10px',
        borderTop: '1px solid #ccc',
        paddingTop: '2mm',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5mm' }}>
          <span>Payer Comptant :</span>
          <span style={{ borderBottom: '1px dotted #000', minWidth: '45mm', textAlign: 'right' }}>
            {totalPaye > 0 ? `${fmt(totalPaye)} FCFA` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5mm' }}>
          <span>Reste à payer :</span>
          <span style={{ borderBottom: '1px dotted #000', minWidth: '45mm', textAlign: 'right' }}>
            {totalCredit > 0 ? `${fmt(totalCredit)} FCFA` : ''}
          </span>
        </div>
        {totalMM > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5mm' }}>
            <span>Mobile Money :</span>
            <span>{fmt(totalMM)} FCFA</span>
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: '2mm', borderTop: '1px solid #000', paddingTop: '1.5mm' }}>
          Facture arrêtée à la somme de : <strong>{fmt(vente.total_net)} FCFA</strong>
        </div>
        <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '1.5mm', fontStyle: 'italic' }}>
          Les marchandises vendues ne sont ni reprises, ni échangées
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4mm', fontStyle: 'italic' }}>
          <span>Le Vendeur</span>
          <span>Le Client</span>
        </div>
      </div>

    </div>
  )
})

// Helpers styles inline
const thStyle = (extra: React.CSSProperties): React.CSSProperties => ({
  border: '1px solid #000',
  padding: '2px 4px',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '11px',
  ...extra,
})

const tdStyle = (extra: React.CSSProperties): React.CSSProperties => ({
  border: '1px solid #aaa',
  padding: '2px 4px',
  fontSize: '10px',
  height: '7mm',
  ...extra,
})

RecuImprimable.displayName = 'RecuImprimable'
export default RecuImprimable