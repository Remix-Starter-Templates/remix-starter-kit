import type { ActionFunction } from 'remix'
import type { Session, User } from '@supabase/supabase-js'
import { useActionData, MetaFunction, redirect, json } from "remix"
import SiteLayout from "~/components/SiteLayout";
import StarterKit from "~/components/StarterKit";
import AuthForm, { AuthCreds } from "../components/AuthForm"
import { supabaseToken } from "../cookies"
import { supabase } from '../lib/supabase.server'

// https://remix.run/api/conventions#meta
export let meta: MetaFunction = () => {
    return {
      title: "Remix Starter Kit - Sign In or Sign Up",
      description: "Welcome to Remix Starter Kit"
    };
};

export let action: ActionFunction = async ({ request }) => {

    const form = await request.formData()
    const email = form.get('email')
    const password = form.get('password')
    const isSignIn = form.get('is_sign_in') === 'true' ? true : false


    let errors: AuthCreds & { service?: Array<string>} = {}

    if (typeof email !== 'string' || !email.match(/^\S+@\S+$/)) {
        errors.email = 'fill-in a valid email address!'
    }

    if (typeof password !== "string" || password.length < 6) {
        errors.password = "password must be at-least 6 chars!";
    }

    let session: Session  | null = null;
    let user: User  | null = null;
    try {
        const { data, error } = await supabase.auth.api[ isSignIn ? 'signInWithEmail' : 'signUpWithEmail'](email?.toString()!, password?.toString()!)
        if(error) {
            errors.service = [ error.message ]
        } else {
            isSignIn ? session = data as Session : user = data as User
        }
    } catch(error) {
        errors.service = [ error.message ]
    }

    if (Object.keys(errors).length) {
        return json(errors, { status: 422 });
    }

    if (session) {

        return redirect('/profile', {
            headers: {
                "Set-Cookie": await supabaseToken.serialize(session.access_token, { expires: new Date(session?.expires_at!), maxAge: session.expires_in })
            }
        })
    }
    if (user) {
        // @TODO: improve this!
        return redirect('/welcome', {})
    }
    return redirect('/auth')
}


export default function Index() {
    const errors = useActionData<AuthCreds>()
  return (
      <SiteLayout>
        <div className="min-h-screen flex flex-col justify-center items-center relative">
            <main className="w-full sm:w-3/4 md:w-8/12 lg:w-6/12 xl:w-4/12">
                <StarterKit/>
                <AuthForm errors={errors} />
            </main>
            <aside className="text-center mt-4">
                {/* Anything? */}
            </aside>
        </div>
    </SiteLayout>
  );
}
