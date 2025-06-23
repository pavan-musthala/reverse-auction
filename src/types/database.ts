export interface Database {
  public: {
    Tables: {
      requirements: {
        Row: {
          id: string;
          product_name: string;
          hs_code: string;
          moq: number;
          description: string;
          images: string[];
          created_by: string;
          start_time: string;
          end_time: string;
          status: 'upcoming' | 'open' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_name: string;
          hs_code: string;
          moq: number;
          description: string;
          images?: string[];
          created_by: string;
          start_time: string;
          end_time: string;
          status?: 'upcoming' | 'open' | 'closed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_name?: string;
          hs_code?: string;
          moq?: number;
          description?: string;
          images?: string[];
          created_by?: string;
          start_time?: string;
          end_time?: string;
          status?: 'upcoming' | 'open' | 'closed';
          created_at?: string;
          updated_at?: string;
        };
      };
      bids: {
        Row: {
          id: string;
          requirement_id: string;
          supplier_id: string;
          supplier_name: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          requirement_id: string;
          supplier_id: string;
          supplier_name: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          requirement_id?: string;
          supplier_id?: string;
          supplier_name?: string;
          amount?: number;
          created_at?: string;
        };
      };
    };
  };
}