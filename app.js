const users = {
  solicitante: {
    id: 1,
    name: "María López",
    role: "Solicitante",
    menu: [
      { id: "home", label: "Inicio" },
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
    menu: [
      { id: "home", label: "Inicio" },
      { id: "inbox", label: "Bandeja de solicitudes" },
      { id: "tracking", label: "Seguimiento" }
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
  nuevo_desarrollo: "Nuevo desarrollo",
  nueva_aplicacion: "Nueva aplicación",
  mejora_aplicacion: "Mejora de aplicación existente",
  nueva_funcionalidad: "Nueva funcionalidad en aplicación existente"
};

let currentUserKey = "solicitante";
let currentView = "home";

const sidebarMenu = document.getElementById("sidebarMenu");
const userSelector = document.getElementById("userSelector");
const userName = document.getElementById("userName");
const userRole = document.getElementById("userRole");
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

function nextRequestId() {
  const requests = getRequests();
  if (!requests.length) return 1001;
  return Math.max(...requests.map(item => Number(item.id) || 0)) + 1;
}

function renderMenu() {
  const user = users[currentUserKey];

  sidebarMenu.innerHTML = user.menu.map(item => `
    <button
      type="button"
      class="menu-btn ${item.id === currentView ? "active" : ""}"
      data-view="${item.id}">
      ${item.label}
    </button>
  `).join("");

  sidebarMenu.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => {
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
      Registre una solicitud para un nuevo desarrollo o una mejora en una aplicación existente.
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
      title: formData.get("title").trim(),
      priority: formData.get("priority"),
      description: formData.get("description").trim(),
      attachments: files,
      status: "Pendiente",
      createdAt: new Date().toISOString(),
      createdById: user.id,
      createdBy: user.name
    };

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
  const user = users[currentUserKey];

  if (currentView === "new" && currentUserKey === "solicitante") {
    renderNewRequestForm();
    return;
  }

  let title = "Inicio";
  let description = "Resumen del acceso disponible para el usuario autenticado.";

  if (currentView === "mine") {
    title = "Mis solicitudes";
    description = "Aquí construiremos el listado de solicitudes del Solicitante.";
  } else if (currentView === "inbox") {
    title = "Bandeja de solicitudes";
    description = "Aquí construiremos la bandeja de trabajo del Área de Desarrollo.";
  } else if (currentView === "tracking") {
    title = "Seguimiento";
    description = "Aquí construiremos el seguimiento de nuevos desarrollos y mejoras.";
  }

  app.innerHTML = `
    <div class="page-kicker">DESARROLLO DE APLICACIONES → ${user.role.toUpperCase()}</div>
    <h2 class="page-title">${title}</h2>
    <p class="page-description">${description}</p>

    ${currentView === "home" ? `
      <div class="role-grid">
        <div class="info-card">
          <span>Usuario</span>
          <strong>${user.name}</strong>
        </div>
        <div class="info-card">
          <span>Tipo de usuario</span>
          <strong>${user.role}</strong>
        </div>
      </div>

      <ul class="permissions">
        ${user.permissions.map(permission => `<li>${permission}</li>`).join("")}
      </ul>
    ` : ""}
  `;
}

function render() {
  const user = users[currentUserKey];
  userName.textContent = user.name;
  userRole.textContent = user.role;
  renderMenu();
  renderContent();
}

userSelector.addEventListener("change", () => {
  currentUserKey = userSelector.value;
  currentView = "home";
  render();
});

render();