# STOCKO — Plano Website

## Stack
- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilos**: Tailwind CSS + Framer Motion
- **Estado**: Zustand
- **Dados**: TanStack Query (React Query)
- **Ícones**: Lucide React
- **Alojamento**: Vercel (free tier)
- **Domínio**: stocko.pt
- **CI/CD**: GitHub Actions → Vercel (deploy automático no push)

---

## Fases

### FASE W1 — Setup & Deploy Pipeline
| ID | Tarefa | Estado |
|----|--------|--------|
| W1.1 | Criar projecto Next.js em `frontend/` | ⬜ |
| W1.2 | Configurar TypeScript + Tailwind + Prettier | ⬜ |
| W1.3 | Criar conta Vercel e ligar repositório GitHub | ⬜ |
| W1.4 | Configurar GitHub Action para deploy automático | ⬜ |
| W1.5 | Ligar domínio stocko.pt ao Vercel | ⬜ |
| W1.6 | Configurar variável de ambiente `NEXT_PUBLIC_API_URL` | ⬜ |
| W1.7 | Primeiro deploy de teste | ⬜ |

### FASE W2 — Design System + Landing Page
| ID | Tarefa | Estado |
|----|--------|--------|
| W2.1 | Paleta de cores, tipografia, tokens de design | ⬜ |
| W2.2 | Componentes base (Button, Card, Badge, Input) | ⬜ |
| W2.3 | Layout (Navbar, Footer) | ⬜ |
| W2.4 | Secção Hero com animação | ⬜ |
| W2.5 | Secção "Como funciona" (3 passos) | ⬜ |
| W2.6 | Secção Funcionalidades (streak, capitão, ligas, tiers) | ⬜ |
| W2.7 | Secção Rankings ao vivo (preview público) | ⬜ |
| W2.8 | Secção CTA + Download app | ⬜ |

### FASE W3 — Autenticação
| ID | Tarefa | Estado |
|----|--------|--------|
| W3.1 | Página Login (`/login`) | ⬜ |
| W3.2 | Página Registo (`/register`) com check username em tempo real | ⬜ |
| W3.3 | Gestão de sessão (JWT no localStorage + Zustand) | ⬜ |
| W3.4 | Middleware de protecção de rotas | ⬜ |
| W3.5 | Página de erro 404 e estados de loading | ⬜ |

### FASE W4 — Dashboard (área autenticada)
| ID | Tarefa | Estado |
|----|--------|--------|
| W4.1 | Layout autenticado com sidebar/nav | ⬜ |
| W4.2 | Página Home (`/dashboard`) — picks da semana + pontuação do dia | ⬜ |
| W4.3 | Mini-gráfico de performance semanal | ⬜ |
| W4.4 | Ecrã de selecção de picks (stocks disponíveis) | ⬜ |
| W4.5 | Activação de capitão | ⬜ |
| W4.6 | Feed de notícias das ações dos picks | ⬜ |

### FASE W5 — Rankings & Ligas
| ID | Tarefa | Estado |
|----|--------|--------|
| W5.1 | Página Rankings globais (`/rankings`) | ⬜ |
| W5.2 | Aba ranking do tier (zonas de promoção/relegação) | ⬜ |
| W5.3 | Página Ligas privadas (`/leagues`) | ⬜ |
| W5.4 | Criar liga + entrar com código | ⬜ |
| W5.5 | Histórico semanal da liga | ⬜ |

### FASE W6 — Perfil & Conquistas
| ID | Tarefa | Estado |
|----|--------|--------|
| W6.1 | Página Perfil (`/profile`) — stats, streak, tier actual/histórico | ⬜ |
| W6.2 | Grelha de conquistas (locked/unlocked) | ⬜ |
| W6.3 | Histórico de semanas anteriores | ⬜ |

### FASE W7 — Polish & Lançamento
| ID | Tarefa | Estado |
|----|--------|--------|
| W7.1 | SEO (meta tags, og:image, sitemap) | ⬜ |
| W7.2 | Responsividade mobile completa | ⬜ |
| W7.3 | Animações e transições finais | ⬜ |
| W7.4 | Testes de performance (Lighthouse) | ⬜ |
| W7.5 | Configurar CORS no backend para stocko.pt | ⬜ |

---

## Ordem de execução recomendada
W1 → W2 → W3 → W4 → W5 → W6 → W7

Cada fase é independente da seguinte até W3 (auth é necessária para W4+).
