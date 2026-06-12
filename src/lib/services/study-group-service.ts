import { supabase, TABLES } from '@/lib/supabase';

export async function createStudyGroup(data: {
  name: string;
  subject: string;
  description: string;
  maxMembers: number;
  createdBy: string;
}) {
  try {
    const { data: result, error } = await supabase
      .from(TABLES.STUDY_GROUPS)
      .insert([
        {
          name: data.name,
          subject: data.subject,
          description: data.description,
          capacity: data.maxMembers,
          created_by: data.createdBy,
          is_private: false,
          tags: [],
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.warn('Supabase error:', error.message);
      return fallbackCreateStudyGroup(data);
    }
    
    return result || [{ id: 'online-' + Date.now(), ...data }];
  } catch (error) {
    console.error('Error creating study group:', error);
    return fallbackCreateStudyGroup(data);
  }
}

function fallbackCreateStudyGroup(data: any) {
  const group = {
    id: 'local-' + Date.now(),
    name: data.name,
    subject: data.subject,
    description: data.description,
    capacity: data.maxMembers,
    created_by: data.createdBy,
    is_private: false,
    tags: [],
    created_at: new Date().toISOString(),
  };

  const groups = JSON.parse(localStorage.getItem('study_groups') || '[]');
  groups.push(group);
  localStorage.setItem('study_groups', JSON.stringify(groups));

  console.log('Study group saved to localStorage (offline):', group);
  return [group];
}
