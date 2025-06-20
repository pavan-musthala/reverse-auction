export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'supplier';
}

export interface ProductRequirement {
  id: string;
  productName: string;
  hsCode: string;
  moq: number;
  description: string;
  images: string[];
  createdAt: Date;
  createdBy: string;
  status: 'open' | 'closed';
}

export interface Bid {
  id: string;
  requirementId: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  timestamp: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'admin' | 'supplier') => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

export interface AuctionContextType {
  requirements: ProductRequirement[];
  bids: Bid[];
  addRequirement: (requirement: Omit<ProductRequirement, 'id' | 'createdAt'>) => void;
  addBid: (bid: Omit<Bid, 'id' | 'timestamp'>) => boolean;
  getRequirementBids: (requirementId: string) => Bid[];
  getLowestBid: (requirementId: string) => Bid | null;
}