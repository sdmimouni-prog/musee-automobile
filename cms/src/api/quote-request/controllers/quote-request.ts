import { factories } from "@strapi/strapi";
import { prepareQuoteRequestSubmission } from "../../../utils/public-submission";

export default factories.createCoreController("api::quote-request.quote-request", () => ({
  async create(ctx) {
    prepareQuoteRequestSubmission(ctx);
    return await super.create(ctx);
  },
}));
