import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma";
import nodemailer from "nodemailer";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/pt-br";
import { z } from "zod";
import { getMailClient } from "./mail";

dayjs.locale("pt-br");
dayjs.extend(localizedFormat);
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
          emails_to_invite: z.array(z.string().email()),
        }),
      },
    },
    async (req) => {
      const {
        destination,
        starts_at,
        ends_at,
        owener_name,
        owner_email,
        emails_to_invite,
      } = req.body;

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
            createMany: {
              data: [
                {
                  name: owener_name,
                  email: owner_email,
                  is_owner: true,
                  is_confirmed: true,
                },
                ...emails_to_invite.map((email) => {
                  return { email };
                }),
              ],
            },
          },
        },
      });

      const formattedStartDate = dayjs(starts_at).format("LL");
      const formattedEndDate = dayjs(ends_at).format("LL");

      const confirmationLink = `http://localhost:3333/trips/${trip.id}/confirm`;

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
        subject: `Confirme sua viagem para ${destination}`,
        html: `
        <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6">
  <p>
    Você solicitou a criação de uma viagem para <strong>${destination}</strong>,
    Brasil nas datas <strong>${formattedStartDate} a ${formattedEndDate}.</strong>
  </p>
  <p></p>
  <p>Para confirmar sua viagem, clique no link abaixo</p>
  <p></p>
  <p><a href="${confirmationLink}">Confirmar viagem</a></p>
  <p></p>
  <p>
    Caso esteja usando o dispositivo movel, você tambem pode confirmar a criação
    da viagem pelos aplicativos:
  </p>
  <p></p>
  <p>
    Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-email
  </p>
</div>

        `.trim(),
      });
      console.log(nodemailer.getTestMessageUrl(message));

      return { tripId: trip.id };
    }
  );
}
