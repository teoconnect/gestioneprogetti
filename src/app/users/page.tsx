"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Pencil, Trash2, Shield, User, ShieldAlert } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form State
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [formError, setFormError] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.status === 401) {
        router.push("/"); // Not admin, redirect
        return;
      }
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (user: any = null) => {
    setFormError("");
    if (user) {
      setEditingUser(user);
      setUsername(user.username);
      setEmail(user.email || "");
      setPassword(""); // Leave blank so we only update if typed
      setRole(user.role);
    } else {
      setEditingUser(null);
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("USER");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!editingUser && !password) {
      setFormError("La password è obbligatoria per i nuovi utenti.");
      return;
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const body: any = { username, email, role };
      if (password) body.password = password;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Errore durante il salvataggio");
        return;
      }

      await fetchUsers();
      closeModal();
    } catch (error) {
      setFormError("Si è verificato un errore imprevisto.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo utente?")) return;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Errore durante l'eliminazione");
        return;
      }

      await fetchUsers();
    } catch (error) {
      console.error("Failed to delete user", error);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Caricamento utenti...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <Link href="/" className="group inline-flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-all font-semibold">
        <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Torna alla Dashboard
      </Link>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 mb-8 border border-gray-100 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-blue-600" />
            Gestione Utenti
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Aggiungi, modifica o rimuovi gli accessi al sistema.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="relative z-10 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          Nuovo Utente
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600 text-sm">Utente</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Ruolo</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Creazione</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                <td className="p-4 font-medium text-gray-900 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase shrink-0">
                    {user.username.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span>{user.username}</span>
                    <span className="text-xs text-gray-400 font-normal">{user.email || <span className="italic">Nessuna email</span>}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString("it-IT")}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openModal(user)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Modifica"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Nessun utente trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg uppercase shrink-0">
                {user.username.charAt(0)}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-bold text-gray-900 text-lg truncate">{user.username}</span>
                <span className="text-sm text-gray-400 font-normal truncate">{user.email || <span className="italic">Nessuna email</span>}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
              <div className="flex flex-col gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${
                  user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {user.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {user.role}
                </span>
                <span className="text-xs text-gray-500">
                  Creazione: {new Date(user.createdAt).toLocaleDateString("it-IT")}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openModal(user)}
                  className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  title="Modifica"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Elimina"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500">
            Nessun utente trovato.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {editingUser ? "Modifica Utente" : "Nuovo Utente"}
            </h2>

            <form onSubmit={handleSaveUser} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email {role === "USER" && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="email"
                  required={role === "USER"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  placeholder="utente@esempio.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser && <span className="text-gray-400 font-normal">(lascia vuoto per non modificare)</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition bg-white"
                >
                  <option value="USER">USER - Accesso limitato ai propri progetti</option>
                  <option value="ADMIN">ADMIN - Accesso completo</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition"
                >
                  Salva Utente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
