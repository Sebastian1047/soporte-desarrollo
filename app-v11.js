const users = {
  solicitante: {
    id: 1,
    name: "María López",
    role: "Solicitante",
    canAccessDevelopment: false,
    menu: [
      { id: "new", label: "Nueva solicitud" },
      { id: "mine", label: "Mis solicitudes" }
    ],
    permissions: [
      "Crear solicitudes de nuevos desarrollos o mejoras de aplicaciones.",
      "Consultar únicamente sus propias solicitudes.",
      "Ver el detalle y estado de sus solicitudes.",
      "Agregar comentarios o información adicional a sus solicitudes."
    ]
  },
  desarrollo: {
    id: 2,
    name: "Carlos Gómez",
    role: "Área de Desarrollo",
    canAccessDevelopment: true,
    menu: [
      { id: "inbox", label: "Bandeja de solicitudes" }
    ],
    permissions: [
      "Consultar todas las solicitudes de desarrollo y mejora.",
      "Cambiar estado y prioridad.",
      "Asignar o cambiar desarrollador responsable.",
      "Agregar comentarios de atención y seguimiento."
    ]
  }
};

const STORAGE_KEY = "solicitudesNuevosDesarrollos";

const requestTypes = {
  reportar_problema: "Reportar daño o problema",
  nueva_aplicacion: "Nueva aplicación",
  mejora_aplicacion: "Mejora de aplicación existente",
  nueva_funcionalidad: "Nueva funcionalidad en aplicación existente"
};

let currentUserKey = "solicitante";
let activeModule = "solicitante";
let modulesExpanded = false;
let currentView = "new";
let selectedRequestId = null;

function canAccessDevelopment() {
  return users[currentUserKey]?.canAccessDevelopment === true;
}

function switchModule(moduleName) {
  if (moduleName !== "solicitante" && moduleName !== "desarrollo") return;
  if (moduleName === "desarrollo" && !canAccessDevelopment()) return;

  activeModule = moduleName;
  selectedRequestId = null;
  currentView = moduleName === "desarrollo" ? "inbox" : "new";
  modulesExpanded = false;
  render();
}
let developmentFilters = {
  area: "",
  priority: "",
  status: "",
  requester: ""
};

const sidebarMenu = document.getElementById("sidebarMenu");
const userSelector = document.getElementById("userSelector");
const userName = document.getElementById("userName");
const userRole = document.getElementById("userRole");
const notificationButton = document.getElementById("notificationButton");
const app = document.getElementById("app");

function getRequests() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRequest(request) {
  const requests = getRequests();
  requests.unshift(request);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function updateRequest(updatedRequest) {
  const requests = getRequests().map(request =>
    Number(request.id) === Number(updatedRequest.id) ? updatedRequest : request
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function getRequestById(id) {
  return getRequests().find(request => Number(request.id) === Number(id));
}

function currentReaderToken() {
  const user = users[currentUserKey];
  return `${activeModule}:${user.id}`;
}

function notificationTargetsCurrentUser(notification) {
  const user = users[currentUserKey];

  if (activeModule === "desarrollo") {
    return canAccessDevelopment() && notification.targetRole === "desarrollo";
  }

  return notification.targetUserId !== undefined &&
    notification.targetUserId !== null &&
    Number(notification.targetUserId) === Number(user.id);
}

function getUnreadNotificationsForRequest(request) {
  const token = currentReaderToken();

  return (request.notifications || []).filter(notification =>
    notificationTargetsCurrentUser(notification) &&
    !(notification.readBy || []).includes(token)
  );
}

function getUnreadNotificationCount() {
  return getRequests().reduce(
    (total, request) => total + getUnreadNotificationsForRequest(request).length,
    0
  );
}

function addNotification(request, notification) {
  request.notifications = request.notifications || [];
  request.notifications.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    createdAt: new Date().toISOString(),
    readBy: [],
    ...notification
  });
}

function markRequestNotificationsRead(requestId) {
  const request = getRequestById(requestId);
  if (!request) return;

  const token = currentReaderToken();
  let changed = false;

  request.notifications = (request.notifications || []).map(notification => {
    if (!notificationTargetsCurrentUser(notification)) return notification;

    const readBy = notification.readBy || [];
    if (readBy.includes(token)) return notification;

    changed = true;
    return {
      ...notification,
      readBy: [...readBy, token]
    };
  });

  if (changed) updateRequest(request);
}

function notificationIcon(type) {
  const icons = {
    new_request: "🆕",
    status: "🔄",
    message: "💬",
    document: "📎"
  };
  return icons[type] || "🔔";
}

function nextRequestId() {
  const requests = getRequests();
  if (!requests.length) return 1001;
  return Math.max(...requests.map(item => Number(item.id) || 0)) + 1;
}


function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(date));
}

function priorityLabel(priority) {
  const labels = {
    baja: "Baja",
    media: "Media",
    alta: "Alta",
    critica: "Crítica"
  };
  return labels[priority] || priority;
}

function attachRequestRowEvents() {
  document.querySelectorAll("[data-request-id]").forEach(row => {
    row.addEventListener("click", event => {
      if (event.target.closest("button, input, select, textarea, label, a")) return;
      selectedRequestId = Number(row.dataset.requestId);
      markRequestNotificationsRead(selectedRequestId);
      currentView = "detail";
      render();
    });

    row.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectedRequestId = Number(row.dataset.requestId);
        markRequestNotificationsRead(selectedRequestId);
        currentView = "detail";
        render();
      }
    });
  });
}

function renderMyRequests() {
  const user = users[currentUserKey];
  const requests = getRequests().filter(request => request.createdById === user.id);

  app.innerHTML = `
    <div class="page-kicker">DESARROLLO DE APLICACIONES → SOLICITANTE</div>
    <h2 class="page-title">Mis solicitudes</h2>
    <p class="page-description">
      Seleccione una solicitud para ver su detalle, respuestas y documentos.
    </p>

    <div class="requests-summary">
      <span>Total de solicitudes</span>
      <strong>${requests.length}</strong>
    </div>

    ${requests.length === 0 ? `
      <div class="empty-state">
        Aún no ha creado ninguna solicitud.
      </div>
    ` : `
      <div class="table-wrap">
        <table class="requests-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tipo de solicitud</th>
              <th>Área</th>
              <th>Asunto / título</th>
              <th>Objetivo</th>
              <th>Prioridad</th>
              <th>Descripción</th>
              <th>Archivos</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            ${requests.map(request => {
              const unread = getUnreadNotificationsForRequest(request).length;
              return `
              <tr class="clickable-row ${unread ? "unread-row" : ""}" data-request-id="${request.id}" tabindex="0" title="Abrir solicitud #${request.id}">
                <td>
                  <strong>#${escapeHtml(request.id)}</strong>
                  ${unread ? `<span class="unread-request-badge">${unread} nuevo${unread > 1 ? "s" : ""}</span>` : ""}
                </td>
                <td>${escapeHtml(request.requestTypeLabel)}</td>
                <td>${escapeHtml(request.area || "-")}</td>
                <td>${escapeHtml(request.title)}</td>
                <td class="long-text">${escapeHtml(request.objective)}</td>
                <td><span class="table-badge">${escapeHtml(priorityLabel(request.priority))}</span></td>
                <td class="long-text">${escapeHtml(request.description)}</td>
                <td>
                  ${request.attachments?.length
                    ? request.attachments.map(file => `<div class="file-name">${escapeHtml(file)}</div>`).join("")
                    : '<span class="muted-cell">Sin archivos</span>'}
                </td>
                <td><span class="status-badge">${escapeHtml(request.status)}</span></td>
                <td>${escapeHtml(formatDate(request.createdAt))}</td>
              </tr>
            `;
            }).join("")}
          </tbody>
        </table>
      </div>
      <p class="table-help">Haga clic sobre una solicitud para abrir su detalle.</p>
    `}
  `;

  attachRequestRowEvents();
}

function renderDevelopmentInbox() {
  if (!canAccessDevelopment() || activeModule !== "desarrollo") {
    app.innerHTML = '<div class="empty-state">Acceso restringido al Área de Desarrollo.</div>';
    return;
  }

  const requests = getRequests();

  const areas = [...new Set(
    requests.map(request => request.area).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "es"));

  const requesters = [...new Set(
    requests.map(request => request.createdBy).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "es"));

  const statuses = [...new Set(
    requests.map(request => request.status).filter(Boolean)
  )];

  const filteredRequests = requests.filter(request => {
    const matchesArea =
      !developmentFilters.area ||
      request.area === developmentFilters.area;

    const matchesPriority =
      !developmentFilters.priority ||
      request.priority === developmentFilters.priority;

    const matchesStatus =
      !developmentFilters.status ||
      request.status === developmentFilters.status;

    const matchesRequester =
      !developmentFilters.requester ||
      request.createdBy === developmentFilters.requester;

    return matchesArea && matchesPriority && matchesStatus && matchesRequester;
  });

  app.innerHTML = `
    <div class="page-kicker">DESARROLLO DE APLICACIONES → ÁREA DE DESARROLLO</div>
    <h2 class="page-title">Bandeja de solicitudes</h2>
    <p class="page-description">
      Consulte y filtre las solicitudes recibidas por área, prioridad, estado o solicitante.
    </p>

    <div class="development-filter-bar">
      <div class="development-filter-title">Filtrar solicitudes</div>

      <label class="development-filter-control">
        <span>Área</span>
        <select id="filterArea">
          <option value="">Todas las áreas</option>
          ${areas.map(area => `
            <option value="${escapeHtml(area)}" ${developmentFilters.area === area ? "selected" : ""}>
              ${escapeHtml(area)}
            </option>
          `).join("")}
        </select>
      </label>

      <label class="development-filter-control">
        <span>Prioridad</span>
        <select id="filterPriority">
          <option value="">Todas las prioridades</option>
          ${["baja","media","alta","critica"].map(priority => `
            <option value="${priority}" ${developmentFilters.priority === priority ? "selected" : ""}>
              ${priorityLabel(priority)}
            </option>
          `).join("")}
        </select>
      </label>

      <label class="development-filter-control">
        <span>Estado</span>
        <select id="filterStatus">
          <option value="">Todos los estados</option>
          ${statuses.map(status => `
            <option value="${escapeHtml(status)}" ${developmentFilters.status === status ? "selected" : ""}>
              ${escapeHtml(status)}
            </option>
          `).join("")}
        </select>
      </label>

      <label class="development-filter-control">
        <span>Solicitante</span>
        <select id="filterRequester">
          <option value="">Todos los solicitantes</option>
          ${requesters.map(requester => `
            <option value="${escapeHtml(requester)}" ${developmentFilters.requester === requester ? "selected" : ""}>
              ${escapeHtml(requester)}
            </option>
          `).join("")}
        </select>
      </label>

      <button type="button" id="clearDevelopmentFilters" class="filter-clear-button">
        Limpiar filtros
      </button>
    </div>

    <div class="requests-summary development-summary">
      <span>Mostrando</span>
      <strong>${filteredRequests.length}</strong>
      <span>de ${requests.length} solicitudes</span>
    </div>

    ${requests.length === 0 ? `
      <div class="empty-state">No hay solicitudes registradas.</div>
    ` : filteredRequests.length === 0 ? `
      <div class="empty-state">
        No hay solicitudes que coincidan con los filtros seleccionados.
      </div>
    ` : `
      <div class="table-wrap">
        <table class="requests-table development-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Solicitante</th>
              <th>Área</th>
              <th>Tipo</th>
              <th>Asunto</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Respuestas</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRequests.map(request => {
              const unread = getUnreadNotificationsForRequest(request).length;
              return `
              <tr class="clickable-row ${unread ? "unread-row" : ""}" data-request-id="${request.id}" tabindex="0" title="Abrir solicitud #${request.id}">
                <td>
                  <strong>#${escapeHtml(request.id)}</strong>
                  ${unread ? `<span class="unread-request-badge">${unread} nuevo${unread > 1 ? "s" : ""}</span>` : ""}
                </td>
                <td>${escapeHtml(request.createdBy)}</td>
                <td>${escapeHtml(request.area || "-")}</td>
                <td>${escapeHtml(request.requestTypeLabel)}</td>
                <td class="long-text">${escapeHtml(request.title)}</td>
                <td><span class="table-badge">${escapeHtml(priorityLabel(request.priority))}</span></td>
                <td><span class="status-badge">${escapeHtml(request.status)}</span></td>
                <td>${(request.messages || []).length}</td>
                <td>${escapeHtml(formatDate(request.createdAt))}</td>
              </tr>
            `;
            }).join("")}
          </tbody>
        </table>
      </div>
      <p class="table-help">Haga clic sobre una solicitud para atenderla.</p>
    `}
  `;

  const applyFilters = () => {
    developmentFilters = {
      area: document.getElementById("filterArea").value,
      priority: document.getElementById("filterPriority").value,
      status: document.getElementById("filterStatus").value,
      requester: document.getElementById("filterRequester").value
    };
    renderDevelopmentInbox();
  };

  ["filterArea","filterPriority","filterStatus","filterRequester"].forEach(id => {
    document.getElementById(id).addEventListener("change", applyFilters);
  });

  document.getElementById("clearDevelopmentFilters").addEventListener("click", () => {
    developmentFilters = {
      area: "",
      priority: "",
      status: "",
      requester: ""
    };
    renderDevelopmentInbox();
  });

  attachRequestRowEvents();
}

function renderAttachments(files) {
  if (!files?.length) {
    return '<span class="muted-cell">Sin archivos</span>';
  }

  return `
    <div class="attachment-list">
      ${files.map(file => `
        <span class="attachment-chip">📎 ${escapeHtml(file)}</span>
      `).join("")}
    </div>
  `;
}

function renderRequestDetail() {
  const request = getRequestById(selectedRequestId);
  const user = users[currentUserKey];

  if (!request) {
    app.innerHTML = '<div class="empty-state">La solicitud no existe.</div>';
    return;
  }

  if (activeModule === "desarrollo" && !canAccessDevelopment()) {
    app.innerHTML = '<div class="empty-state">Acceso restringido al Área de Desarrollo.</div>';
    return;
  }

  if (activeModule === "solicitante" && Number(request.createdById) !== Number(user.id)) {
    app.innerHTML = '<div class="empty-state">No tiene permiso para consultar esta solicitud.</div>';
    return;
  }

  const messages = request.messages || [];
  const isDevelopment = activeModule === "desarrollo";
  const backView = isDevelopment ? "inbox" : "mine";

  app.innerHTML = `
    <div class="detail-header">
      <div>
        <div class="page-kicker">SOLICITUD #${escapeHtml(request.id)}</div>
        <h2 class="page-title">${escapeHtml(request.title)}</h2>
        <p class="page-description">
          Creada por ${escapeHtml(request.createdBy)} · ${escapeHtml(formatDate(request.createdAt))}
        </p>
      </div>
      <button type="button" id="backToRequests" class="btn-secondary">← Volver</button>
    </div>

    ${(request.notifications || []).length ? `
      <div class="activity-strip">
        <div class="activity-strip-title">Actividad reciente</div>
        <div class="activity-strip-list">
          ${(request.notifications || []).slice(-4).reverse().map(notification => `
            <div class="activity-item">
              <span class="activity-icon">${notificationIcon(notification.type)}</span>
              <div>
                <strong>${escapeHtml(notification.text)}</strong>
                <small>${escapeHtml(formatDate(notification.createdAt))}</small>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    ` : ""}

    <div class="detail-layout">
      <section class="detail-card">
        <div class="detail-card-title">Información de la solicitud</div>

        <div class="detail-grid">
          <div class="detail-field">
            <span>Tipo de solicitud</span>
            <strong>${escapeHtml(request.requestTypeLabel)}</strong>
          </div>
          <div class="detail-field">
            <span>Área solicitante</span>
            <strong>${escapeHtml(request.area || "-")}</strong>
          </div>
          <div class="detail-field">
            <span>Prioridad</span>
            <strong>${escapeHtml(priorityLabel(request.priority))}</strong>
          </div>
          <div class="detail-field">
            <span>Estado</span>
            <strong>${escapeHtml(request.status)}</strong>
          </div>
          <div class="detail-field full-detail">
            <span>Objetivo</span>
            <p>${escapeHtml(request.objective)}</p>
          </div>
          <div class="detail-field full-detail">
            <span>Descripción</span>
            <p>${escapeHtml(request.description)}</p>
          </div>
          <div class="detail-field full-detail">
            <span>Archivos de la solicitud</span>
            ${renderAttachments(request.attachments)}
          </div>
        </div>

        ${isDevelopment ? `
          <div class="status-editor">
            <label for="requestStatus">Actualizar estado</label>
            <div class="status-editor-row">
              <select id="requestStatus">
                ${["Pendiente","En análisis","En desarrollo","Pendiente de información","Finalizado"].map(status =>
                  `<option value="${status}" ${request.status === status ? "selected" : ""}>${status}</option>`
                ).join("")}
              </select>
              <button type="button" id="saveStatus" class="btn-primary">Guardar estado</button>
            </div>
          </div>
        ` : ""}
      </section>

      <section class="conversation-card">
        <div class="detail-card-title">Respuestas y documentos</div>

        <div class="conversation-list">
          ${messages.length === 0 ? `
            <div class="empty-conversation">Todavía no hay respuestas en esta solicitud.</div>
          ` : messages.map(message => `
            <article class="message-item ${message.authorRole === "Área de Desarrollo" ? "development-message" : "requester-message"}">
              <div class="message-head">
                <div>
                  <strong>${escapeHtml(message.authorName)}</strong>
                  <span>${escapeHtml(message.authorRole)}</span>
                </div>
                <time>${escapeHtml(formatDate(message.createdAt))}</time>
              </div>
              ${message.text ? `<p>${escapeHtml(message.text)}</p>` : ""}
              ${renderAttachments(message.attachments)}
            </article>
          `).join("")}
        </div>

        <form id="replyForm" class="reply-form">
          <div class="form-group full">
            <label for="replyText">Respuesta</label>
            <textarea
              id="replyText"
              name="replyText"
              rows="4"
              maxlength="2000"
              placeholder="Escriba una respuesta o información adicional..."
            ></textarea>
          </div>

          <div class="form-group full">
            <label for="replyFiles">Adjuntar documentos</label>
            <input
              id="replyFiles"
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.xlsx,.txt"
            />
            <small>Puede responder con texto, archivos o ambos.</small>
          </div>

          <div id="replyError"></div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">Enviar respuesta</button>
          </div>
        </form>
      </section>
    </div>
  `;

  document.getElementById("backToRequests").addEventListener("click", () => {
    selectedRequestId = null;
    currentView = backView;
    render();
  });

  if (isDevelopment) {
    document.getElementById("saveStatus").addEventListener("click", () => {
      const updated = getRequestById(request.id);
      const previousStatus = updated.status;
      const newStatus = document.getElementById("requestStatus").value;

      if (previousStatus !== newStatus) {
        updated.status = newStatus;
        addNotification(updated, {
          type: "status",
          targetUserId: updated.createdById,
          text: `El Área de Desarrollo cambió el estado de "${previousStatus}" a "${newStatus}".`
        });
        updateRequest(updated);
      }

      renderRequestDetail();
    });
  }

  document.getElementById("replyForm").addEventListener("submit", event => {
    event.preventDefault();

    const text = document.getElementById("replyText").value.trim();
    const attachments = [...document.getElementById("replyFiles").files].map(file => file.name);

    if (!text && attachments.length === 0) {
      document.getElementById("replyError").innerHTML =
        '<div class="form-error">Escriba una respuesta o seleccione al menos un archivo.</div>';
      return;
    }

    const updated = getRequestById(request.id);
    updated.messages = updated.messages || [];
    updated.messages.push({
      id: Date.now(),
      authorId: user.id,
      authorName: user.name,
      authorRole: isDevelopment ? "Área de Desarrollo" : "Solicitante",
      text,
      attachments,
      createdAt: new Date().toISOString()
    });

    const target = isDevelopment
      ? { targetUserId: updated.createdById }
      : { targetRole: "desarrollo" };

    if (text) {
      addNotification(updated, {
        type: "message",
        ...target,
        text: isDevelopment
          ? "El Área de Desarrollo envió una nueva respuesta."
          : `${user.name} envió una nueva respuesta.`
      });
    }

    if (attachments.length) {
      addNotification(updated, {
        type: "document",
        ...target,
        text: isDevelopment
          ? `El Área de Desarrollo adjuntó ${attachments.length} documento${attachments.length > 1 ? "s" : ""}.`
          : `${user.name} adjuntó ${attachments.length} documento${attachments.length > 1 ? "s" : ""}.`
      });
    }

    updateRequest(updated);
    renderRequestDetail();
  });
}

function renderMenu() {
  const unreadCount = getUnreadNotificationCount();
  const authorized = canAccessDevelopment();
  const submenus = activeModule === "desarrollo"
    ? [{ id: "inbox", label: "Bandeja de solicitudes" }]
    : [
        { id: "new", label: "Nueva solicitud" },
        { id: "mine", label: "Mis solicitudes" }
      ];

  sidebarMenu.innerHTML = `
    <button type="button" id="moduleToggle" class="module-toggle"
      aria-controls="moduleChoices" aria-expanded="${modulesExpanded}">
      <span>▦&nbsp; Módulos</span>
      <span class="module-chevron" aria-hidden="true">${modulesExpanded ? "▴" : "▾"}</span>
    </button>

    <div id="moduleChoices" class="module-choices" ${modulesExpanded ? "" : "hidden"}>
      <button type="button" class="module-choice ${activeModule === "solicitante" ? "selected" : ""}"
        data-module="solicitante">
        <span class="module-icon" aria-hidden="true">✎</span>
        <span>Solicitante</span>
      </button>
      <button type="button" class="module-choice ${activeModule === "desarrollo" ? "selected" : ""} ${authorized ? "" : "module-locked"}"
        data-module="desarrollo"
        ${authorized ? "" : 'disabled aria-disabled="true" title="Solo para usuarios autorizados del Área de Desarrollo"'}>
        <span class="module-icon" aria-hidden="true">${authorized ? "⚙" : "🔒"}</span>
        <span>Área de Desarrollo</span>
      </button>
      ${authorized ? "" : '<p class="module-help">Área de Desarrollo: acceso restringido.</p>'}
    </div>

    <div class="sidebar-current-label">
      ${activeModule === "desarrollo" ? "ÁREA DE DESARROLLO" : "SOLICITANTE"}
    </div>
    <div class="sidebar-subnav">
      ${submenus.map(item => `
        <button type="button" class="menu-btn ${item.id === currentView ? "active" : ""}"
          data-view="${item.id}">
          <span>${item.label}</span>
          ${(
            (activeModule === "solicitante" && item.id === "mine") ||
            (activeModule === "desarrollo" && item.id === "inbox")
          ) && unreadCount > 0 ? `<span class="menu-notification-badge">${unreadCount}</span>` : ""}
        </button>
      `).join("")}
    </div>
  `;

  document.getElementById("moduleToggle").addEventListener("click", () => {
    modulesExpanded = !modulesExpanded;
    renderMenu();
  });

  sidebarMenu.querySelectorAll("[data-module]").forEach(button => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      switchModule(button.dataset.module);
    });
  });

  sidebarMenu.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => {
      if (activeModule === "desarrollo" && !canAccessDevelopment()) return;
      selectedRequestId = null;
      currentView = button.dataset.view;
      render();
    });
  });
}

function renderNewRequestForm() {
  app.innerHTML = `
    <div class="page-kicker">DESARROLLO DE APLICACIONES → SOLICITANTE</div>
    <h2 class="page-title">Nueva solicitud</h2>
    <p class="page-description">
      Registre una solicitud para crear una aplicación, mejorar una existente o reportar un daño o problema.
    </p>

    <div id="formMessage"></div>

    <form id="newRequestForm" class="request-form">
      <div class="form-grid">
        <div class="form-section-title full">Clasificación de la solicitud</div>

        <div class="form-group full">
          <label for="requestType">Tipo de solicitud *</label>
          <select id="requestType" name="requestType" required>
            ${Object.entries(requestTypes).map(([value, label]) =>
              `<option value="${value}">${label}</option>`
            ).join("")}
          </select>
          <small>Seleccione la opción que mejor describa la necesidad.</small>
        </div>

        <div class="form-group full">
          <label for="requestArea">Área solicitante *</label>
          <select id="requestArea" name="area" required>
            <option value="" selected disabled>Seleccione un área</option>
            <option value="Producción">Producción</option>
            <option value="Comercial">Comercial</option>
            <option value="Compras">Compras</option>
            <option value="Logística">Logística</option>
            <option value="Calidad">Calidad</option>
            <option value="Gestión Humana">Gestión Humana</option>
            <option value="Finanzas">Finanzas</option>
            <option value="Administración">Administración</option>
            <option value="Tecnología">Tecnología</option>
            <option value="Otra">Otra</option>
          </select>
        </div>

        <div class="form-group full">
          <label for="requestTitle">Asunto / título *</label>
          <input
            id="requestTitle"
            name="title"
            type="text"
            required
            maxlength="120"
            placeholder="Ej: Nueva funcionalidad para aprobar solicitudes de compra"
          />
        </div>

        <div class="form-group full">
          <label for="requestObjective">Objetivo *</label>
          <textarea
            id="requestObjective"
            name="objective"
            rows="3"
            required
            maxlength="1000"
            placeholder="Explique cuál es el objetivo principal del desarrollo o mejora solicitada."
          ></textarea>
        </div>

        <div class="form-group">
          <label for="requestPriority">Prioridad *</label>
          <select id="requestPriority" name="priority" required>
            <option value="baja">Baja</option>
            <option value="media" selected>Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>

        <div class="form-section-title full">Detalle de la solicitud</div>

        <div class="form-group full">
          <label for="requestDescription">Descripción detallada *</label>
          <textarea
            id="requestDescription"
            name="description"
            rows="5"
            required
            maxlength="2000"
            placeholder="Explique qué desarrollo o mejora necesita, para qué se requiere y cuál sería el resultado esperado."
          ></textarea>
        </div>

        <div class="form-group full">
          <label for="requestFiles">Archivos de referencia</label>
          <input
            id="requestFiles"
            name="attachments"
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.xlsx,.txt"
          />
          <small>Puede adjuntar documentos, imágenes, ejemplos o archivos relacionados con la solicitud.</small>
        </div>

      </div>

      <div class="form-actions">
        <button class="btn-secondary" type="reset">Limpiar</button>
        <button class="btn-primary" type="submit">Crear solicitud</button>
      </div>
    </form>
  `;

  const form = document.getElementById("newRequestForm");

  form.addEventListener("submit", event => {
    event.preventDefault();

    const formData = new FormData(form);
    const files = [...document.getElementById("requestFiles").files].map(file => file.name);
    const user = users[currentUserKey];
    const type = formData.get("requestType");

    const request = {
      id: nextRequestId(),
      requestType: type,
      requestTypeLabel: requestTypes[type],
      area: formData.get("area"),
      title: formData.get("title").trim(),
      objective: formData.get("objective").trim(),
      priority: formData.get("priority"),
      description: formData.get("description").trim(),
      attachments: files,
      messages: [],
      notifications: [],
      status: "Pendiente",
      createdAt: new Date().toISOString(),
      createdById: user.id,
      createdBy: user.name
    };

    addNotification(request, {
      type: "new_request",
      targetRole: "desarrollo",
      text: `Nueva solicitud #${request.id} creada por ${user.name}.`
    });

    if (files.length) {
      addNotification(request, {
        type: "document",
        targetRole: "desarrollo",
        text: `La solicitud #${request.id} incluye ${files.length} archivo${files.length > 1 ? "s" : ""} de referencia.`
      });
    }

    saveRequest(request);

    document.getElementById("formMessage").innerHTML = `
      <div class="success-message">
        Solicitud <strong>#${request.id}</strong> creada correctamente como
        <strong>${request.requestTypeLabel}</strong>.
        Estado inicial: <strong>Pendiente</strong>.
      </div>
    `;

    form.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function renderContent() {
  if (activeModule === "desarrollo" && !canAccessDevelopment()) {
    switchModule("solicitante");
    return;
  }

  if (currentView === "new" && activeModule === "solicitante") {
    renderNewRequestForm();
    return;
  }

  if (currentView === "mine" && activeModule === "solicitante") {
    renderMyRequests();
    return;
  }

  if (currentView === "inbox" && activeModule === "desarrollo") {
    renderDevelopmentInbox();
    return;
  }

  if (currentView === "detail") {
    renderRequestDetail();
    return;
  }

  currentView = activeModule === "desarrollo" ? "inbox" : "new";
  renderContent();
}

function render() {
  if (activeModule === "desarrollo" && !canAccessDevelopment()) {
    activeModule = "solicitante";
    currentView = "new";
    selectedRequestId = null;
  }

  const user = users[currentUserKey];
  const unreadCount = getUnreadNotificationCount();

  userName.textContent = user.name;
  userRole.textContent = user.role;

  if (notificationButton) {
    notificationButton.innerHTML = unreadCount > 0
      ? `🔔 <strong>${unreadCount}</strong> novedad${unreadCount > 1 ? "es" : ""}`
      : "🔔 Sin novedades";
    notificationButton.classList.toggle("has-notifications", unreadCount > 0);
  }

  renderMenu();
  renderContent();
}

userSelector.addEventListener("change", () => {
  if (!users[userSelector.value]) return;
  currentUserKey = userSelector.value;
  activeModule = "solicitante";
  selectedRequestId = null;
  currentView = "new";
  modulesExpanded = true;
  render();
});

if (notificationButton) {
  notificationButton.addEventListener("click", () => {
    selectedRequestId = null;
    currentView = activeModule === "solicitante" ? "mine" : "inbox";
    render();
  });
}

window.addEventListener("storage", event => {
  if (event.key === STORAGE_KEY) render();
});

render();