import Stripe from "stripe";
import { STRIPE_API_VERSION } from "@formbricks/lib/constants";
import { env } from "@formbricks/lib/env";
import {
  getMonthlyActiveOrganizationPeopleCount,
  getMonthlyOrganizationResponseCount,
  getOrganization,
  updateOrganization,
} from "@formbricks/lib/organization/service";
import { ProductFeatureKeys, StripePriceLookupKeys, StripeProductNames } from "../lib/constants";
import { reportUsage } from "../lib/report-usage";

export const handleCheckoutSessionCompleted = async (event: Stripe.Event) => {
  if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe is not enabled; STRIPE_SECRET_KEY is not set.");

  const checkoutSession = event.data.object as Stripe.Checkout.Session;

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
  });

  const stripeSubscriptionObject = await stripe.subscriptions.retrieve(
    checkoutSession.subscription as string
  );

  const { customer: stripeCustomer } = (await stripe.checkout.sessions.retrieve(checkoutSession.id, {
    expand: ["customer"],
  })) as { customer: Stripe.Customer };

  const organization = await getOrganization(stripeSubscriptionObject.metadata.organizationId);
  if (!organization) throw new Error("Organization not found.");
  const updatedFeatures = organization.billing.features;

  for (const item of stripeSubscriptionObject.items.data) {
    const product = await stripe.products.retrieve(item.price.product as string);

    switch (product.name) {
      case StripeProductNames.inAppSurvey:
        updatedFeatures.inAppSurvey.status = "active";
        const isInAppSurveyUnlimited =
          item.price.lookup_key === StripePriceLookupKeys.inAppSurveyUnlimitedPlan90 ||
          item.price.lookup_key === StripePriceLookupKeys.inAppSurveyUnlimitedPlan33;
        if (isInAppSurveyUnlimited) {
          updatedFeatures.inAppSurvey.unlimited = true;
        } else {
          const countForOrganization = await getMonthlyOrganizationResponseCount(organization.id);
          await reportUsage(
            stripeSubscriptionObject.items.data,
            ProductFeatureKeys.inAppSurvey,
            countForOrganization
          );
        }
        break;

      case StripeProductNames.linkSurvey:
        updatedFeatures.linkSurvey.status = "active";
        const isLinkSurveyUnlimited =
          item.price.lookup_key === StripePriceLookupKeys.linkSurveyUnlimitedPlan19 ||
          item.price.lookup_key === StripePriceLookupKeys.linkSurveyUnlimitedPlan33;
        if (isLinkSurveyUnlimited) {
          updatedFeatures.linkSurvey.unlimited = true;
        }
        break;

      case StripeProductNames.userTargeting:
        updatedFeatures.userTargeting.status = "active";
        const isUserTargetingUnlimited =
          item.price.lookup_key === StripePriceLookupKeys.userTargetingUnlimitedPlan90 ||
          item.price.lookup_key === StripePriceLookupKeys.userTargetingUnlimitedPlan33;
        if (isUserTargetingUnlimited) {
          updatedFeatures.userTargeting.unlimited = true;
        } else {
          const countForOrganization = await getMonthlyActiveOrganizationPeopleCount(organization.id);

          await reportUsage(
            stripeSubscriptionObject.items.data,
            ProductFeatureKeys.userTargeting,
            countForOrganization
          );
        }
        break;
    }
  }

  await updateOrganization(organization.id, {
    billing: {
      stripeCustomerId: stripeCustomer.id,
      features: updatedFeatures,
    },
  });

  await stripe.customers.update(stripeCustomer.id, {
    name: organization.name,
    metadata: { organization: organization.id },
    invoice_settings: {
      default_payment_method: stripeSubscriptionObject.default_payment_method as string,
    },
  });
};
