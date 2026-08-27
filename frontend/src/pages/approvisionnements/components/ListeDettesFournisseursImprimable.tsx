// src/pages/approvisionnements/components/ListeDettesFournisseursImprimable.tsx
import { forwardRef } from 'react'
import type { Boutique } from '@/contexts/BoutiqueContext'
import { formatDate } from '@/utils/format'

export interface LigneDetteFournisseur {
  fournisseurId: number
  nom: string
  provenance: string | null
  montantTotal: number
  montantPaye: number
  resteAPayer: number
  statut: 'non_paye' | 'partiel' | 'solde'
  nbAppros: number
}

interface Props {
  boutique: Boutique
  logoBase64?: string | null
  lignes: LigneDetteFournisseur[]
  dateImpression: string
}

const STATUT_CONFIG = {
  non_paye: { label: 'NON PAYÉ', color: '#DC2626' },
  partiel:  { label: 'PARTIEL',  color: '#D97706' },
  solde:    { label: 'SOLDÉ',    color: '#1A7A4A' },
} as const

const ListeDettesFournisseursImprimable = forwardRef<HTMLDivElement, Props>(
  ({ boutique, logoBase64, lignes, dateImpression }, ref) => {
    const fmt = (n: number) => Number(n).toLocaleString('fr-FR')

    const totalGeneral = lignes.reduce((s, l) => s + l.montantTotal, 0)
    const totalPaye    = lignes.reduce((s, l) => s + l.montantPaye, 0)
    const totalRestant = lignes.reduce((s, l) => s + l.resteAPayer, 0)

    return (
      <div
        ref={ref}
        id="liste-dettes-fournisseurs-print"
        style={{
          width: '210mm',
          minHeight: '297mm',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
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
          <div style={{ width: '24mm', flexShrink: 0 }}>
            {logoBase64 ? (
              <img src={logoBase64} alt="Logo" style={{ width: '24mm', height: '24mm', objectFit: 'contain' }} />
            ) : (
              <div style={{
                width: '24mm', height: '24mm', border: '1px solid #ccc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', color: '#aaa',
              }}>Logo</div>
            )}
          </div>
          <div style={{ textAlign: 'right', flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
              {boutique.nom.toUpperCase()}
            </div>
            {boutique.adresse   && <div style={{ fontSize: '11px', marginTop: '1.5mm' }}>{boutique.adresse}</div>}
            {boutique.telephone && <div style={{ fontSize: '11px' }}>Tél : {boutique.telephone}</div>}
            {boutique.ncc       && <div style={{ fontSize: '11px' }}>NCC : {boutique.ncc}</div>}
          </div>
        </div>

        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: '5mm' }}>
          <div style={{ fontSize: '17px', fontWeight: 'bold', letterSpacing: '1px' }}>
            SITUATION DES DETTES FOURNISSEURS
          </div>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '1.5mm' }}>
            Édité le {formatDate(dateImpression)}
          </div>
        </div>

        {/* Tableau */}
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm' }}>
            <thead>
              <tr style={{ backgroundColor: '#e8f0fe' }}>
                <th style={thStyle({ width: '10mm' })}>N°</th>
                <th style={thStyle({ textAlign: 'left' })}>Fournisseur</th>
                <th style={thStyle({ width: '30mm' })}>Montant total</th>
                <th style={thStyle({ width: '30mm' })}>Montant payé</th>
                <th style={thStyle({ width: '30mm' })}>Reste à payer</th>
                <th style={thStyle({ width: '24mm' })}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...tdStyle({ textAlign: 'center' }), padding: '10mm 0', color: '#888' }}>
                    Aucune dette fournisseur
                  </td>
                </tr>
              ) : lignes.map((l, i) => (
                <tr key={l.fournisseurId}>
                  <td style={tdStyle({ textAlign: 'center' })}>{i + 1}</td>
                  <td style={tdStyle({})}>
                    {l.nom}
                    {l.provenance && <span style={{ color: '#777' }}> · {l.provenance}</span>}
                  </td>
                  <td style={tdStyle({ textAlign: 'right' })}>{fmt(l.montantTotal)}</td>
                  <td style={tdStyle({ textAlign: 'right' })}>{fmt(l.montantPaye)}</td>
                  <td style={tdStyle({ textAlign: 'right', fontWeight: 'bold' })}>{fmt(l.resteAPayer)}</td>
                  <td style={{ ...tdStyle({ textAlign: 'center' }), color: STATUT_CONFIG[l.statut].color, fontWeight: 'bold' }}>
                    {STATUT_CONFIG[l.statut].label}
                  </td>
                </tr>
              ))}
            </tbody>
            {lignes.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ ...tdStyle({}), textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #000' }}>
                    Total général
                  </td>
                  <td style={{ ...tdStyle({ textAlign: 'right' }), fontWeight: 'bold', borderTop: '2px solid #000' }}>
                    {fmt(totalGeneral)}
                  </td>
                  <td style={{ ...tdStyle({ textAlign: 'right' }), fontWeight: 'bold', borderTop: '2px solid #000', color: '#1A7A4A' }}>
                    {fmt(totalPaye)}
                  </td>
                  <td style={{ ...tdStyle({ textAlign: 'right' }), fontWeight: 'bold', borderTop: '2px solid #000', color: '#DC2626' }}>
                    {fmt(totalRestant)}
                  </td>
                  <td style={{ borderTop: '2px solid #000' }}></td>
                </tr>
              </tfoot>
            )}
          </table>
          <div style={{ fontSize: '11px', color: '#555', textAlign: 'right' }}>
            Montants exprimés en FCFA
          </div>
        </div>

        {/* Pied de page */}
        <div style={{
          fontSize: '11px',
          borderTop: '1px solid #ccc',
          paddingTop: '3mm',
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
        }}>
          {lignes.length} fournisseur{lignes.length > 1 ? 's' : ''} listé{lignes.length > 1 ? 's' : ''}
        </div>
      </div>
    )
  }
)

const thStyle = (extra: React.CSSProperties): React.CSSProperties => ({
  border: '1px solid #000',
  padding: '4px 6px',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '12px',
  ...extra,
})

const tdStyle = (extra: React.CSSProperties): React.CSSProperties => ({
  border: '1px solid #aaa',
  padding: '4px 6px',
  fontSize: '12px',
  height: '8mm',
  ...extra,
})

ListeDettesFournisseursImprimable.displayName = 'ListeDettesFournisseursImprimable'
export default ListeDettesFournisseursImprimable