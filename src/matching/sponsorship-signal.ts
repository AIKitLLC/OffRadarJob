export type SponsorshipSignal = "yes" | "no" | "unknown";

const NO_SPONSORSHIP =
  /no sponsorship|cannot sponsor|can't sponsor|unable to sponsor|not able to sponsor|will not sponsor|do not sponsor|not sponsor|without sponsorship|us citizens only|u\.s\. citizens only|must be authorized to work/;

const YES_SPONSORSHIP =
  /visa sponsorship|will sponsor|sponsorship available|sponsor(?:s|ed|ing)? (?:a )?(?:visa|work authorization)|h-1b|h1b|stem opt/;

export function detectSponsorshipSignal(text: string): SponsorshipSignal {
  const normalized = text.toLowerCase();
  if (NO_SPONSORSHIP.test(normalized)) return "no";
  if (YES_SPONSORSHIP.test(normalized)) return "yes";
  return "unknown";
}
