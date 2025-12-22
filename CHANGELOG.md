# 🔄 CHANGELOG - Quadro de Obras

Histórico de alterações e versões do projeto.

---

## [2.0.0] - 2025-12-22

### 🎉 Lançamento da Versão 2.0

#### ✨ Novidades
- **Multi-tenant completo**: Organizações isoladas com dados segregados
- **Sistema Kanban**: 5 status com drag & drop
- **Real-time**: Socket.IO para atualizações instantâneas
- **Cache inteligente**: Sistema de cache com invalidação automática
- **Auditoria**: Logs completos de todas as ações
- **Tema escuro**: Interface moderna e profissional

#### 🔐 Autenticação
- Sistema JWT seguro
- 3 níveis de acesso (ADMIN, MEMBER, VIEWER)
- Hash de senhas com bcryptjs
- Expiração de token em 7 dias

#### 📊 Gestão de Projetos
- Cadastro completo de obras
- Filtros por loja, status e categoria
- Busca instantânea
- Arquivamento de projetos
- Ordenação via drag & drop
- Detalhes: cliente, responsáveis, datas, localização

#### 📋 Tarefas Kanban
- 5 colunas: Criado → Em separação → Pendência → Em romaneio → Entregue
- Drag & drop entre colunas
- Botões de navegação rápida (◀ ▶)
- Criação de pendências
- Histórico de movimentações

#### 🚀 Performance
- Cache local de 5 minutos
- Filtros instantâneos (sem chamadas ao servidor)
- Índices otimizados no banco
- Queries eficientes com prepared statements

#### 🔧 Infraestrutura
- Deploy no Railway com PostgreSQL
- Socket.IO para comunicação real-time
- Express.js + Node.js 18+
- Frontend vanilla JS (sem frameworks)

#### 📝 Documentação
- README.md completo
- ARCHITECTURE.md técnico detalhado
- DEPLOYMENT.md com guias de deploy
- CHANGELOG.md (este arquivo)

#### 🐛 Correções Importantes
- **Fix:** Tarefas desaparecendo após F5 (problema de cache)
- **Fix:** Socket.IO event mismatch (taskCreated → task:created)
- **Fix:** Tarefas não renderizando após load inicial
- **Fix:** Organization_id faltando em tarefas

---

## [1.2.4] - 2025-12-20

### 🔧 Correções
- Ajustes no sistema de cache
- Melhoria na sincronização de tarefas
- Correção de bugs no drag & drop

---

## [1.2.0] - 2025-12-15

### ✨ Novidades
- Adição de campo "Responsável" nas tarefas
- Implementação de ordenação customizável
- Melhoria na UI do Kanban

---

## [1.1.0] - 2025-12-10

### ✨ Novidades
- Sistema de arquivamento de projetos
- Filtros avançados (loja, status, categoria)
- Campo de observações nos projetos

---

## [1.0.0] - 2025-12-01

### 🎉 Primeira Versão Estável
- Sistema básico de projetos e tarefas
- Autenticação JWT
- Banco PostgreSQL (Supabase)
- Interface Kanban simples

---

## Formato

O changelog segue o formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

### Categorias
- `✨ Novidades` - Novas funcionalidades
- `🔧 Correções` - Bug fixes
- `🚀 Performance` - Melhorias de desempenho
- `📝 Documentação` - Mudanças na documentação
- `⚠️  Deprecated` - Funcionalidades descontinuadas
- `🗑️  Removido` - Funcionalidades removidas
- `🔐 Segurança` - Correções de segurança

---

## Versionamento

Este projeto segue [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH

MAJOR: Mudanças incompatíveis na API
MINOR: Novas funcionalidades compatíveis
PATCH: Correções de bugs compatíveis
```

---

**Versão atual:** 2.0.0  
**Última atualização:** 22 de dezembro de 2025
