import type { GovernmentService } from "./types.js";

/**
 * Government Services Database
 * Maps queries to official government services and resources
 */

export const GOVERNMENT_SERVICES: Record<string, GovernmentService> = {
  karnataka_ekhata: {
    id: "karnataka_ekhata",
    name: "eKhata / RTC / Mutation - Karnataka",
    keywords: [
      "ekhata",
      "e khata",
      "e-khata",
      "khata",
      "rtc",
      "pahani",
      "mutation",
      "karnataka land records",
      "bhoomi",
      "kaveri",
      "e swathu",
      "eswathu",
      "bbmp khata",
      "karnataka property records"
    ],
    description: "Access Karnataka property records and related services including eKhata, RTC/Pahani, and mutation via official state portals.",
    category: "Property",
    state: "Karnataka",
    requirements: [
      "Survey number / Property ID / Khata number",
      "Owner details",
      "Sale deed / title documents (for application or transfer)",
      "Identity proof",
      "Supporting tax receipts where applicable"
    ],
    processingTime: "Varies by local body and request type (typically a few days to several weeks)",
    officialLinks: [
      "https://kaveri.karnataka.gov.in/",
      "https://landrecords.karnataka.gov.in/",
      "https://eswathu.karnataka.gov.in/",
      "https://bbmp.gov.in/",
      "https://sakala.karnataka.gov.in/"
    ],
    relatedServices: ["property_registration", "encumbrance_certificate"]
  },

  marks_card: {
    id: "marks_card",
    name: "Marks Card / Score Card Retrieval",
    keywords: ["marks card", "score card", "10th marks", "12th marks", "board marks", "lost marks card", "duplicate marks"],
    description: "Get duplicate or replacement marks card from education board",
    category: "Education",
    requirements: [
      "Admission number",
      "Date of birth",
      "ID proof",
      "Affidavit (if lost)"
    ],
    processingTime: "5-15 working days",
    officialLinks: [
      "https://cbse.gov.in/",
      "https://www.result.nic.in/"
    ],
    relatedServices: ["duplicate_certificate", "transcripts"]
  },

  aadhaar_update: {
    id: "aadhaar_update",
    name: "Aadhaar Update",
    keywords: ["aadhaar update", "aadhar correction", "aadhaar change", "update aadhar", "modify aadhar"],
    description: "Update or correct details in Aadhaar card",
    category: "Identity",
    requirements: [
      "Aadhaar number",
      "Original proof of identity",
      "Original proof of address",
      "Mobile number linked to Aadhaar"
    ],
    processingTime: "15-30 days",
    officialLinks: [
      "https://uidai.gov.in/",
      "https://resident.uidai.gov.in/"
    ],
    relatedServices: ["pan_correction", "passport_application"]
  },

  pan_correction: {
    id: "pan_correction",
    name: "PAN Card Correction",
    keywords: ["pan card correction", "pan correction", "update pan", "modify pan"],
    description: "Correct or update information on PAN card",
    category: "Tax/Finance",
    requirements: [
      "PAN card",
      "Proof of identity",
      "Proof of address",
      "Form ITR or other relevant documents"
    ],
    processingTime: "3-5 days",
    officialLinks: [
      "https://www.incometaxindiaefiling.gov.in/",
      "https://www.pan.gov.in/"
    ],
    relatedServices: ["aadhaar_update"]
  },

  encumbrance_certificate: {
    id: "encumbrance_certificate",
    name: "Encumbrance Certificate (EC)",
    keywords: ["encumbrance certificate", "ec", "encumbrance", "property certificate", "non-encumbered"],
    description: "Obtain Encumbrance Certificate for property verification",
    category: "Property",
    requirements: [
      "Survey number",
      "Property details",
      "Ownership proof"
    ],
    processingTime: "1-7 days",
    officialLinks: [
      "https://ror.tn.gov.in/",
      "https://mahabhumi.mahaitc.in/"
    ],
    relatedServices: ["property_registration", "title_deed"]
  },

  income_certificate: {
    id: "income_certificate",
    name: "Income Certificate",
    keywords: ["income certificate", "income proof", "salary certificate"],
    description: "Get income certificate for education/job applications",
    category: "Administrative",
    requirements: [
      "Identity proof",
      "Address proof",
      "Tax returns (if available)",
      "Employment letter"
    ],
    processingTime: "3-7 days",
    officialLinks: [
      "https://www.edistrict.gov.in/",
      "https://onlineservices.nta.ac.in/"
    ],
    relatedServices: ["caste_certificate", "residence_certificate"]
  },

  caste_certificate: {
    id: "caste_certificate",
    name: "Caste Certificate",
    keywords: ["caste certificate", "sc st certificate", "obc certificate"],
    description: "Obtain caste certificate for educational/job benefits",
    category: "Administrative",
    requirements: [
      "Identity proof",
      "Address proof",
      "Father's name",
      "Caste details",
      "Affidavit if required"
    ],
    processingTime: "5-15 days",
    officialLinks: [
      "https://www.edistrict.gov.in/",
      "https://socialjustice.gov.in/"
    ],
    relatedServices: ["income_certificate", "residence_certificate"]
  },

  passport_application: {
    id: "passport_application",
    name: "Passport Application / Renewal",
    keywords: ["passport", "passport application", "passport renewal", "passport update"],
    description: "Apply for new passport or renew existing passport",
    category: "Travel",
    requirements: [
      "Birth certificate or Aadhaar",
      "Address proof",
      "PAN card",
      "Photographs",
      "Police clearance (if applicable)"
    ],
    processingTime: "10-15 days (normal), 3-5 days (expedited)",
    officialLinks: [
      "https://www.passportindia.gov.in/",
      "https://portal1.passportindia.gov.in/"
    ],
    relatedServices: ["aadhaar_update", "pan_correction"]
  },

  driving_license_renewal: {
    id: "driving_license_renewal",
    name: "Driving License Renewal",
    keywords: ["driving license renewal", "dl renewal", "license renewal", "driving license expire"],
    description: "Renew expired or expiring driving license",
    category: "Transport",
    requirements: [
      "Current driving license",
      "Form 8 (for renewal)",
      "Medical fitness certificate",
      "Address proof",
      "Photographs"
    ],
    processingTime: "3-7 days",
    officialLinks: [
      "https://vahan.nic.in/",
      "https://sarthi.parivahan.gov.in/"
    ],
    relatedServices: ["vehicle_registration"]
  },

  property_registration: {
    id: "property_registration",
    name: "Property Registration",
    keywords: ["property registration", "register property", "document registration"],
    description: "Register property deed and ownership documents",
    category: "Property",
    requirements: [
      "Purchase deed",
      "ID proofs of buyer and seller",
      "Survey details",
      "Tax payment proof"
    ],
    processingTime: "1-2 weeks",
    officialLinks: [
      "https://ror.tn.gov.in/",
      "https://mahabhumi.mahaitc.in/"
    ],
    relatedServices: ["encumbrance_certificate", "title_deed"]
  },

  birth_certificate: {
    id: "birth_certificate",
    name: "Birth Certificate",
    keywords: ["birth certificate", "duplicate birth certificate", "birth certificate application"],
    description: "Apply for or get duplicate birth certificate",
    category: "Administrative",
    requirements: [
      "Hospital records (for new)",
      "Identification proof",
      "Address proof",
      "Registration number (if duplicate)"
    ],
    processingTime: "2-5 days",
    officialLinks: [
      "https://crsorgi.gov.in/",
      "https://www.edistrict.gov.in/"
    ],
    relatedServices: ["marriage_certificate", "death_certificate"]
  },

  marriage_certificate: {
    id: "marriage_certificate",
    name: "Marriage Certificate",
    keywords: ["marriage certificate", "marriage registration", "duplicate marriage certificate"],
    description: "Register or get duplicate marriage certificate",
    category: "Administrative",
    requirements: [
      "Marriage invitation/invitation card",
      "ID proofs of both spouses",
      "Address proofs",
      "Photographs"
    ],
    processingTime: "3-7 days",
    officialLinks: [
      "https://crsorgi.gov.in/",
      "https://www.edistrict.gov.in/"
    ],
    relatedServices: ["birth_certificate", "divorce_certificate"]
  },

  duplicate_certificate: {
    id: "duplicate_certificate",
    name: "Duplicate/Replacement of Any Certificate",
    keywords: ["duplicate certificate", "replacement certificate", "lost certificate"],
    description: "Get duplicate of any official/educational certificate",
    category: "Administrative",
    requirements: [
      "Original receipt or registration",
      "ID proof",
      "Lost/Damage affidavit"
    ],
    processingTime: "5-10 days",
    officialLinks: [
      "https://www.edistrict.gov.in/ ",
      "https://www.crsorgi.gov.in/"
    ],
    relatedServices: ["marks_card"]
  }
};

/**
 * Find matching government service from query
 */
export function findGovernmentService(query: string): GovernmentService | null {
  const lowerQuery = query.toLowerCase();

  for (const service of Object.values(GOVERNMENT_SERVICES)) {
    // Check if any keyword matches
    for (const keyword of service.keywords) {
      if (lowerQuery.includes(keyword)) {
        return service;
      }
    }
  }

  return null;
}

/**
 * Get related services
 */
export function getRelatedServices(serviceId: string): GovernmentService[] {
  const service = GOVERNMENT_SERVICES[serviceId];
  if (!service) return [];

  return service.relatedServices
    .map(id => GOVERNMENT_SERVICES[id])
    .filter(Boolean);
}

/**
 * Search services by category
 */
export function searchServicesByCategory(category: string): GovernmentService[] {
  return Object.values(GOVERNMENT_SERVICES).filter(
    s => s.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get all service categories
 */
export function getAllCategories(): string[] {
  const categories = new Set(Object.values(GOVERNMENT_SERVICES).map(s => s.category));
  return Array.from(categories).sort();
}
