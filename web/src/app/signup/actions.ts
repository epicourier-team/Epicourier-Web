'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server' 


export async function signup(formData: { email?: string; password?: string; username?: string }) {
  const supabase = await createClient()
  const form_data = {
    email: formData?.email as string,
    password: formData?.password as string,
  }


  const { error: signupError } = await supabase.auth.signUp(form_data)
  if (signupError) {
    return { error: signupError }
  } 
  else {
    const { error: insertError } = await supabase.from('User').insert([{ 
      email: formData.email as string,
      username: formData.username as string,
    }])
    if (insertError) {
      return { error: insertError }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/signin')
}