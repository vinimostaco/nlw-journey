import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma";
import nodemailer from "nodemailer";
import dayjs from "dayjs";
import { z } from "zod";
import { getMailClient } from "./mail";
export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/trips",
    {
      schema: {
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
          owener_name: z.string(),
          owner_email: z.string().email(),
        }),
      },
    },
    async (req) => {
      const { destination, starts_at, ends_at, owener_name, owner_email } =
        req.body;

      if (dayjs(starts_at).isBefore(new Date())) {
        throw new Error("Invalid trip start date.");
      }

      if (dayjs(ends_at).isBefore(starts_at)) {
        throw new Error("Invalid trip end date");
      }

      const trip = await prisma.trip.create({
        data: {
          destination: destination,
          starts_at: starts_at,
          ends_at: ends_at,
          participants: {
            create: {
              name: owener_name,
              email: owner_email,
              is_owner: true,
              is_confirmed: true,
            },
          },
        },
      });

      const mail = await getMailClient();
      const message = await mail.sendMail({
        from: {
          name: "Equipe plann.er",
          address: "oi@plann.er",
        },
        to: {
          name: owener_name,
          address: owner_email,
        },
        subject: "Testando envio de email",
        html: `<p>Teste do envio de email</p>`,
      });
      console.log(nodemailer.getTestMessageUrl(message));

      return { tripId: trip.id };
    }
  );
}
