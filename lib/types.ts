export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: '13.0.5';
    };
    public: {
        Tables: {
            clients: {
                Row: {
                    address: string | null;
                    company_id: string;
                    created_at: string | null;
                    email: string | null;
                    id: string;
                    name: string;
                    phone: string | null;
                };
                Insert: {
                    address?: string | null;
                    company_id: string;
                    created_at?: string | null;
                    email?: string | null;
                    id?: string;
                    name: string;
                    phone?: string | null;
                };
                Update: {
                    address?: string | null;
                    company_id?: string;
                    created_at?: string | null;
                    email?: string | null;
                    id?: string;
                    name?: string;
                    phone?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'clients_company_id_fkey';
                        columns: ['company_id'];
                        isOneToOne: false;
                        referencedRelation: 'companies';
                        referencedColumns: ['id'];
                    }
                ];
            };
            companies: {
                Row: {
                    address: string | null;
                    created_at: string | null;
                    default_deposit_percent: number | null;
                    default_tax_rate: number | null;
                    email: string | null;
                    id: string;
                    logo_url: string | null;
                    name: string;
                    phone: string | null;
                };
                Insert: {
                    address?: string | null;
                    created_at?: string | null;
                    default_deposit_percent?: number | null;
                    default_tax_rate?: number | null;
                    email?: string | null;
                    id?: string;
                    logo_url?: string | null;
                    name: string;
                    phone?: string | null;
                };
                Update: {
                    address?: string | null;
                    created_at?: string | null;
                    default_deposit_percent?: number | null;
                    default_tax_rate?: number | null;
                    email?: string | null;
                    id?: string;
                    logo_url?: string | null;
                    name?: string;
                    phone?: string | null;
                };
                Relationships: [];
            };
            estimate_items: {
                Row: {
                    description: string;
                    estimate_id: string;
                    id: string;
                    labor_hours: number | null;
                    labor_rate: number | null;
                    line_total: number | null;
                    quantity: number | null;
                    sort_order: number | null;
                    taxable: boolean | null;
                    unit_price: number | null;
                };
                Insert: {
                    description: string;
                    estimate_id: string;
                    id?: string;
                    labor_hours?: number | null;
                    labor_rate?: number | null;
                    line_total?: number | null;
                    quantity?: number | null;
                    sort_order?: number | null;
                    taxable?: boolean | null;
                    unit_price?: number | null;
                };
                Update: {
                    description?: string;
                    estimate_id?: string;
                    id?: string;
                    labor_hours?: number | null;
                    labor_rate?: number | null;
                    line_total?: number | null;
                    quantity?: number | null;
                    sort_order?: number | null;
                    taxable?: boolean | null;
                    unit_price?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'estimate_items_estimate_id_fkey';
                        columns: ['estimate_id'];
                        isOneToOne: false;
                        referencedRelation: 'estimates';
                        referencedColumns: ['id'];
                    }
                ];
            };
            estimates: {
                Row: {
                    accepted_at: string | null;
                    client_id: string | null;
                    company_id: string;
                    created_at: string | null;
                    deposit_amount: number | null;
                    deposit_percent: number | null;
                    estimate_number: string;
                    id: string;
                    notes: string | null;
                    pdf_url: string | null;
                    signature: string | null;
                    status: string | null;
                    subtotal: number;
                    tax: number;
                    terms: string | null;
                    total: number;
                };
                Insert: {
                    accepted_at?: string | null;
                    client_id?: string | null;
                    company_id: string;
                    created_at?: string | null;
                    deposit_amount?: number | null;
                    deposit_percent?: number | null;
                    estimate_number: string;
                    id?: string;
                    notes?: string | null;
                    pdf_url?: string | null;
                    signature?: string | null;
                    status?: string | null;
                    subtotal?: number;
                    tax?: number;
                    terms?: string | null;
                    total?: number;
                };
                Update: {
                    accepted_at?: string | null;
                    client_id?: string | null;
                    company_id?: string;
                    created_at?: string | null;
                    deposit_amount?: number | null;
                    deposit_percent?: number | null;
                    estimate_number?: string;
                    id?: string;
                    notes?: string | null;
                    pdf_url?: string | null;
                    signature?: string | null;
                    status?: string | null;
                    subtotal?: number;
                    tax?: number;
                    terms?: string | null;
                    total?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'estimates_client_id_fkey';
                        columns: ['client_id'];
                        isOneToOne: false;
                        referencedRelation: 'clients';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'estimates_company_id_fkey';
                        columns: ['company_id'];
                        isOneToOne: false;
                        referencedRelation: 'companies';
                        referencedColumns: ['id'];
                    }
                ];
            };
            invoices: {
                Row: {
                    balance_due: number | null;
                    company_id: string;
                    created_at: string | null;
                    due_date: string | null;
                    estimate_id: string | null;
                    id: string;
                    invoice_number: string;
                    paid: number | null;
                    status: string | null;
                    total: number;
                };
                Insert: {
                    balance_due?: number | null;
                    company_id: string;
                    created_at?: string | null;
                    due_date?: string | null;
                    estimate_id?: string | null;
                    id?: string;
                    invoice_number: string;
                    paid?: number | null;
                    status?: string | null;
                    total: number;
                };
                Update: {
                    balance_due?: number | null;
                    company_id?: string;
                    created_at?: string | null;
                    due_date?: string | null;
                    estimate_id?: string | null;
                    id?: string;
                    invoice_number?: string;
                    paid?: number | null;
                    status?: string | null;
                    total?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'invoices_company_id_fkey';
                        columns: ['company_id'];
                        isOneToOne: false;
                        referencedRelation: 'companies';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'invoices_estimate_id_fkey';
                        columns: ['estimate_id'];
                        isOneToOne: false;
                        referencedRelation: 'estimates';
                        referencedColumns: ['id'];
                    }
                ];
            };
            payments: {
                Row: {
                    amount: number;
                    created_at: string | null;
                    estimate_id: string | null;
                    id: string;
                    invoice_id: string | null;
                    payment_method: string | null;
                    status: string | null;
                    stripe_payment_id: string | null;
                };
                Insert: {
                    amount: number;
                    created_at?: string | null;
                    estimate_id?: string | null;
                    id?: string;
                    invoice_id?: string | null;
                    payment_method?: string | null;
                    status?: string | null;
                    stripe_payment_id?: string | null;
                };
                Update: {
                    amount?: number;
                    created_at?: string | null;
                    estimate_id?: string | null;
                    id?: string;
                    invoice_id?: string | null;
                    payment_method?: string | null;
                    status?: string | null;
                    stripe_payment_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'payments_estimate_id_fkey';
                        columns: ['estimate_id'];
                        isOneToOne: false;
                        referencedRelation: 'estimates';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'payments_invoice_id_fkey';
                        columns: ['invoice_id'];
                        isOneToOne: false;
                        referencedRelation: 'invoices';
                        referencedColumns: ['id'];
                    }
                ];
            };
            users: {
                Row: {
                    company_id: string | null;
                    created_at: string | null;
                    email: string;
                    id: string;
                };
                Insert: {
                    company_id?: string | null;
                    created_at?: string | null;
                    email: string;
                    id: string;
                };
                Update: {
                    company_id?: string | null;
                    created_at?: string | null;
                    email?: string;
                    id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'users_company_id_fkey';
                        columns: ['company_id'];
                        isOneToOne: false;
                        referencedRelation: 'companies';
                        referencedColumns: ['id'];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            generate_estimate_number: {
                Args: Record<PropertyKey, never>;
                Returns: string;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
    keyof Database,
    'public'
>];

export type Tables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Update'];

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
    public: {
        Enums: {},
    },
} as const;

export type Client = Tables<'clients'>;
export type Company = Tables<'companies'>;
export type User = Tables<'users'>;
export type Estimate = Tables<'estimates'>;
export type EstimateItem = Tables<'estimate_items'>;
export type Invoice = Tables<'invoices'>;
export type Payment = Tables<'payments'>;
