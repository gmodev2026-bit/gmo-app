export function filterPublicSupplierContacts({
  contactName,
  phone,
  email,
  website,
  isContactNamePublic,
  isPhonePublic,
  isEmailPublic,
  isWebsitePublic
}: {
  contactName: string | null;
  phone: string;
  email: string | null;
  website: string | null;
  isContactNamePublic: boolean;
  isPhonePublic: boolean;
  isEmailPublic: boolean;
  isWebsitePublic: boolean;
}) {
  return {
    contactName: isContactNamePublic ? contactName : null,
    phone: isPhonePublic ? phone : null,
    email: isEmailPublic ? email : null,
    website: isWebsitePublic ? website : null
  };
}
