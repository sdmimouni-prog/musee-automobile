import { factories } from "@strapi/strapi";
import { prepareBookingSubmission } from "../../../utils/public-submission";

export default factories.createCoreController("api::booking.booking", () => ({
  async create(ctx) {
    prepareBookingSubmission(ctx);
    return await super.create(ctx);
  },
}));
