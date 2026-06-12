import { api } from '../apiClient';
import { generateJoinCode, saveGroupCode, saveForumCode, saveResourceCode, addGroupMembership } from '../joinCodes';
import { storeResourceFile, deleteResourceFile } from '../resourceFiles';

// localStorage keys
const MATERIALS_KEY = 'study_materials';
const ASSIGNMENTS_KEY = 'assignments';
const GROUPS_KEY = 'study_groups';
const FORUMS_KEY = 'forums';

function getFromStorage<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
}

// --- Category mapping ---

function mapCategoryToBackend(cat: string): string {
  switch (cat.toLowerCase()) {
    case 'syllabus': return 'SYLLABUS';
    case 'notes':
    case 'lecture notes': return 'NOTES';
    case 'papers':
    case 'exam papers': return 'QUESTION_PAPERS';
    case 'reference books': return 'REFERENCE';
    case 'sample code': return 'CODE';
    case 'presentations': return 'PRESENTATION';
    case 'assignments': return 'ASSIGNMENT';
    case 'video tutorials': return 'VIDEO';
    default: return 'OTHER';
  }
}

function mapCategoryToFrontend(cat: string): string {
  switch (cat) {
    case 'SYLLABUS': return 'syllabus';
    case 'NOTES': return 'notes';
    case 'QUESTION_PAPERS': return 'papers';
    case 'REFERENCE': return 'reference';
    case 'CODE': return 'code';
    case 'PRESENTATION': return 'presentations';
    case 'ASSIGNMENT': return 'assignments';
    case 'VIDEO': return 'video';
    default: return 'other';
  }
}

// --- Study Materials / Resources ---

export async function getResources() {
  try {
    const response: any = await api.get('/materials');
    const content = response.content || response;
    return (Array.isArray(content) ? content : []).map((m: any) => ({
      id: m.id,
      title: m.title,
      category: mapCategoryToFrontend(m.category),
      description: m.description,
      uploaded_by: m.createdBy,
      uploaded_by_name: m.creatorName,
      subject: m.subject || 'General',
      downloads: 0,
      file_url: m.fileUrl,
      created_at: m.createdAt,
      updated_at: m.createdAt,
    }));
  } catch {
    return getFromStorage<any>(MATERIALS_KEY);
  }
}

export async function uploadResource(data: {
  title: string;
  category: string;
  description: string;
  uploadedBy: string;
  uploadedByName: string;
  subject?: string;
  file?: File;
  fileDataUrl?: string;
}) {
  const joinCode = generateJoinCode();
  const resourceId = generateId();
  const hasFile = !!(data.file && data.fileDataUrl);

  if (hasFile && data.file && data.fileDataUrl) {
    storeResourceFile(resourceId, data.file, data.fileDataUrl);
  }

  const resource = {
    id: resourceId,
    title: data.title,
    category: data.category,
    description: data.description,
    uploaded_by: data.uploadedBy,
    uploaded_by_name: data.uploadedByName,
    subject: data.subject || 'General',
    downloads: 0,
    file_url: hasFile ? `local://${resourceId}` : '',
    file_name: data.file?.name || null,
    requires_code: true,
    join_code: joinCode,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const payload = {
      title: data.title,
      category: mapCategoryToBackend(data.category),
      description: data.description,
      subject: data.subject || 'General',
      fileUrl: resource.file_url,
    };
    const response = await api.post('/materials', payload);
    resource.id = (response as any).id || resource.id;
  } catch { /* localStorage fallback */ }

  const materials = getFromStorage<any>(MATERIALS_KEY);
  materials.push(resource);
  saveToStorage(MATERIALS_KEY, materials);
  saveResourceCode(resource.id, joinCode, resource.title);

  return [{ ...resource, joinCode }];
}

export async function updateResource(id: string, data: Partial<{
  title: string;
  category: string;
  description: string;
  subject: string;
}>) {
  try {
    const payload: any = {};
    if (data.title) payload.title = data.title;
    if (data.category) payload.category = mapCategoryToBackend(data.category);
    if (data.description) payload.description = data.description;
    if (data.subject) payload.subject = data.subject;
    await api.put(`/materials/${id}`, payload);
  } catch { /* fallback below */ }

  const materials = getFromStorage<any>(MATERIALS_KEY);
  const idx = materials.findIndex((m: any) => m.id === id);
  if (idx >= 0) {
    materials[idx] = { ...materials[idx], ...data, updated_at: new Date().toISOString() };
    saveToStorage(MATERIALS_KEY, materials);
  }
  return materials[idx];
}

export async function deleteResource(id: string) {
  try { await api.delete(`/materials/${id}`); } catch { /* fallback */ }
  deleteResourceFile(id);
  const materials = getFromStorage<any>(MATERIALS_KEY).filter((m: any) => m.id !== id);
  saveToStorage(MATERIALS_KEY, materials);
}

// --- Assignments ---

export async function getAssignments() {
  try {
    const response: any = await api.get('/assignments');
    const content = response.content || response;
    return (Array.isArray(content) ? content : []).map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      due_date: a.dueDate,
      max_marks: a.points,
      created_by: a.createdBy,
      subject: a.course,
      file_url: a.fileUrl,
      created_at: a.createdAt,
      submissions: { count: 0 },
    }));
  } catch {
    return getFromStorage<any>(ASSIGNMENTS_KEY);
  }
}

export async function createAssignment(data: {
  title: string;
  description: string;
  subject?: string;
  dueDate: Date;
  maxScore: number;
  createdBy: string;
}) {
  const assignment = {
    id: generateId(),
    title: data.title,
    description: data.description,
    due_date: data.dueDate.toISOString(),
    max_marks: data.maxScore,
    created_by: data.createdBy,
    subject: data.subject || 'General',
    file_url: '',
    created_at: new Date().toISOString(),
    submissions: { count: 0 },
  };

  try {
    const payload = {
      title: data.title,
      description: data.description,
      course: data.subject || 'General',
      dueDate: data.dueDate.toISOString(),
      points: data.maxScore,
      fileUrl: '',
    };
    const response = await api.post('/assignments', payload);
    assignment.id = (response as any).id || assignment.id;
  } catch { /* fallback */ }

  const assignments = getFromStorage<any>(ASSIGNMENTS_KEY);
  assignments.push(assignment);
  saveToStorage(ASSIGNMENTS_KEY, assignments);
  return [assignment];
}

export async function updateAssignment(id: string, data: Partial<{
  title: string;
  description: string;
  subject: string;
  dueDate: Date;
  maxScore: number;
}>) {
  try {
    const payload: any = {};
    if (data.title) payload.title = data.title;
    if (data.description) payload.description = data.description;
    if (data.subject) payload.course = data.subject;
    if (data.dueDate) payload.dueDate = data.dueDate.toISOString();
    if (data.maxScore !== undefined) payload.points = data.maxScore;
    await api.put(`/assignments/${id}`, payload);
  } catch { /* fallback */ }

  const assignments = getFromStorage<any>(ASSIGNMENTS_KEY);
  const idx = assignments.findIndex((a: any) => a.id === id);
  if (idx >= 0) {
    const updated: any = { ...assignments[idx] };
    if (data.title) updated.title = data.title;
    if (data.description) updated.description = data.description;
    if (data.subject) updated.subject = data.subject;
    if (data.dueDate) updated.due_date = data.dueDate.toISOString();
    if (data.maxScore !== undefined) updated.max_marks = data.maxScore;
    assignments[idx] = updated;
    saveToStorage(ASSIGNMENTS_KEY, assignments);
  }
  return assignments[idx];
}

export async function deleteAssignment(id: string) {
  try { await api.delete(`/assignments/${id}`); } catch { /* fallback */ }
  const assignments = getFromStorage<any>(ASSIGNMENTS_KEY).filter((a: any) => a.id !== id);
  saveToStorage(ASSIGNMENTS_KEY, assignments);
}

// --- Study Groups ---

function mapGroup(g: any) {
  return {
    id: g.id,
    name: g.name,
    subject: g.subject || g.category,
    description: g.description,
    capacity: g.capacity || g.maxMembers || 20,
    member_count: g.member_count || g.memberCount || 0,
    created_by: g.created_by || g.createdBy,
    created_at: g.created_at || g.createdAt,
    join_code: g.join_code,
  };
}

export async function getStudyGroups() {
  try {
    const response: any = await api.get('/groups');
    const content = response.content || response;
    const groups = (Array.isArray(content) ? content : []).map(mapGroup);
    if (groups.length > 0) return groups;
  } catch { /* fallback */ }
  return getFromStorage<any>(GROUPS_KEY).map(mapGroup);
}

export async function createStudyGroup(data: {
  name: string;
  subject: string;
  description: string;
  maxMembers: number;
  createdBy: string;
}) {
  const joinCode = generateJoinCode();
  const group = {
    id: generateId(),
    name: data.name,
    subject: data.subject,
    description: data.description,
    capacity: data.maxMembers,
    member_count: 1,
    created_by: data.createdBy,
    created_at: new Date().toISOString(),
    join_code: joinCode,
  };

  try {
    const payload = {
      name: data.name,
      category: data.subject,
      description: data.description,
      maxMembers: data.maxMembers,
    };
    const response = await api.post('/groups', payload);
    group.id = (response as any).id || group.id;
  } catch { /* fallback */ }

  const groups = getFromStorage<any>(GROUPS_KEY);
  groups.push(group);
  saveToStorage(GROUPS_KEY, groups);
  saveGroupCode(group.id, joinCode, group.name);
  addGroupMembership(data.createdBy, group.id, 'Creator');

  return [{ ...group, joinCode }];
}

export async function updateStudyGroup(id: string, data: Partial<{
  name: string;
  subject: string;
  description: string;
}>) {
  try {
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.subject) payload.category = data.subject;
    if (data.description) payload.description = data.description;
    await api.put(`/groups/${id}`, payload);
  } catch { /* fallback */ }

  const groups = getFromStorage<any>(GROUPS_KEY);
  const idx = groups.findIndex((g: any) => g.id === id);
  if (idx >= 0) {
    groups[idx] = { ...groups[idx], ...data, updated_at: new Date().toISOString() };
    saveToStorage(GROUPS_KEY, groups);
  }
  return groups[idx];
}

export async function deleteStudyGroup(id: string) {
  try { await api.delete(`/groups/${id}`); } catch { /* fallback */ }
  const groups = getFromStorage<any>(GROUPS_KEY).filter((g: any) => g.id !== id);
  saveToStorage(GROUPS_KEY, groups);
}

export async function joinStudyGroup(groupId: string, userId: string, fullName: string) {
  try {
    await api.post(`/groups/${groupId}/join`);
  } catch { /* fallback */ }

  addGroupMembership(userId, groupId, fullName);

  const groups = getFromStorage<any>(GROUPS_KEY);
  const idx = groups.findIndex((g: any) => g.id === groupId);
  if (idx >= 0) {
    groups[idx].member_count = (groups[idx].member_count || 0) + 1;
    saveToStorage(GROUPS_KEY, groups);
  }
  return { success: true };
}

export async function getGroupMembers(groupId: string) {
  try {
    const response: any = await api.get('/groups');
    const groups = response.content || response;
    const group = (groups || []).find((g: any) => g.id === groupId);
    if (group?.members) {
      return group.members.map((m: any) => ({
        id: m.userId,
        group_id: groupId,
        user_id: m.userId,
        full_name: m.userName,
        joined_at: m.joinedAt,
      }));
    }
  } catch { /* fallback */ }

  const memberships = JSON.parse(localStorage.getItem('campus_group_memberships') || '[]');
  return memberships
    .filter((m: any) => m.resourceId === groupId)
    .map((m: any) => ({
      id: m.userId,
      group_id: groupId,
      user_id: m.userId,
      full_name: m.fullName,
      joined_at: m.joinedAt,
    }));
}

export async function getStudyGroupsWithMembers() {
  const groups = await getStudyGroups();
  return Promise.all(groups.map(async (g: any) => ({
    ...g,
    members: await getGroupMembers(g.id),
  })));
}

// --- Forums ---

function mapForum(f: any) {
  return {
    id: f.id,
    topic: f.topic || f.title,
    description: f.description,
    subject: f.subject || f.category,
    author_id: f.author_id || f.createdBy,
    author_name: f.author_name || f.creatorName,
    created_at: f.created_at || f.createdAt,
    updated_at: f.updated_at || f.createdAt,
    posts: f.posts || { count: 0 },
    join_code: f.join_code,
  };
}

export async function getForums() {
  try {
    const response: any = await api.get('/forums');
    const content = response.content || response;
    const forums = (Array.isArray(content) ? content : []).map(mapForum);
    if (forums.length > 0) return forums;
  } catch { /* fallback */ }
  return getFromStorage<any>(FORUMS_KEY).map(mapForum);
}

export async function createForumThread(data: {
  topic: string;
  description: string;
  category: string;
  tags: string;
  authorId: string;
  authorName: string;
}) {
  const joinCode = generateJoinCode();
  const forum = {
    id: generateId(),
    topic: data.topic,
    description: data.description,
    subject: data.category,
    author_id: data.authorId,
    author_name: data.authorName,
    tags: data.tags,
    is_solved: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    join_code: joinCode,
    posts: { count: 0 },
  };

  try {
    const payload = {
      title: data.topic,
      description: data.description,
      category: data.category,
      tags: data.tags,
    };
    const response = await api.post('/forums', payload);
    forum.id = (response as any).id || forum.id;
  } catch { /* fallback */ }

  const forums = getFromStorage<any>(FORUMS_KEY);
  forums.push(forum);
  saveToStorage(FORUMS_KEY, forums);
  saveForumCode(forum.id, joinCode, forum.topic);

  return [{ ...forum, joinCode }];
}

export async function updateForum(id: string, data: Partial<{
  topic: string;
  description: string;
  category: string;
}>) {
  try {
    const payload: any = {};
    if (data.topic) payload.title = data.topic;
    if (data.description) payload.description = data.description;
    if (data.category) payload.category = data.category;
    await api.put(`/forums/${id}`, payload);
  } catch { /* fallback */ }

  const forums = getFromStorage<any>(FORUMS_KEY);
  const idx = forums.findIndex((f: any) => f.id === id);
  if (idx >= 0) {
    const updated: any = { ...forums[idx] };
    if (data.topic) updated.topic = data.topic;
    if (data.description) updated.description = data.description;
    if (data.category) updated.subject = data.category;
    updated.updated_at = new Date().toISOString();
    forums[idx] = updated;
    saveToStorage(FORUMS_KEY, forums);
  }
  return forums[idx];
}

export async function deleteForum(id: string) {
  try { await api.delete(`/forums/${id}`); } catch { /* fallback */ }
  const forums = getFromStorage<any>(FORUMS_KEY).filter((f: any) => f.id !== id);
  saveToStorage(FORUMS_KEY, forums);
}
