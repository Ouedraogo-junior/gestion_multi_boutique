// src/pages/approvisionnements/components/RecuApprovisionnement.tsx
import { forwardRef } from 'react'
import type { Approvisionnement } from '@/api/approvisionnements'
import type { Boutique } from '@/contexts/BoutiqueContext'
import { formatDate } from '@/utils/format'

interface Props {
  appro: Approvisionnement
  boutique: Boutique
  logoBase64?: string | null
}

const RecuApprovisionnement = forwardRef<HTMLDivElement, Props>(({ appro, boutique, logoBase64 }, ref) => {
  const fmt    = (n: number) => Number(n).toLocaleString('fr-FR')
  const lignes = appro.lignes ?? []
  const totalGeneral = lignes.reduce((s, l) => s + Number(l.prix_achat) * l.quantite, 0)

  return (
    <div
      ref={ref}
      id="recu-appro-print"
      style={{
        width: '148mm',
        minHeight: '210mm',
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
      {/* En-tête boutique */}
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
          {boutique.adresse   && <div style={{ fontSize: '9px', marginTop: '1mm' }}>{boutique.adresse}</div>}
          {boutique.telephone && <div style={{ fontSize: '9px' }}>Tél : {boutique.telephone}</div>}
          {boutique.ncc       && <div style={{ fontSize: '9px' }}>NCC : {boutique.ncc}</div>}
          {boutique.slogan    && <div style={{ fontSize: '9px', fontStyle: 'italic', marginTop: '1mm' }}>{boutique.slogan}</div>}
        </div>
      </div>

      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>
          BON D'ENTRÉE EN STOCK
        </div>
        <div style={{ fontSize: '10px', color: '#555', marginTop: '1mm' }}>
          Réf : <strong>{appro.reference}</strong>
        </div>
      </div>

      {/* Infos fournisseur + opérateur */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2mm',
        marginBottom: '3mm',
        fontSize: '10px',
        border: '1px solid #ddd',
        borderRadius: '2mm',
        padding: '2mm 3mm',
      }}>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '1mm', fontSize: '9px', color: '#555', textTransform: 'uppercase' }}>
            Fournisseur
          </div>
          <div><strong>{appro.fournisseur.nom}</strong></div>
          {appro.fournisseur.telephone  && <div>Tél : {appro.fournisseur.telephone}</div>}
          {appro.fournisseur.provenance && <div>Provenance : {appro.fournisseur.provenance}</div>}
          {appro.fournisseur.adresse    && <div>Adresse : {appro.fournisseur.adresse}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '1mm', fontSize: '9px', color: '#555', textTransform: 'uppercase' }}>
            Enregistré par
          </div>
          <div><strong>{appro.user.prenom} {appro.user.nom}</strong></div>
          <div style={{ marginTop: '1mm' }}>Date : <strong>{formatDate(appro.created_at)}</strong></div>
          {appro.note && <div style={{ marginTop: '1mm', fontStyle: 'italic', color: '#666' }}>{appro.note}</div>}
        </div>
      </div>

      {/* Tableau des articles */}
      <div style={{ flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3mm' }}>
          <thead>
            <tr style={{ backgroundColor: '#e8f0fe' }}>
              <th style={thStyle({ width: '5mm' })}>N°</th>
              <th style={thStyle({})}>Article</th>
              <th style={thStyle({ width: '10mm' })}>Qté</th>
              <th style={thStyle({ width: '22mm' })}>Prix achat</th>
              <th style={thStyle({ width: '24mm' })}>Total</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => {
              const designation = l.variante?.produit?.designation ?? '—'
              const attributs   = l.variante?.attributs && Object.keys(l.variante.attributs).length > 0
                ? Object.values(l.variante.attributs).join(' / ') : ''
              const label = attributs ? `${designation} (${attributs})` : designation
              const total = Number(l.prix_achat) * l.quantite

              return (
                <tr key={l.id}>
                  <td style={tdStyle({ textAlign: 'center' })}>{i + 1}</td>
                  <td style={tdStyle({})}>{label}</td>
                  <td style={tdStyle({ textAlign: 'center' })}>{l.quantite}</td>
                  <td style={tdStyle({ textAlign: 'right' })}>{fmt(Number(l.prix_achat))}</td>
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
        fontSize: '10px',
        borderTop: '1px solid #ccc',
        paddingTop: '2mm',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
          Entrée arrêtée à la somme de : <strong>{fmt(totalGeneral)} FCFA</strong>
        </div>

        {/* Statut paiement */}
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '2mm',
          padding: '2mm 3mm',
          marginBottom: '3mm',
          fontSize: '10px',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '1mm', fontSize: '9px', color: '#555', textTransform: 'uppercase' }}>
            Paiement fournisseur
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2mm' }}>
            <div>
              <div style={{ color: '#555', fontSize: '9px' }}>Montant dû</div>
              <div style={{ fontWeight: 'bold' }}>
                {fmt(Number(appro.montant_total_facture ?? appro.montant_calcule))} FCFA
              </div>
            </div>
            <div>
              <div style={{ color: '#555', fontSize: '9px' }}>Montant payé</div>
              <div style={{ fontWeight: 'bold' }}>0 FCFA</div>
            </div>
            <div>
              <div style={{ color: '#555', fontSize: '9px' }}>Statut</div>
              <div style={{
                fontWeight: 'bold',
                color: '#D97706',   // amber = non soldé à la création
              }}>
                NON PAYÉ
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6mm', fontStyle: 'italic' }}>
          <span>Le Responsable</span>
          <span>Le Fournisseur</span>
        </div>
      </div>

    </div>
  )
})

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

RecuApprovisionnement.displayName = 'RecuApprovisionnement'
export default RecuApprovisionnement