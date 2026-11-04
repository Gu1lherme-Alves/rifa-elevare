# Controle Rifa ELEVARE — FECAP

Web app mobile-first em tempo real para controle e gestão da rifa beneficente do projeto acadêmico **ELEVARE (FECAP)**.

> **Lema:** *"Doar hoje. Transformar amanhã."*  
> **Prêmio:** 1 Alexa Echo Dot OU R$ 400,00 no Pix  
> **Chave Pix:** `elevare.fecap@gmail.com`  
> **Total de números:** 200 (R$ 10,00 cada)

---

## 🚀 Tecnologias

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons + React Router DOM
- **Backend:** Supabase (PostgreSQL 17 + Realtime WebSockets + Supabase Auth + Row Level Security)
- **Concorrência Atômica:** Função PL/pgSQL `reserve_numbers` com bloqueio pessimista (`FOR UPDATE`) para garantia matemática contra duplicidade de números entre vendedores simultâneos.

---

## 👥 Perfis de Acesso

| Perfil | Acesso | Capacidades |
|---|---|---|
| **Público** | Link aberto (sem login) | Visualiza status dos números em tempo real e dashboard geral (sem nenhum dado pessoal dos compradores). |
| **Vendedor** | `vendedor@elevare.com` / `elevare123` | Registra vendas e reservas, seleciona múltiplos números, vê comprador e telefone dos números vendidos/reservados. |
| **Administrador** | `admin@elevare.com` / `elevare123` | Tudo do vendedor + gerenciamento e ranking de vendedores, liberação/confirmação de qualquer número, exportação (CSV e WhatsApp), alteração de configurações e realização do sorteio oficial. |

---

## 🔒 Regra Crítica: Zero Duplicidade

Quando dois vendedores tentam comprar o mesmo número no mesmo milissegundo:
1. O banco bloqueia as linhas via `SELECT ... FOR UPDATE`.
2. Apenas a primeira transação tem sucesso.
3. A segunda transação é imediatamente abortada com a mensagem: `"Números já escolhidos por outra pessoa: [números]"`.
4. O canal Supabase Realtime dispara evento WebSocket para todos os navegadores conectados atualizarem a grade sem necessidade de refresh manual.

---

## 📦 Dados Iniciais Importados (Seed)

- **Total vendido:** 119 números confirmados e vinculados aos compradores originais com seus valores e descontos.
- **Caso Roberta Gentile:** Cadastrada como compradora pendente de números com alerta visível na aba Compradores (R$ 100 pagos aguardando atribuição de números).
- **Validação de consistência:** 0 números repetidos, todos no intervalo [1, 200].

---

## 💻 Como Rodar Localmente

```bash
cd rifa-elevare
npm install
npm run dev
```

Abra no navegador em `http://localhost:5173`.
