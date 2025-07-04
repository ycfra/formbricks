import { getTranslate } from "@/tolgee/server";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { DefaultParamType, TFnType, TranslationKey } from "@tolgee/react/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TResponse } from "@formbricks/types/responses";
import { TSurvey, TSurveyQuestionTypeEnum } from "@formbricks/types/surveys/types";
import { FollowUpEmail } from "./follow-up-email";

vi.mock("@/lib/constants", () => ({
  IS_FORMBRICKS_CLOUD: false,
  FB_LOGO_URL: "https://example.com/mock-logo.png",
  IMPRINT_URL: "https://example.com/imprint",
  PRIVACY_URL: "https://example.com/privacy",
  IMPRINT_ADDRESS: "Imprint Address",
}));

vi.mock("@/tolgee/server", () => ({
  getTranslate: vi.fn(),
}));

vi.mock("@/modules/email/emails/lib/utils", () => ({
  renderEmailResponseValue: vi.fn(() => <p data-testid="response-value">user@example.com</p>),
}));

const defaultProps = {
  followUp: {
    id: "followupid",
    createdAt: new Date(),
    updatedAt: new Date(),
    name: "Follow Up Email",
    trigger: {
      type: "response" as const,
      properties: null,
    },
    action: {
      type: "send-email" as const,
      properties: {
        to: "",
        from: "test@test.com",
        replyTo: ["test@test.com"],
        subject: "Subject",
        body: "<p>Test HTML Content</p>",
        attachResponseData: true,
      },
    },
    surveyId: "surveyid",
  },
  logoUrl: "https://example.com/custom-logo.png",
  attachResponseData: false,
  survey: {
    questions: [
      {
        id: "vjniuob08ggl8dewl0hwed41",
        type: "openText" as TSurveyQuestionTypeEnum.OpenText,
        headline: {
          default: "What would you like to know?‌‌‍‍‌‍‍‍‌‌‌‍‍‌‍‍‌‌‌‌‌‌‍‌‍‌‌",
        },
        required: true,
        charLimit: {},
        inputType: "email",
        longAnswer: false,
        buttonLabel: {
          default: "Next‌‌‍‍‌‍‍‍‌‌‌‍‍‍‌‌‌‌‌‌‌‌‍‌‍‌‌",
        },
        placeholder: {
          default: "example@email.com",
        },
      },
    ],
  } as unknown as TSurvey,
  response: {
    data: {
      vjniuob08ggl8dewl0hwed41: "user@example.com",
    },
    language: null,
  } as unknown as TResponse,
};

describe("FollowUpEmail", () => {
  beforeEach(() => {
    vi.mocked(getTranslate).mockResolvedValue(
      ((key: string) => key) as TFnType<DefaultParamType, string, TranslationKey>
    );
  });

  afterEach(() => {
    cleanup();
  });

  test("renders the default logo if no custom logo is provided", async () => {
    const followUpEmailElement = await FollowUpEmail({
      ...defaultProps,
      logoUrl: undefined,
    });

    render(followUpEmailElement);

    const logoImage = screen.getByAltText("Logo");
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute("src", "https://example.com/mock-logo.png");
  });

  test("renders the custom logo if provided", async () => {
    const followUpEmailElement = await FollowUpEmail({
      ...defaultProps,
    });

    render(followUpEmailElement);

    const logoImage = screen.getByAltText("Logo");
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute("src", "https://example.com/custom-logo.png");
  });

  test("renders the HTML content", async () => {
    const followUpEmailElement = await FollowUpEmail({
      ...defaultProps,
    });

    render(followUpEmailElement);

    expect(screen.getByText("Test HTML Content")).toBeInTheDocument();
  });

  test("renders the footer with imprint and privacy policy links when using default logo", async () => {
    const followUpEmailElement = await FollowUpEmail({
      ...defaultProps,
      logoUrl: undefined, // Using default logo
    });

    render(followUpEmailElement);

    expect(screen.getByText("emails.imprint")).toBeInTheDocument();
    expect(screen.getByText("emails.privacy_policy")).toBeInTheDocument();
    expect(screen.getByText("emails.email_template_text_1")).toBeInTheDocument();
    expect(screen.getByText("Imprint Address")).toBeInTheDocument();
  });

  test("renders the footer with imprint and privacy policy links when using FB_LOGO_URL", async () => {
    const followUpEmailElement = await FollowUpEmail({
      ...defaultProps,
      logoUrl: "https://example.com/mock-logo.png", // Using FB_LOGO_URL
    });

    render(followUpEmailElement);

    expect(screen.getByText("emails.imprint")).toBeInTheDocument();
    expect(screen.getByText("emails.privacy_policy")).toBeInTheDocument();
    expect(screen.getByText("emails.email_template_text_1")).toBeInTheDocument();
    expect(screen.getByText("Imprint Address")).toBeInTheDocument();
  });

  test("does not render the footer when using custom logo (white labeling)", async () => {
    const followUpEmailElement = await FollowUpEmail({
      ...defaultProps,
      logoUrl: "https://example.com/custom-logo.png", // Using custom logo
    });

    render(followUpEmailElement);

    expect(screen.queryByText("emails.imprint")).not.toBeInTheDocument();
    expect(screen.queryByText("emails.privacy_policy")).not.toBeInTheDocument();
    expect(screen.queryByText("emails.email_template_text_1")).not.toBeInTheDocument();
    expect(screen.queryByText("Imprint Address")).not.toBeInTheDocument();
  });

  test("renders the response data if attachResponseData is true", async () => {
    const followUpEmailElement = await FollowUpEmail({
      ...defaultProps,
      attachResponseData: true,
    });

    render(followUpEmailElement);

    expect(screen.getByTestId("response-value")).toBeInTheDocument();
  });
});
