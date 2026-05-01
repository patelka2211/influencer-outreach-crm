import { useEffect } from 'react'
import { supabase } from './services/supabaseClient'

function App() {
  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from('influencers')
        .select('*')

      console.log('Supabase data:', data)
      console.log('Supabase error:', error)
    }

    testConnection()
  }, [])

  return <h1>Influencer CRM</h1>
}

export default App