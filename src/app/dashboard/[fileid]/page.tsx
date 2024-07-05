import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect, notFound} from "next/navigation";
import {db} from "@/db";

interface  PageProps{
    params: {
        fileid: string
    }
}

const page =  async ({params}: PageProps) => {
    //get the file id
    const {fileid} = params;
    const {getUser} = getKindeServerSession();
    const user  = await getUser();

    if(!user || !user.id) redirect(`/auth-callback/origin=dashboard/${fileid}`)

    //make call to db
    const file = await  db.file.findFirst({
        where: {
            id: fileid,
            userId: user?.id
        }
    })

    if(!file) notFound();
    return(
        <div>TBD...</div>
    )
}

export default page;