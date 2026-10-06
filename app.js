const STORAGE_KEY = 'ticketSupportHtmlTickets';

const seedTickets = [
  {
    id: 1001,
    title: 'Falla en acceso a servidor de base de datos',
    category: 'Soporte Técnico / TI',
    urgency: 'alta',
    confidential: true,
    description: 'Se presenta lentitud intermitente en las consultas hacia SQL Server.',
    status: 'En Proceso',
    createdAt: new Date().toISOString(),
    createdBy: 'Usuario Demo'
  },
  {
    id: 1002,
    title: 'Solicitud de monitor secundario',
    category: 'Solicitud de Hardware / Equipo',
    urgency: 'media',
    confidential: false,
    description: 'Se requiere un monitor adicional para labores de soporte.',
    status: 'Pendiente',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: 'Usuario Demo'
  }
];

function loadTickets() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTickets));
    return [...seedTickets];
  }
  try { return JSON.parse(raw); } catch { return [...seedTickets]; }
}

function saveTickets(tickets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

let tickets = loadTickets();
let currentView = 'dashboard';

const app = document.getElementById('app');
const navButtons = [...document.querySelectorAll('.sidebar-link')];

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentView = btn.dataset.view;
    setActiveNav(currentView);
    render();
  });
});

function setActiveNav(view) {
  navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
}

function categoryLabel(value) {
  const map = {
    it_support: 'Soporte Técnico / TI',
    hardware: 'Solicitud de Hardware / Equipo',
    software_access: 'Acceso a Software / Permisos',
    infrastructure: 'Redes e Infraestructura'
  };
  return map[value] || value;
}

function urgencyLabel(value) {
  return { baja:'Baja', media:'Media', alta:'Alta', critica:'Crítica' }[value] || value;
}

function urgencyClass(value) {
  return { baja:'badge-low', media:'badge-medium', alta:'badge-high', critica:'badge-critical' }[value] || 'badge-medium';
}

function render() {
  if (currentView === 'dashboard') renderDashboard();
  else if (currentView === 'new-ticket') renderNewTicket();
  else if (currentView === 'tickets') renderTicketsPage();
  else if (currentView === 'developer') renderDeveloper();
}

function renderDashboard() {
  const total = tickets.length;
  const attention = tickets.filter(t => ['Pendiente','En Proceso'].includes(t.status)).length;
  const critical = tickets.filter(t => t.urgency === 'critica').length;

  app.innerHTML = `
    <div class="page-header">
      <div>
        <h2>📊 Panel de Control</h2>
        <p>Bienvenido, usuario@empresa.com</p>
      </div>
      <button class="btn-primary" id="goNew">➕ Nueva Solicitud</button>
    </div>

    <div class="metrics-grid">
      <div class="metric-card"><span class="metric-title">Total Solicitudes</span><span class="metric-value">${total}</span></div>
      <div class="metric-card warning"><span class="metric-title">En Atención</span><span class="metric-value">${attention}</span></div>
      <div class="metric-card danger"><span class="metric-title">Urgencia Crítica</span><span class="metric-value">${critical}</span></div>
    </div>

    <section class="dashboard-section">
      <h3>Solicitudes Recientes</h3>
      ${ticketFiltersHtml()}
      <div id="ticketList"></div>
    </section>
  `;

  document.getElementById('goNew').onclick = () => {
    currentView = 'new-ticket'; setActiveNav(currentView); render();
  };
  bindTicketFilters();
}

function ticketFiltersHtml() {
  return `
    <div class="ticket-filters">
      <input id="ticketSearch" class="search-input" placeholder="Buscar por ID o asunto..." />
      <select id="urgencyFilter" class="filter-select">
        <option value="all">Todas las urgencias</option>
        <option value="baja">Baja</option>
        <option value="media">Media</option>
        <option value="alta">Alta</option>
        <option value="critica">Crítica</option>
      </select>
    </div>
  `;
}

function bindTicketFilters() {
  const search = document.getElementById('ticketSearch');
  const urgency = document.getElementById('urgencyFilter');
  const draw = () => {
    const term = search.value.trim().toLowerCase();
    const urg = urgency.value;
    const filtered = tickets.filter(t => {
      const matchText = String(t.id).includes(term) || t.title.toLowerCase().includes(term);
      const matchUrgency = urg === 'all' || t.urgency === urg;
      return matchText && matchUrgency;
    });
    renderTicketCards(filtered);
  };
  search.addEventListener('input', draw);
  urgency.addEventListener('change', draw);
  draw();
}

function renderTicketCards(list) {
  const target = document.getElementById('ticketList');
  if (!list.length) {
    target.innerHTML = '<div class="empty-state">No se encontraron tickets.</div>';
    return;
  }

  target.innerHTML = `<div class="ticket-grid">${list.map(t => `
    <article class="ticket-card" data-ticket-id="${t.id}">
      <div class="ticket-card-header">
        <strong>#${t.id}</strong>
        <div>
          ${t.confidential ? '<span class="badge badge-confidential">🔒 Confidencial</span>' : ''}
          <span class="badge ${urgencyClass(t.urgency)}">${urgencyLabel(t.urgency).toUpperCase()}</span>
        </div>
      </div>
      <h4 class="ticket-title">${escapeHtml(t.title)}</h4>
      <div class="ticket-meta">
        <span>📁 ${escapeHtml(t.category)}</span>
        <span>⏱️ ${new Date(t.createdAt).toLocaleDateString('es-CO')}</span>
      </div>
      <div class="ticket-card-footer">
        <span class="status-pill">${escapeHtml(t.status)}</span>
        <span>Ver detalle →</span>
      </div>
    </article>
  `).join('')}</div>`;

  target.querySelectorAll('[data-ticket-id]').forEach(card => {
    card.addEventListener('click', () => renderTicketDetail(Number(card.dataset.ticketId)));
  });
}

function renderNewTicket() {
  app.innerHTML = `
    <div class="page-header">
      <div>
        <h2>➕ Crear Nueva Solicitud</h2>
        <p>Versión HTML + CSS + JavaScript. Los datos se guardan en este navegador.</p>
      </div>
      <button class="btn-secondary" id="backDashboard">← Volver al Panel</button>
    </div>

    <form id="ticketForm" class="form-card">
      <div class="form-group">
        <label>Asunto / Título *</label>
        <input name="title" required placeholder="Ej: Falla en acceso a servidor de base de datos" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Categoría *</label>
          <select name="category" id="category">
            <option value="it_support">Soporte Técnico / TI</option>
            <option value="hardware">Solicitud de Hardware / Equipo</option>
            <option value="software_access">Acceso a Software / Permisos</option>
            <option value="infrastructure">Redes e Infraestructura</option>
          </select>
        </div>
        <div class="form-group">
          <label>Nivel de Urgencia *</label>
          <select name="urgency">
            <option value="baja">Baja</option>
            <option value="media" selected>Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>
      </div>

      <div id="dynamicFields"></div>

      <label class="checkbox-row">
        <input type="checkbox" name="confidential" />
        🔒 Marcar esta solicitud como confidencial
      </label>

      <div class="form-group">
        <label>Descripción Detallada *</label>
        <textarea name="description" rows="5" required placeholder="Describe el problema o requerimiento..."></textarea>
      </div>

      <div class="form-group">
        <label>Adjuntar evidencias</label>
        <input type="file" id="attachments" multiple />
        <div class="small">En esta versión estática se conserva el nombre de los archivos; no se suben a un servidor.</div>
      </div>

      <div class="form-actions">
        <button class="btn-primary" type="submit">Crear Ticket</button>
      </div>
    </form>
  `;

  document.getElementById('backDashboard').onclick = () => {
    currentView='dashboard'; setActiveNav(currentView); render();
  };

  const category = document.getElementById('category');
  const dynamic = document.getElementById('dynamicFields');
  const refreshDynamic = () => {
    if (category.value === 'hardware') {
      dynamic.innerHTML = '<div class="form-group"><label>Tipo de Equipo Requerido</label><input name="equipmentType" placeholder="Ej: Laptop i7, Monitor secundario" /></div>';
    } else if (category.value === 'software_access') {
      dynamic.innerHTML = '<div class="form-group"><label>Sistema o BD solicitado</label><input name="systemName" placeholder="Ej: Portal ERP, SQL Server Staging" /></div>';
    } else dynamic.innerHTML = '';
  };
  category.addEventListener('change', refreshDynamic);
  refreshDynamic();

  document.getElementById('ticketForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.target);
    const files = [...document.getElementById('attachments').files].map(f => f.name);
    const nextId = tickets.length ? Math.max(...tickets.map(t => Number(t.id))) + 1 : 1001;
    tickets.unshift({
      id: nextId,
      title: form.get('title'),
      category: categoryLabel(form.get('category')),
      urgency: form.get('urgency'),
      confidential: form.get('confidential') === 'on',
      description: form.get('description'),
      status: 'Pendiente',
      createdAt: new Date().toISOString(),
      createdBy: 'Usuario Demo',
      customField: form.get('equipmentType') || form.get('systemName') || '',
      attachments: files
    });
    saveTickets(tickets);
    currentView = 'dashboard';
    setActiveNav(currentView);
    render();
  });
}

function renderTicketsPage() {
  app.innerHTML = `
    <div class="page-header"><div><h2>📑 Mis Solicitudes</h2><p>Consulta y filtra los tickets registrados.</p></div></div>
    ${ticketFiltersHtml()}
    <div id="ticketList"></div>
  `;
  bindTicketFilters();
}

function renderTicketDetail(id) {
  const t = tickets.find(x => Number(x.id) === Number(id));
  if (!t) return;
  app.innerHTML = `
    <div class="page-header">
      <div><h2>🎫 Detalle de Solicitud #${t.id}</h2><span class="status-pill">${escapeHtml(t.status)}</span></div>
      <button class="btn-secondary" id="backTickets">← Volver</button>
    </div>

    <div class="detail-card">
      <div class="ticket-card-header">
        <h3>${escapeHtml(t.title)}</h3>
        ${t.confidential ? '<span class="badge badge-confidential">🔒 Ticket Confidencial</span>' : ''}
      </div>

      <div class="ticket-detail-grid">
        <div><strong>Categoría:</strong><p>${escapeHtml(t.category)}</p></div>
        <div><strong>Urgencia:</strong><p>${urgencyLabel(t.urgency)}</p></div>
        <div><strong>Creado Por:</strong><p>${escapeHtml(t.createdBy || 'Usuario Demo')}</p></div>
        <div><strong>Fecha:</strong><p>${new Date(t.createdAt).toLocaleString('es-CO')}</p></div>
      </div>

      <hr class="divider" />
      <h4>Descripción</h4>
      <p>${escapeHtml(t.description)}</p>

      ${t.customField ? `<hr class="divider" /><h4>Información adicional</h4><p>${escapeHtml(t.customField)}</p>` : ''}

      <hr class="divider" />
      <h4>📁 Archivos Adjuntos</h4>
      ${t.attachments?.length ? `<ul class="file-list">${t.attachments.map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul>` : '<p class="small">No hay archivos adjuntos.</p>'}
    </div>
  `;
  document.getElementById('backTickets').onclick = () => {
    currentView='dashboard'; setActiveNav(currentView); render();
  };
}

function renderDeveloper() {
  app.innerHTML = `
    <div class="page-header">
      <div><h2>🛠️ Vista Desarrollador</h2><p>Información técnica de esta versión estática.</p></div>
    </div>
    <div class="dev-card">
      <h3>Arquitectura actual</h3>
      <div class="dev-grid">
        <div class="dev-box"><strong>Frontend</strong><p>HTML5 + CSS3 + JavaScript puro</p></div>
        <div class="dev-box"><strong>Persistencia</strong><p>localStorage del navegador</p></div>
        <div class="dev-box"><strong>Hosting</strong><p>Compatible con GitHub Pages</p></div>
        <div class="dev-box"><strong>Dependencias</strong><p>Ninguna</p></div>
      </div>
      <hr class="divider" />
      <button class="btn-danger" id="resetData">Restablecer datos de prueba</button>
    </div>
  `;
  document.getElementById('resetData').onclick = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTickets));
    tickets = loadTickets();
    alert('Datos de prueba restablecidos.');
    renderDeveloper();
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

render();