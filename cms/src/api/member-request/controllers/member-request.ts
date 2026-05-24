import { factories } from "@strapi/strapi";
import { prepareMemberRequestSubmission } from "../../../utils/public-submission";

export default factories.createCoreController("api::member-request.member-request", () => ({
  async create(ctx) {
    prepareMemberRequestSubmission(ctx);
    return await super.create(ctx);
  },
}));
