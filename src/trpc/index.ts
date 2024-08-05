import { z } from "zod";
import { privateProcedure, procedure, router } from "./trpc";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { absoluteUrl } from "@/lib/utils";
import { getUserSubscriptionPlan, stripe } from "@/lib/stripe";
import { PLANS } from "@/config/stripe";

export const appRouter = router({
  authCallback: procedure.query(async () => {
    console.log("CALLED THE APIIIII");
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    console.log("USER IS ", user);
    if (!user || !user.email) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    //check if user is in database
    const dbUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });
    if (!dbUser) {
      //crate user in db
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
        },
      });
    }
    return { success: true, isLoading: true };
  }),
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId, user } = ctx;
    return db.file.findMany({
      where: {
        userId,
      },
    });
  }),
  deleteFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!file) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await db.file.delete({
        where: {
          id: input.id,
        },
      });
      return file;
    }), //inputs needs id and id should be string

  getFile: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const file = await db.file.findFirst({
        where: {
          key: input.key,
          userId,
        },
      });

      if (!file) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return file;
    }),

  getFileUploadStatus: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ ctx, input }) => {
      let file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId: ctx.userId,
        },
      });

      if (!file) return { status: "PENDING" as const };


      const subscriptionPlan = await getUserSubscriptionPlan();
      if(subscriptionPlan.isSubscribed && file.uploadStatus === 'FAILED'){
       file = await db.file.update({
          data:{
            uploadStatus: 'SUCCESS'
            
          },
          where:{
            id: input.fileId
          }
        })
      }


      return {
        status: file.uploadStatus,
      };
    }),

  getFileMessages: privateProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { fileId, cursor } = input;
      const limit = input.limit ?? INFINITE_QUERY_LIMIT;

      const file = await db.file.findFirst({
        where: {
          id: fileId,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      const messages = await db.message.findMany({
        take: limit + 1,
        where: {
          fileId,
        },
        orderBy: {
          createdAt: "desc",
        },
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          isUserMessage: true,
          createdAt: true,
          text: true,
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages,
        nextCursor,
      };
    }),
  createStripeSession: privateProcedure.mutation(async ({ ctx }) => {
    const { userId } = ctx;

    const billingUrl = absoluteUrl("/dashboard/billing");

    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    const dbUser = await db.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!dbUser) throw new TRPCError({ code: "UNAUTHORIZED" });

    const subscriptionPlan = await getUserSubscriptionPlan();

    if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
      const stripeSesson = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripeCustomerId,
        return_url: billingUrl,
      });
      return {
        url: stripeSesson.url,
      };
    }
    const stripeSesson = await stripe.checkout.sessions.create({
      success_url: billingUrl,
      cancel_url: billingUrl,
      payment_method_types: ['card'],
      mode: "subscription",
      billing_address_collection: "auto",
      line_items: [
        {
          price: PLANS.find((p) => p.name === "pro")?.price.priceIds.test,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
      },
    });

    return { url: stripeSesson.url };
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
