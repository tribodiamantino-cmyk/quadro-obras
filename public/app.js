(function(){
  'use strict';

  // Fluxo de status
  const STATUSES = ['Criado','Em separação','Pendencia','Em romaneio','Entregue'];

  // Socket / estado global
  const socket = io();
  let state = { projects: [], currentProjectId: null };
  let blockSocketUpdate = false; // bloqueia atualizações do socket quando true

  // Carregar estado e assinar socket
  socket.on('state', s => {
    // Se estiver bloqueado, ignora update do socket
    if (blockSocketUpdate) return;
    state = s;
    if (window._detailsState) {
      (state.projects || []).forEach(p => {
        const projId = p.id;
        let checklist = Array.isArray(p.detailsChecklist) ? p.detailsChecklist : [];
        let detailsText = typeof p.detailsText === 'string' ? p.detailsText : '';
        if (Array.isArray(p.details)) checklist = p.details;
        else if (typeof p.details === 'string' && !p.detailsText) detailsText = p.details;
        if (!checklist || checklist.length === 0) checklist = [{ text: '', checked: false }];
        const local = window._detailsState[projId];
        if (!local || !local.editing) {
          window._detailsState[projId] = { checklist, detailsText };
        }
      });
    }
    renderAll();
  });
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        for (const node of mutation.addedNodes) {
          if (node.classList && node.classList.contains('checklist-row')) {
            const input = node.querySelector('.checklist-txt');
            if (input && document.activeElement !== input) {
              input.focus();
              const len = input.value.length;
              input.setSelectionRange(len, len);
              // Para de observar após encontrar e focar
              return;
            }
          }
        }
      }
    }
  });

  // Elementos de UI
  const projectSelect = document.getElementById('projectSelect');
  const projectsList = document.getElementById('projectsList');
  const btnNewProject = document.getElementById('btnNewProjectAside');
  const btnAddCriado = document.getElementById('btnAddCriado');
  const inputCriado = document.getElementById('input-criado');
  const vtag = document.getElementById('vtag');
  if (vtag) vtag.textContent = window.APP_VERSION || '-';

  // Aviso se socket não conectou
  setTimeout(() => {
    if (socket.disconnected) alert('Conexão em tempo real não estabelecida. Use a URL do servidor.');
  }, 3000);

  // Helper de API (usa Auth.fetch do auth.js que adiciona token JWT automaticamente)
  function api(path, opts) {
    if (window.Auth && window.Auth.fetch) {
      return window.Auth.fetch(path, opts);
    }
    // Fallback se auth.js não estiver carregado
    return fetch(path, Object.assign({ headers: {'Content-Type': 'application/json'} }, opts || {}));
  }

  // Conecta socket à organização do usuário autenticado
  const user = window.Auth && window.Auth.getUser();
  if (user && user.organizationId) {
    socket.emit('join-organization', user.organizationId);
  }

  // Carregar estado inicial
  api('/api/state').then(r => r.json()).then(s => {
    state = s;
    if (!window._detailsState) window._detailsState = {};
    // Atualiza estado local do checklist/texto livre ao receber do backend,
    // sem sobrescrever projetos em edição.
    (state.projects || []).forEach(p => {
      const projId = p.id;
      let checklist = Array.isArray(p.detailsChecklist) ? p.detailsChecklist : [];
      let detailsText = typeof p.detailsText === 'string' ? p.detailsText : '';
      if (Array.isArray(p.details)) checklist = p.details;
      else if (typeof p.details === 'string' && !p.detailsText) detailsText = p.details;
      if (!checklist || checklist.length === 0) checklist = [{ text: '', checked: false }];
      const local = window._detailsState[projId];
      if (!local || !local.editing) {
        window._detailsState[projId] = { checklist, detailsText };
      }
    });
    renderAll();
  });
    // Atualiza estado local do checklist/texto livre ao receber do backend,
    // mas não sobrescreve projetos que estão sendo editados pelo usuário.
    if (window._detailsState) {
      (state.projects || []).forEach(p => {
        const projId = p.id;
        let checklist = Array.isArray(p.detailsChecklist) ? p.detailsChecklist : [];
        let detailsText = typeof p.detailsText === 'string' ? p.detailsText : '';
        if (Array.isArray(p.details)) checklist = p.details;
        else if (typeof p.details === 'string' && !p.detailsText) detailsText = p.details;
        if (!checklist || checklist.length === 0) checklist = [{ text: '', checked: false }];
        const local = window._detailsState[projId];
        if (!local || !local.editing) {
          window._detailsState[projId] = { checklist, detailsText };
        } else {
          // if local exists and is editing, merge only non-conflicting parts (keep local)
          // leave local.checklist and local.detailsText untouched while editing
        }
      });
    }
    renderAll();
  });
  fetch('/api/state').then(r => r.json()).then(s => {
    state = s;
    if (!window._detailsState) window._detailsState = {};
    // Atualiza estado local do checklist/texto livre ao receber do backend,
    // sem sobrescrever projetos em edição.
    (state.projects || []).forEach(p => {
      const projId = p.id;
      let checklist = Array.isArray(p.detailsChecklist) ? p.detailsChecklist : [];
      let detailsText = typeof p.detailsText === 'string' ? p.detailsText : '';
      if (Array.isArray(p.details)) checklist = p.details;
      else if (typeof p.details === 'string' && !p.detailsText) detailsText = p.details;
      if (!checklist || checklist.length === 0) checklist = [{ text: '', checked: false }];
      const local = window._detailsState[projId];
      if (!local || !local.editing) {
        window._detailsState[projId] = { checklist, detailsText };
      }
    });
    renderAll();
  });

  // Projeto atual
  function currentProject() {
    return state.projects.find(p => p.id === state.currentProjectId) || state.projects[0];
  }

  // === SELEÇÃO EM LOTE ===
  const selectedIds = new Set();
  function renderBulkBar() {
    let bar = document.getElementById('bulkBar');
    const count = selectedIds.size;

    if (!count) {
      if (bar) bar.remove();
      return;
    }

    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'bulkBar';
      bar.innerHTML = `
        <div class="bulk-inner">
          <span class="info"></span>
          <select id="bulkTarget"><option disabled selected>Copiar para obra...</option></select>
          <button id="bulkCopy" class="primary">Copiar</button>
          <button id="bulkDelete" class="danger">Excluir</button>
          <button id="bulkClear">Limpar seleção</button>
        </div>`;
      document.body.appendChild(bar);
    }

    // contador
    bar.querySelector('.info').textContent = `${count} selecionada(s)`;

    // popular select de destino (todas menos a atual)
    const proj = currentProject();
    const select = bar.querySelector('#bulkTarget');
    select.innerHTML = '<option disabled selected>Copiar para obra...</option>';
    (state.projects || []).forEach(p => {
      if (proj && p.id !== proj.id) {
        const o = document.createElement('option');
        o.value = p.id;
        o.textContent = p.name;
        select.appendChild(o);
      }
    });

    // ações
    bar.querySelector('#bulkCopy').onclick = () => {
      const targetId = select.value;
      if (!targetId) return alert('Escolha a obra de destino.');
      api('/api/tasks/batch-copy', {
        method: 'POST',
        body: JSON.stringify({
          sourceProjectId: proj.id,
          targetProjectId: targetId,
          taskIds: Array.from(selectedIds)
        })
      });
      selectedIds.clear();
      renderBulkBar();
    };

    bar.querySelector('#bulkDelete').onclick = () => {
      if (!confirm(`Excluir ${count} tarefa(s)?`)) return;
      api('/api/tasks/batch-delete', {
        method: 'POST',
        body: JSON.stringify({
          projectId: proj.id,
          taskIds: Array.from(selectedIds)
        })
      });
      selectedIds.clear();
      renderBulkBar();
    };

    bar.querySelector('#bulkClear').onclick = () => {
      selectedIds.clear();
      renderBulkBar();
    };
  }

  // Sidebar e select de obras
  function renderProjectsUI() {
    projectSelect.innerHTML = '';
    (state.projects || []).forEach(p => {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.name;
      if (p.id === state.currentProjectId) o.selected = true;
      projectSelect.appendChild(o);
    });

    projectsList.innerHTML = '';
    (state.projects || []).forEach(p => {
      const card = document.createElement('div');
      card.className = 'proj' + (p.id === state.currentProjectId ? ' active' : '');
      const header = document.createElement('div');
      header.className = 'proj-header';

      const title = document.createElement('div');
      title.className = 'proj-title';
      title.setAttribute('contenteditable','true');
      title.textContent = p.name;
      title.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          title.blur();
        }
      });
      title.addEventListener('blur', () => {
        const v = (title.textContent || '').trim() || p.name;
        if (v !== p.name) {
          api('/api/project/' + p.id, { method: 'PATCH', body: JSON.stringify({ name: v }) });
        }
      });

      card.addEventListener('click', e => {
        if (e.target.closest('.delete-project')) return;
        if (state.currentProjectId !== p.id) {
          api('/api/project/' + p.id, { method: 'PATCH', body: JSON.stringify({ current: true }) });
        }
      });

      const del = document.createElement('button');
      del.className = 'delete-project';
      del.textContent = '🗑️';
      del.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Excluir esta obra?')) {
          api('/api/project/' + p.id, { method: 'DELETE' });
        }
      });

      header.appendChild(title);
      header.appendChild(del);
      card.appendChild(header);
      projectsList.appendChild(card);
    });
  }
  // Avanço/Volta customizados
  function nextOf(status) {
    if (status === 'Em separação') return 'Em romaneio';
    const i = STATUSES.indexOf(status);
    return (i > -1 && i < STATUSES.length - 1) ? STATUSES[i + 1] : null;
  }

  function prevOf(status) {
    if (status === 'Em romaneio') return 'Em separação';
    const i = STATUSES.indexOf(status);
    return (i > 0) ? STATUSES[i - 1] : null;
  }

  // Renderização do quadro
  function renderBoard() {
    document.querySelectorAll('.tasks').forEach(el => el.innerHTML = '');
    const proj = currentProject();
    if (!proj) return;

    // Mantém estado local do checklist e texto livre
    if (!window._detailsState) window._detailsState = {};
    const detailsState = window._detailsState;
    const projId = proj.id;
    if (!detailsState[projId]) {
      let checklist = Array.isArray(proj.detailsChecklist) ? proj.detailsChecklist : [];
      let detailsText = typeof proj.detailsText === 'string' ? proj.detailsText : '';
      if (Array.isArray(proj.details)) checklist = proj.details;
      else if (typeof proj.details === 'string' && !proj.detailsText) detailsText = proj.details;
      if (!checklist || checklist.length === 0) checklist = [{ text: '', checked: false }];
      detailsState[projId] = { checklist, detailsText };
    }
    let { checklist, detailsText } = detailsState[projId];

    // --- Checklist dinâmico + texto livre Detalhes da Obra ---
    const detailsBox = document.getElementById('projectDetails');
    if (detailsBox) {
      detailsBox.innerHTML = '';
      // Checklist dinâmico
      const checklistContainer = document.createElement('div');
      checklistContainer.className = 'checklist-container';
      // Cria um elemento de linha a partir de dados (não altera checklist array)
      function createRowElement(item, idx) {
        const row = document.createElement('div');
        row.className = 'checklist-row';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!item.checked;
        cb.className = 'checklist-cb';
        cb.onchange = () => {
          checklist[idx].checked = cb.checked;
          patchDetails();
        };
        row.appendChild(cb);
        const txt = document.createElement('input');
        txt.type = 'text';
        txt.value = item.text;
        txt.className = 'checklist-txt';
        txt.oninput = () => {
          checklist[idx].text = txt.value;
          if (!detailsState[projId]) detailsState[projId] = { checklist, detailsText };
          detailsState[projId].editing = true;
        };
        txt.onfocus = () => {
          if (!detailsState[projId]) detailsState[projId] = { checklist, detailsText };
          detailsState[projId].editing = true;
        };
        txt.onblur = () => {
          setTimeout(() => { if (detailsState[projId]) detailsState[projId].editing = false; }, 150);
          patchDetails();
        };
        txt.onkeydown = e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            checklist[idx].text = txt.value;
            if (!detailsState[projId]) detailsState[projId] = { checklist, detailsText };
            detailsState[projId].editing = true;
            insertRowAt(idx + 1);
          }
        };
        row.appendChild(txt);
        const btnX = document.createElement('button');
        btnX.textContent = 'X';
        btnX.className = 'checklist-del';
        btnX.onclick = () => {
          removeRowAt(idx);
        };
        row.appendChild(btnX);
        return row;
      }

      // Render inicial completa
      function renderChecklist() {
        checklistContainer.innerHTML = '';
        checklist.forEach((item, idx) => checklistContainer.appendChild(createRowElement(item, idx)));
      }

      // Inserir linha diretamente no DOM e no array, posicionando foco imediato no input
      function insertRowAt(pos) {
        // Bloqueia atualizações do socket temporariamente
        blockSocketUpdate = true;

        checklist.splice(pos, 0, { text: '', checked: false });
        // create element and insert
        const rowEl = createRowElement(checklist[pos], pos);
        const rows = checklistContainer.querySelectorAll('.checklist-row');
        if (rows.length === 0 || pos >= rows.length) checklistContainer.appendChild(rowEl);
        else checklistContainer.insertBefore(rowEl, rows[pos]);
        
        // rebuild indexes of following rows
        for (let i = pos + 1; i < checklist.length; i++) {
          const next = checklistContainer.querySelectorAll('.checklist-row')[i];
          if (next) {
            const newEl = createRowElement(checklist[i], i);
            checklistContainer.replaceChild(newEl, next);
          }
        }

        // Foca no novo input após o DOM estar pronto
        requestAnimationFrame(() => {
          const inp = rowEl.querySelector('.checklist-txt');
          if (inp) {
            inp.focus();
            const len = inp.value.length;
            inp.setSelectionRange(len, len);
            lastFocusedInput = inp;
          }
          // Libera atualizações do socket após focar
          setTimeout(() => {
            blockSocketUpdate = false;
          }, 100);
        });

        // mark editing e persist
        if (!detailsState[projId]) detailsState[projId] = { checklist, detailsText };
        detailsState[projId].editing = true;
        patchDetails();
      }

      // Remover linha diretamente no DOM e no array
      function removeRowAt(pos) {
        if (pos < 0 || pos >= checklist.length) return;
        checklist.splice(pos, 1);
        const rows = checklistContainer.querySelectorAll('.checklist-row');
        if (rows[pos]) rows[pos].remove();
        // rebuild subsequent rows to fix their idx closures
        for (let i = pos; i < checklist.length; i++) {
          const next = checklistContainer.querySelectorAll('.checklist-row')[i];
          if (next) {
            const newEl = createRowElement(checklist[i], i);
            checklistContainer.replaceChild(newEl, next);
          }
        }
        patchDetails();
      }
      function addItem(pos) {
        checklist.splice(pos, 0, { text: '', checked: false });
        // request focus after next render via shared state so socket re-renders don't steal focus
        if (!detailsState[projId]) detailsState[projId] = { checklist, detailsText };
        detailsState[projId].pendingFocus = pos;
        // mark editing so socket updates don't overwrite while we're adding
        detailsState[projId].editing = true;
        renderChecklist();
        patchDetails();
        // leave editing=true for a short while; blur handler clears it
        setTimeout(() => { if (detailsState[projId]) detailsState[projId].editing = false; }, 400);
      }
      function patchDetails() {
        detailsState[projId] = { checklist, detailsText };
        api('/api/project/' + proj.id, {
          method: 'PATCH',
          body: JSON.stringify({ detailsChecklist: checklist.slice(), detailsText })
        });
      }
      renderChecklist();
      detailsBox.appendChild(checklistContainer);

      // Texto livre abaixo
      const textArea = document.createElement('textarea');
      textArea.className = 'details-textarea';
      textArea.placeholder = 'Adicione aqui observações ou detalhes da obra...';
      textArea.value = detailsText;
      textArea.oninput = () => {
        detailsText = textArea.value;
      };
      textArea.onblur = () => {
        patchDetails();
      };
      detailsBox.appendChild(textArea);
    }

    (proj.tasks || []).forEach(t => {
      const line = document.createElement('div');
      line.className = 'task-line';

      const holder = document.createElement('div');
      holder.className = 'task-select';
      const sel = document.createElement('input');
      sel.type = 'checkbox';
      sel.className = 'sel';
      sel.checked = selectedIds.has(t.id);
      sel.onchange = () => {
        if (sel.checked) selectedIds.add(t.id);
        else selectedIds.delete(t.id);
        renderBulkBar();
      };
      holder.appendChild(sel);
      line.appendChild(holder);

      const el = document.createElement('div');
      el.className = 'task' +
        (t.expanded ? ' open' : '') +
        (t.status === 'Pendencia' ? ' pending' : '') +
        (t.hasPending ? ' parent-pending' : '');
      el.draggable = true;

      el.addEventListener('click', () => {
        t.expanded = !t.expanded;
        renderBoard();
      });

      el.addEventListener('dragstart', e => {
        el.classList.add('dragging');
        e.dataTransfer.setData('id', t.id);
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
      });

      const hdr = document.createElement('div');
      hdr.className = 'hdr';

      const chev = document.createElement('span');
      chev.className = 'chev';
      chev.textContent = t.expanded ? '▼' : '▶';

      const inp = document.createElement('textarea');
      inp.value = t.title;
      inp.rows = 1;
      inp.addEventListener('click', e => e.stopPropagation());
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          inp.blur();
        }
      });
      inp.addEventListener('blur', () => {
        api('/api/task/' + t.id, {
          method: 'PATCH',
          body: JSON.stringify({ projectId: proj.id, title: inp.value })
        });
      });
      function fit() {
        inp.style.height = 'auto';
        inp.style.height = inp.scrollHeight + 'px';
      }
      inp.addEventListener('input', fit);
      setTimeout(fit, 0);

      const titleWrap = document.createElement('div');
      titleWrap.className = 'title-wrap';
      titleWrap.appendChild(chev);
      titleWrap.appendChild(inp);

      const ctrls = document.createElement('div');
      ctrls.className = 'mini-ctrls';

      const p = prevOf(t.status);
      if (p) {
        const b = document.createElement('button');
        b.className = 'mini-btn mini-back';
        b.textContent = '←';
        b.onclick = e => {
          e.stopPropagation();
          api('/api/task/' + t.id, {
            method: 'PATCH',
            body: JSON.stringify({ projectId: proj.id, toStatus: p })
          });
        };
        ctrls.appendChild(b);
      }

      const n = nextOf(t.status);
      if (n) {
        const a = document.createElement('button');
        a.className = 'mini-btn mini-advance';
        a.textContent = '→';
        a.onclick = e => {
          e.stopPropagation();
          api('/api/task/' + t.id, {
            method: 'PATCH',
            body: JSON.stringify({ projectId: proj.id, toStatus: n })
          });
        };
        ctrls.appendChild(a);
      }

      if (t.status === 'Em separação') {
        const ap = document.createElement('button');
        ap.className = 'mini-btn mini-advance';
        ap.textContent = '→P';
        ap.onclick = e => {
          e.stopPropagation();
          api('/api/task/' + t.id + '/advance-with-pending', {
            method: 'POST',
            body: JSON.stringify({ projectId: proj.id })
          });
        };
        ctrls.appendChild(ap);
      }

      const x = document.createElement('button');
      x.className = 'mini-del';
      x.textContent = '✖';
      x.onclick = e => {
        e.stopPropagation();
        api('/api/task/' + t.id, {
          method: 'DELETE',
          body: JSON.stringify({ projectId: proj.id })
        });
      };
      ctrls.appendChild(x);

      const row = document.createElement('div');
      row.className = 'row';
      const small = document.createElement('small');
      const parts = ['Criado: ' + (t.created || '-')];
      STATUSES.forEach(s => { if (t.dates && t.dates[s]) parts.push(s + ': ' + t.dates[s]); });
      small.textContent = parts.join(' • ');

      const btns = document.createElement('div');
      btns.className = 'btns';

      const pp = prevOf(t.status);
      const nn = nextOf(t.status);

      if (pp) {
        const bb = document.createElement('button');
        bb.className = 'btn-back';
        bb.textContent = '← Voltar';
        bb.onclick = () => {
          api('/api/task/' + t.id, {
            method: 'PATCH',
            body: JSON.stringify({ projectId: proj.id, toStatus: pp })
          });
        };
        btns.appendChild(bb);
      }
      if (nn) {
        const aa = document.createElement('button');
        aa.className = 'btn-advance';
        aa.textContent = 'Avançar →';
        aa.onclick = () => {
          api('/api/task/' + t.id, {
            method: 'PATCH',
            body: JSON.stringify({ projectId: proj.id, toStatus: nn })
          });
        };
        btns.appendChild(aa);
      }

      if (t.status === 'Pendencia') {
        const dup = document.createElement('button');
        dup.textContent = 'Duplicar pendência';
        dup.onclick = () => {
          const name = prompt('Nome da nova pendência:', t.title + ' — Pendência');
          if (name !== null) {
            api('/api/task/' + t.id + '/duplicate-pending', {
              method: 'POST',
              body: JSON.stringify({ projectId: proj.id, name })
            });
          }
        };
        btns.appendChild(dup);
      }

      const del = document.createElement('button');
      del.textContent = 'Excluir';
      del.onclick = () => {
        api('/api/task/' + t.id, {
          method: 'DELETE',
          body: JSON.stringify({ projectId: proj.id })
        });
      };
      btns.appendChild(del);

      hdr.appendChild(titleWrap);
      el.appendChild(hdr);
      el.appendChild(ctrls);
      row.appendChild(small);
      row.appendChild(btns);
      el.appendChild(row);
      line.appendChild(el);
      document.querySelector('[data-status="' + t.status + '"] .tasks').appendChild(line);
    });

    document.querySelectorAll('.tasks').forEach(area => {
      area.ondragover = e => e.preventDefault();
      area.ondrop = e => {
        e.preventDefault();
        const id = e.dataTransfer.getData('id');
        const to = area.parentElement.getAttribute('data-status');
        if (!id || !to) return;
        const proj = currentProject();
        api('/api/task/' + id, {
          method: 'PATCH',
          body: JSON.stringify({ projectId: proj.id, toStatus: to })
        });
      };
    });

    renderBulkBar();
  }

  function renderAll() {
    renderProjectsUI();
    renderBoard();
  }

  if (btnAddCriado) {
    btnAddCriado.addEventListener('click', () => {
      const v = (inputCriado.value || '').trim();
      if (!v) return;
      const proj = currentProject();
      api('/api/task', {
        method: 'POST',
        body: JSON.stringify({ projectId: proj.id, title: v })
      });
      inputCriado.value = '';
      inputCriado.focus();
    });
  }

  if (inputCriado) {
    inputCriado.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const v = (inputCriado.value || '').trim();
        if (!v) return;
        const proj = currentProject();
        api('/api/task', {
          method: 'POST',
          body: JSON.stringify({ projectId: proj.id, title: v })
        });
        inputCriado.value = '';
        inputCriado.focus();
      }
    });
  }

  if (projectSelect) {
    projectSelect.addEventListener('change', e => {
      api('/api/project/' + e.target.value, {
        method: 'PATCH',
        body: JSON.stringify({ current: true })
      });
    });
  }

  if (btnNewProject) {
    btnNewProject.addEventListener('click', () => {
      const name = prompt('Nome da nova obra:', 'Obra ' + (state.projects.length + 1));
      if (name !== null) {
        api('/api/project', {
          method: 'POST',
          body: JSON.stringify({ name })
        });
      }
    });
  }

})();