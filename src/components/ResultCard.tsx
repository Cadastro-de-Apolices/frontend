'use client';

import styles from './ResultCard.module.css';
import type { ResultadoBusca } from '@/types/busca';

interface ResultCardProps {
  resultado: ResultadoBusca;
  onClick: () => void;
}

export default function ResultCard({ resultado, onClick }: ResultCardProps) {
  const { imovel, locador, locatario, apoliceAtual } = resultado;

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <span className={styles.badge}>{apoliceAtual.status}</span>
        <span className={styles.seguradora}>{apoliceAtual.seguradora}</span>
      </div>

      <h2 className={styles.title}>{imovel.nome_imovel}</h2>
      <p className={styles.subtitle}>Código do imóvel: {imovel.codigo_visual}</p>

      <div className={styles.row}>
        <div>
          <span className={styles.label}>Locador</span>
          <p className={styles.text}>{locador.nome}</p>
        </div>
        <div>
          <span className={styles.label}>Locatário</span>
          <p className={styles.text}>{locatario.nome}</p>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.small}>
          Apólice: {apoliceAtual.numero_apolice}
        </span>
        {apoliceAtual.data_vencimento && (
          <span className={styles.small}>
            Vencimento:{' '}
            {new Date(apoliceAtual.data_vencimento).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  );
}
