"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Paperclip, FileText, Calendar, Hash, Trash2, Edit2, Settings, ChevronUp, ChevronDown } from "lucide-react";
import GanttChartWrapper from "@/components/GanttChartWrapper";
import { calculateProgress } from "@/lib/utils";

type TaskItem = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  value: string | null;
};

type User = {
  id: string;
  username: string;
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
  users?: User[];
};

type Project = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  defaultNotificationEmail: string | null;
  tasks: Task[];
  users?: User[];
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
  const [taskSelectedUsers, setTaskSelectedUsers] = useState<string[]>([]);

  // Item form
  const [itemType, setItemType] = useState("text");
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemValue, setItemValue] = useState("");
  const [itemFile, setItemFile] = useState<File | null>(null);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Inline Item Edit state
  const [editingInlineItemId, setEditingInlineItemId] = useState<string | null>(null);
  const [inlineItemValue, setInlineItemValue] = useState("");

  // Inline Task Edit state (status/progress)
  const [editingTaskStatusId, setEditingTaskStatusId] = useState<string | null>(null);
  const [editingTaskProgressId, setEditingTaskProgressId] = useState<string | null>(null);
  const [inlineTaskProgress, setInlineTaskProgress] = useState("");

  // Gantt Click modal state
  const [selectedGanttTaskId, setSelectedGanttTaskId] = useState<string | null>(null);

  // Gantt Visibility state
  const [isGanttVisible, setIsGanttVisible] = useState(true);

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
    setTaskSelectedUsers([]);
  };

  const toggleTaskUserSelection = (userId: string) => {
    setTaskSelectedUsers(prev =>
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }

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
          userIds: taskSelectedUsers,
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
    setTaskSelectedUsers(task.users ? task.users.map((u: any) => u.id) : []);
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

  const handleInlineItemUpdate = async (item: TaskItem, newValue: string) => {
    try {
      const res = await fetch(`/api/task-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: newValue,
        }),
      });
      if (res.ok) {
        fetchProject();
        setEditingInlineItemId(null);
      } else {
        console.error("Failed to update item inline");
      }
    } catch (error) {
      console.error("Error updating item inline", error);
    }
  };

  const handleInlineItemKeyDown = (e: React.KeyboardEvent, item: TaskItem) => {
    if (e.key === "Enter") {
      handleInlineItemUpdate(item, inlineItemValue);
    } else if (e.key === "Escape") {
      setEditingInlineItemId(null);
    }
  };

  const handleInlineTaskUpdate = async (taskId: string, field: "status" | "progress", value: string | number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [field]: value,
        }),
      });
      if (res.ok) {
        fetchProject();
        if (field === "status") setEditingTaskStatusId(null);
        if (field === "progress") setEditingTaskProgressId(null);
      } else {
        console.error("Failed to update task inline");
      }
    } catch (error) {
      console.error("Error updating task inline", error);
    }
  };

  const handleInlineProgressKeyDown = (e: React.KeyboardEvent, taskId: string) => {
    if (e.key === "Enter") {
      handleInlineTaskUpdate(taskId, "progress", inlineTaskProgress);
    } else if (e.key === "Escape") {
      setEditingTaskProgressId(null);
    }
  };

  const handleGanttTaskClick = (task: Task) => {
    setSelectedGanttTaskId(task.id);
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

  const avgProgress = calculateProgress(project.tasks);

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <Link href="/" className="group inline-flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-all font-semibold">
        <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Torna alla Dashboard
      </Link>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 mb-8 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg tracking-widest uppercase">
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
                  className={`px-3 py-1 text-xs font-bold uppercase rounded-lg outline-none cursor-pointer border-2 border-blue-500 bg-white ${editValue === 'active' ? 'text-green-600' : 'text-gray-600'}`}
                >
                  <option value="active">Attivo</option>
                  <option value="completed">Completato</option>
                </select>
              ) : (
                <span
                  onClick={() => startEditing("status", project.status)}
                  className={`px-3 py-1 text-xs font-bold uppercase rounded-lg cursor-pointer hover:ring-4 hover:ring-blue-100 transition-all ${project.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}`}
                  title="Clicca per modificare lo stato"
                >
                  {project.status === 'active' ? 'Attivo' : 'Completato'}
                </span>
              )}
            </div>

            {editingField === "name" ? (
              <input
                type="text"
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleProjectUpdate("name", editValue)}
                onKeyDown={(e) => handleEditKeyDown(e, "name")}
                className="text-3xl sm:text-4xl font-black text-gray-900 border-b-4 border-blue-500 outline-none bg-transparent w-full"
              />
            ) : (
              <h1
                onClick={() => startEditing("name", project.name)}
                className="text-3xl sm:text-4xl font-black text-gray-900 cursor-pointer hover:text-blue-600 transition-colors break-all leading-tight"
                title="Clicca per modificare"
              >
                {project.name}
              </h1>
            )}

            {editingField === "description" ? (
              <textarea
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleProjectUpdate("description", editValue)}
                onKeyDown={(e) => handleEditKeyDown(e, "description")}
                className="text-gray-500 mt-4 w-full p-4 border-2 border-blue-500 rounded-xl outline-none resize-none bg-gray-50 text-lg"
                rows={2}
              />
            ) : (
              <p
                onClick={() => startEditing("description", project.description)}
                className="text-gray-500 mt-4 text-lg cursor-pointer hover:bg-gray-50 rounded-xl p-2 -ml-2 transition-colors border border-transparent hover:border-gray-100"
                title="Clicca per modificare la descrizione"
              >
                {project.description || <span className="text-gray-300 italic">Aggiungi una descrizione dettagliata per questo progetto...</span>}
              </p>
            )}
          </div>

          <div className="lg:w-72 shrink-0 bg-gray-50 rounded-2xl p-6 border border-gray-100">
             <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Avanzamento Globale</span>
                <span className="text-2xl font-black text-blue-600">{avgProgress}%</span>
             </div>
             <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${avgProgress}%` }}
                ></div>
             </div>
             <p className="text-[10px] text-gray-400 mt-3 text-center font-medium uppercase tracking-tighter">Basato sulla media dei task sottostanti</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10 pt-8 border-t border-gray-50 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Task Totali</p>
              <p className="text-xl font-black text-gray-900">{totalTasks}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">In Scadenza</p>
              <p className="text-xl font-black text-gray-900">{overdueTasks}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 shadow-sm">
              <Paperclip size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Documenti</p>
              <p className="text-xl font-black text-gray-900">{tasksWithAttachments}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div
          className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setIsGanttVisible(!isGanttVisible)}
        >
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <Calendar size={24} className="text-blue-600" />
            Gantt del Progetto
          </h2>
          <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
            {isGanttVisible ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>
        {isGanttVisible && (
          <div className="p-4 sm:p-6">
            <GanttChartWrapper tasks={project.tasks} onTaskUpdate={handleGanttTaskUpdate} onTaskProgressUpdate={handleGanttProgressUpdate} onTaskClick={handleGanttTaskClick} />
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
           <h2 className="text-2xl font-black text-gray-900 tracking-tight">Timeline & Task</h2>
           <p className="text-gray-400 text-sm font-medium">Organizza le attività e monitora le scadenze</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setDefaultEmail(project?.defaultNotificationEmail || "");
              setShowSettingsModal(true);
            }}
            className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-600 px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all border border-gray-200 font-bold text-sm shadow-sm"
          >
            <Settings size={18} />
            Impostazioni
          </button>
          <button
            onClick={openNewTaskModal}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} />
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
            <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-white px-6 py-5 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-2 h-6 rounded-full" style={{ backgroundColor: task.color || '#3b82f6' }}></div>
                     <h3 className="text-xl font-bold text-gray-900 leading-tight">{task.name}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-gray-300" />
                      <span>{new Date(task.startDate).toLocaleDateString()} → {new Date(task.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">Stato:</span>
                      {editingTaskStatusId === task.id ? (
                        <select
                          autoFocus
                          value={task.status}
                          onChange={(e) => handleInlineTaskUpdate(task.id, "status", e.target.value)}
                          onBlur={() => setEditingTaskStatusId(null)}
                          className="border border-blue-500 rounded-lg px-2 py-0.5 text-xs bg-white text-blue-600 outline-none"
                        >
                          <option value="TODO">Da fare</option>
                          <option value="IN_PROGRESS">In corso</option>
                          <option value="DONE">Completato</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${task.status === 'DONE' ? 'bg-green-50 text-green-600' : task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}
                          onClick={() => setEditingTaskStatusId(task.id)}
                          title="Clicca per modificare lo stato"
                        >
                          {task.status === 'TODO' ? 'Da fare' : task.status === 'IN_PROGRESS' ? 'In corso' : 'Completato'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-auto sm:ml-0">
                      <div className="w-24 sm:w-32 bg-gray-100 h-2 rounded-full overflow-hidden shadow-inner relative">
                         <div className="bg-blue-500 h-full transition-all duration-700" style={{ width: `${task.progress}%` }}></div>
                      </div>
                      {editingTaskProgressId === task.id ? (
                        <input
                          type="number"
                          autoFocus
                          min="0"
                          max="100"
                          value={inlineTaskProgress}
                          onChange={(e) => setInlineTaskProgress(e.target.value)}
                          onBlur={() => handleInlineTaskUpdate(task.id, "progress", inlineTaskProgress)}
                          onKeyDown={(e) => handleInlineProgressKeyDown(e, task.id)}
                          className="w-14 border border-blue-500 rounded-lg px-1 py-0.5 text-xs text-center font-black text-blue-600 outline-none"
                        />
                      ) : (
                        <span
                          className="font-black text-blue-600 cursor-pointer min-w-[3ch] text-right"
                          onClick={() => {
                            setEditingTaskProgressId(task.id);
                            setInlineTaskProgress(task.progress.toString());
                          }}
                          title="Clicca per modificare il progresso"
                        >
                          {task.progress}%
                        </span>
                      )}
                    </div>
                  </div>
                  {task.description && <p className="text-gray-500 mt-4 text-sm leading-relaxed">{task.description}</p>}

                  {task.users && task.users.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                       {task.users.map(u => (
                          <span key={u.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                             <div className="w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center text-[8px] font-bold uppercase">{u.username.charAt(0)}</div>
                             {u.username}
                          </span>
                       ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:border-l border-gray-100 sm:pl-6">
                  <button
                    onClick={() => {
                      resetItemForm();
                      setActiveTaskId(task.id);
                      setShowItemModal(true);
                    }}
                    className="flex-1 sm:flex-none text-blue-600 hover:text-white flex items-center justify-center gap-2 text-xs font-bold bg-blue-50 hover:bg-blue-600 px-4 py-2.5 rounded-xl transition-all"
                  >
                    <Plus size={16} /> <span>Aggiungi Riga</span>
                  </button>
                  <button
                    onClick={() => openEditTaskModal(task)}
                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="Modifica Task"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Elimina Task">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 bg-white/50 backdrop-blur-sm">
                {task.items.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4 text-center">Nessun dettaglio associato a questo task.</p>
                ) : (
                  <div className="grid gap-2">
                    {task.items.map((item) => (
                      <div key={item.id} className="group/item flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all gap-4 sm:gap-0">
                        <div className="flex items-start gap-4 w-full">
                          <div className="mt-1 w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover/item:text-blue-500 group-hover/item:bg-blue-50 transition-colors shrink-0">
                            {item.type === "text" && <FileText size={18} />}
                            {item.type === "number" && <Hash size={18} />}
                            {item.type === "date" && <Calendar size={18} />}
                            {item.type === "attachment" && <Paperclip size={18} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-gray-900 truncate">{item.name}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                                {item.type}
                              </span>
                            </div>
                            {item.description && <div className="text-xs text-gray-400 mb-2 line-clamp-1">{item.description}</div>}

                            <div className="text-sm font-semibold text-blue-600">
                              {item.type === "attachment" ? (
                                item.value ? (
                                  <a href={item.value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
                                    <Paperclip size={14} />
                                    Visualizza Allegato
                                  </a>
                                ) : (
                                  <span className="text-gray-300 italic font-normal">Nessun file</span>
                                )
                              ) : editingInlineItemId === item.id ? (
                                <input
                                  type={item.type === "number" ? "number" : item.type === "date" ? "date" : "text"}
                                  autoFocus
                                  value={inlineItemValue}
                                  onChange={(e) => setInlineItemValue(e.target.value)}
                                  onBlur={() => handleInlineItemUpdate(item, inlineItemValue)}
                                  onKeyDown={(e) => handleInlineItemKeyDown(e, item)}
                                  className="w-full border-2 border-blue-500 rounded-lg px-2 py-1 bg-white text-gray-900 outline-none text-sm"
                                />
                              ) : (
                                <span
                                  className="cursor-pointer hover:text-blue-800 transition-colors flex items-center gap-2"
                                  onClick={() => {
                                    setEditingInlineItemId(item.id);
                                    setInlineItemValue(item.value || "");
                                  }}
                                  title="Clicca per modificare"
                                >
                                  {item.value || <span className="text-gray-300 italic font-normal">Aggiungi valore...</span>}
                                  <Edit2 size={12} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 w-full sm:w-auto justify-end opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => openEditItemModal(item, task.id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Modifica Riga">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Elimina Riga">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio</label>
                  <input required type="date" value={taskStart} onChange={e => setTaskStart(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Fine</label>
                  <input required type="date" value={taskEnd} onChange={e => setTaskEnd(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
                  <select
                    value={taskStatus}
                    onChange={e => {
                      const newStatus = e.target.value;
                      setTaskStatus(newStatus);
                      if (newStatus === "DONE") {
                        setTaskProgress("100");
                      } else if (newStatus === "TODO") {
                        setTaskProgress("0");
                      } else if (newStatus === "IN_PROGRESS") {
                        setTaskProgress("50");
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                  >
                    <option value="TODO">Da fare</option>
                    <option value="IN_PROGRESS">In corso</option>
                    <option value="DONE">Completato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Progresso (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taskProgress}
                    onChange={e => {
                      const newProgress = parseInt(e.target.value, 10);
                      setTaskProgress(e.target.value);
                      if (newProgress === 100) {
                        setTaskStatus("DONE");
                      } else if (newProgress === 0) {
                        setTaskStatus("TODO");
                      } else if (newProgress >= 1 && newProgress <= 99) {
                        setTaskStatus("IN_PROGRESS");
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Colore (es. #ff0000)</label>
                  <div className="flex gap-2">
                    <input type="color" value={taskColor || "#10b981"} onChange={e => setTaskColor(e.target.value)} className="h-10 w-10 border border-gray-300 rounded cursor-pointer" />
                    <input type="text" placeholder="#10b981" value={taskColor} onChange={e => setTaskColor(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 sm:mt-7 mb-1 cursor-pointer">
                    <input type="checkbox" checked={taskNotificationsEnabled} onChange={e => setTaskNotificationsEnabled(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium text-gray-700 line-clamp-2">Abilita Notifiche Email</span>
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

              {project?.users && project.users.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assegna Task a Utenti (Membri del progetto)</label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                      {project.users.map(u => (
                        <label key={u.id} className="flex items-center gap-2 mb-2 last:mb-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={taskSelectedUsers.includes(u.id)}
                            onChange={() => toggleTaskUserSelection(u.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{u.username}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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

      {/* Gantt Task Modal (iframe) */}
      {selectedGanttTaskId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedGanttTaskId(null)}>
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col" style={{ height: '80vh' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Dettaglio Task</h2>
              <button onClick={() => setSelectedGanttTaskId(null)} className="text-gray-500 hover:text-gray-800 transition p-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="flex-1 w-full bg-gray-100">
              <iframe
                src={`/projects/${project.id}/task/${selectedGanttTaskId}?modal=true`}
                className="w-full h-full border-0"
                title="Task Details"
              />
            </div>
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
