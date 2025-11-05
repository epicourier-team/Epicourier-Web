"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function signup(formData: { email?: string; password?: string; username?: string }) {
  const supabase = await createClient();
  const form_data = {
    email: formData?.email as string,
    password: formData?.password as string,
  };

  // const {data, error} = await supabase.from('User').select('*').eq('email', form_data.email).maybeSingle();
  // if (data) {
  //   console.log("data: ", data);
  //   return { error: new Error('User with this email already exists') }
  // }
  // if (error){
  //   console.log("error: ", error);
  //   return { error }
  // }

  const { error: signupError } = await supabase.auth.signUp(form_data);
  if (signupError) {
    return { error: signupError };
  } else {
    const { error: insertError } = await supabase.from("User").insert([
      {
        email: formData.email as string,
        username: formData.username as string,
      },
    ]);
    if (insertError) {
      return { error: insertError };
    }
  }

  //revalidatePath('/', 'layout')
  redirect("/signin");
}
