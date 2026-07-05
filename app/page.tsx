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
    <>
      {/* Large background text behind the glass card to test liquid-glass refraction. */}
      <div
        aria-hidden="true"
        className="fixed left-1/2 top-[15vh] -translate-x-1/2 -z-10 select-none pointer-events-none"
        style={{
          fontSize: 'clamp(56px, 14vw, 180px)',
          fontWeight: 900,
          color: '#000000',
          lineHeight: 0.95,
          textAlign: 'center',
          letterSpacing: '-0.04em',
          whiteSpace: 'nowrap'
        }}
      >
        This is word farm
      </div>
      <HomeClient
        userId={user.id}
        email={user.email ?? ''}
        initialSiteTitle={(settings as { site_title?: string | null } | null)?.site_title ?? null}
        initialDailyNewLimit={(settings as { daily_new_limit?: number | null } | null)?.daily_new_limit ?? null}
      />
    </>
  );
}
