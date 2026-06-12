import { supabase, TABLES } from '@/lib/supabase';

export async function uploadResource(data: {
  title: string;
  category: string;
  description: string;
  uploadedBy: string;
  uploadedByName: string;
  subject?: string;
}) {
  try {
    const { data: result, error } = await supabase
      .from(TABLES.STUDY_MATERIALS)
      .insert([
        {
          title: data.title,
          category: data.category,
          description: data.description,
          uploaded_by: data.uploadedBy,
          uploaded_by_name: data.uploadedByName,
          subject: data.subject || 'General',
          downloads: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.warn('Supabase error:', error.message);
      return fallbackUploadResource(data);
    }
    
    return result || [{ id: 'online-' + Date.now(), ...data }];
  } catch (error) {
    console.error('Error uploading resource:', error);
    return fallbackUploadResource(data);
  }
}

function fallbackUploadResource(data: any) {
  const resource = {
    id: 'local-' + Date.now(),
    title: data.title,
    category: data.category,
    description: data.description,
    uploaded_by: data.uploadedBy,
    uploaded_by_name: data.uploadedByName,
    subject: data.subject || 'General',
    downloads: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const resources = JSON.parse(localStorage.getItem('study_materials') || '[]');
  resources.push(resource);
  localStorage.setItem('study_materials', JSON.stringify(resources));

  console.log('Resource saved to localStorage (offline):', resource);
  return [resource];
}
