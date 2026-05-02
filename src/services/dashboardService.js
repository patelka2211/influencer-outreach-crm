import { supabase } from './supabaseClient'

export async function getBrandDashboardData() {
  const [
    influencersResult,
    campaignsResult,
    outreachResult,
  ] = await Promise.all([
    supabase.from('influencers').select('*'),
    supabase.from('campaigns').select('*'),
    supabase
      .from('outreach')
      .select(`
        *,
        influencers (*),
        campaigns (*),
        notes (*)
      `)
      .order('created_at', { ascending: false }),
  ])

  if (influencersResult.error) throw influencersResult.error
  if (campaignsResult.error) throw campaignsResult.error
  if (outreachResult.error) throw outreachResult.error

  const influencers = influencersResult.data || []
  const campaigns = campaignsResult.data || []
  const outreach = outreachResult.data || []

  const activeOutreach = outreach.filter(
    (r) => r.campaigns?.status !== 'COMPLETED' && r.campaigns?.status !== 'ARCHIVED'
  )

  const statusCounts = {
    CONTACTED: activeOutreach.filter((record) => record.status === 'CONTACTED').length,
    REPLIED: activeOutreach.filter((record) => record.status === 'REPLIED').length,
    SHIPPED: activeOutreach.filter((record) => record.status === 'SHIPPED').length,
    POSTED: activeOutreach.filter((record) => record.status === 'POSTED').length,
  }

  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.status === 'ACTIVE'
  ).length

  return {
    influencers,
    campaigns,
    outreach,
    activeOutreach,
    statusCounts,
    totals: {
      totalInfluencers: influencers.length,
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalOutreach: activeOutreach.length,
    },
  }
}