# 📝 Changelog

## [1.1.0] - 2025-11-19

### 🎉 FEATURES PRINCIPAIS

**🎨 Drag & Drop com Ordenação Persistente**
- **Obras**: Arraste e solte obras na sidebar para reorganizar
  - Cursor muda para "mão" (grab/grabbing)
  - Efeito visual de rotação ao arrastar
  - Salva ordem automaticamente no banco
  - Toast de confirmação: "✅ Ordem salva!"
  - Ordem persiste após reload

- **Tarefas**: Reorganize tarefas dentro das colunas Kanban
  - Arraste entre colunas: muda status + salva ordem
  - Arraste dentro da coluna: apenas reordena
  - Update otimista para UX fluida
  - Rollback automático se houver erro

**⚡ Sincronização em Tempo Real**
- Socket.IO para updates instantâneos entre usuários
- Quando um usuário move algo, **TODOS veem em tempo real!**
- Funciona entre múltiplas abas/dispositivos/usuários
- Eventos: `projectsReordered`, `tasksReordered`, `projectUpdated`

### 🗄️ Backend

- ✅ `POST /api/projects/reorder` - Endpoint para reordenar obras
- ✅ `POST /api/tasks/reorder` - Endpoint para reordenar tarefas
- ✅ Campo `display_order` em `projects` e `tasks` (INTEGER, default 0)
- ✅ Índices otimizados para performance de ordenação
- ✅ Socket.IO emite eventos de reordenação para toda organização
- ✅ Ordenação automática por `display_order` nas consultas

### 🎨 Frontend

- ✅ `setupProjectsDragAndDrop()` - Drag & drop de obras
- ✅ `saveProjectsOrder()` - Salva ordem das obras
- ✅ `saveTasksOrder()` - Salva ordem das tarefas
- ✅ CSS: `.dragging` com rotação e sombra azul
- ✅ Cursor `grab` → `grabbing` durante drag

### 🔧 Técnico

- Campo `display_order` baseado em zero (0, 1, 2, 3...)
- Projetos ordenados dentro da organização
- Tarefas ordenadas por projeto + status
- Update otimista com rollback
- Debounce para evitar requisições excessivas

### 📝 Migrações

**SQL executado no Supabase:**
```sql
ALTER TABLE projects ADD COLUMN display_order INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN display_order INTEGER DEFAULT 0;
CREATE INDEX idx_projects_order ON projects(organization_id, display_order);
CREATE INDEX idx_tasks_order ON tasks(project_id, status, display_order);
```

### 📚 Documentação

- `DRAG-DROP-IMPLEMENTADO.md` - Guia completo de implementação
- `INSTRUCAO-BANCO-ORDEM.md` - Instruções SQL
- `supabase-add-order.sql` - Script de migração
- `scripts/setup-order.js` - Script de teste

---

## [1.0.4] - 2025-11-19

### 🐛 Correções
- **Botão "Adicionar Tarefa" funcionando**: Corrigido bug crítico na criação de tarefas
  - Status correto: `'backlog'` → `'Criado'` (português)
  - Validação melhorada: exibe toast de erro se nenhuma obra estiver selecionada
  - Mensagens de feedback ao usuário

### ✨ Melhorias UX
- **Enter para criar tarefa**: Pressione Enter no campo de nova tarefa para adicionar
- **Foco automático**: Após criar tarefa, cursor volta automaticamente para o campo
  - Permite adicionar múltiplas tarefas rapidamente
  - Fluxo otimizado: digitar → Enter → digitar → Enter
- **Validação visual**: Campo recebe foco se tentar adicionar tarefa vazia

### 🔧 Técnico
- Previne submit padrão do Enter (`e.preventDefault()`)
- Timeout de 100ms para garantir foco após re-render
- Toast notifications para feedback visual

---

## [1.0.3] - 2025-11-19

### 🎨 Melhorias UX
- **Sidebar 20% mais larga**: Coluna "Obras" expandida de 240px → 288px
  - Melhor visualização dos nomes de obras
  - Menos quebra de linha
  - max-width responsivo: 36vw → 40vw

---

## [1.0.2] - 2025-11-19

### ✨ Adicionado
- **Display de versão e data de atualização** no canto inferior direito
  - Mostra a versão atual do sistema (ex: v1.0.2)
  - Exibe data e hora da última atualização
  - Posicionamento fixo no canto inferior direito
  - Design discreto com fundo translúcido
  - API endpoint `/api/version` para buscar informações
  - Implementado em todas as páginas (dashboard e configurações)

### 🎨 Melhorias Visuais
- Footer redesenhado com:
  - Posição fixa (não ocupa espaço)
  - Backdrop blur para efeito glassmorphism
  - Cores da paleta do sistema (#3b82f6, #64748b)
  - Responsivo e discreto

---

## [1.0.1] - 2025-11-19

### 🐛 Correções
- **Fix crítico para iOS Safari**: Filtros não funcionavam no iPhone
  - Adicionado evento `input` além de `change` em todos os selects
  - Filtros da sidebar (Loja, Status, Categoria)
  - Dropdown de status nos cards de projeto
  - Todos os campos select no modal de detalhes
  - Compatibilidade total com Safari iOS

### 🔧 Técnico
- Implementado padrão de eventos duplos para compatibilidade cross-browser
- Adicionado `data-attributes` para facilitar manipulação DOM
- Event listeners programáticos com `setTimeout` para garantir renderização

---

## [1.0.0] - 2025-11-19

### 🎉 Lançamento Inicial
- Sistema completo de gestão de obras multi-tenant
- Autenticação JWT com 3 níveis de permissão (ADMIN, MEMBER, VIEWER)
- Sistema Kanban com 5 status
- Gerenciamento de usuários
- Atualização em tempo real via Socket.IO
- 41 projetos e 140 tarefas importados do sistema antigo
- Deploy em produção no Railway
- Documentação completa

### 🚀 Funcionalidades
- Criar, editar e arquivar obras
- Sistema de tarefas com drag-and-drop entre status
- Filtros por loja, status e categoria
- Gerenciamento de lojas, status, integradoras, montadores e eletricistas
- Logs de auditoria completos
- Campos GSI para controle de entregas
- Painel administrativo completo

### 📦 Tecnologias
- Node.js + Express.js
- Supabase (PostgreSQL)
- Socket.IO para real-time
- JWT para autenticação
- Bcrypt para senhas
- Vanilla JavaScript (sem frameworks)

---

## Formato de Versão

Seguimos [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.x.x): Mudanças incompatíveis na API
- **MINOR** (x.1.x): Novas funcionalidades compatíveis
- **PATCH** (x.x.1): Correções de bugs

**Tipo de Commits:**
- `feat:` - Nova funcionalidade (MINOR)
- `fix:` - Correção de bug (PATCH)
- `chore:` - Tarefas de manutenção
- `docs:` - Documentação
- `style:` - Formatação de código
- `refactor:` - Refatoração sem mudanças funcionais
- `perf:` - Melhorias de performance
- `test:` - Testes
