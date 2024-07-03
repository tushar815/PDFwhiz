import { useRouter, useSearchParams } from 'next/navigation';
import {trpc} from "@/app/_trpc/client";


/*
This component is to sync the users to db.
 */
const Page = () => {

    const router = useRouter();
    const searchParams = useSearchParams();
    const origin = searchParams.get('origin')
    const {data, isLoading} = trpc.authCallback.useQuery(undefined);
    if (!data.success) {
        return;
    }
    router.push(origin ? `/${origin}` : '/dashboard')


}

export default Page;