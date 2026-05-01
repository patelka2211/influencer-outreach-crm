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

  const statusCounts = {
    CONTACTED: outreach.filter((record) => record.status === 'CONTACTED').length,
    REPLIED: outreach.filter((record) => record.status === 'REPLIED').length,
    SHIPPED: outreach.filter((record) => record.status === 'SHIPPED').length,
    POSTED: outreach.filter((record) => record.status === 'POSTED').length,
  }

  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.status === 'ACTIVE'
  ).length

  return {
    influencers,
    campaigns,
    outreach,
    statusCounts,
    totals: {
      totalInfluencers: influencers.length,
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalOutreach: outreach.length,
    },
  }
}