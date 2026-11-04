"use strict";

const STORAGE_KEY = "organizador-tarefas.v1";
const PRIORITIES = ["low", "medium", "high"];
const PRIORITY_LABELS = {
  low: "Prioridade baixa",
  medium: "Prioridade média",
  high: "Prioridade alta"
};

class Task {
  constructor({ id, title, description = "", dueDate = "", priority = "medium", completed = false, createdAt }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.priority = priority;
    this.completed = completed;
    this.createdAt = createdAt;
  }

  update({ title, description, dueDate, priority }) {
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.priority = priority;
  }
}

class TaskRepository {
  load() {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) return [];

    const data = JSON.parse(stored);
    if (!Array.isArray(data) || !data.every(TaskRepository.isValidTask)) {
      throw new Error("Os dados salvos não estão no formato esperado.");
    }

    return data.map((item) => new Task(item));
  }

  save(tasks) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  static isValidTask(item) {
    return item !== null
      && typeof item === "object"
      && typeof item.id === "string"
      && typeof item.title === "string"
      && typeof item.description === "string"
      && typeof item.dueDate === "string"
      && PRIORITIES.includes(item.priority)
      && typeof item.completed === "boolean"
      && typeof item.createdAt === "string";
  }
}

const repository = new TaskRepository();
const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#title");
const descriptionInput = document.querySelector("#description");
const dueDateInput = document.querySelector("#due-date");
const priorityInput = document.querySelector("#priority");
const taskIdInput = document.querySelector("#task-id");
const saveButton = document.querySelector("#save-task");
const cancelEditButton = document.querySelector("#cancel-edit");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const feedback = document.querySelector("#feedback");
const filterButtons = [...document.querySelectorAll("[data-filter]")];

let tasks = [];
let currentFilter = "all";
let storageReady = false;

function showFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.classList.toggle("is-error", isError);
}

function setFormEnabled(enabled) {
  form.querySelectorAll("input, textarea, select, button").forEach((control) => {
    control.disabled = !enabled;
  });
  filterButtons.forEach((button) => {
    button.disabled = !enabled;
  });
}

function loadTasks() {
  try {
    tasks = repository.load();
    storageReady = true;
  } catch (error) {
    storageReady = false;
    setFormEnabled(false);
    showFeedback(`Não foi possível ler as tarefas salvas: ${error.message} Os dados não foram alterados.`, true);
  }
}

function saveTasks(nextTasks) {
  try {
    repository.save(nextTasks);
    tasks = nextTasks;
    return true;
  } catch (error) {
    showFeedback(`Não foi possível salvar as alterações neste navegador: ${error.message}`, true);
    return false;
  }
}

function getLocalDateString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatDueDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(new Date(year, month - 1, day));
}

function createTag(text, className = "") {
  const tag = document.createElement("span");
  tag.className = `task-tag ${className}`.trim();
  tag.textContent = text;
  return tag;
}

function createActionButton(label, className, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `task-action ${className}`.trim();
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
}

function createTaskCard(task) {
  const item = document.createElement("li");
  item.className = `task-card${task.completed ? " is-completed" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", `${task.completed ? "Reabrir" : "Marcar como concluída"}: ${task.title}`);
  checkbox.addEventListener("change", () => toggleTask(task.id, checkbox.checked));

  const main = document.createElement("div");
  main.className = "task-main";

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;
  main.append(title);

  if (task.description) {
    const description = document.createElement("p");
    description.className = "task-description";
    description.textContent = task.description;
    main.append(description);
  }

  const meta = document.createElement("div");
  meta.className = "task-meta";
  meta.append(createTag(PRIORITY_LABELS[task.priority], `priority-${task.priority}`));

  if (task.dueDate) {
    const overdue = !task.completed && task.dueDate < getLocalDateString();
    meta.append(createTag(
      `${overdue ? "Prazo vencido" : "Prazo"}: ${formatDueDate(task.dueDate)}`,
      overdue ? "is-overdue" : ""
    ));
  }
  meta.append(createTag(task.completed ? "Concluída" : "Pendente"));
  main.append(meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.append(createActionButton("Editar", "", () => startEditing(task)));
  actions.append(createActionButton("Excluir", "delete", () => deleteTask(task.id)));

  item.append(checkbox, main, actions);
  return item;
}

function visibleTasks() {
  const filtered = tasks.filter((task) => {
    if (currentFilter === "pending") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  return filtered.sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    if (!a.dueDate) return b.dueDate ? 1 : a.title.localeCompare(b.title, "pt-BR");
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

function render() {
  const pendingCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.length - pendingCount;
  document.querySelector("#total-count").textContent = String(tasks.length);
  document.querySelector("#pending-count").textContent = String(pendingCount);
  document.querySelector("#completed-count").textContent = String(completedCount);

  const shown = visibleTasks();
  taskList.replaceChildren(...shown.map(createTaskCard));
  emptyState.hidden = shown.length > 0;
  if (shown.length === 0) {
    const heading = emptyState.querySelector("h3");
    const description = emptyState.querySelector("p");
    if (tasks.length === 0) {
      heading.textContent = "A lista está livre por enquanto";
      description.textContent = "Quando aparecer uma tarefa, anote aqui para não perder de vista.";
    } else {
      heading.textContent = currentFilter === "pending" ? "Nenhuma tarefa pendente" : "Nenhuma tarefa concluída";
      description.textContent = "Tente outro filtro para ver as demais tarefas.";
    }
  }
}

function resetForm() {
  form.reset();
  taskIdInput.value = "";
  saveButton.textContent = "Adicionar tarefa";
  cancelEditButton.hidden = true;
  document.querySelector("#form-heading").textContent = "O que você precisa fazer?";
}

function startEditing(task) {
  taskIdInput.value = task.id;
  titleInput.value = task.title;
  descriptionInput.value = task.description;
  dueDateInput.value = task.dueDate;
  priorityInput.value = task.priority;
  saveButton.textContent = "Salvar alterações";
  cancelEditButton.hidden = false;
  document.querySelector("#form-heading").textContent = "Editar tarefa";
  titleInput.focus();
}

function toggleTask(id, completed) {
  const nextTasks = tasks.map((task) => {
    if (task.id !== id) return task;
    const updated = new Task(task);
    updated.completed = completed;
    return updated;
  });

  if (saveTasks(nextTasks)) {
    showFeedback(completed ? "Tarefa marcada como concluída." : "Tarefa voltou para pendentes.");
    render();
  } else {
    render();
  }
}

function deleteTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task || !window.confirm(`Excluir a tarefa “${task.title}”?`)) return;

  if (saveTasks(tasks.filter((item) => item.id !== id))) {
    if (taskIdInput.value === id) resetForm();
    showFeedback("Tarefa excluída.");
    render();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!storageReady) return;

  const title = titleInput.value.trim();
  if (!title) {
    showFeedback("Escreva um título para a tarefa.", true);
    titleInput.focus();
    return;
  }

  const values = {
    title,
    description: descriptionInput.value.trim(),
    dueDate: dueDateInput.value,
    priority: priorityInput.value
  };
  const id = taskIdInput.value;
  let nextTasks;
  let message;

  if (id) {
    nextTasks = tasks.map((task) => {
      if (task.id !== id) return task;
      const updated = new Task(task);
      updated.update(values);
      return updated;
    });
    message = "Alterações salvas.";
  } else {
    const newTask = new Task({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...values,
      completed: false,
      createdAt: new Date().toISOString()
    });
    nextTasks = [...tasks, newTask];
    message = "Tarefa adicionada.";
  }

  if (saveTasks(nextTasks)) {
    resetForm();
    showFeedback(message);
    render();
  }
});

cancelEditButton.addEventListener("click", () => {
  resetForm();
  showFeedback("Edição cancelada.");
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    render();
  });
});

loadTasks();
render();
