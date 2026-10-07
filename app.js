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

let currentUserKey = "solicitante";
let currentView = "home";

const sidebarMenu = document.getElementById("sidebarMenu");
const userSelector = document.getElementById("userSelector");
const userName = document.getElementById("userName");
const userRole = document.getElementById("userRole");
const app = document.getElementById("app");

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

function renderContent() {
  const user = users[currentUserKey];

  let title = "Inicio";
  let description = "Resumen del acceso disponible para el usuario autenticado.";

  if (currentView === "new") {
    title = "Nueva solicitud";
    description = "Aquí construiremos en el siguiente paso el formulario de creación.";
  } else if (currentView === "mine") {
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