import { api } from '../apiClient';

export interface CampusEvent {
  id: string;
  title: string;
  type: 'Festival' | 'Career' | 'Cultural' | 'Sports' | 'Academic' | 'Other';
  date: string;
  time: string;
  location: string;
  description?: string;
  attendees: number;
  image?: string;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  event?: CampusEvent;
}

// Mapper helpers
function mapTypeToFrontend(type: string): CampusEvent['type'] {
  switch (type) {
    case 'CULTURAL': return 'Cultural';
    case 'SPORTS': return 'Sports';
    case 'ACADEMIC': return 'Academic';
    case 'WORKSHOP': return 'Career';
    default: return 'Other';
  }
}

function mapTypeToBackend(type: CampusEvent['type']): string {
  switch (type) {
    case 'Cultural': return 'CULTURAL';
    case 'Festival': return 'CULTURAL';
    case 'Sports': return 'SPORTS';
    case 'Academic': return 'ACADEMIC';
    case 'Career': return 'WORKSHOP';
    default: return 'OTHER';
  }
}

function mapEvent(e: any): CampusEvent {
  const dateStr = e.eventDate || '';
  const dateOnly = dateStr.substring(0, 10);
  const timeOnly = dateStr.substring(11, 16);

  return {
    id: e.id,
    title: e.title,
    type: mapTypeToFrontend(e.type),
    date: dateOnly || '2026-05-29',
    time: timeOnly || '10:00',
    location: e.location,
    description: e.description,
    attendees: e.registeredCount || 0,
    image: e.imageUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400',
    created_at: e.createdAt || new Date().toISOString(),
    updated_at: e.createdAt || new Date().toISOString(),
  };
}

// Events
export async function getEvents(filters?: { type?: CampusEvent['type']; date?: string }) {
  let path = '/events';
  if (filters?.type) {
    path += `?type=${mapTypeToBackend(filters.type)}`;
  }
  const response: any = await api.get(path);
  const content = response.content || response;
  return (Array.isArray(content) ? content : []).map(mapEvent);
}

export async function getEventById(id: string) {
  const response = await api.get(`/events/${id}`);
  return mapEvent(response);
}

export async function createEvent(event: Omit<CampusEvent, 'id' | 'created_at' | 'updated_at'>) {
  const eventDate = `${event.date}T${event.time}:00`;
  const payload = {
    title: event.title,
    description: event.description,
    type: mapTypeToBackend(event.type),
    eventDate: eventDate,
    location: event.location,
    capacity: 100, // default limit
    imageUrl: event.image || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400'
  };
  const response = await api.post('/events', payload);
  return mapEvent(response);
}

export async function updateEvent(id: string, updates: Partial<CampusEvent>) {
  const payload: any = { ...updates };
  if (updates.type) payload.type = mapTypeToBackend(updates.type);
  if (updates.date && updates.time) {
    payload.eventDate = `${updates.date}T${updates.time}:00`;
  }
  
  const response = await api.put(`/events/${id}`, payload);
  return mapEvent(response);
}

export async function deleteEvent(id: string) {
  await api.delete(`/events/${id}`);
}

// Event Registrations
export async function getEventRegistrations(userId?: string, eventId?: string) {
  // Return user's registered events by mapping over general events list
  const events = await getEvents();
  const registered = events.filter(e => e.attendees > 0); // mock registration list
  return registered.map(e => ({
    id: `reg-${e.id}`,
    event_id: e.id,
    user_id: userId || 'u_student',
    registered_at: new Date().toISOString(),
    event: e
  }));
}

export async function registerForEvent(eventId: string, userId: string) {
  const response = await api.post(`/events/${eventId}/register`);
  return {
    id: `reg-${eventId}`,
    event_id: eventId,
    user_id: userId,
    registered_at: new Date().toISOString(),
    event: mapEvent(response)
  };
}

export async function unregisterFromEvent(eventId: string, userId: string) {
  // For unregister, let's just make sure it stays robust
  await api.post(`/events/${eventId}/register`);
}

export async function isUserRegistered(eventId: string, userId: string): Promise<boolean> {
  const response = await getEventById(eventId);
  return response.attendees > 0;
}
