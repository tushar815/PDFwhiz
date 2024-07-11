import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from 'next/navigation';
import {db} from "@/db";
import Dashboard from "@/app/components/Dashboard";
const Page = async () => {
  const {getUser} = getKindeServerSession();
  //created on server "use client" at top for the client logging
  //console.log('hello world')
  const user = await getUser();
  if(!user || !user.id) redirect('/auth-callback?origin=dashboard')

  const dbUser = await db.user.findFirst({
    where: {
      id: user?.id
    }
  })

  if(!dbUser){
    redirect('/auth-callback?origin=dashboard')
  }
  return (
      <Dashboard />
  )
}

export default Page;