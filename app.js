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

function saveTickets(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

let tickets = loadTickets();
let currentView = 'dashboard';

const app = document.getElementById('app');
const navButtons = [...document.querySelectorAll('.support-nav-link')];

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

function pageHeader(kicker, title, subtitle, action = '') {
  return `
    <div class="support-page-header">
      <div>
        <div class="support-page-kicker">${kicker}</div>
        <h2>${title}</h2>
        <p>${subtitle}</p>
      </div>
      ${action}
    </div>
  `;
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
    ${pageHeader(
      'SOPORTE → PANEL PRINCIPAL',
      'Solicitudes de Soporte',
      'Resumen general de tickets registrados y solicitudes que requieren atención.',
      '<button class="support-button primary" id="goNew">Nueva solicitud</button>'
    )}

    <div class="support-tabs">
      <span class="support-tab active">Solicitudes</span>
      <span class="support-tab">Indicadores</span>
    </div>

    <div class="support-toolbar">
      <div class="form-group grow">
        <label>Buscar solicitud</label>
        <input id="ticketSearch" class="support-filter" placeholder="ID, asunto o categoría" />
      </div>
      <div class="form-group">
        <label>Urgencia</label>
        <select id="urgencyFilter" class="support-filter">
          <option value="all">Todas</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>
    </div>

    <div class="support-metrics">
      <div class="support-metric"><span>Solicitudes registradas</span><strong>${total}</strong></div>
      <div class="support-metric"><span>En atención</span><strong>${attention}</strong></div>
      <div class="support-metric"><span>Urgencia crítica</span><strong>${critical}</strong></div>
    </div>

    <div id="ticketList"></div>
  `;

  document.getElementById('goNew').onclick = () => {
    currentView = 'new-ticket';
    setActiveNav(currentView);
    render();
  };

  bindTicketFilters();
}

function bindTicketFilters() {
  const search = document.getElementById('ticketSearch');
  const urgency = document.getElementById('urgencyFilter');

  const draw = () => {
    const term = search.value.trim().toLowerCase();
    const urg = urgency.value;
    const filtered = tickets.filter(t => {
      const text = `${t.id} ${t.title} ${t.category}`.toLowerCase();
      return text.includes(term) && (urg === 'all' || t.urgency === urg);
    });
    renderTicketTable(filtered);
  };

  search.addEventListener('input', draw);
  urgency.addEventListener('change', draw);
  draw();
}

function renderTicketTable(list) {
  const target = document.getElementById('ticketList');
  if (!list.length) {
    target.innerHTML = '<div class="empty-state">No se encontraron solicitudes con esos criterios.</div>';
    return;
  }

  target.innerHTML = `
    <div class="support-table-wrap">
      <table class="support-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Solicitud</th>
            <th>Categoría</th>
            <th>Urgencia</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(t => `
            <tr data-ticket-id="${t.id}">
              <td>#${t.id}</td>
              <td>
                <div class="support-ticket-title">${escapeHtml(t.title)}</div>
                ${t.confidential ? '<span class="badge badge-confidential">Confidencial</span>' : ''}
              </td>
              <td>${escapeHtml(t.category)}</td>
              <td><span class="badge ${urgencyClass(t.urgency)}">${urgencyLabel(t.urgency)}</span></td>
              <td><span class="status-pill">${escapeHtml(t.status)}</span></td>
              <td>${new Date(t.createdAt).toLocaleDateString('es-CO')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  target.querySelectorAll('[data-ticket-id]').forEach(row => {
    row.addEventListener('click', () => renderTicketDetail(Number(row.dataset.ticketId)));
  });
}

function renderNewTicket() {
  app.innerHTML = `
    ${pageHeader(
      'SOPORTE → NUEVA SOLICITUD',
      'Registrar solicitud',
      'Complete los datos requeridos para enviar la solicitud a la mesa de soporte.',
      '<button class="support-button secondary" id="backDashboard">Volver</button>'
    )}

    <form id="ticketForm" class="form-card">
      <div class="form-group">
        <label>Asunto / título *</label>
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
          <label>Nivel de urgencia *</label>
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
        Marcar esta solicitud como confidencial
      </label>

      <div class="form-group">
        <label>Descripción detallada *</label>
        <textarea name="description" rows="5" required placeholder="Describe el problema o requerimiento..."></textarea>
      </div>

      <div class="form-group">
        <label>Adjuntar evidencias</label>
        <input type="file" id="attachments" multiple />
        <div class="small">En esta versión estática se conserva el nombre del archivo.</div>
      </div>

      <div class="form-actions">
        <button class="support-button primary" type="submit">Crear solicitud</button>
      </div>
    </form>
  `;

  document.getElementById('backDashboard').onclick = () => {
    currentView = 'dashboard';
    setActiveNav(currentView);
    render();
  };

  const category = document.getElementById('category');
  const dynamic = document.getElementById('dynamicFields');

  const refreshDynamic = () => {
    if (category.value === 'hardware') {
      dynamic.innerHTML = '<div class="form-group"><label>Tipo de equipo requerido</label><input name="equipmentType" placeholder="Ej: Laptop i7, monitor secundario" /></div>';
    } else if (category.value === 'software_access') {
      dynamic.innerHTML = '<div class="form-group"><label>Sistema o base de datos</label><input name="systemName" placeholder="Ej: Portal ERP, SQL Server Staging" /></div>';
    } else {
      dynamic.innerHTML = '';
    }
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
    ${pageHeader(
      'SOPORTE → MIS SOLICITUDES',
      'Mis solicitudes',
      'Consulta el histórico de solicitudes creadas desde este módulo.'
    )}

    <div class="support-toolbar">
      <div class="form-group grow">
        <label>Buscar solicitud</label>
        <input id="ticketSearch" class="support-filter" placeholder="ID, asunto o categoría" />
      </div>
      <div class="form-group">
        <label>Urgencia</label>
        <select id="urgencyFilter" class="support-filter">
          <option value="all">Todas</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>
    </div>

    <div id="ticketList"></div>
  `;

  bindTicketFilters();
}

function renderTicketDetail(id) {
  const t = tickets.find(x => Number(x.id) === Number(id));
  if (!t) return;

  app.innerHTML = `
    ${pageHeader(
      'SOPORTE → DETALLE',
      `Solicitud #${t.id}`,
      'Información completa y trazabilidad básica de la solicitud.',
      '<button class="support-button secondary" id="backTickets">Volver</button>'
    )}

    <div class="detail-card">
      <div class="support-page-header">
        <div>
          <div class="support-ticket-title">${escapeHtml(t.title)}</div>
          <span class="status-pill">${escapeHtml(t.status)}</span>
        </div>
        ${t.confidential ? '<span class="badge badge-confidential">Confidencial</span>' : ''}
      </div>

      <div class="ticket-detail-grid">
        <div class="detail-field"><strong>Categoría</strong><p>${escapeHtml(t.category)}</p></div>
        <div class="detail-field"><strong>Urgencia</strong><p>${urgencyLabel(t.urgency)}</p></div>
        <div class="detail-field"><strong>Creado por</strong><p>${escapeHtml(t.createdBy || 'Usuario Demo')}</p></div>
        <div class="detail-field"><strong>Fecha de creación</strong><p>${new Date(t.createdAt).toLocaleString('es-CO')}</p></div>
      </div>

      <hr class="divider" />
      <h4>Descripción</h4>
      <p class="support-muted">${escapeHtml(t.description)}</p>

      ${t.customField ? `<hr class="divider" /><h4>Información adicional</h4><p class="support-muted">${escapeHtml(t.customField)}</p>` : ''}

      <hr class="divider" />
      <h4>Archivos adjuntos</h4>
      ${t.attachments?.length
        ? `<ul>${t.attachments.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>`
        : '<p class="small">No hay archivos adjuntos.</p>'
      }
    </div>
  `;

  document.getElementById('backTickets').onclick = () => {
    currentView = 'dashboard';
    setActiveNav(currentView);
    render();
  };
}

function renderDeveloper() {
  app.innerHTML = `
    ${pageHeader(
      'SOPORTE → CONFIGURACIÓN',
      'Configuración del módulo',
      'Información técnica de la versión estática preparada para integrarse a una aplicación mayor.'
    )}

    <div class="dev-card">
      <div class="dev-grid">
        <div class="dev-box"><strong>Frontend</strong><p>HTML5 + CSS3 + JavaScript puro</p></div>
        <div class="dev-box"><strong>Persistencia</strong><p>localStorage del navegador</p></div>
        <div class="dev-box"><strong>Integración</strong><p>Estilos encapsulados con prefijo support-</p></div>
        <div class="dev-box"><strong>Hosting</strong><p>Compatible con GitHub Pages</p></div>
      </div>

      <hr class="divider" />
      <button class="support-button danger" id="resetData">Restablecer datos de prueba</button>
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