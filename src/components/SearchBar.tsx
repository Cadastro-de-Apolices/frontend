'use client';

import { useState, FormEvent } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearch: (term: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [term, setTerm] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch(term.trim());
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type="text"
        className={styles.input}
        placeholder="Busque por código do imóvel, nome do imóvel ou número da apólice..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <button type="submit" className={styles.button}>
        Buscar
      </button>
    </form>
  );
}
