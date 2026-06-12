import { api } from '../apiClient';
import type { Facility, FacilityBooking, BookingRequest } from '@/types/facility';

function mapTypeToFrontend(type: string): Facility['type'] {
  switch (type) {
    case 'SEMINAR_HALL': return 'seminar-hall';
    case 'LAB': return 'laboratory';
    case 'AUDITORIUM': return 'auditorium';
    case 'SPORTS_GROUND': return 'classroom';
    case 'DISCUSSION_ROOM': return 'conference-room';
    default: return 'conference-room';
  }
}

function mapTypeToBackend(type: Facility['type']): string {
  switch (type) {
    case 'seminar-hall': return 'SEMINAR_HALL';
    case 'laboratory': return 'LAB';
    case 'auditorium': return 'AUDITORIUM';
    case 'conference-room': return 'DISCUSSION_ROOM';
    case 'classroom': return 'CLASSROOM';
    default: return 'DISCUSSION_ROOM';
  }
}

function mapFacility(f: any): Facility {
  return {
    id: f.id,
    name: f.name,
    type: mapTypeToFrontend(f.type),
    capacity: f.capacity,
    description: f.description,
    building: f.location?.split(',')[0] || 'Main Block',
    floor: f.location?.split(',')[1] || 'Ground',
    equipment: ['Projector', 'AC', 'Whiteboard'], // seed defaults
    amenities: ['Wi-Fi'], // seed defaults
    hours: '09:00 - 18:00',
    image: f.imageUrl,
  };
}

function mapBookingStatus(status: string): FacilityBooking['status'] {
  switch (status) {
    case 'APPROVED': return 'confirmed';
    case 'REJECTED': return 'cancelled';
    case 'PENDING': return 'pending';
    default: return 'pending';
  }
}

function mapBooking(b: any): FacilityBooking {
  const startStr = b.startTime || '';
  const dateOnly = startStr.substring(0, 10);
  const startOnly = startStr.substring(11, 16);
  const endOnly = (b.endTime || '').substring(11, 16);

  return {
    id: b.id,
    facilityId: b.facilityId,
    facilityName: b.facilityName,
    bookedBy: b.userId,
    bookedByName: b.userFullName,
    purpose: b.purpose,
    eventType: 'meeting',
    startTime: startOnly || '09:00',
    endTime: endOnly || '10:00',
    date: dateOnly || '2026-05-29',
    attendees: 10,
    status: mapBookingStatus(b.status),
    notes: b.purpose,
    createdAt: b.createdAt || new Date().toISOString(),
    updatedAt: b.createdAt || new Date().toISOString(),
  };
}

// Facilities
export async function getFacilities(filters?: { type?: Facility['type']; building?: string }) {
  let path = '/facilities';
  if (filters?.type) {
    path += `?type=${mapTypeToBackend(filters.type)}`;
  }
  const response: any = await api.get(path);
  const content = response.content || response;
  return (Array.isArray(content) ? content : []).map(mapFacility);
}

export async function getFacilityById(id: string) {
  const response = await api.get(`/facilities/${id}`);
  return mapFacility(response);
}

export async function createFacility(facility: Omit<Facility, 'id'>) {
  const payload = {
    name: facility.name,
    type: mapTypeToBackend(facility.type),
    description: facility.description,
    capacity: facility.capacity,
    location: `${facility.building},${facility.floor}`,
    hourlyRate: 100,
    imageUrl: facility.image || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400'
  };
  const response = await api.post('/facilities', payload);
  return mapFacility(response);
}

export async function updateFacility(id: string, updates: Partial<Facility>) {
  const payload: any = { ...updates };
  if (updates.type) payload.type = mapTypeToBackend(updates.type);

  
  const response = await api.put(`/facilities/${id}`, payload);
  return mapFacility(response);
}

export async function deleteFacility(id: string) {
  await api.delete(`/facilities/${id}`);
}

// Facility Bookings
export async function getFacilityBookings(filters?: { facilityId?: string; userId?: string; status?: FacilityBooking['status'] }) {
  let path = '/facilities/bookings';
  const params: string[] = [];
  if (filters?.userId) params.push(`userId=${filters.userId}`);
  if (params.length > 0) {
    path += `?${params.join('&')}`;
  }
  const response: any = await api.get(path);
  const content = response.content || response;
  return (Array.isArray(content) ? content : []).map(mapBooking);
}

export async function getFacilityBookingById(id: string) {
  const bookings = await getFacilityBookings();
  return bookings.find(b => b.id === id) || null;
}

export async function createFacilityBooking(userId: string, userName: string, request: BookingRequest) {
  // Join request.date and times into ISO start/end
  const startIso = `${request.date}T${request.startTime}:00`;
  const endIso = `${request.date}T${request.endTime}:00`;

  const payload = {
    startTime: startIso,
    endTime: endIso,
    purpose: request.purpose
  };

  const response = await api.post(`/facilities/${request.facilityId}/book`, payload);
  return mapBooking(response);
}

export async function updateFacilityBooking(id: string, updates: Partial<FacilityBooking>) {
  // Accept booking approvals
  if (updates.status === 'confirmed') {
    const response = await api.put(`/facilities/bookings/${id}/approve`);
    return mapBooking(response);
  } else if (updates.status === 'cancelled') {
    const response = await api.put(`/facilities/bookings/${id}/reject`);
    return mapBooking(response);
  }
  throw new Error(`Unsupported booking status update: ${updates.status}`);
}

export async function deleteFacilityBooking(id: string) {
  await api.put(`/facilities/bookings/${id}/reject`);
}

export async function getFacilityAvailability(facilityId: string, date: string) {
  // Generate active slots dynamically
  const bookings = await getFacilityBookings({ facilityId });
  
  const timeSlots = [];
  for (let hour = 9; hour < 21; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

    const isBooked = bookings?.some((booking) => {
      if (booking.date !== date || booking.status !== 'confirmed') return false;
      const bookingStart = parseInt(booking.startTime.split(':')[0]);
      const bookingEnd = parseInt(booking.endTime.split(':')[0]);
      return hour >= bookingStart && hour < bookingEnd;
    });

    timeSlots.push({
      startTime,
      endTime,
      available: !isBooked,
    });
  }

  return {
    facilityId,
    date,
    timeSlots,
  };
}
