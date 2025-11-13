'use client';

import styles from './DetailsModal.module.css';
import type { ResultadoBusca } from '@/types/busca';

interface DetailsModalProps {
  open: boolean;
  onClose: () => void;
  data: ResultadoBusca | null;
}

export default function DetailsModal({ open, onClose, data }: DetailsModalProps) {
  if (!open || !data) return null;

  const { imovel, locador, locatario, apoliceAtual } = data;

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '-';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()} // não fechar clicando dentro
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Detalhes da Apólice</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </header>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Imóvel</h3>
          <p><strong>Nome:</strong> {imovel.nome_imovel}</p>
          <p><strong>Código:</strong> {imovel.codigo_visual}</p>
          <p><strong>CEP:</strong> {imovel.cep}</p>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Locador</h3>
          <p><strong>Nome:</strong> {locador.nome}</p>
          <p><strong>CPF/CNPJ:</strong> {locador.cpf_cnpj}</p>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Locatário</h3>
          <p><strong>Nome:</strong> {locatario.nome}</p>
          <p><strong>CPF/CNPJ:</strong> {locatario.cpf_cnpj}</p>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Apólice Atual</h3>
          <p><strong>Nº Apólice:</strong> {apoliceAtual.numero_apolice}</p>
          <p><strong>Nº Proposta:</strong> {apoliceAtual.numero_proposta || '-'}</p>
          <p><strong>Seguradora:</strong> {apoliceAtual.seguradora}</p>
          <p><strong>Status:</strong> {apoliceAtual.status}</p>
          <p><strong>Data de envio:</strong> {formatDate(apoliceAtual.data_emissao)}</p>
          <p><strong>Vencimento:</strong> {formatDate(apoliceAtual.data_vencimento)}</p>
          <p><strong>Pagamento:</strong> {formatDate(apoliceAtual.data_pagamento)}</p>
          <p><strong>Parcelamento:</strong> {apoliceAtual.parcelamento ?? '-'}</p>
        </section>
      </div>
    </div>
  );
}
