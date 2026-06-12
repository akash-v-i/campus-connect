import { supabase, TABLES } from '@/lib/supabase';

export async function createForumThread(data: {
  topic: string;
  description: string;
  category: string;
  tags: string;
  authorId: string;
  authorName: string;
}) {
  try {
    const { data: result, error } = await supabase
      .from(TABLES.FORUMS)
      .insert([
        {
          topic: data.topic,
          subject: data.category,
          description: data.description,
          author_id: data.authorId,
          author_name: data.authorName,
          is_solved: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.warn('Supabase error:', error.message);
      return fallbackCreateForumThread(data);
    }
    
    return result || [{ id: 'online-' + Date.now(), ...data }];
  } catch (error) {
    console.error('Error creating forum thread:', error);
    return fallbackCreateForumThread(data);
  }
}

function fallbackCreateForumThread(data: any) {
  const forum = {
    id: 'local-' + Date.now(),
    topic: data.topic,
    description: data.description,
    subject: data.category,
    author_id: data.authorId,
    author_name: data.authorName,
    is_solved: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const forums = JSON.parse(localStorage.getItem('forums') || '[]');
  forums.push(forum);
  localStorage.setItem('forums', JSON.stringify(forums));

  console.log('Forum thread saved to localStorage (offline):', forum);
  return [forum];
}
