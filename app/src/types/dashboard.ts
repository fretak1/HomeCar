import { PropertyModel } from './property';
import { UserDocument } from './user';

export interface ApplicationModel {
  id: string;
  propertyId: string;
  property?: PropertyModel;
  applicantId: string;
  applicant?: UserDocument;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message?: string;
  createdAt: string;
}

export interface MaintenanceRequestModel {
  id: string;
  propertyId: string;
  property?: PropertyModel;
  requesterId: string;
  requester?: UserDocument;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  images: string[];
  createdAt: string;
}

export interface TransactionModel {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  type: 'RENT_PAYMENT' | 'SECURITY_DEPOSIT' | 'MAINTENANCE_FEE' | 'PAYOUT';
  payerId?: string;
  payer?: UserDocument;
  payeeId?: string;
  payee?: UserDocument;
  propertyId?: string;
  property?: PropertyModel;
  leaseId?: string;
  txRef: string;
  createdAt: string;
}

export interface LeaseModel {
  id: string;
  propertyId: string;
  property?: PropertyModel;
  tenantId: string;
  tenant?: UserDocument;
  startDate: string;
  endDate: string;
  rentAmount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  createdAt: string;
}
