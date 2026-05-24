import { notifyPublicSubmission } from "../../../../utils/internal-notifications";

declare const strapi: any;

export default {
  async afterCreate(event) {
    await notifyPublicSubmission(strapi, "member-request", event.result);
  },
};
