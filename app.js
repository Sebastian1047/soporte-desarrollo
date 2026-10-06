const STORAGE_KEY = "flowerlogix_support_v1";
const CURRENT_USER = {
  id: 1,
  name: "Usuario Demo",
  email: "usuario@empresa.com",
  role: "Administrador",
  site: "JL"
};

const categories = {
  it_support: "Soporte Técnico / TI",
  hardware: "Solicitud de Hardware / Equipo",
  software_access: "Acceso a Software / Permisos",
  infrastructure: "Redes e Infraestructura"
};

const urgencyLabels = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica"
};

const statusOptions = [
  "Pendiente",
  "En Proceso",
  "Pendiente de Usuario",
  "Resuelto",
  "Cerrado"
];

const demoTickets = [
  {
    id: 1001,
    title: "Falla en acceso a servidor de base de datos",
    category: "Soporte Técnico / TI",
    categoryKey: "it_support",
    urgency: "alta",
    confidential: true,
    description: "Se presenta lentitud intermitente en las consultas hacia SQL Server y algunos usuarios pierden conexión durante la jornada.",
    status: "En Proceso",
    createdAt: "2026-10-06T08:30:00-05:00",
    createdById: 1,
    createdBy: "Usuario Demo",
    assignedTo: "Mesa TI",
    additionalInfo: "Servidor principal de reportes",
    attachments: ["captura-error.png"],
    comments: [
      { user: "Mesa TI", text: "Solicitud recibida y en revisión.", date: "2026-10-06T09:05:00-05:00" }
    ],
    history: [
      { text: "Solicitud creada", date: "2026-10-06T08:30:00-05:00" },
      { text: "Estado cambiado a En Proceso", date: "2026-10-06T09:05:00-05:00" }
    ]
  },
  {
    id: 1002,
    title: "Solicitud de monitor secundario",
    category: "Solicitud de Hardware / Equipo",
    categoryKey: "hardware",
    urgency: "media",
    confidential: false,
    description: "Se requiere un monitor adicional para labores de soporte y seguimiento de incidentes.",
    status: "Pendiente",
    createdAt: "2026-10-05T11:20:00-05:00",
    createdById: 1,
    createdBy: "Usuario Demo",
    assignedTo: "Sin asignar",
    additionalInfo: "Monitor 24 pulgadas",
    attachments: [],
    comments: [],
    history: [
      { text: "Solicitud creada", date: "2026-10-05T11:20:00-05:00" }
    ]
  },
  {
    id: 1003,
    title: "Acceso al portal ERP",
    category: "Acceso a Software / Permisos",
    categoryKey: "software_access",
    urgency: "baja",
    confidential: false,
    description: "Solicitud de permisos de consulta para el módulo de inventarios del ERP.",
    status: "Resuelto",
    createdAt: "2026-10-03T14:10:00-05:00",
    createdById: 2,
    createdBy: "Natalia López",
    assignedTo: "Gabriel Velilla",
    additionalInfo: "ERP · Inventarios",
    attachments: [],
    comments: [
      { user: "Gabriel Velilla", text: "Acceso habilitado y validado con el usuario.", date: "2026-10-04T09:40:00-05:00" }
    ],
    history: [
      { text: "Solicitud creada", date: "2026-10-03T14:10:00-05:00" },
      { text: "Estado cambiado a Resuelto", date: "2026-10-04T09:40:00-05:00" }
    ]
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = { tickets: clone(demoTickets) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return { tickets: clone(demoTickets) };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
let currentView = "dashboard";
let selectedTicketId = null;

const app = document.getElementById("app");
const navItems = [...document.querySelectorAll(".nav-item")];
const tabItems = [...document.querySelectorAll(".tab-pill")];

document.getElementById("sessionSite").value = CURRENT_USER.site;

function formatDate(value) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function urgencyClass(value) {
  return {
    baja: "badge-low",
    media: "badge-medium",
    alta: "badge-high",
    critica: "badge-critical"
  }[value] || "badge-medium";
}

function goTo(view) {
  currentView = view;
  selectedTicketId = null;
  syncNavigation();
  render();
}

function syncNavigation() {
  navItems.forEach(item => item.classList.toggle("active", item.dataset.view === currentView));
  tabItems.forEach(item => item.classList.toggle("active", item.dataset.view === currentView));
}

navItems.forEach(item => item.addEventListener("click", () => goTo(item.dataset.view)));
tabItems.forEach(item => item.addEventListener("click", () => goTo(item.dataset.view)));

function pageHeading(kicker, title, subtitle, action = "") {
  return `
    <section class="page-heading">
      <div class="page-heading-top">
        <div>
          <div class="page-kicker">${kicker}</div>
          <h2>${title}</h2>
        </div>
        ${action}
      </div>
      <p>${subtitle}</p>
    </section>
  `;
}

function metricsHtml(list) {
  const total = list.length;
  const open = list.filter(t => ["Pendiente", "En Proceso", "Pendiente de Usuario"].includes(t.status)).length;
  const critical = list.filter(t => t.urgency === "critica").length;

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <span>Solicitudes registradas</span>
        <strong>${total}</strong>
      </div>
      <div class="stat-card">
        <span>En atención</span>
        <strong>${open}</strong>
      </div>
      <div class="stat-card">
        <span>Prioridad crítica</span>
        <strong>${critical}</strong>
      </div>
    </div>
  `;
}

function ticketTableHtml(list) {
  if (!list.length) {
    return '<div class="empty-state">No hay solicitudes que coincidan con los filtros seleccionados.</div>';
  }

  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Solicitud</th>
            <th>Categoría</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Creado por</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(ticket => `
            <tr data-ticket-id="${ticket.id}">
              <td>#${ticket.id}</td>
              <td>
                <div class="ticket-subject">${escapeHtml(ticket.title)}</div>
                ${ticket.confidential ? '<span class="badge badge-private">Confidencial</span>' : ""}
              </td>
              <td>${escapeHtml(ticket.category)}</td>
              <td><span class="badge ${urgencyClass(ticket.urgency)}">${urgencyLabels[ticket.urgency]}</span></td>
              <td><span class="badge badge-status">${escapeHtml(ticket.status)}</span></td>
              <td>${escapeHtml(ticket.createdBy)}</td>
              <td>${formatDate(ticket.createdAt)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindTicketRows() {
  app.querySelectorAll("[data-ticket-id]").forEach(row => {
    row.addEventListener("click", () => {
      selectedTicketId = Number(row.dataset.ticketId);
      renderTicketDetail(selectedTicketId);
    });
  });
}

function renderDashboard() {
  const list = [...state.tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  app.innerHTML = `
    ${pageHeading(
      "SOPORTE → PANEL PRINCIPAL",
      "🎫 Gestión de Soporte",
      "Resumen de solicitudes internas, prioridades y estados de atención.",
      '<button id="newTicketTop" class="btn btn-primary" type="button">Nueva solicitud</button>'
    )}

    <div class="filter-panel">
      <div class="field grow">
        <label>Buscar solicitud</label>
        <input id="filterSearch" type="text" placeholder="ID, asunto o categoría" />
      </div>
      <div class="field">
        <label>Estado</label>
        <select id="filterStatus">
          <option value="">Todos</option>
          ${statusOptions.map(status => `<option value="${status}">${status}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Prioridad</label>
        <select id="filterUrgency">
          <option value="">Todas</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>
      <button id="applyFilters" class="btn btn-primary" type="button">Consultar</button>
    </div>

    <div id="dashboardMetrics">${metricsHtml(list)}</div>

    <h3 class="section-title">Solicitudes recientes</h3>
    <div id="dashboardTable">${ticketTableHtml(list)}</div>
  `;

  document.getElementById("newTicketTop").addEventListener("click", () => goTo("new-ticket"));

  const apply = () => {
    const search = document.getElementById("filterSearch").value.trim().toLowerCase();
    const status = document.getElementById("filterStatus").value;
    const urgency = document.getElementById("filterUrgency").value;

    const filtered = list.filter(ticket => {
      const haystack = `${ticket.id} ${ticket.title} ${ticket.category} ${ticket.createdBy}`.toLowerCase();
      return (!search || haystack.includes(search))
        && (!status || ticket.status === status)
        && (!urgency || ticket.urgency === urgency);
    });

    document.getElementById("dashboardMetrics").innerHTML = metricsHtml(filtered);
    document.getElementById("dashboardTable").innerHTML = ticketTableHtml(filtered);
    bindTicketRows();
  };

  document.getElementById("applyFilters").addEventListener("click", apply);
  document.getElementById("filterSearch").addEventListener("input", apply);
  document.getElementById("filterStatus").addEventListener("change", apply);
  document.getElementById("filterUrgency").addEventListener("change", apply);
  bindTicketRows();
}

function dynamicFieldHtml(categoryKey) {
  if (categoryKey === "hardware") {
    return `
      <div class="field span-2">
        <label>Tipo de equipo requerido</label>
        <input name="additionalInfo" placeholder="Ej: Laptop i7, monitor 24 pulgadas, teclado..." />
      </div>
    `;
  }

  if (categoryKey === "software_access") {
    return `
      <div class="field span-2">
        <label>Sistema, aplicación o base de datos</label>
        <input name="additionalInfo" placeholder="Ej: ERP, SQL Server, portal corporativo..." />
      </div>
    `;
  }

  if (categoryKey === "infrastructure") {
    return `
      <div class="field span-2">
        <label>Ubicación o recurso afectado</label>
        <input name="additionalInfo" placeholder="Ej: Sede JL, VPN, red inalámbrica..." />
      </div>
    `;
  }

  return `
    <div class="field span-2">
      <label>Información adicional</label>
      <input name="additionalInfo" placeholder="Dato adicional relacionado con la solicitud" />
    </div>
  `;
}

function renderNewTicket() {
  app.innerHTML = `
    ${pageHeading(
      "SOPORTE → NUEVA SOLICITUD",
      "➕ Registrar solicitud",
      "Complete la información requerida para enviar la solicitud a la mesa de soporte.",
      '<button id="cancelNewTicket" class="btn btn-secondary" type="button">Volver</button>'
    )}

    <form id="ticketForm" class="form-card">
      <div class="form-grid">
        <div class="field span-2">
          <label>Asunto / título *</label>
          <input name="title" required placeholder="Ej: Falla en acceso a servidor de base de datos" />
        </div>

        <div class="field">
          <label>Categoría *</label>
          <select id="category" name="categoryKey">
            <option value="it_support">Soporte Técnico / TI</option>
            <option value="hardware">Solicitud de Hardware / Equipo</option>
            <option value="software_access">Acceso a Software / Permisos</option>
            <option value="infrastructure">Redes e Infraestructura</option>
          </select>
        </div>

        <div class="field">
          <label>Nivel de urgencia *</label>
          <select name="urgency">
            <option value="baja">Baja</option>
            <option value="media" selected>Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>

        <div id="dynamicField" class="span-2">
          ${dynamicFieldHtml("it_support")}
        </div>

        <div class="field span-2">
          <label>Descripción detallada *</label>
          <textarea name="description" required placeholder="Describa el problema, el impacto y cualquier información útil para soporte."></textarea>
        </div>

        <div class="field span-2">
          <label>Archivos adjuntos</label>
          <input id="attachments" type="file" multiple />
          <div class="muted" style="font-size:.54rem;margin-top:4px">En esta versión local se guardan los nombres de los archivos seleccionados.</div>
        </div>

        <label class="check-row span-2">
          <input name="confidential" type="checkbox" />
          Marcar esta solicitud como confidencial
        </label>
      </div>

      <div class="form-actions">
        <button class="btn btn-secondary" id="clearForm" type="reset">Limpiar</button>
        <button class="btn btn-primary" type="submit">Crear solicitud</button>
      </div>
    </form>
  `;

  document.getElementById("cancelNewTicket").addEventListener("click", () => goTo("dashboard"));

  const category = document.getElementById("category");
  const dynamicField = document.getElementById("dynamicField");

  category.addEventListener("change", () => {
    dynamicField.innerHTML = dynamicFieldHtml(category.value);
  });

  document.getElementById("ticketForm").addEventListener("submit", event => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const files = [...document.getElementById("attachments").files].map(file => file.name);
    const nextId = state.tickets.length
      ? Math.max(...state.tickets.map(ticket => Number(ticket.id))) + 1
      : 1001;

    const categoryKey = formData.get("categoryKey");
    const now = new Date().toISOString();

    state.tickets.unshift({
      id: nextId,
      title: formData.get("title").trim(),
      category: categories[categoryKey],
      categoryKey,
      urgency: formData.get("urgency"),
      confidential: formData.get("confidential") === "on",
      description: formData.get("description").trim(),
      status: "Pendiente",
      createdAt: now,
      createdById: CURRENT_USER.id,
      createdBy: CURRENT_USER.name,
      assignedTo: "Sin asignar",
      additionalInfo: (formData.get("additionalInfo") || "").trim(),
      attachments: files,
      comments: [],
      history: [{ text: "Solicitud creada", date: now }]
    });

    saveState();
    goTo("dashboard");
  });
}

function renderMyTickets() {
  const mine = state.tickets
    .filter(ticket => ticket.createdById === CURRENT_USER.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  app.innerHTML = `
    ${pageHeading(
      "SOPORTE → MIS SOLICITUDES",
      "☑ Mis solicitudes",
      "Consulte el estado y detalle de las solicitudes creadas por el usuario autenticado."
    )}

    ${metricsHtml(mine)}

    <div class="filter-panel">
      <div class="field grow">
        <label>Buscar</label>
        <input id="mySearch" placeholder="ID o asunto" />
      </div>
      <div class="field">
        <label>Estado</label>
        <select id="myStatus">
          <option value="">Todos</option>
          ${statusOptions.map(status => `<option value="${status}">${status}</option>`).join("")}
        </select>
      </div>
    </div>

    <div id="myTicketsTable">${ticketTableHtml(mine)}</div>
  `;

  const filter = () => {
    const search = document.getElementById("mySearch").value.toLowerCase();
    const status = document.getElementById("myStatus").value;
    const filtered = mine.filter(ticket =>
      (!search || `${ticket.id} ${ticket.title}`.toLowerCase().includes(search))
      && (!status || ticket.status === status)
    );
    document.getElementById("myTicketsTable").innerHTML = ticketTableHtml(filtered);
    bindTicketRows();
  };

  document.getElementById("mySearch").addEventListener("input", filter);
  document.getElementById("myStatus").addEventListener("change", filter);
  bindTicketRows();
}

function renderAllTickets() {
  const list = [...state.tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  app.innerHTML = `
    ${pageHeading(
      "SOPORTE → BANDEJA",
      "Bandeja de solicitudes",
      "Vista general para el personal de soporte y administración."
    )}

    <div class="filter-panel">
      <div class="field grow">
        <label>Buscar</label>
        <input id="allSearch" placeholder="ID, asunto, usuario o categoría" />
      </div>
      <div class="field">
        <label>Estado</label>
        <select id="allStatus">
          <option value="">Todos</option>
          ${statusOptions.map(status => `<option value="${status}">${status}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Prioridad</label>
        <select id="allUrgency">
          <option value="">Todas</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>
    </div>

    <div id="allTicketsTable">${ticketTableHtml(list)}</div>
  `;

  const filter = () => {
    const search = document.getElementById("allSearch").value.toLowerCase();
    const status = document.getElementById("allStatus").value;
    const urgency = document.getElementById("allUrgency").value;
    const filtered = list.filter(ticket => {
      const text = `${ticket.id} ${ticket.title} ${ticket.createdBy} ${ticket.category}`.toLowerCase();
      return (!search || text.includes(search))
        && (!status || ticket.status === status)
        && (!urgency || ticket.urgency === urgency);
    });
    document.getElementById("allTicketsTable").innerHTML = ticketTableHtml(filtered);
    bindTicketRows();
  };

  document.getElementById("allSearch").addEventListener("input", filter);
  document.getElementById("allStatus").addEventListener("change", filter);
  document.getElementById("allUrgency").addEventListener("change", filter);
  bindTicketRows();
}

function renderTicketDetail(id) {
  const ticket = state.tickets.find(item => Number(item.id) === Number(id));
  if (!ticket) {
    goTo("dashboard");
    return;
  }

  selectedTicketId = id;

  app.innerHTML = `
    ${pageHeading(
      "SOPORTE → DETALLE",
      `Solicitud #${ticket.id}`,
      "Información completa, seguimiento y gestión de la solicitud.",
      '<button id="backFromDetail" class="btn btn-secondary" type="button">Volver</button>'
    )}

    <div class="two-column">
      <section class="detail-card">
        <div class="page-heading-top" style="margin-bottom:10px">
          <div>
            <div class="ticket-subject" style="font-size:.86rem">${escapeHtml(ticket.title)}</div>
            <div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap">
              <span class="badge ${urgencyClass(ticket.urgency)}">${urgencyLabels[ticket.urgency]}</span>
              <span class="badge badge-status">${escapeHtml(ticket.status)}</span>
              ${ticket.confidential ? '<span class="badge badge-private">Confidencial</span>' : ""}
            </div>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-box"><span>Categoría</span><strong>${escapeHtml(ticket.category)}</strong></div>
          <div class="detail-box"><span>Creado por</span><strong>${escapeHtml(ticket.createdBy)}</strong></div>
          <div class="detail-box"><span>Asignado a</span><strong>${escapeHtml(ticket.assignedTo)}</strong></div>
          <div class="detail-box"><span>Fecha</span><strong>${formatDateTime(ticket.createdAt)}</strong></div>
        </div>

        <div class="detail-description">
          <h3>Descripción</h3>
          <p>${escapeHtml(ticket.description)}</p>
        </div>

        ${ticket.additionalInfo ? `
          <div class="detail-description">
            <h3>Información adicional</h3>
            <p>${escapeHtml(ticket.additionalInfo)}</p>
          </div>
        ` : ""}

        <div class="detail-description">
          <h3>Archivos adjuntos</h3>
          ${ticket.attachments.length
            ? `<p>${ticket.attachments.map(file => escapeHtml(file)).join(" · ")}</p>`
            : '<p>No hay archivos adjuntos.</p>'
          }
        </div>

        <div class="detail-actions">
          <div class="field">
            <label>Estado</label>
            <select id="detailStatus">
              ${statusOptions.map(status => `<option value="${status}" ${status === ticket.status ? "selected" : ""}>${status}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Prioridad</label>
            <select id="detailUrgency">
              ${Object.entries(urgencyLabels).map(([key, label]) => `<option value="${key}" ${key === ticket.urgency ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </div>
          <div class="field grow">
            <label>Responsable</label>
            <input id="detailAssignee" value="${escapeHtml(ticket.assignedTo)}" />
          </div>
          <button id="saveTicketChanges" class="btn btn-primary" type="button">Guardar cambios</button>
        </div>

        <h3 class="section-title">Comentarios</h3>
        <div class="field">
          <label>Agregar comentario</label>
          <textarea id="newComment" placeholder="Escriba una actualización o respuesta para el seguimiento."></textarea>
        </div>
        <button id="addComment" class="btn btn-primary" type="button">Agregar comentario</button>

        <div class="comments-list">
          ${ticket.comments.length
            ? ticket.comments.slice().reverse().map(comment => `
                <article class="comment">
                  <div class="comment-header">
                    <strong>${escapeHtml(comment.user)}</strong>
                    <span>${formatDateTime(comment.date)}</span>
                  </div>
                  <p>${escapeHtml(comment.text)}</p>
                </article>
              `).join("")
            : '<div class="empty-state">Esta solicitud todavía no tiene comentarios.</div>'
          }
        </div>
      </section>

      <aside class="timeline-card">
        <h3 class="section-title" style="margin-top:0">Historial</h3>
        <ul class="timeline">
          ${ticket.history.slice().reverse().map(item => `
            <li>
              ${escapeHtml(item.text)}
              <small>${formatDateTime(item.date)}</small>
            </li>
          `).join("")}
        </ul>
      </aside>
    </div>
  `;

  document.getElementById("backFromDetail").addEventListener("click", () => goTo("dashboard"));

  document.getElementById("saveTicketChanges").addEventListener("click", () => {
    const status = document.getElementById("detailStatus").value;
    const urgency = document.getElementById("detailUrgency").value;
    const assignedTo = document.getElementById("detailAssignee").value.trim() || "Sin asignar";
    const changes = [];

    if (status !== ticket.status) {
      changes.push(`Estado cambiado de ${ticket.status} a ${status}`);
      ticket.status = status;
    }

    if (urgency !== ticket.urgency) {
      changes.push(`Prioridad cambiada a ${urgencyLabels[urgency]}`);
      ticket.urgency = urgency;
    }

    if (assignedTo !== ticket.assignedTo) {
      changes.push(`Responsable asignado: ${assignedTo}`);
      ticket.assignedTo = assignedTo;
    }

    const now = new Date().toISOString();
    changes.forEach(text => ticket.history.push({ text, date: now }));
    saveState();
    renderTicketDetail(ticket.id);
  });

  document.getElementById("addComment").addEventListener("click", () => {
    const input = document.getElementById("newComment");
    const text = input.value.trim();
    if (!text) return;

    const now = new Date().toISOString();
    ticket.comments.push({
      user: CURRENT_USER.name,
      text,
      date: now
    });
    ticket.history.push({
      text: `Comentario agregado por ${CURRENT_USER.name}`,
      date: now
    });

    saveState();
    renderTicketDetail(ticket.id);
  });
}

function renderActivity() {
  const items = state.tickets
    .flatMap(ticket => ticket.history.map(item => ({
      ...item,
      ticketId: ticket.id,
      title: ticket.title
    })))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  app.innerHTML = `
    ${pageHeading(
      "SOPORTE → SEGUIMIENTO",
      "Actividad reciente",
      "Historial consolidado de cambios y acciones registradas en las solicitudes."
    )}

    <div class="timeline-card">
      <ul class="timeline">
        ${items.map(item => `
          <li>
            <strong>#${item.ticketId}</strong> · ${escapeHtml(item.text)}
            <small>${escapeHtml(item.title)} · ${formatDateTime(item.date)}</small>
          </li>
        `).join("")}
      </ul>
    </div>
  `;
}

function renderSettings() {
  app.innerHTML = `
    ${pageHeading(
      "ADMINISTRACIÓN → CONFIGURACIÓN",
      "Configuración del módulo",
      "Información de la versión actual y herramientas de prueba."
    )}

    <div class="config-card">
      <div class="config-grid">
        <div class="config-item">
          <strong>Tecnología</strong>
          <span>HTML5 + CSS3 + JavaScript puro</span>
        </div>
        <div class="config-item">
          <strong>Persistencia actual</strong>
          <span>localStorage del navegador</span>
        </div>
        <div class="config-item">
          <strong>Usuario demo</strong>
          <span>${CURRENT_USER.name} · ${CURRENT_USER.role}</span>
        </div>
        <div class="config-item">
          <strong>Sede</strong>
          <span>${CURRENT_USER.site}</span>
        </div>
      </div>

      <h3 class="section-title">Datos de prueba</h3>
      <p class="muted" style="font-size:.62rem">Restablece las solicitudes de ejemplo y elimina los cambios guardados localmente.</p>
      <div style="margin-top:9px">
        <button id="resetDemoData" class="btn btn-danger" type="button">Restablecer datos</button>
      </div>
    </div>
  `;

  document.getElementById("resetDemoData").addEventListener("click", () => {
    state = { tickets: clone(demoTickets) };
    saveState();
    renderSettings();
  });
}

function render() {
  syncNavigation();

  if (currentView === "dashboard") return renderDashboard();
  if (currentView === "new-ticket") return renderNewTicket();
  if (currentView === "my-tickets") return renderMyTickets();
  if (currentView === "all-tickets") return renderAllTickets();
  if (currentView === "activity") return renderActivity();
  if (currentView === "settings") return renderSettings();

  renderDashboard();
}

render();
