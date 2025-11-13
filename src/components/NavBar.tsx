"use client";

import { useEffect, useState } from "react";
import { getUser, logout } from "@/lib/auth";
import styles from "./navbar.module.css";
import type { SessionUser } from "@/lib/auth";

export default function NavBar() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUser(u);
    })();
  }, []);

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <span className={styles.title}>Cadastro de Apólices</span>
        </div>

        <div className={styles.right}>
          {user && (
            <>
              <span className={styles.userChip}>
                {user.name} · {user.role === "admin" ? "Thaise" : "Visualização"}
              </span>

              <button
                className={styles.logout}
                onClick={async () => {
                  await logout();
                  window.location.href = "/login";
                }}
              >
                Sair
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
