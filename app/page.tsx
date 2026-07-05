import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import HomeClient from './HomeClient';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('site_title, daily_new_limit')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <HomeClient
      userId={user.id}
      email={user.email ?? ''}
      initialSiteTitle={(settings as { site_title?: string | null } | null)?.site_title ?? null}
      initialDailyNewLimit={(settings as { daily_new_limit?: number | null } | null)?.daily_new_limit ?? null}
    />
  );
}
