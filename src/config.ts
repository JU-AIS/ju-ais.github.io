// Placeholders: swap one line each when the real value exists.
const hitractClub = 'ju-ai-student-association';

export const config = {
  name: 'Jönköping University AI Student Association',
  shortName: 'JU AIS',
  joinUrl: '/join',
  // Universal link: opens the membership in the HiTract app, 404 in a browser without it.
  membershipUrl: 'https://open.hitract.se/hitclub/2494/memberships/2115',
  // Manual target of /now, the reusable QR code. Empty: the next upcoming event in the HiTract app (or its sign-up), else membershipUrl.
  nowUrl: '' as string,
  appStoreUrl: 'https://apps.apple.com/se/app/hitract/id1494632863',
  googlePlayUrl: 'https://play.google.com/store/apps/details?id=se.hitract.hitract',
  discordUrl: 'https://discord.gg/Jr8uSpJt4S',
  whatsappUrl: 'https://whatsapp.com/channel/0029VbDbmxMLSmbVIB9Nsz2a',
  instagramUrl: 'https://www.instagram.com/juaistudentassociation/',
  githubUrl: 'https://github.com/JU-AIS',
  linkedinUrl: 'https://www.linkedin.com/company/ju-ai-student-association/',
  email: 'ju.ai.student.association@gmail.com',
  partnerEmail: 'ju.ai.student.association@gmail.com',
  partnerFormAction: 'https://docs.google.com/forms/d/e/1FAIpQLSeitmytU7Mz6EYiycImE0cuAYfZlpwyP97Hijm9NEIg-ccsew/formResponse',
  goatcounterUrl: 'https://ju-ais.goatcounter.com/count',
  timeZone: 'Europe/Stockholm',
  hitractClub,
};
