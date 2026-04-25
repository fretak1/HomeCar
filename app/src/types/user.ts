export interface UserDocument {
  id: string;
  type: string;
  url: string;
  verified: boolean;
}

export type UserRole = 'CUSTOMER' | 'OWNER' | 'AGENT' | 'ADMIN';

export interface UserModel {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  verified: boolean;
  rejectionReason?: string;
  chapaSubaccountId?: string;
  payoutBankCode?: string;
  payoutAccountNumber?: string;
  payoutAccountName?: string;
  verificationPhoto?: string;
  marriageStatus?: string;
  kids?: string;
  gender?: string;
  employmentStatus?: string;
  createdAt?: string;
  documents: UserDocument[];
}

export const isOwnerOrAgent = (user?: UserModel | null) => {
  if (!user) return false;
  const role = user.role.toUpperCase();
  return role === 'OWNER' || role === 'AGENT' || role === 'ADMIN';
};

export const isAdmin = (user?: UserModel | null) => user?.role.toUpperCase() === 'ADMIN';
export const isCustomer = (user?: UserModel | null) => user?.role.toUpperCase() === 'CUSTOMER';
export const isOwner = (user?: UserModel | null) => user?.role.toUpperCase() === 'OWNER';
export const isAgent = (user?: UserModel | null) => user?.role.toUpperCase() === 'AGENT';
