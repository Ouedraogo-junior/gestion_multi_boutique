import { forwardRef } from 'react'
import type { TransfertBoutique } from '@/api/transferts-boutiques'
import type { Boutique } from '@/contexts/BoutiqueContext'
import { formatDate } from '@/utils/format'

interface Props {
  transfert: TransfertBoutique
  boutique: Boutique
  logoBase64?: string | null
}

const STATUT_CONFIG = {
  non_paye: { label: 'NON PAYÉ', color: '#D97706' },
  partiel:  { label: 'PARTIEL',  color: '#D97706' },
  solde:    { label: 'SOLDÉ',    color: '#1A7A4A' },
} as const

const RecuTransfertBoutique = forwardRef<HTMLDivElement, Props>(({ transfert, boutique, logoBase64 }, ref) => {
  const fmt    = (n: number) => Number(n).toLocaleString('fr-FR')
  const lignes = transfert.lignes ?? []
  const totalGeneral = lignes.reduce((s, l) => s + Number(l.prix_unitaire) * l.quantite, 0)

  const montantDu    = transfert.montant_du ?? Number(transfert.montant_convenu ?? transfert.montant_calcule)
  const soldeRestant = transfert.solde_restant ?? montantDu
  const montantPaye  = montantDu - soldeRestant
  const statut       = transfert.statut_paiement ?? 'non_paye'
  const { label: statutLabel, color: statutColor } = STATUT_CONFIG[statut]

  return (
    <div
      ref={ref}
      id="recu-transfert-print"
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
      {/* En-tête boutique */}
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
          {boutique.adresse   && <div style={{ fontSize: '12px', marginTop: '1.5mm' }}>{boutique.adresse}</div>}
          {boutique.telephone && <div style={{ fontSize: '12px' }}>Tél : {boutique.telephone}</div>}
          {boutique.ncc       && <div style={{ fontSize: '12px' }}>NCC : {boutique.ncc}</div>}
          {boutique.slogan    && <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '1.5mm' }}>{boutique.slogan}</div>}
        </div>
      </div>

      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: '5mm' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>
          BON DE TRANSFERT INTER-BOUTIQUE
        </div>
        <div style={{ fontSize: '13px', color: '#555', marginTop: '1.5mm' }}>
          Réf : <strong>{transfert.reference}</strong>
        </div>
      </div>

      {/* Boutiques source / destination */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3mm',
        marginBottom: '5mm',
        fontSize: '13px',
        border: '1px solid #ddd',
        borderRadius: '2mm',
        padding: '3mm 4mm',
      }}>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '1.5mm', fontSize: '11px', color: '#555', textTransform: 'uppercase' }}>
            Boutique émettrice
          </div>
          <div><strong>{transfert.boutique_source.nom}</strong></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '1.5mm', fontSize: '11px', color: '#555', textTransform: 'uppercase' }}>
            Boutique destinataire
          </div>
          <div><strong>{transfert.boutique_destination.nom}</strong></div>
        </div>
      </div>

      {/* Enregistré par / date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5mm', fontSize: '13px' }}>
        <div>Enregistré par : <strong>{transfert.user.prenom} {transfert.user.nom}</strong></div>
        <div>Date : <strong>{formatDate(transfert.created_at)}</strong></div>
      </div>
      {transfert.note && (
        <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#666', marginBottom: '4mm' }}>
          {transfert.note}
        </div>
      )}

      {/* Tableau des articles */}
      <div style={{ flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm' }}>
          <thead>
            <tr style={{ backgroundColor: '#e8f0fe' }}>
              <th style={thStyle({ width: '8mm' })}>N°</th>
              <th style={thStyle({})}>Article</th>
              <th style={thStyle({ width: '14mm' })}>Qté</th>
              <th style={thStyle({ width: '28mm' })}>Prix unitaire</th>
              <th style={thStyle({ width: '30mm' })}>Total</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => {
              const designation = l.variante?.produit?.designation ?? '—'
              const attributs   = l.variante?.attributs && Object.keys(l.variante.attributs).length > 0
                ? Object.values(l.variante.attributs).join(' / ') : ''
              const label = attributs ? `${designation} (${attributs})` : designation
              const total = Number(l.prix_unitaire) * l.quantite

              return (
                <tr key={l.id}>
                  <td style={tdStyle({ textAlign: 'center' })}>{i + 1}</td>
                  <td style={tdStyle({})}>{label}</td>
                  <td style={tdStyle({ textAlign: 'center' })}>{l.quantite}</td>
                  <td style={tdStyle({ textAlign: 'right' })}>{fmt(Number(l.prix_unitaire))}</td>
                  <td style={tdStyle({ textAlign: 'right' })}>{fmt(total)}</td>
                </tr>
              )
            })}

            {/* Total général */}
            <tr>
              <td colSpan={4} style={{ ...tdStyle({}), textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #000' }}>
                Total général
              </td>
              <td style={{ ...tdStyle({ textAlign: 'right' }), fontWeight: 'bold', borderTop: '2px solid #000' }}>
                {fmt(totalGeneral)} FCFA
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
        <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
          Transfert arrêté à la somme de : <strong>{fmt(totalGeneral)} FCFA</strong>
        </div>

        {/* Statut paiement */}
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '2mm',
          padding: '3mm 4mm',
          marginBottom: '4mm',
          fontSize: '13px',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '1.5mm', fontSize: '11px', color: '#555', textTransform: 'uppercase' }}>
            Paiement de la boutique destinataire
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3mm' }}>
            <div>
              <div style={{ color: '#555', fontSize: '11px' }}>Montant dû</div>
              <div style={{ fontWeight: 'bold' }}>{fmt(montantDu)} FCFA</div>
            </div>
            <div>
              <div style={{ color: '#555', fontSize: '11px' }}>Montant payé</div>
              <div style={{ fontWeight: 'bold' }}>{fmt(montantPaye)} FCFA</div>
            </div>
            <div>
              <div style={{ color: '#555', fontSize: '11px' }}>Statut</div>
              <div style={{ fontWeight: 'bold', color: statutColor }}>
                {statutLabel}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8mm', fontStyle: 'italic' }}>
          <span>Le Responsable ({transfert.boutique_source.nom})</span>
          <span>Le Représentant ({transfert.boutique_destination.nom})</span>
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

RecuTransfertBoutique.displayName = 'RecuTransfertBoutique'
export default RecuTransfertBoutique