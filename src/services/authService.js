import { supabase } from './supabaseClient'

export async function loginUser({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) throw error

    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

    if (profileError) throw profileError

    if (!profile.is_active) {
        await supabase.auth.signOut()
        throw new Error('This account is inactive.')
    }

    return profile
}

export async function registerUser({ email, password, name, role }) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (authError) throw authError

    if (!authData.user) {
        throw new Error('No user was returned after registration.')
    }

    const { data: profile, error: profileError } = await supabase
        .from('users')
        .upsert(
            [
                {
                    id: authData.user.id,
                    email,
                    name,
                    role,
                    is_active: true,
                },
            ],
            { onConflict: 'id' }
        )
        .select()
        .single()

    if (profileError) throw profileError

    return profile
}

export async function getCurrentProfile() {
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError) throw authError
    if (!authData.user) return null

    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

    if (profileError) throw profileError

    if (!profile.is_active) {
        await supabase.auth.signOut()
        localStorage.setItem('auth_deactivated', 'true')
        return null
    }

    return profile
}

export async function logoutUser() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}



