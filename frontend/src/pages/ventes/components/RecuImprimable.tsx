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
  const isDevis = vente.statut === 'brouillon'

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
        width: '210mm',
        minHeight: '297mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#000',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        padding: '10mm 14mm',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* En-tête */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '5mm',
        borderBottom: '2px solid #000',
        paddingBottom: '4mm',
        gap: '6mm',
      }}>
        <div style={{ width: '26mm', flexShrink: 0 }}>
          {logoBase64 ? (
            <img src={logoBase64} alt="Logo" style={{ width: '26mm', height: '26mm', objectFit: 'contain' }} />
          ) : (
            <div style={{
              width: '26mm', height: '26mm', border: '1px solid #ccc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: '#aaa',
            }}>Logo</div>
          )}
        </div>
        <div style={{ textAlign: 'right', flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            {boutique.nom.toUpperCase()}
          </div>
          {boutique.adresse && (
            <div style={{ fontSize: '12px', marginTop: '1.5mm' }}>{boutique.adresse}</div>
          )}
          {boutique.telephone && (
            <div style={{ fontSize: '12px' }}>Tél : {boutique.telephone}</div>
          )}
          {boutique.ncc && (
            <div style={{ fontSize: '12px' }}>NCC : {boutique.ncc}</div>
          )}
          {boutique.slogan && (
            <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '1.5mm' }}>{boutique.slogan}</div>
          )}
        </div>
      </div>

      {/* Bandeau DEVIS — visible uniquement pour un brouillon */}
      {isDevis && (
        <div style={{
          textAlign: 'center',
          fontSize: '17px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          color: '#B45309',
          border: '2px solid #B45309',
          borderRadius: '2mm',
          padding: '3mm',
          marginBottom: '5mm',
        }}>
          DEVIS / PROFORMA — DOCUMENT NON CONTRACTUEL
        </div>
      )}

      {/* Infos facture */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3mm', fontSize: '13px' }}>
        <div>
          Nom : <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '55mm' }}>
            {vente.client ? [vente.client.prenom, vente.client.nom].filter(Boolean).join(' ') : 'Client'}
          </span>
        </div>
        <div>
          {isDevis ? 'Devis N° : ' : 'Facture N° : '}
          <strong>{isDevis ? `BROUILLON-${vente.id}` : vente.numero_facture}</strong>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5mm', fontSize: '13px' }}>
        <div>Date : <strong>{formatDate(vente.date_validation ?? vente.created_at)}</strong></div>
        <div>Vendeur : <strong>{vente.vendeur?.prenom} {vente.vendeur?.nom}</strong></div>
      </div>

      {/* Tableau articles */}
      <div style={{ flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm' }}>
          <thead>
            <tr style={{ backgroundColor: '#e8f0fe' }}>
              <th style={thStyle({ width: '8mm' })}>N°</th>
              <th style={thStyle({})}>Article</th>
              <th style={thStyle({ width: '14mm' })}>Qté</th>
              <th style={thStyle({ width: '26mm' })}>P.Unit</th>
              <th style={thStyle({ width: '28mm' })}>Total TTC</th>
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
                {isDevis ? 'Total estimé' : 'Total Facture'}
              </td>
              <td style={{ ...tdStyle({ textAlign: 'right' }), fontWeight: 'bold', borderTop: '2px solid #000' }}>
                {fmt(vente.total_net)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pied */}
      <div style={{
        fontSize: '13px',
        borderTop: '1px solid #ccc',
        paddingTop: '3mm',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}>
        {!isDevis && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2mm' }}>
              <span>Payer Comptant :</span>
              <span style={{ borderBottom: '1px dotted #000', minWidth: '50mm', textAlign: 'right' }}>
                {totalPaye > 0 ? `${fmt(totalPaye)} FCFA` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2mm' }}>
              <span>Reste à payer :</span>
              <span style={{ borderBottom: '1px dotted #000', minWidth: '50mm', textAlign: 'right' }}>
                {totalCredit > 0 ? `${fmt(totalCredit)} FCFA` : ''}
              </span>
            </div>
            {totalMM > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2mm' }}>
                <span>Mobile Money :</span>
                <span>{fmt(totalMM)} FCFA</span>
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '3mm', borderTop: '1px solid #000', paddingTop: '2mm' }}>
          {isDevis ? 'Devis estimé à la somme de : ' : 'Facture arrêtée à la somme de : '}
          <strong>{fmt(vente.total_net)} FCFA</strong>
        </div>

        {isDevis && (
          <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '2mm', fontStyle: 'italic' }}>
            Ce document est une proposition et ne constitue pas une facture. Prix et disponibilité sous réserve de confirmation.
          </div>
        )}
        {!isDevis && boutique.mention_legale && (
          <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '2mm', fontStyle: 'italic' }}>
            {boutique.mention_legale}
          </div>
        )}
        {/* <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '1mm', fontStyle: 'italic' }}>
          Les marchandises vendues ne sont ni reprises, ni échangées
        </div> */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8mm', fontStyle: 'italic' }}>
          <span>Le Vendeur</span>
          <span>Le Client</span>
        </div>
      </div>

    </div>
  )
})

const thStyle = (extra: React.CSSProperties): React.CSSProperties => ({
  border: '1px solid #000',
  padding: '4px 6px',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '14px',
  ...extra,
})

const tdStyle = (extra: React.CSSProperties): React.CSSProperties => ({
  border: '1px solid #aaa',
  padding: '4px 6px',
  fontSize: '13px',
  height: '9mm',
  ...extra,
})

RecuImprimable.displayName = 'RecuImprimable'
export default RecuImprimable