// frontend/src/app/calendar/page.tsx
"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Calendar as CalIcon,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

// Hooks & Components
import {
  useEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  useProfile,
} from "@/hooks/useTroupeData";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import Modal from "@/components/ui/Modal";
import KebabMenu from "@/components/ui/KebabMenu";

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const { data: events = [], isLoading } = useEvents();
  const { data: profile } = useProfile();
  const isAdmin = profile?.role === "admin" || profile?.role === "teacher";

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    location: "",
    description: "",
  });

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // --- HANDLERS ---

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      date: "",
      startTime: "",
      location: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (event: any) => {
    setEditingEvent(event);
    const dateObj = parseISO(event.start_time);
    setFormData({
      title: event.title,
      date: format(dateObj, "yyyy-MM-dd"),
      startTime: format(dateObj, "HH:mm"),
      location: event.location || "",
      description: event.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.startTime) {
      setToast({ msg: "Required fields missing", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const startIso = new Date(
        `${formData.date}T${formData.startTime}`
      ).toISOString();

      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_time: startIso,
        end_time: null,
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, payload);
        setToast({ msg: "Event updated!", type: "success" });
      } else {
        await createEvent(payload);
        setToast({ msg: "Event scheduled!", type: "success" });
      }

      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    } catch (error) {
      console.error(error);
      setToast({ msg: "Operation failed", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEvent(deleteId);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setToast({ msg: "Event removed", type: "success" });
    } catch (error) {
      setToast({ msg: "Error removing event", type: "error" });
    }
    setDeleteId(null);
  };

  // Group events by Month
  const eventsByMonth: { [key: string]: any[] } = {};
  events.forEach((event: any) => {
    const date = parseISO(event.start_time);
    const monthKey = format(date, "MMMM yyyy");
    if (!eventsByMonth[monthKey]) eventsByMonth[monthKey] = [];
    eventsByMonth[monthKey].push(event);
  });

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto h-full pb-24 md:pb-8">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Cancel Event?"
        message="This will remove it from the troupe calendar."
        type="danger"
        confirmText="Yes, Cancel Event"
      />

      {/* --- FORM MODAL --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? "Edit Event" : "Schedule New Event"}
      >
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                  Event Title
                </label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                    Date
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                    Start Time
                  </label>
                  <input
                    required
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                  Location
                </label>
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-3 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Plus size={20} />
                )}
                {editingEvent ? "Save Changes" : "Schedule Event"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalIcon className="text-indigo-400" /> Troupe Calendar
          </h1>
          <p className="text-zinc-400">
            Rehearsals, performances, and meetings.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            // UPDATED: Matches Upload Button size (py-3, justify-center, shrink-0)
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all shrink-0"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Event</span>
          </button>
        )}
      </div>

      {/* EVENTS LIST */}
      {isLoading ? (
        <div className="text-zinc-500 animate-pulse">Loading schedule...</div>
      ) : events.length === 0 ? (
        <div className="h-64 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 gap-4">
          <CalIcon size={48} className="opacity-20" />
          <p>No upcoming events.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(eventsByMonth).map((month) => (
            <div key={month}>
              <h3 className="text-indigo-400 font-bold uppercase tracking-wider text-sm mb-4 border-b border-zinc-800 pb-2">
                {month}
              </h3>
              <div className="grid gap-4">
                {eventsByMonth[month].map((event: any) => {
                  const startDate = parseISO(event.start_time);

                  // Construct Google Maps URL if location exists
                  const mapUrl = event.location
                    ? `https://maps.google.com/?q=${encodeURIComponent(
                        event.location
                      )}`
                    : null;

                  return (
                    <div
                      key={event.id}
                      className="group relative bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-indigo-500/50 transition-colors flex gap-4"
                    >
                      {/* Date Badge */}
                      <div className="flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800 rounded-lg w-16 h-16 shrink-0">
                        <span className="text-xs font-bold text-indigo-500 uppercase">
                          {format(startDate, "MMM")}
                        </span>
                        <span className="text-2xl font-bold text-white">
                          {format(startDate, "d")}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 pr-8">
                        <h4 className="font-bold text-lg text-white truncate">
                          {event.title}
                        </h4>

                        <div className="flex flex-wrap gap-4 mt-1 text-sm text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-zinc-500" />
                            <span>{format(startDate, "h:mm a")}</span>
                          </div>

                          {/* CLICKABLE LOCATION */}
                          {event.location && (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <MapPin
                                size={14}
                                className="text-zinc-500 shrink-0"
                              />
                              {mapUrl ? (
                                <a
                                  href={mapUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 hover:text-indigo-300 hover:underline truncate flex items-center gap-1"
                                >
                                  {event.location}
                                  <ExternalLink
                                    size={10}
                                    className="opacity-50"
                                  />
                                </a>
                              ) : (
                                <span className="truncate">
                                  {event.location}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className="mt-2 text-sm text-zinc-500 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* ADMIN ACTIONS: Kebab Menu */}
                      {isAdmin && (
                        <div className="absolute top-2 right-1">
                          <KebabMenu
                            items={[
                              {
                                label: "Edit Event",
                                icon: <Edit2 size={16} />,
                                onClick: () => openEditModal(event),
                              },
                              {
                                label: "Cancel Event",
                                icon: <Trash2 size={16} />,
                                onClick: () => setDeleteId(event.id),
                                variant: "danger",
                              },
                            ]}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
