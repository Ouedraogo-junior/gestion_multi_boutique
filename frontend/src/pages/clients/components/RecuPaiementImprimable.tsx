import { forwardRef } from 'react'
import type { Client } from '@/api/clients'
import type { Boutique } from '@/contexts/BoutiqueContext'
import { formatMontant, formatDate } from '@/utils/format'

interface Paiement {
  montant: number
  mode: 'especes' | 'mobile_money' | 'avance_client'
  date: string
  vente: {
    numero_facture: string
    total_net: number
    solde_restant: number
  }
}

interface Props {
  client: Client
  boutique: Boutique
  paiement: Paiement
  logoBase64?: string | null
}

const MODE_LABELS: Record<string, string> = {
  especes:       'Espèces',
  mobile_money:  'Mobile Money',
  avance_client: 'Avance',
}

const RecuPaiementImprimable = forwardRef<HTMLDivElement, Props>(
  ({ client, boutique, paiement, logoBase64 }, ref) => {
    const nouveauSolde = paiement.vente.solde_restant - paiement.montant

    return (
      <div
        ref={ref}
        id="recu-print"
        style={{
          width: '210mm',
          minHeight: '297mm',
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          color: '#000',
          backgroundColor: '#fff',
          boxSizing: 'border-box',
          padding: '10mm 12mm',
        }}
      >
        {/* En-tête */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '3mm', borderBottom: '2px solid #000', paddingBottom: '3mm', gap: '4mm',
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
            <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{boutique.nom.toUpperCase()}</div>
            {boutique.adresse   && <div style={{ fontSize: '9px', marginTop: '1mm' }}>{boutique.adresse}</div>}
            {boutique.telephone && <div style={{ fontSize: '9px' }}>Tél : {boutique.telephone}</div>}
            {boutique.ncc && <div style={{ fontSize: '9px' }}>NCC : {boutique.ncc}</div>}
            {boutique.slogan    && <div style={{ fontSize: '9px', fontStyle: 'italic', marginTop: '1mm' }}>{boutique.slogan}</div>}
          </div>
        </div>

        {/* Titre */}
        <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 'bold', marginBottom: '3mm', letterSpacing: '0.5px' }}>
          REÇU DE PAIEMENT
        </div>

        {/* Infos */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2mm' }}>
          <div>Client : <strong>{[client.prenom, client.nom].filter(Boolean).join(' ')}</strong></div>
          <div>Date : <strong>{formatDate(paiement.date)}</strong></div>
        </div>
        {client.telephone && (
          <div style={{ marginBottom: '2mm' }}>Tél : <strong>{client.telephone}</strong></div>
        )}

        {/* Détail paiement */}
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '3mm 0' }}>
          <thead>
            <tr style={{ backgroundColor: '#e8f0fe' }}>
              <th style={thStyle()}>Facture</th>
              <th style={thStyle()}>Montant facture</th>
              <th style={thStyle()}>Mode</th>
              <th style={thStyle()}>Montant payé</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle({ textAlign: 'center' })}>{paiement.vente.numero_facture}</td>
              <td style={tdStyle({ textAlign: 'right' })}>{formatMontant(paiement.vente.total_net)}</td>
              <td style={tdStyle({ textAlign: 'center' })}>{MODE_LABELS[paiement.mode]}</td>
              <td style={tdStyle({ textAlign: 'right', fontWeight: 'bold' })}>{formatMontant(paiement.montant)}</td>
            </tr>
          </tbody>
        </table>

        {paiement.mode === 'avance_client' && (
          <div style={{ fontSize: '9px', color: '#555', fontStyle: 'italic', marginTop: '-2mm', marginBottom: '2mm' }}>
            Réglé par prélèvement sur l'avance du client — aucun encaissement en espèces à cette date.
          </div>
        )}

        {/* Soldes */}
        <div style={{ borderTop: '1px solid #ccc', paddingTop: '2mm', marginTop: '2mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5mm' }}>
            <span>Ancien solde :</span>
            <span style={{ color: '#E8314A', fontWeight: 'bold' }}>{formatMontant(paiement.vente.solde_restant)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5mm' }}>
            <span>Montant versé :</span>
            <span style={{ color: '#1A7A4A', fontWeight: 'bold' }}>{formatMontant(paiement.montant)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', paddingTop: '1.5mm', marginTop: '1.5mm' }}>
            <span style={{ fontWeight: 'bold' }}>Nouveau solde :</span>
            <span style={{ fontWeight: 'bold', color: nouveauSolde > 0 ? '#E8314A' : '#1A7A4A' }}>
              {formatMontant(nouveauSolde)}
            </span>
          </div>
        </div>

        {/* Pied */}
        <div style={{ textAlign: 'center', marginTop: '4mm', fontSize: '9px', fontStyle: 'italic' }}>
          {nouveauSolde === 0
            ? 'Dette entièrement réglée — Merci !'
            : `Reste à payer : ${formatMontant(nouveauSolde)}`
          }
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6mm', fontStyle: 'italic', fontSize: '10px' }}>
          <span>Le Caissier</span>
          <span>Le Client</span>
        </div>
      </div>
    )
  }
)

const thStyle = (): React.CSSProperties => ({
  border: '1px solid #000', padding: '2px 4px',
  textAlign: 'center', fontWeight: 'bold', fontSize: '10px',
})

const tdStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  border: '1px solid #aaa', padding: '2px 4px',
  fontSize: '10px', height: '7mm', ...extra,
})

RecuPaiementImprimable.displayName = 'RecuPaiementImprimable'
export default RecuPaiementImprimable