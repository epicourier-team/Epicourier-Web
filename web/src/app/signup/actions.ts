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

  // const {data, error} = await supabase.from('User').select('*').eq('email', form_data.email).maybeSingle();
  // if (data) {
  //   console.log("data: ", data);
  //   return { error: new Error('User with this email already exists') }
  // }
  // if (error){
  //   console.log("error: ", error);
  //   return { error }
  // }

  const { error: signupError } = await supabase.auth.signUp(form_data)
  if (signupError) {
    return { error: signupError }
  } 
  else {
    const {data:dbGetData, error: dbGetError} = await supabase.from('User').select('*').eq('email', form_data.email).maybeSingle();
    if (dbGetError  || !dbGetData) {
      return { error: dbGetError? dbGetError : new Error('Failed to get user data') }
    }
    console.log("dbGetData: ", dbGetData);
    const { error: updateUserError } = await supabase.from('User').update({username: formData?.username as string}).eq('id', dbGetData.id)
    if (updateUserError) {
      console.log("insertError: ", updateUserError);
      return { error: updateUserError }
    }
  }
  return {success: true}

  // revalidatePath('/', 'layout')
  // redirect('/signin')
}