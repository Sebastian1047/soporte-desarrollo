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
      "Crear nuevas solicitudes.",
      "Consultar únicamente sus propias solicitudes.",
      "Ver el detalle y estado de sus solicitudes.",
      "Agregar comentarios o información adicional a sus solicitudes."
    ]
  },
  ti: {
    id: 2,
    name: "Carlos Gómez",
    role: "Área TI",
    menu: [
      { id: "home", label: "Inicio" },
      { id: "inbox", label: "Bandeja de solicitudes" },
      { id: "tracking", label: "Seguimiento" }
    ],
    permissions: [
      "Consultar todas las solicitudes del sistema.",
      "Cambiar estado y prioridad.",
      "Asignar o cambiar responsable.",
      "Agregar comentarios de atención y seguimiento."
    ]
  }
};

const STORAGE_KEY = "soporteSolicitudes";

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

function dynamicFieldByCategory(category) {
  if (category === "hardware") {
    return `
      <div class="form-group full">
        <label for="additionalInfo">Tipo de equipo requerido</label>
        <input id="additionalInfo" name="additionalInfo" type="text"
          placeholder="Ej: portátil, monitor, teclado, impresora..." />
      </div>
    `;
  }

  if (category === "software") {
    return `
      <div class="form-group full">
        <label for="additionalInfo">Sistema, aplicación o base de datos</label>
        <input id="additionalInfo" name="additionalInfo" type="text"
          placeholder="Ej: ERP, SQL Server, portal corporativo..." />
      </div>
    `;
  }

  if (category === "redes") {
    return `
      <div class="form-group full">
        <label for="additionalInfo">Ubicación o recurso afectado</label>
        <input id="additionalInfo" name="additionalInfo" type="text"
          placeholder="Ej: Sede JL, WiFi oficina, VPN..." />
      </div>
    `;
  }

  return `
    <div class="form-group full">
      <label for="additionalInfo">Equipo o servicio afectado</label>
      <input id="additionalInfo" name="additionalInfo" type="text"
        placeholder="Ej: equipo portátil, correo, impresora..." />
    </div>
  `;
}

function renderNewRequestForm() {
  app.innerHTML = `
    <div class="page-kicker">SOPORTE → SOLICITANTE</div>
    <h2 class="page-title">Nueva solicitud</h2>
    <p class="page-description">
      Registre el requerimiento o incidente que necesita reportar al Área TI.
    </p>

    <div id="formMessage"></div>

    <form id="newRequestForm" class="request-form">
      <div class="form-grid">
        <div class="form-group full">
          <label for="requestTitle">Asunto / título *</label>
          <input
            id="requestTitle"
            name="title"
            type="text"
            required
            maxlength="120"
            placeholder="Ej: No puedo ingresar al sistema de inventarios"
          />
        </div>

        <div class="form-group">
          <label for="requestCategory">Categoría *</label>
          <select id="requestCategory" name="category" required>
            <option value="soporte">Soporte Técnico / TI</option>
            <option value="hardware">Hardware / Equipo</option>
            <option value="software">Acceso a Software / Permisos</option>
            <option value="redes">Redes e Infraestructura</option>
          </select>
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

        <div id="dynamicFields" class="full">
          ${dynamicFieldByCategory("soporte")}
        </div>

        <div class="form-group full">
          <label for="requestDescription">Descripción detallada *</label>
          <textarea
            id="requestDescription"
            name="description"
            rows="6"
            required
            maxlength="1500"
            placeholder="Explique qué sucede, desde cuándo ocurre y cómo afecta su trabajo."
          ></textarea>
        </div>

        <div class="form-group full">
          <label for="requestFiles">Archivos adjuntos</label>
          <input
            id="requestFiles"
            name="attachments"
            type="file"
            multiple
          />
          <small>Puede seleccionar capturas, documentos u otras evidencias.</small>
        </div>

        <label class="checkbox-row full">
          <input id="requestConfidential" name="confidential" type="checkbox" />
          <span>Marcar la solicitud como confidencial</span>
        </label>
      </div>

      <div class="form-actions">
        <button id="clearRequestForm" class="btn-secondary" type="reset">Limpiar</button>
        <button class="btn-primary" type="submit">Crear solicitud</button>
      </div>
    </form>
  `;

  const form = document.getElementById("newRequestForm");
  const category = document.getElementById("requestCategory");
  const dynamicFields = document.getElementById("dynamicFields");

  category.addEventListener("change", () => {
    dynamicFields.innerHTML = dynamicFieldByCategory(category.value);
  });

  form.addEventListener("submit", event => {
    event.preventDefault();

    const formData = new FormData(form);
    const attachments = [...document.getElementById("requestFiles").files].map(file => file.name);
    const user = users[currentUserKey];

    const categoryLabels = {
      soporte: "Soporte Técnico / TI",
      hardware: "Hardware / Equipo",
      software: "Acceso a Software / Permisos",
      redes: "Redes e Infraestructura"
    };

    const request = {
      id: nextRequestId(),
      title: formData.get("title").trim(),
      category: categoryLabels[formData.get("category")],
      categoryKey: formData.get("category"),
      priority: formData.get("priority"),
      additionalInfo: (formData.get("additionalInfo") || "").trim(),
      description: formData.get("description").trim(),
      confidential: formData.get("confidential") === "on",
      attachments,
      status: "Pendiente",
      createdAt: new Date().toISOString(),
      createdById: user.id,
      createdBy: user.name
    };

    saveRequest(request);

    document.getElementById("formMessage").innerHTML = `
      <div class="success-message">
        Solicitud <strong>#${request.id}</strong> creada correctamente.
        Estado inicial: <strong>Pendiente</strong>.
      </div>
    `;

    form.reset();
    dynamicFields.innerHTML = dynamicFieldByCategory("soporte");
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
    description = "Aquí construiremos la bandeja de trabajo del Área TI.";
  } else if (currentView === "tracking") {
    title = "Seguimiento";
    description = "Aquí construiremos el seguimiento y gestión de tickets.";
  }

  app.innerHTML = `
    <div class="page-kicker">SOPORTE → ${user.role.toUpperCase()}</div>
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