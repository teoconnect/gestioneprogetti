"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, LogOut, RefreshCw } from "lucide-react";
import { calculateProgress } from "@/lib/utils";

type Project = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  tasks: { progress: number }[];
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // New states for personal tasks summary
  const [myTasks, setMyTasks] = useState<any[]>([]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        console.error("API did not return an array:", data);
        setProjects([]);
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchMyTasks();
    checkAdminAndFetchUsers();
  }, []);

  const fetchMyTasks = async () => {
    try {
        const res = await fetch("/api/tasks");
        const sessionRes = await fetch("/api/users/list"); // Reuse to easily get current auth state or just use logic below

        // Since we don't have a specific /api/auth/me endpoint, we can filter based on the UI's best effort,
        // but for now let's just show active tasks and maybe indicate they are active.
        // Wait, the API GET /api/tasks already filters by session for standard users.
        // For admins, it returns ALL tasks. To make the "My Tasks" section truly accurate for admins,
        // the API should optionally take a filter, but since it's a summary, showing active tasks is fine.

        if (res.ok) {
            const data = await res.json();
            // Filter tasks to display a summary
            setMyTasks(data.filter((t: any) => t.status !== "DONE" && t.status !== "deleted"));
        }
    } catch (e) {
        console.error("Failed to fetch my tasks", e);
    }
  }

  const checkAdminAndFetchUsers = async () => {
    try {
       // All users might not have access to /api/users, but let's try to fetch all users if possible.
       // We should fetch users specifically for assignment.
       // Currently /api/users is restricted to ADMIN. We need to create an endpoint or modify it.
       // Actually, we can fetch users via a new lightweight endpoint or if the api allows.
       // Wait, if /api/users is ADMIN only, USERs will get 401.
       // Let's modify the code so it calls a new or existing allowed endpoint.
       // For now, let's keep the dashboard logic. We need all users to assign them.

       const res = await fetch("/api/users");
       if (res.ok) {
           const users = await res.json();
           setAllUsers(users);
           setIsAdmin(true);
       } else {
           setIsAdmin(false);
           // If user is not admin, we still want them to be able to see all users to assign them.
           // I will create a public (authenticated) user list endpoint below.
           const publicRes = await fetch("/api/users/list");
           if (publicRes.ok) {
             const users = await publicRes.json();
             setAllUsers(users);
           }
       }
    } catch (e) {
       setIsAdmin(false);
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { name, description, status };
      if (selectedUsers.length > 0) {
        payload.userIds = selectedUsers;
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        setName("");
        setDescription("");
        setStatus("active");
        setSelectedUsers([]);
        fetchProjects();
      }
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  const toggleUserSelection = (userId: string) => {
      setSelectedUsers(prev =>
          prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
  }

  const handleSoftDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler spostare questo progetto nel cestino?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "deleted" }),
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error("Failed to soft delete project", error);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error("Failed to restore project", error);
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm("ATTENZIONE: Sei sicuro di voler eliminare DEFINITIVAMENTE questo progetto? L'operazione non è reversibile.")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error("Failed to hard delete project", error);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = false;
    if (filterStatus === "all") {
      matchesStatus = p.status !== "deleted";
    } else {
      matchesStatus = p.status === filterStatus;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Progetti</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Gestisci e monitora i tuoi flussi di lavoro</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {isAdmin && (
             <Link
                href="/users"
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md text-sm sm:text-base font-semibold"
             >
                <span className="hidden sm:inline">Utenti</span>
                <span className="sm:hidden">Utenti</span>
             </Link>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md text-sm sm:text-base font-semibold"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nuovo Progetto</span>
            <span className="sm:hidden">Nuovo</span>
          </button>
          <button
            onClick={handleLogout}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md text-sm sm:text-base font-medium"
            title="Logout"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Esci</span>
          </button>
        </div>
      </div>

      {myTasks.length > 0 && (
        <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 tracking-tight">I miei Task Attivi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTasks.slice(0, 6).map(task => (
                    <Link key={task.id} href={`/projects/${task.projectId}`} className="block">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">{task.project?.code}</span>
                                <span className={`text-[10px] font-bold uppercase ${task.status === 'IN_PROGRESS' ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {task.status === 'IN_PROGRESS' ? 'In corso' : 'Da fare'}
                                </span>
                            </div>
                            <h3 className="font-bold text-gray-900 leading-tight mb-3 line-clamp-1">{task.name}</h3>
                            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
                                <span>Scadenza: {new Date(task.endDate).toLocaleDateString()}</span>
                                <span className="text-blue-600">{task.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${task.progress}%` }}></div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Cerca per nome o codice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-none rounded-xl px-5 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white shadow-sm placeholder:text-gray-400"
          />
        </div>
        <div className="w-full sm:w-56">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full border-none rounded-xl px-5 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white shadow-sm cursor-pointer appearance-none text-gray-700"
          >
            <option value="all">Tutti gli stati</option>
            <option value="active">Attivo</option>
            <option value="completed">Completato</option>
            <option value="deleted">Cestino</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
          <p className="font-medium text-lg">Caricamento in corso...</p>
        </div>
      ) : (
        <>
          {/* Visualizzazione Desktop */}
          <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {projects.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Plus className="text-gray-300" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Nessun progetto trovato</h3>
                <p className="text-gray-500 mb-6 max-w-xs mx-auto">Inizia creando il tuo primo progetto per organizzare i tuoi task.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Crea Progetto
                </button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="col-span-full text-center py-20 text-gray-500 italic bg-gray-50 rounded-2xl">
                Nessun progetto corrisponde alla ricerca.
              </div>
            ) : (
              filteredProjects.map((project) => {
                const progress = calculateProgress(project.tasks);
                return (
                  <div key={project.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 transition-all duration-300 group-hover:w-3"></div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{project.code}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            project.status === 'active' ? 'bg-green-50 text-green-600' :
                            project.status === 'deleted' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
                          }`}>
                            {project.status === 'active' ? 'Attivo' :
                             project.status === 'deleted' ? 'Cancellato' : 'Completato'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                      </div>
                      <div className="flex gap-2">
                        {project.status === "deleted" ? (
                          <>
                            <button
                              onClick={(e) => { e.preventDefault(); handleRestore(project.id); }}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Ripristina"
                            >
                              <RefreshCw size={18} />
                            </button>
                            <button
                              onClick={(e) => { e.preventDefault(); handleHardDelete(project.id); }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Elimina definitivamente"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => { e.preventDefault(); handleSoftDelete(project.id); }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sposta nel cestino"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10 flex-1">
                      {project.description || <span className="italic text-gray-300">Nessuna descrizione fornita.</span>}
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between items-end text-sm">
                        <span className="font-semibold text-gray-700">Completamento</span>
                        <span className="text-blue-600 font-bold">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {project.status !== "deleted" ? (
                      <Link
                        href={`/projects/${project.id}`}
                        className="mt-auto w-full text-center bg-gray-50 hover:bg-blue-600 hover:text-white text-gray-700 font-bold py-3 rounded-xl transition-all duration-200"
                      >
                        Vai al Progetto
                      </Link>
                    ) : (
                      <div className="mt-auto w-full text-center bg-red-50 text-red-700 font-bold py-3 rounded-xl">
                        Progetto nel Cestino
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Visualizzazione Mobile */}
          <div className="md:hidden space-y-4">
            {projects.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
                <p className="text-gray-500">Nessun progetto trovato.</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
                Nessun progetto corrisponde alla ricerca.
              </div>
            ) : (
              filteredProjects.map((project) => {
                const progress = calculateProgress(project.tasks);
                return (
                  <Link key={project.id} href={`/projects/${project.id}`} className="block">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col active:scale-[0.98] transition-transform">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{project.code}</span>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight">{project.name}</h3>
                        </div>
                        <span className={`px-2 py-1 inline-flex text-[10px] font-bold uppercase rounded ${
                            project.status === 'active' ? 'bg-green-50 text-green-600' :
                            project.status === 'deleted' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
                        }`}>
                          {project.status === 'active' ? 'Attivo' :
                           project.status === 'deleted' ? 'Cancellato' : 'Completato'}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between items-end text-xs mb-1">
                          <span className="text-gray-500">Progresso</span>
                          <span className="text-blue-600 font-bold">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                        {project.status !== "deleted" ? (
                          <span className="text-blue-600 text-xs font-bold uppercase tracking-wider">Visualizza Dettagli</span>
                        ) : (
                          <span className="text-red-600 text-xs font-bold uppercase tracking-wider">Nel Cestino</span>
                        )}
                        <div className="flex gap-2">
                          {project.status === "deleted" ? (
                            <>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRestore(project.id); }}
                                className="text-gray-400 hover:text-green-600 p-1"
                                title="Ripristina"
                              >
                                <RefreshCw size={16} />
                              </button>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleHardDelete(project.id); }}
                                className="text-gray-400 hover:text-red-600 p-1"
                                title="Elimina definitivamente"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSoftDelete(project.id); }}
                              className="text-gray-400 hover:text-red-600 p-1"
                              title="Sposta nel cestino"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 tracking-tight">Nuovo Progetto</h2>
            <form onSubmit={handleCreateProject} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome Progetto</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="es. Ristrutturazione Soggiorno" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descrizione</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrizione degli obiettivi..." className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-gray-400" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stato Iniziale</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white cursor-pointer appearance-none">
                  <option value="active">Attivo</option>
                  <option value="completed">Completato</option>
                </select>
              </div>

              {allUsers.length > 0 && (
                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assegna Utenti al Team</label>
                   <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2">
                       {allUsers.map(user => (
                           <label key={user.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded">
                               <input
                                   type="checkbox"
                                   checked={selectedUsers.includes(user.id)}
                                   onChange={() => toggleUserSelection(user.id)}
                                   className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                               />
                               <span className="text-sm text-gray-700">{user.username} ({user.role})</span>
                           </label>
                       ))}
                   </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 font-semibold transition-all">Annulla</button>
                <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0">Salva Progetto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
