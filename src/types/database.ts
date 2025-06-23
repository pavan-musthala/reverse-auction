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
          images: string[] | null;
          created_by: string | null;
          start_time: string;
          end_time: string;
          status: 'upcoming' | 'open' | 'closed';
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          product_name: string;
          hs_code: string;
          moq: number;
          description: string;
          images?: string[] | null;
          created_by?: string | null;
          start_time: string;
          end_time: string;
          status?: 'upcoming' | 'open' | 'closed';
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          product_name?: string;
          hs_code?: string;
          moq?: number;
          description?: string;
          images?: string[] | null;
          created_by?: string | null;
          start_time?: string;
          end_time?: string;
          status?: 'upcoming' | 'open' | 'closed';
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      bids: {
        Row: {
          id: string;
          requirement_id: string;
          supplier_id: string;
          supplier_name: string;
          amount: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          requirement_id: string;
          supplier_id: string;
          supplier_name: string;
          amount: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          requirement_id?: string;
          supplier_id?: string;
          supplier_name?: string;
          amount?: number;
          created_at?: string | null;
        };
      };
    };
  };
}