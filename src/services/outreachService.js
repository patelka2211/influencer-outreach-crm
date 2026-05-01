import { supabase } from './supabaseClient'

export async function getOutreachRecords() {
    const { data, error } = await supabase
        .from('outreach')
        .select(`
      *,
      influencers (*),
      campaigns (*),
      notes (
        *,
        users (
          name,
          email
        )
      )
    `)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function createOutreachRecord({ influencer_id, campaign_id }) {
    const { data, error } = await supabase
        .from('outreach')
        .insert([
            {
                influencer_id,
                campaign_id,
                status: 'CONTACTED',
                contacted_at: new Date().toISOString(),
            },
        ])
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateOutreachStatus(id, newStatus) {
    const timestampUpdates = {
        REPLIED: 'replied_at',
        SHIPPED: 'shipped_at',
        POSTED: 'posted_at',
    }

    const updates = {
        status: newStatus,
    }

    if (timestampUpdates[newStatus]) {
        updates[timestampUpdates[newStatus]] = new Date().toISOString()
    }

    const { data, error } = await supabase
        .from('outreach')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function addOutreachNote({ outreach_id, content }) {
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!userData.user) throw new Error('You must be logged in to add a note.')

    const { data, error } = await supabase
        .from('notes')
        .insert([
            {
                outreach_id,
                content,
                author_id: userData.user.id,
            },
        ])
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteOutreachRecord(id) {
    const { error } = await supabase
        .from('outreach')
        .delete()
        .eq('id', id)

    if (error) throw error
}