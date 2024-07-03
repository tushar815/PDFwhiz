import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from 'next/navigation';
const Page = () => {
  const {getUser} = getKindeServerSession();
  //created on server "use client" at top for the client logging
  //console.log('hello world')
  const user = getUser();
  if(!user || !user.id) redirect('/auth-callback?origin=dashboard')

  return (
      <div></div>
  )
}

export default Page;