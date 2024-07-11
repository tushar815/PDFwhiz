"use client"

import {useRouter, useSearchParams} from 'next/navigation';
import {trpc} from "@/app/_trpc/client";
import {Loader2} from "lucide-react";


/*
This component is to sync the users to db.
 */
const Page = () => {

    const router = useRouter();
    const searchParams = useSearchParams();
    const origin = searchParams.get('origin')
    /*
     with trpc we dont have to worry about the verbs and address of api. trpc takes care of that.
     Query is like GET from REST.

     */
    const {data, error} = trpc.authCallback.useQuery(undefined, {

        // retry: true,
        // retryDelay: 500,
    });
    console.log("CaLL IN THE TRPC", data, error )

        if (error?.data?.code == 'UNAUTHORIZED') {
            router.push("/sign-in")
        }else {
            router.push(origin ? `/${origin}` : '/dashboard')
        }
    return (
        <div className='w-full mt-24 flex justify-center'>
            <div className='flex flex-col items-center gap-2'>
                <Loader2 className='h-8 w-8 animate-spin text-zinc-800'/>
                <h3 className="font-semibold text-xl">Setting up your account...</h3>
                <p>You will be redirected automatically.</p>
            </div>
        </div>
    )
    }

export default Page;