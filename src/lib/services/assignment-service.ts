import { supabase, TABLES } from '@/lib/supabase';

export async function createAssignment(data: {
  title: string;
  description: string;
  dueDate: Date;
  maxScore: number;
  createdBy: string;
}) {
  try {
    const { data: result, error } = await supabase
      .from(TABLES.ASSIGNMENTS)
      .insert([
        {
          title: data.title,
          description: data.description,
          due_date: data.dueDate.toISOString(),
          max_marks: data.maxScore,
          created_by: data.createdBy,
          subject: 'General',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.warn('Supabase error:', error.message);
      return fallbackCreateAssignment(data);
    }
    
    return result || [{ id: 'online-' + Date.now(), ...data }];
  } catch (error) {
    console.error('Error creating assignment:', error);
    return fallbackCreateAssignment(data);
  }
}

function fallbackCreateAssignment(data: any) {
  const assignment = {
    id: 'local-' + Date.now(),
    title: data.title,
    description: data.description,
    due_date: data.dueDate.toISOString(),
    max_marks: data.maxScore,
    created_by: data.createdBy,
    subject: 'General',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
  assignments.push(assignment);
  localStorage.setItem('assignments', JSON.stringify(assignments));

  console.log('Assignment saved to localStorage (offline):', assignment);
  return [assignment];
}
