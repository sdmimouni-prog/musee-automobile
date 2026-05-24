import { factories } from "@strapi/strapi";
import { prepareRestaurantReservationSubmission } from "../../../utils/public-submission";

export default factories.createCoreController("api::restaurant-reservation.restaurant-reservation", () => ({
  async create(ctx) {
    prepareRestaurantReservationSubmission(ctx);
    return await super.create(ctx);
  },
}));
