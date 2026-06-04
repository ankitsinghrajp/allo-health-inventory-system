import { z } from "zod";

export const reservationSchema = z.object({
  inventoryId: z.string(),
  quantity: z.number().min(1),
});