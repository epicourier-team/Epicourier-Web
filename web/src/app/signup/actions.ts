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

  // First check if user already exists
  const { data: existingUser } = await supabase
    .from('User')
    .select('*')
    .eq('email', form_data.email)
    .maybeSingle();

  if (existingUser) {
    return { error: { message: 'An account with this email already exists' } };
  }

  // Attempt to sign up
  const { error: signupError, data: signupData } = await supabase.auth.signUp(form_data)
  if (signupError) {
    // Format the error message to be more user-friendly
    let errorMessage = signupError.message;
    if (errorMessage.includes('Password should be')) {
      errorMessage = 'Password must be at least 6 characters long';
    } else if (errorMessage.includes('Invalid email')) {
      errorMessage = 'Please enter a valid email address';
    }
    return { error: { message: errorMessage } };
  }

  if (!signupData.user) {
    return { error: { message: 'Failed to create account' } };
  }

  try {
    // Get the newly created user
    const { data: dbGetData, error: dbGetError } = await supabase
      .from('User')
      .select()
      .eq('email', form_data.email)
      .maybeSingle();

    if (dbGetError || !dbGetData) {
      return { 
        error: { 
          message: 'Account created but failed to set username. Please try signing in and updating your profile.' 
        } 
      };
    }

    // Update the username
    const { error: updateUserError } = await supabase
      .from('User')
      .update({ username: formData?.username as string })
      .eq('id', dbGetData.id);

    if (updateUserError) {
      return { 
        error: { 
          message: 'Account created but failed to set username. Please try signing in and updating your profile.'
        } 
      };
    }

    revalidatePath('/', 'layout')
    return { success: true };
  } catch (error) {
    return { 
      error: { 
        message: 'An unexpected error occurred. Please try again.'
      } 
    };
  }
}