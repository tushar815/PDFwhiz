import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { Icons } from "./Icons";
import Link from "next/link";
import { Gem } from "lucide-react";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";

interface UserAccountNavProps {
  email: string | undefined;
  imageUrl: string;
  name: string;
}
const UserAccountNav = async ({
  email,
  imageUrl,
  name,
}: UserAccountNavProps) => {
  const subscriptionPlan = await getUserSubscriptionPlan();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="overflow-visible">
        <Button className="rounded-full h-8 w-8 aspect-square bg-slate-400">
          <Avatar className="w-8h h-8 relative">
            {imageUrl ? (
              <div className="relative aspect-square h-4 w-4">
                <Image
                  fill
                  src={imageUrl}
                  alt="profile picture"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <AvatarFallback className="">
                <span className="sr-only">{name}</span>
                <Icons.user className="h-4 w-4 text-zinc-900" />
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white" align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-0.5 leading-none">
            {name && <p className="font-medium text-sm text-black"> {name} </p>}
            {email && (
              <p className="w-[200px] truncate text-xs  text-zinc-700">
                {email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          {subscriptionPlan?.isSubscribed ? (
            <Link href="/dashboard/billing">Manage Subscription</Link>
          ) : (
            <Link href="/pricing">
              Upgrade
              <Gem className="text-red-600 h-4 w-4 ml-1.5 " />
            </Link> 
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
            <LogoutLink>Log out</LogoutLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAccountNav;
