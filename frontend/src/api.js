const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function localDateTimeInput(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export async function api(path, options = {}) {
  const token = localStorage.getItem("evently-token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`);
  return data;
}

export function fromApiEvent(item) {
  const dateValue = new Date(item.date);
  const date = Number.isNaN(dateValue.getTime()) ? "" : dateValue.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const fullDate = Number.isNaN(dateValue.getTime()) ? "Date to be announced" : dateValue.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const registered = Number(item.registered || 0);
  const deadlineTime = item.deadline ? new Date(item.deadline).getTime() : null;
  const registrationOpen = (deadlineTime === null || Number.isNaN(deadlineTime) || deadlineTime > Date.now()) && registered < Number(item.capacity || 0) && dateValue > new Date();
  return {
    ...item,
    id: item._id || item.id,
    category: item.category || "Technology",
    location: item.location || "Main Campus",
    campus: item.location || "Main Campus",
    date,
    fullDate,
    formDate: Number.isNaN(dateValue.getTime()) ? "" : localDateTimeInput(dateValue).slice(0, 10),
    startTime: Number.isNaN(dateValue.getTime()) ? "" : dateValue.toTimeString().slice(0, 5),
    deadlineInput: item.deadline ? localDateTimeInput(item.deadline) : "",
    deadline: item.deadline ? new Date(item.deadline).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Not specified",
    registered,
    seats: Math.max(0, Number(item.capacity || 0) - registered),
    status: dateValue > new Date() ? "Upcoming" : "Completed",
    registrationOpen,
    host: item.createdBy?.name || "Event host",
    ownerEmail: item.createdBy?.email || "",
    image: item.image || "",
    banner: item.banner || item.image || "",
    visual: item.category === "Music" ? "concert" : item.category === "Cultural" ? "masks" : item.category === "Sports" ? "wellness" : "calendar",
  };
}

export function toApiEvent(event) {
  return {
    title: event.title,
    description: event.description,
    date: new Date(`${event.formDate}T${event.startTime || "12:00"}:00`).toISOString(),
    time: event.time,
    venue: event.venue,
    capacity: Number(event.capacity),
    category: event.category,
    location: event.location,
    deadline: event.deadlineInput ? new Date(event.deadlineInput).toISOString() : null,
    googleForm: event.googleForm,
    image: event.banner,
  };
}
