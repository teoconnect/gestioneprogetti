"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Paperclip, FileText, Calendar, Hash, Trash2, Edit2, Settings } from "lucide-react";
import GanttChartWrapper from "@/components/GanttChartWrapper";

type TaskItem = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  value: string | null;
};

type Task = {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  color: string | null;
  dependencies: string | null;
  notificationsEnabled: boolean;
  notificationEmail: string | null;
  items: TaskItem[];
};

type Project = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  defaultNotificationEmail: string | null;
  tasks: Task[];
};

export default function ProjectDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Inline edit state
  const [editingField, setEditingField] = useState<"name" | "description" | "status" | null>(null);
  const [editValue, setEditValue] = useState("");

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Settings Form
  const [defaultEmail, setDefaultEmail] = useState("");

  // Task form
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStart, setTaskStart] = useState("");
  const [taskEnd, setTaskEnd] = useState("");
  const [taskStatus, setTaskStatus] = useState("TODO");
  const [taskProgress, setTaskProgress] = useState("0");
  const [taskColor, setTaskColor] = useState("");
  const [taskDependencies, setTaskDependencies] = useState<string[]>([]);
  const [taskNotificationsEnabled, setTaskNotificationsEnabled] = useState(false);
  const [taskNotificationEmail, setTaskNotificationEmail] = useState("");
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Item form
  const [itemType, setItemType] = useState("text");
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemValue, setItemValue] = useState("");
  const [itemFile, setItemFile] = useState<File | null>(null);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Gantt drag state refs
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (error) {
      console.error("Error fetching project", error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleProjectUpdate = async (field: "name" | "description" | "status", value: string) => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        fetchProject();
        setEditingField(null);
      } else {
        console.error("Failed to update project field");
      }
    } catch (error) {
      console.error("Error updating project field", error);
    }
  };

  const startEditing = (field: "name" | "description" | "status", currentValue: string | null) => {
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const handleProjectSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultNotificationEmail: defaultEmail }),
      });
      if (res.ok) {
        fetchProject();
        setShowSettingsModal(false);
      }
    } catch (error) {
      console.error("Error saving project settings", error);
    }
  };

  const handleTestEmail = async () => {
    if (!project || !defaultEmail) {
      alert("Inserisci un'email prima di fare il test.");
      return;
    }
    try {
      const res = await fetch(`/api/projects/${project.id}/test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: defaultEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Email inviata con successo!");
      } else {
        alert("Errore nell'invio dell'email: " + (data.error || ""));
      }
    } catch (error) {
      console.error("Error testing email", error);
      alert("Si è verificato un errore.");
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, field: "name" | "description" | "status") => {
    if (e.key === "Enter" && field !== "description") {
      handleProjectUpdate(field, editValue);
    } else if (e.key === "Escape") {
      setEditingField(null);
    }
  };


  const openNewTaskModal = () => {
    resetTaskForm();
    if (project?.defaultNotificationEmail) {
      setTaskNotificationsEnabled(true);
      setTaskNotificationEmail(project.defaultNotificationEmail);
    }
    setShowTaskModal(true);
  };

  const resetTaskForm = () => {
    setTaskName("");
    setTaskDesc("");
    setTaskStart("");
    setTaskEnd("");
    setTaskStatus("TODO");
    setTaskProgress("0");
    setTaskColor("");
    setTaskDependencies([]);
    setTaskNotificationsEnabled(false);
    setTaskNotificationEmail("");
    setIsEditingTask(false);
    setEditingTaskId(null);
  };

  const handleCreateOrUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditingTask ? `/api/tasks/${editingTaskId}` : "/api/tasks";
      const method = isEditingTask ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project?.id,
          name: taskName,
          description: taskDesc,
          startDate: taskStart,
          endDate: taskEnd,
          status: taskStatus,
          progress: taskProgress,
          color: taskColor,
          dependencies: taskDependencies.join(","),
          notificationsEnabled: taskNotificationsEnabled,
          notificationEmail: taskNotificationEmail || null,
        }),
      });
      if (res.ok) {
        setShowTaskModal(false);
        resetTaskForm();
        fetchProject();
      }
    } catch (error) {
      console.error("Error saving task", error);
    }
  };

  const openEditTaskModal = (task: Task) => {
    setTaskName(task.name);
    setTaskDesc(task.description || "");
    setTaskStart(new Date(task.startDate).toISOString().split('T')[0]);
    setTaskEnd(new Date(task.endDate).toISOString().split('T')[0]);
    setTaskStatus(task.status);
    setTaskProgress(task.progress.toString());
    setTaskColor(task.color || "");
    setTaskDependencies(task.dependencies ? task.dependencies.split(",").map(d => d.trim()).filter(Boolean) : []);
    setTaskNotificationsEnabled(task.notificationsEnabled);
    setTaskNotificationEmail(task.notificationEmail || "");
    setIsEditingTask(true);
    setEditingTaskId(task.id);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        fetchProject();
      }
    } catch (error) {
      console.error("Error deleting task", error);
    }
  };

  const resetItemForm = () => {
    setItemType("text");
    setItemName("");
    setItemDesc("");
    setItemValue("");
    setItemFile(null);
    setIsEditingItem(false);
    setEditingItemId(null);
  };

  const openEditItemModal = (item: TaskItem, taskId: string) => {
    setActiveTaskId(taskId);
    setItemType(item.type);
    setItemName(item.name);
    setItemDesc(item.description || "");
    setItemValue(item.value || "");
    setItemFile(null);
    setIsEditingItem(true);
    setEditingItemId(item.id);
    setShowItemModal(true);
  };

  const handleCreateOrUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskId) return;

    try {
      let finalValue = itemValue;

      if (itemType === "attachment" && itemFile) {
        const formData = new FormData();
        formData.append("file", itemFile);
        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalValue = uploadData.path;
        } else {
          throw new Error("Failed to upload file");
        }
      } else if (itemType === "attachment" && isEditingItem && !itemFile) {
        // Se sto modificando un allegato ma non ho caricato un nuovo file, mantengo il vecchio valore
        finalValue = itemValue;
      }

      const url = isEditingItem ? `/api/task-items/${editingItemId}` : "/api/task-items";
      const method = isEditingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: activeTaskId,
          type: itemType,
          name: itemName,
          description: itemDesc,
          value: finalValue,
        }),
      });

      if (res.ok) {
        setShowItemModal(false);
        setActiveTaskId(null);
        resetItemForm();
        fetchProject();
      }
    } catch (error) {
      console.error("Error saving item", error);
      alert("Errore durante il salvataggio dell'elemento.");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo elemento?")) return;
    try {
      const res = await fetch(`/api/task-items/${itemId}`, { method: "DELETE" });
      if (res.ok) {
        fetchProject();
      }
    } catch (error) {
      console.error("Error deleting task item", error);
    }
  };

  const handleGanttTaskUpdate = async (task: Task, start: string, end: string) => {
    if (!project) return;

    // Use a simple debounce to handle multiple on_date_change events gracefully
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        // Aggiorniamo direttamente e unicamente il singolo task spostato sul Gantt
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: start,
            endDate: end,
          }),
        });

        if (res.ok) {
          fetchProject();
        }
      } catch (error) {
        console.error("Error updating task from Gantt", error);
      }
    }, 500);
  };

  const handleGanttProgressUpdate = async (task: Task, progress: number) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            progress,
          }),
        });
        if (res.ok) {
          fetchProject();
        }
      } catch (error) {
        console.error("Error updating task progress from Gantt", error);
      }
    }, 500);
  };

  if (loading) return <div className="text-center py-10">Caricamento in corso...</div>;
  if (!project) return <div className="text-center py-10">Progetto non trovato</div>;

  const totalTasks = project.tasks.length;
  const overdueTasks = project.tasks.filter(t => new Date(t.endDate) < new Date()).length;
  const tasksWithAttachments = project.tasks.filter(t => t.items?.some(i => i.type === 'attachment')).length;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition">
        <ArrowLeft size={16} className="mr-2" />
        Torna alla Dashboard
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-100">
        <div className="flex justify-between items-start">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {editingField === "name" ? (
                <input
                  type="text"
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleProjectUpdate("name", editValue)}
                  onKeyDown={(e) => handleEditKeyDown(e, "name")}
                  className="text-3xl font-bold text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent px-1 min-w-[200px]"
                />
              ) : (
                <h1
                  onClick={() => startEditing("name", project.name)}
                  className="text-3xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 rounded px-1 -ml-1 transition-colors border border-transparent hover:border-gray-200"
                  title="Clicca per modificare"
                >
                  {project.name}
                </h1>
              )}

              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                {project.code}
              </span>

              {editingField === "status" ? (
                <select
                  autoFocus
                  value={editValue}
                  onChange={(e) => {
                    setEditValue(e.target.value);
                    handleProjectUpdate("status", e.target.value);
                  }}
                  onBlur={() => setEditingField(null)}
                  className={`px-3 py-1 text-sm font-medium rounded-full outline-none cursor-pointer ${editValue === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                >
                  <option value="active">Attivo</option>
                  <option value="completed">Completato</option>
                </select>
              ) : (
                <span
                  onClick={() => startEditing("status", project.status)}
                  className={`px-3 py-1 text-sm font-medium rounded-full cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all ${project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                  title="Clicca per modificare lo stato"
                >
                  {project.status === 'active' ? 'Attivo' : 'Completato'}
                </span>
              )}
            </div>

            {editingField === "description" ? (
              <textarea
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleProjectUpdate("description", editValue)}
                onKeyDown={(e) => handleEditKeyDown(e, "description")}
                className="text-gray-600 mt-2 w-full p-2 border-2 border-blue-500 rounded outline-none resize-y min-h-[80px]"
              />
            ) : (
              <div
                onClick={() => startEditing("description", project.description)}
                className="text-gray-600 mt-2 p-2 -mx-2 cursor-pointer hover:bg-gray-50 rounded transition-colors border border-transparent hover:border-gray-200 min-h-[40px]"
                title="Clicca per modificare la descrizione"
              >
                {project.description || <span className="text-gray-400 italic">Aggiungi descrizione...</span>}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Task Totali</p>
              <p className="text-2xl font-bold text-blue-900">{totalTasks}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Calendar size={20} />
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Task Scaduti</p>
              <p className="text-2xl font-bold text-red-900">{overdueTasks}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <Calendar size={20} />
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Task con Allegati</p>
              <p className="text-2xl font-bold text-green-900">{tasksWithAttachments}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <Paperclip size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar size={24} className="text-blue-600" />
          Gantt del Progetto
        </h2>
        <GanttChartWrapper tasks={project.tasks} onTaskUpdate={handleGanttTaskUpdate} onTaskProgressUpdate={handleGanttProgressUpdate} />
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Task del Progetto</h2>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setDefaultEmail(project?.defaultNotificationEmail || "");
              setShowSettingsModal(true);
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 transition shadow-sm"
          >
            <Settings size={20} />
            Impostazioni Progetto
          </button>
          <button
            onClick={openNewTaskModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition shadow-sm"
          >
            <Plus size={20} />
            Nuovo Task
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {project.tasks.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            Nessun task per questo progetto.
          </div>
        ) : (
          project.tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{task.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>Inizio: {new Date(task.startDate).toLocaleDateString()}</span>
                    <span>Fine: {new Date(task.endDate).toLocaleDateString()}</span>
                    <span className="font-semibold text-gray-700">Stato: {task.status}</span>
                    <span>Progresso: {task.progress}%</span>
                  </div>
                  {task.description && <p className="text-gray-600 mt-2 text-sm">{task.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEditTaskModal(task)}
                    className="text-gray-600 hover:bg-gray-200 p-1.5 rounded-md transition"
                    title="Modifica Task"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => {
                      resetItemForm();
                      setActiveTaskId(task.id);
                      setShowItemModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium bg-blue-50 px-3 py-1.5 rounded-md transition"
                  >
                    <Plus size={16} /> Aggiungi Riga
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white">
                {task.items.length === 0 ? (
                  <p className="text-sm text-gray-500 italic px-2">Nessun elemento abbinato.</p>
                ) : (
                  <div className="grid gap-3">
                    {task.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 rounded bg-gray-50 border border-gray-100 hover:border-gray-300 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="mt-1 text-gray-400">
                            {item.type === "text" && <FileText size={18} />}
                            {item.type === "number" && <Hash size={18} />}
                            {item.type === "date" && <Calendar size={18} />}
                            {item.type === "attachment" && <Paperclip size={18} />}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {item.name}
                              <span className="text-[10px] uppercase tracking-wider bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                {item.type}
                              </span>
                            </div>
                            {item.description && <div className="text-sm text-gray-500">{item.description}</div>}

                            <div className="mt-1 text-sm font-medium text-blue-700">
                              {item.type === "attachment" && item.value ? (
                                <a href={item.value} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                  Scarica File
                                </a>
                              ) : (
                                <span>{item.value}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEditItemModal(item, task.id)} className="text-gray-400 hover:text-blue-600 transition-colors p-2" title="Modifica Riga">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-600 transition-colors p-2" title="Elimina Riga">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{isEditingTask ? "Modifica Task" : "Nuovo Task"}</h2>
            <form onSubmit={handleCreateOrUpdateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Task</label>
                <input required type="text" value={taskName} onChange={e => setTaskName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" rows={3}></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio</label>
                  <input required type="date" value={taskStart} onChange={e => setTaskStart(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Fine</label>
                  <input required type="date" value={taskEnd} onChange={e => setTaskEnd(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
                  <select value={taskStatus} onChange={e => setTaskStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white">
                    <option value="TODO">Da fare</option>
                    <option value="IN_PROGRESS">In corso</option>
                    <option value="DONE">Completato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Progresso (%)</label>
                  <input type="number" min="0" max="100" value={taskProgress} onChange={e => setTaskProgress(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Colore (es. #ff0000)</label>
                  <div className="flex gap-2">
                    <input type="color" value={taskColor || "#10b981"} onChange={e => setTaskColor(e.target.value)} className="h-10 w-10 border border-gray-300 rounded cursor-pointer" />
                    <input type="text" placeholder="#10b981" value={taskColor} onChange={e => setTaskColor(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 mt-7 mb-1 cursor-pointer">
                    <input type="checkbox" checked={taskNotificationsEnabled} onChange={e => setTaskNotificationsEnabled(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5" />
                    <span className="text-sm font-medium text-gray-700">Abilita Notifiche Email</span>
                  </label>
                </div>
              </div>

              {taskNotificationsEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email per Notifiche</label>
                  <input required type="email" value={taskNotificationEmail} onChange={e => setTaskNotificationEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="nome@esempio.com" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seleziona il task padre</label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                    {project?.tasks.filter(t => t.id !== editingTaskId).length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Nessun altro task disponibile nel progetto.</p>
                    ) : (
                      project?.tasks.filter(t => t.id !== editingTaskId).map(t => (
                        <label key={t.id} className="flex items-center gap-2 mb-2 last:mb-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={taskDependencies.includes(t.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTaskDependencies([...taskDependencies, t.id]);
                              } else {
                                setTaskDependencies(taskDependencies.filter(id => id !== t.id));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{t.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setShowTaskModal(false); resetTaskForm(); }} className="px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition">Annulla</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition">Salva Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Impostazioni Progetto</h2>
            <form onSubmit={handleProjectSettingsUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Notifiche Predefinita
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={defaultEmail}
                    onChange={(e) => setDefaultEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="nome@esempio.com"
                  />
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition whitespace-nowrap"
                  >
                    Testa
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Se impostata, questa email verrà abilitata di default per i nuovi task creati in questo progetto.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition"
                >
                  Salva Impostazioni
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{isEditingItem ? "Modifica Riga Dettaglio" : "Nuova Riga Dettaglio"}</h2>
            <form onSubmit={handleCreateOrUpdateItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Elemento</label>
                <select disabled={isEditingItem} value={itemType} onChange={e => setItemType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white disabled:bg-gray-100 disabled:text-gray-500">
                  <option value="text">Testo</option>
                  <option value="number">Numero</option>
                  <option value="date">Data</option>
                  <option value="attachment">Allegato</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input required type="text" value={itemName} onChange={e => setItemName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione (opzionale)</label>
                <textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" rows={2}></textarea>
              </div>

              {itemType === "attachment" ? (
                <div key="attachment-input">
                  <label className="block text-sm font-medium text-gray-700 mb-1">File {isEditingItem && "(carica per sostituire)"}</label>
                  {isEditingItem && itemValue && (
                    <div className="mb-2 text-sm text-gray-600">
                      File attuale: <a href={itemValue} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Vedi file</a>
                    </div>
                  )}
                  <input required={!isEditingItem} type="file" onChange={e => setItemFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition" />
                </div>
              ) : (
                <div key="value-input">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valore</label>
                  <input required type={itemType === "number" ? "number" : itemType === "date" ? "date" : "text"} value={itemValue} onChange={e => setItemValue(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setShowItemModal(false); resetItemForm(); }} className="px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition">Annulla</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition">Salva Riga</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
