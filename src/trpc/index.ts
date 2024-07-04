import {z} from 'zod';
import {privateProcedure, procedure, router} from './trpc';
import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";
import {TRPCError} from "@trpc/server";
import {db} from "@/db";

export const appRouter = router({
    authCallback: procedure.query(async () => {

        console.log("CALLED THE APIIIII")
        const {getUser} = getKindeServerSession();
        const user = await getUser();
        console.log("USER IS ", user)
        if (!user || !user.email){
            throw new TRPCError({code: "UNAUTHORIZED"})
        }

        //check if user is in database
        const dbUser = await db.user.findFirst({
            where: {
                id: user.id
            }
        })
        if (!dbUser) {
            //crate user in db
            await db.user.create({
                data: {
                    id: user.id,
                    email: user.email
                }
            })
        }
        return {success: true, isLoading: true}
    }),
    getUserFiles: privateProcedure.query(async ({ctx}) => {
        const {userId, user} = ctx;
        return db.file.findMany({
            where: {
                userId
            }
        });
    })
});

// export type definition of API
export type AppRouter = typeof appRouter;