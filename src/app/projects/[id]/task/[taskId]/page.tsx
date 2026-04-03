"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Calendar, FileText, Hash, Paperclip, CheckCircle } from "lucide-react";

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
  items: TaskItem[];
  projectId: string;
};

export default function TaskDetails({ params }: { params: Promise<{ id: string; taskId: string }> }) {
  const resolvedParams = use(params);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const isModal = searchParams.get("modal") === "true";

  // Inline Item Edit state
  const [editingInlineItemId, setEditingInlineItemId] = useState<string | null>(null);
  const [inlineItemValue, setInlineItemValue] = useState("");

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${resolvedParams.taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      }
    } catch (error) {
      console.error("Error fetching task", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [resolvedParams.taskId]);

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
        fetchTask();
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

  if (loading) return <div className="text-center py-10">Caricamento in corso...</div>;
  if (!task) return <div className="text-center py-10">Task non trovato</div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {!isModal && (
        <Link href={`/projects/${resolvedParams.id}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition">
          <ArrowLeft size={16} className="mr-2" />
          Torna al Progetto
        </Link>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.name}</h1>
            <div className="flex gap-4 text-sm text-gray-600 flex-wrap">
              <span className="flex items-center gap-1"><Calendar size={16} /> Dal: {new Date(task.startDate).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><Calendar size={16} /> Al: {new Date(task.endDate).toLocaleDateString()}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {task.status}
              </span>
              <span className="flex items-center gap-1"><CheckCircle size={16} /> Progresso: {task.progress}%</span>
            </div>
          </div>
          {task.color && (
            <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: task.color }} title="Colore task"></div>
          )}
        </div>

        {task.description && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-700">
            <h3 className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Descrizione</h3>
            <p className="whitespace-pre-wrap">{task.description}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FileText size={24} className="text-blue-600" />
          Dettagli e Allegati
        </h2>

        {(!task.items || task.items.length === 0) ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            Nessun elemento abbinato a questo task.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {task.items.map((item) => (
              <div key={item.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-400">
                    {item.type === "text" && <FileText size={20} />}
                    {item.type === "number" && <Hash size={20} />}
                    {item.type === "date" && <Calendar size={20} />}
                    {item.type === "attachment" && <Paperclip size={20} />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-semibold text-gray-900 flex items-center justify-between">
                      <span className="truncate">{item.name}</span>
                      <span className="text-[10px] uppercase tracking-wider bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                        {item.type}
                      </span>
                    </div>
                    {item.description && <div className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</div>}

                    <div className="mt-3 pt-3 border-t border-gray-200 text-sm font-medium text-blue-700 break-all">
                      {item.type === "attachment" ? (
                        item.value ? (
                          <a href={item.value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-white border border-blue-200 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors">
                            <Paperclip size={14} /> Scarica Allegato
                          </a>
                        ) : (
                          <span></span>
                        )
                      ) : editingInlineItemId === item.id ? (
                        <input
                          type={item.type === "number" ? "number" : item.type === "date" ? "date" : "text"}
                          autoFocus
                          value={inlineItemValue}
                          onChange={(e) => setInlineItemValue(e.target.value)}
                          onBlur={() => handleInlineItemUpdate(item, inlineItemValue)}
                          onKeyDown={(e) => handleInlineItemKeyDown(e, item)}
                          className="w-full border-b border-blue-500 outline-none bg-white text-gray-900 px-1 py-0.5 rounded shadow-sm text-sm"
                        />
                      ) : (
                        <span
                          className="bg-white px-3 py-1.5 rounded-md border border-gray-200 block cursor-pointer hover:border-blue-300 transition-colors"
                          onClick={() => {
                            setEditingInlineItemId(item.id);
                            setInlineItemValue(item.value || "");
                          }}
                          title="Clicca per modificare il valore"
                        >
                          {item.value || <span className="text-gray-400 italic">Clicca per aggiungere valore</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
