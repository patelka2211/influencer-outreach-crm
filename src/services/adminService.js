import { supabase } from './supabaseClient'

export async function getAdminDashboardData() {
  const [usersResult, influencersResult, campaignsResult, outreachResult] =
    await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('influencers').select('*'),
      supabase.from('campaigns').select('*'),
      supabase.from('outreach').select('*'),
    ])

  if (usersResult.error) throw usersResult.error
  if (influencersResult.error) throw influencersResult.error
  if (campaignsResult.error) throw campaignsResult.error
  if (outreachResult.error) throw outreachResult.error

  const users = usersResult.data || []
  const influencers = influencersResult.data || []
  const campaigns = campaignsResult.data || []
  const outreach = outreachResult.data || []

  return {
    users,
    totals: {
      totalUsers: users.length,
      brandManagers: users.filter((user) => user.role === 'BRAND_MANAGER').length,
      admins: users.filter((user) => user.role === 'ADMIN').length,
      activeUsers: users.filter((user) => user.is_active).length,
      inactiveUsers: users.filter((user) => !user.is_active).length,
      totalInfluencers: influencers.length,
      totalCampaigns: campaigns.length,
      totalOutreach: outreach.length,
    },
  }
}

export async function updateUserActiveStatus(id, isActive) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}