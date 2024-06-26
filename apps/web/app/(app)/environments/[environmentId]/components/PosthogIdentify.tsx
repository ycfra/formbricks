"use client";

import type { Session } from "next-auth";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { env } from "@formbricks/lib/env";
import { TSubscriptionStatus } from "@formbricks/types/organizations";

const posthogEnabled = env.NEXT_PUBLIC_POSTHOG_API_KEY && env.NEXT_PUBLIC_POSTHOG_API_HOST;

interface PosthogIdentifyProps {
  session: Session;
  environmentId?: string;
  organizationId?: string;
  organizationName?: string;
  inAppSurveyBillingStatus?: TSubscriptionStatus;
  linkSurveyBillingStatus?: TSubscriptionStatus;
  userTargetingBillingStatus?: TSubscriptionStatus;
}

export const PosthogIdentify = ({
  session,
  environmentId,
  organizationId,
  organizationName,
  inAppSurveyBillingStatus,
  linkSurveyBillingStatus,
  userTargetingBillingStatus,
}: PosthogIdentifyProps) => {
  const posthog = usePostHog();

  useEffect(() => {
    if (posthogEnabled && session.user && posthog) {
      posthog.identify(session.user.id, {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        objective: session.user.objective,
      });
      if (environmentId) {
        posthog.group("environment", environmentId, { name: environmentId });
      }
      if (organizationId) {
        posthog.group("organization", organizationId, {
          name: organizationName,
          inAppSurveyBillingStatus,
          linkSurveyBillingStatus,
          userTargetingBillingStatus,
        });
      }
    }
  }, [
    posthog,
    session.user,
    environmentId,
    organizationId,
    organizationName,
    inAppSurveyBillingStatus,
    linkSurveyBillingStatus,
    userTargetingBillingStatus,
  ]);

  return null;
};
