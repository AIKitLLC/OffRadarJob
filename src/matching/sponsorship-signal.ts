export type SponsorshipSignal = "yes" | "no" | "unknown";

const NO_SPONSORSHIP =
  /no sponsorship|cannot sponsor|can't sponsor|unable to sponsor|not able to sponsor|will not sponsor|do not sponsor|not sponsor|without sponsorship|us citizens? only|u\.s\. citizens? only|us person only|u\.s\. person only|green card or u\.s\. citizen|must hold (?:an? )?(?:active )?(?:top secret|secret|ts\/sci|security clearance)|security clearance required|\bts\/sci\b|\bitar\b|authorized to work in the u\.?s\.? without sponsorship|must be authorized to work/;

const YES_SPONSORSHIP =
  /visa sponsorship|will sponsor|sponsorship available|sponsor(?:s|ed|ing)? (?:a )?(?:visa|work authorization)|h-?1b(?: transfer| visa)?|cap-exempt|f-?1 opt|stem opt|e-?3 visa|tn visa|o-?1 visa|green card sponsorship/;

export function detectSponsorshipSignal(text: string): SponsorshipSignal {
  const normalized = text.toLowerCase();
  if (NO_SPONSORSHIP.test(normalized)) return "no";
  if (YES_SPONSORSHIP.test(normalized)) return "yes";
  return "unknown";
}
