export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          entity_type: string
          entity_id: string
          old_values: Json | null
          new_values: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          entity_type: string
          entity_id: string
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      cashier_session_movements: {
        Row: {
          id: string
          cashier_session_id: string
          event_id: string
          movement_type: Database['public']['Enums']['cashier_session_movement_type']
          amount: number
          description: string
          admin_user_id: string | null
          recorded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          cashier_session_id: string
          event_id: string
          movement_type: Database['public']['Enums']['cashier_session_movement_type']
          amount: number
          description: string
          admin_user_id?: string | null
          recorded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          cashier_session_id?: string
          event_id?: string
          movement_type?: Database['public']['Enums']['cashier_session_movement_type']
          amount?: number
          description?: string
          admin_user_id?: string | null
          recorded_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cashier_session_movements_cashier_session_id_fkey'
            columns: ['cashier_session_id']
            isOneToOne: false
            referencedRelation: 'cashier_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cashier_session_movements_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cashier_session_movements_admin_user_id_fkey'
            columns: ['admin_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cashier_session_movements_recorded_by_fkey'
            columns: ['recorded_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      cashier_sessions: {
        Row: {
          id: string
          event_id: string
          staff_user_id: string
          opening_float_amount: number
          opening_float_default: number
          opening_float_note: string | null
          status: Database['public']['Enums']['cashier_session_status']
          opened_at: string
          closed_at: string | null
          closing_counted_cash: number | null
          closing_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          staff_user_id: string
          opening_float_amount: number
          opening_float_default?: number
          opening_float_note?: string | null
          status?: Database['public']['Enums']['cashier_session_status']
          opened_at?: string
          closed_at?: string | null
          closing_counted_cash?: number | null
          closing_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          staff_user_id?: string
          opening_float_amount?: number
          opening_float_default?: number
          opening_float_note?: string | null
          status?: Database['public']['Enums']['cashier_session_status']
          opened_at?: string
          closed_at?: string | null
          closing_counted_cash?: number | null
          closing_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cashier_sessions_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cashier_sessions_staff_user_id_fkey'
            columns: ['staff_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      permissions: {
        Row: {
          id: string
          description: string
          created_at: string
        }
        Insert: {
          id: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          description?: string
          created_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          role: Database['public']['Enums']['app_role']
          permission_id: string
        }
        Insert: {
          role: Database['public']['Enums']['app_role']
          permission_id: string
        }
        Update: {
          role?: Database['public']['Enums']['app_role']
          permission_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          user_id: string
          permission_id: string
        }
        Insert: {
          user_id: string
          permission_id: string
        }
        Update: {
          user_id?: string
          permission_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          key: string
          value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          role: Database['public']['Enums']['app_role']
          display_name: string | null
          is_active: boolean
          deactivated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: Database['public']['Enums']['app_role']
          display_name?: string | null
          is_active?: boolean
          deactivated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: Database['public']['Enums']['app_role']
          display_name?: string | null
          is_active?: boolean
          deactivated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      promoters: {
        Row: {
          id: string
          user_id: string | null
          name: string
          contact_person: string | null
          phone: string | null
          email: string | null
          address: string | null
          status: Database['public']['Enums']['promoter_status']
          commission_type: Database['public']['Enums']['commission_type']
          commission_value: number | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          status?: Database['public']['Enums']['promoter_status']
          commission_type?: Database['public']['Enums']['commission_type']
          commission_value?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          status?: Database['public']['Enums']['promoter_status']
          commission_type?: Database['public']['Enums']['commission_type']
          commission_value?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          promoter_id: string | null
          name: string
          venue: string
          event_date: string
          registration_deadline: string | null
          event_type: Database['public']['Enums']['event_type']
          derby_format: Database['public']['Enums']['derby_format'] | null
          derby_type: Database['public']['Enums']['derby_age_type'] | null
          allowed_age_classes: string[] | null
          min_weight_grams: number | null
          max_weight_grams: number | null
          match_weight_tolerance_grams: number | null
          weight_verification_required: boolean
          require_rooster_entry_approval: boolean
          require_separate_entry_approver: boolean
          allow_conditional_approval: boolean
          conditionally_approved_match_handling: Database['public']['Enums']['conditionally_approved_match_handling']
          eligibility_enforcement_enabled: boolean
          classification_matching_enabled: boolean
          unknown_value_handling: Database['public']['Enums']['unknown_value_handling']
          approval_config: Json
          entry_fee: number
          registration_fee_enabled: boolean
          registration_fee_amount: number
          rooster_entry_fee_enabled: boolean
          rooster_entry_fee_amount: number
          cash_bond_enabled: boolean
          cash_bond_amount: number
          tax_per_fight: number
          tax_commission: number
          physical_inspection_required: boolean
          revolving_fund_initial: number
          cashier_opening_float_default: number
          min_entries: number | null
          max_entries: number | null
          cocks_per_entry: number
          min_weight: number | null
          max_weight: number | null
          scoring_system: Database['public']['Enums']['scoring_system']
          draw_rule: string
          tie_breaker_rule: string
          status: Database['public']['Enums']['event_status']
          is_active: boolean
          guaranteed_prize_amount: number | null
          house_deduction: number | null
          venue_share: number | null
          registration_rules: string | null
          legal_authorized: boolean
          is_public: boolean
          publish_matches: boolean
          publish_standings: boolean
          publish_winners: boolean
          publish_prize_amounts: boolean
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          promoter_id?: string | null
          name: string
          venue: string
          event_date: string
          registration_deadline?: string | null
          event_type?: Database['public']['Enums']['event_type']
          derby_format?: Database['public']['Enums']['derby_format'] | null
          derby_type?: Database['public']['Enums']['derby_age_type'] | null
          allowed_age_classes?: string[] | null
          min_weight_grams?: number | null
          max_weight_grams?: number | null
          match_weight_tolerance_grams?: number | null
          weight_verification_required?: boolean
          require_rooster_entry_approval?: boolean
          require_separate_entry_approver?: boolean
          allow_conditional_approval?: boolean
          conditionally_approved_match_handling?: Database['public']['Enums']['conditionally_approved_match_handling']
          eligibility_enforcement_enabled?: boolean
          classification_matching_enabled?: boolean
          unknown_value_handling?: Database['public']['Enums']['unknown_value_handling']
          approval_config?: Json
          entry_fee?: number
          registration_fee_enabled?: boolean
          registration_fee_amount?: number
          rooster_entry_fee_enabled?: boolean
          rooster_entry_fee_amount?: number
          cash_bond_enabled?: boolean
          cash_bond_amount?: number
          tax_per_fight?: number
          tax_commission?: number
          physical_inspection_required?: boolean
          revolving_fund_initial?: number
          cashier_opening_float_default?: number
          min_entries?: number | null
          max_entries?: number | null
          cocks_per_entry?: number
          min_weight?: number | null
          max_weight?: number | null
          scoring_system?: Database['public']['Enums']['scoring_system']
          draw_rule?: string
          tie_breaker_rule?: string
          status?: Database['public']['Enums']['event_status']
          is_active?: boolean
          guaranteed_prize_amount?: number | null
          house_deduction?: number | null
          venue_share?: number | null
          registration_rules?: string | null
          legal_authorized?: boolean
          is_public?: boolean
          publish_matches?: boolean
          publish_standings?: boolean
          publish_winners?: boolean
          publish_prize_amounts?: boolean
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          promoter_id?: string | null
          name?: string
          venue?: string
          event_date?: string
          registration_deadline?: string | null
          event_type?: Database['public']['Enums']['event_type']
          derby_format?: Database['public']['Enums']['derby_format'] | null
          derby_type?: Database['public']['Enums']['derby_age_type'] | null
          allowed_age_classes?: string[] | null
          min_weight_grams?: number | null
          max_weight_grams?: number | null
          match_weight_tolerance_grams?: number | null
          weight_verification_required?: boolean
          require_rooster_entry_approval?: boolean
          require_separate_entry_approver?: boolean
          allow_conditional_approval?: boolean
          conditionally_approved_match_handling?: Database['public']['Enums']['conditionally_approved_match_handling']
          eligibility_enforcement_enabled?: boolean
          classification_matching_enabled?: boolean
          unknown_value_handling?: Database['public']['Enums']['unknown_value_handling']
          approval_config?: Json
          entry_fee?: number
          registration_fee_enabled?: boolean
          registration_fee_amount?: number
          rooster_entry_fee_enabled?: boolean
          rooster_entry_fee_amount?: number
          cash_bond_enabled?: boolean
          cash_bond_amount?: number
          tax_per_fight?: number
          tax_commission?: number
          physical_inspection_required?: boolean
          revolving_fund_initial?: number
          cashier_opening_float_default?: number
          min_entries?: number | null
          max_entries?: number | null
          cocks_per_entry?: number
          min_weight?: number | null
          max_weight?: number | null
          scoring_system?: Database['public']['Enums']['scoring_system']
          draw_rule?: string
          tie_breaker_rule?: string
          status?: Database['public']['Enums']['event_status']
          is_active?: boolean
          guaranteed_prize_amount?: number | null
          house_deduction?: number | null
          venue_share?: number | null
          registration_rules?: string | null
          legal_authorized?: boolean
          is_public?: boolean
          publish_matches?: boolean
          publish_standings?: boolean
          publish_winners?: boolean
          publish_prize_amounts?: boolean
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'events_promoter_id_fkey'
            columns: ['promoter_id']
            isOneToOne: false
            referencedRelation: 'promoters'
            referencedColumns: ['id']
          },
        ]
      }
      prize_structures: {
        Row: {
          id: string
          event_id: string
          prize_type: Database['public']['Enums']['prize_type']
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          prize_type?: Database['public']['Enums']['prize_type']
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          prize_type?: Database['public']['Enums']['prize_type']
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      competitors: {
        Row: {
          id: string
          display_name: string
          contact_full_name: string | null
          contact_designation: string | null
          contact_number: string | null
          email: string | null
          address: string | null
          competitor_level: Database['public']['Enums']['competitor_level']
          suggested_competitor_level: Database['public']['Enums']['competitor_level'] | null
          competitor_level_assigned_by: string | null
          competitor_level_assigned_at: string | null
          competitor_level_notes: string | null
          notes: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          display_name: string
          contact_full_name?: string | null
          contact_designation?: string | null
          contact_number?: string | null
          email?: string | null
          address?: string | null
          competitor_level?: Database['public']['Enums']['competitor_level']
          suggested_competitor_level?: Database['public']['Enums']['competitor_level'] | null
          competitor_level_assigned_by?: string | null
          competitor_level_assigned_at?: string | null
          competitor_level_notes?: string | null
          notes?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          display_name?: string
          contact_full_name?: string | null
          contact_designation?: string | null
          contact_number?: string | null
          email?: string | null
          address?: string | null
          competitor_level?: Database['public']['Enums']['competitor_level']
          suggested_competitor_level?: Database['public']['Enums']['competitor_level'] | null
          competitor_level_assigned_by?: string | null
          competitor_level_assigned_at?: string | null
          competitor_level_notes?: string | null
          notes?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      entries: {
        Row: {
          id: string
          event_id: string
          referred_by_promoter_id: string | null
          competitor_id: string | null
          entry_number: string
          entry_name: string
          owner_name: string
          contact_full_name: string | null
          contact_designation: string | null
          contact_number: string | null
          email: string | null
          address: string | null
          entry_source: Database['public']['Enums']['entry_source'] | null
          registration_status: Database['public']['Enums']['registration_status']
          payment_status: Database['public']['Enums']['payment_status']
          owner_barcode: string | null
          fee_snapshot: Json | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          referred_by_promoter_id?: string | null
          competitor_id?: string | null
          entry_number: string
          entry_name: string
          owner_name: string
          contact_full_name?: string | null
          contact_designation?: string | null
          contact_number?: string | null
          email?: string | null
          address?: string | null
          entry_source?: Database['public']['Enums']['entry_source'] | null
          registration_status?: Database['public']['Enums']['registration_status']
          payment_status?: Database['public']['Enums']['payment_status']
          owner_barcode?: string | null
          fee_snapshot?: Json | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          referred_by_promoter_id?: string | null
          competitor_id?: string | null
          entry_number?: string
          entry_name?: string
          owner_name?: string
          contact_full_name?: string | null
          contact_designation?: string | null
          contact_number?: string | null
          email?: string | null
          address?: string | null
          entry_source?: Database['public']['Enums']['entry_source'] | null
          registration_status?: Database['public']['Enums']['registration_status']
          payment_status?: Database['public']['Enums']['payment_status']
          owner_barcode?: string | null
          fee_snapshot?: Json | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'entries_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'entries_referred_by_promoter_id_fkey'
            columns: ['referred_by_promoter_id']
            isOneToOne: false
            referencedRelation: 'promoters'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'entries_competitor_id_fkey'
            columns: ['competitor_id']
            isOneToOne: false
            referencedRelation: 'competitors'
            referencedColumns: ['id']
          },
        ]
      }
      entry_fee_adjustment_lines: {
        Row: {
          id: string
          adjustment_id: string
          entry_id: string
          previous_amount_due: number
          new_amount_due: number
          amount_paid: number
          delta: number
          created_at: string
        }
        Insert: {
          id?: string
          adjustment_id: string
          entry_id: string
          previous_amount_due: number
          new_amount_due: number
          amount_paid?: number
          delta: number
          created_at?: string
        }
        Update: {
          id?: string
          adjustment_id?: string
          entry_id?: string
          previous_amount_due?: number
          new_amount_due?: number
          amount_paid?: number
          delta?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'entry_fee_adjustment_lines_adjustment_id_fkey'
            columns: ['adjustment_id']
            isOneToOne: false
            referencedRelation: 'event_fee_adjustments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'entry_fee_adjustment_lines_entry_id_fkey'
            columns: ['entry_id']
            isOneToOne: false
            referencedRelation: 'entries'
            referencedColumns: ['id']
          },
        ]
      }
      event_revolving_fund_ledger: {
        Row: {
          id: string
          event_id: string
          entry_type: Database['public']['Enums']['revolving_fund_entry_type']
          amount: number
          balance_after: number
          description: string | null
          source_payment_id: string | null
          cashier_session_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          entry_type: Database['public']['Enums']['revolving_fund_entry_type']
          amount: number
          balance_after: number
          description?: string | null
          source_payment_id?: string | null
          cashier_session_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          entry_type?: Database['public']['Enums']['revolving_fund_entry_type']
          amount?: number
          balance_after?: number
          description?: string | null
          source_payment_id?: string | null
          cashier_session_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_revolving_fund_ledger_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'event_revolving_fund_ledger_source_payment_id_fkey'
            columns: ['source_payment_id']
            isOneToOne: false
            referencedRelation: 'payments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'event_revolving_fund_ledger_cashier_session_id_fkey'
            columns: ['cashier_session_id']
            isOneToOne: false
            referencedRelation: 'cashier_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      event_fee_adjustments: {
        Row: {
          id: string
          event_id: string
          changed_by: string | null
          previous_settings: Json
          new_settings: Json
          entries_with_payments_count: number
          total_refund_due: number
          total_collect_due: number
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          changed_by?: string | null
          previous_settings: Json
          new_settings: Json
          entries_with_payments_count?: number
          total_refund_due?: number
          total_collect_due?: number
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          changed_by?: string | null
          previous_settings?: Json
          new_settings?: Json
          entries_with_payments_count?: number
          total_refund_due?: number
          total_collect_due?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_fee_adjustments_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          id: string
          payment_reference: string
          entry_id: string
          event_id: string
          amount_due: number
          amount_paid: number
          amount_tendered: number | null
          change_given: number | null
          balance: number
          payment_method: Database['public']['Enums']['payment_method'] | null
          receipt_number: string | null
          payment_status: Database['public']['Enums']['payment_status']
          payment_category: Database['public']['Enums']['payment_category']
          receipt_path: string | null
          received_by: string | null
          cashier_session_id: string | null
          paid_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          payment_reference: string
          entry_id: string
          event_id: string
          amount_due: number
          amount_paid?: number
          amount_tendered?: number | null
          change_given?: number | null
          balance?: number
          payment_method?: Database['public']['Enums']['payment_method'] | null
          receipt_number?: string | null
          payment_status?: Database['public']['Enums']['payment_status']
          payment_category?: Database['public']['Enums']['payment_category']
          receipt_path?: string | null
          received_by?: string | null
          cashier_session_id?: string | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          payment_reference?: string
          entry_id?: string
          event_id?: string
          amount_due?: number
          amount_paid?: number
          amount_tendered?: number | null
          change_given?: number | null
          balance?: number
          payment_method?: Database['public']['Enums']['payment_method'] | null
          receipt_number?: string | null
          payment_status?: Database['public']['Enums']['payment_status']
          payment_category?: Database['public']['Enums']['payment_category']
          receipt_path?: string | null
          received_by?: string | null
          cashier_session_id?: string | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_entry_id_fkey'
            columns: ['entry_id']
            isOneToOne: false
            referencedRelation: 'entries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_cashier_session_id_fkey'
            columns: ['cashier_session_id']
            isOneToOne: false
            referencedRelation: 'cashier_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      reference_values: {
        Row: {
          id: string
          kind: Database['public']['Enums']['reference_value_kind']
          name: string
          normalized_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          kind: Database['public']['Enums']['reference_value_kind']
          name: string
          normalized_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          kind?: Database['public']['Enums']['reference_value_kind']
          name?: string
          normalized_name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      rooster_event_registrations: {
        Row: {
          id: string
          entry_id: string
          event_id: string
          registry_rooster_id: string | null
          cock_number: number
          band_number: string
          declared_weight: number | null
          category: string | null
          color_marking: string | null
          status: Database['public']['Enums']['lineup_status']
          entry_rooster_role: Database['public']['Enums']['entry_rooster_role']
          registration_status: Database['public']['Enums']['registration_workflow_status']
          approval_status: Database['public']['Enums']['rooster_approval_status']
          eligibility_status: Database['public']['Enums']['eligibility_status']
          inspection_status: Database['public']['Enums']['inspection_status']
          reg_payment_status: Database['public']['Enums']['registration_payment_status']
          eligibility_snapshot: Json | null
          eligibility_checked_at: string | null
          eligibility_checked_by: string | null
          submitted_by: string | null
          submitted_at: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          approved_by: string | null
          approved_at: string | null
          approval_notes: string | null
          rejected_by: string | null
          rejected_at: string | null
          rejection_category: Database['public']['Enums']['rejection_category'] | null
          rejection_reason: string | null
          eligibility_override_reason: string | null
          eligibility_override_approved_by: string | null
          eligibility_override_approved_at: string | null
          withdrawn_by: string | null
          withdrawn_at: string | null
          withdrawal_reason: string | null
          disqualified_by: string | null
          disqualified_at: string | null
          disqualification_reason: string | null
          conditional_approval_condition: string | null
          conditional_approval_deadline: string | null
          declared_weight_grams: number | null
          official_weight_grams: number | null
          weighed_at: string | null
          weighed_by: string | null
          weight_verified: boolean
          weight_verification_status: Database['public']['Enums']['weight_status'] | null
          weight_notes: string | null
          cock_entry_barcode: string | null
          handler_name: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          entry_id: string
          event_id: string
          registry_rooster_id?: string | null
          cock_number: number
          band_number: string
          declared_weight?: number | null
          category?: string | null
          color_marking?: string | null
          notes?: string | null
          status?: Database['public']['Enums']['lineup_status']
          entry_rooster_role?: Database['public']['Enums']['entry_rooster_role']
          registration_status?: Database['public']['Enums']['registration_workflow_status']
          approval_status?: Database['public']['Enums']['rooster_approval_status']
          eligibility_status?: Database['public']['Enums']['eligibility_status']
          inspection_status?: Database['public']['Enums']['inspection_status']
          reg_payment_status?: Database['public']['Enums']['registration_payment_status']
          eligibility_snapshot?: Json | null
          eligibility_checked_at?: string | null
          eligibility_checked_by?: string | null
          submitted_by?: string | null
          submitted_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          approval_notes?: string | null
          rejected_by?: string | null
          rejected_at?: string | null
          rejection_category?: Database['public']['Enums']['rejection_category'] | null
          rejection_reason?: string | null
          eligibility_override_reason?: string | null
          eligibility_override_approved_by?: string | null
          eligibility_override_approved_at?: string | null
          withdrawn_by?: string | null
          withdrawn_at?: string | null
          withdrawal_reason?: string | null
          disqualified_by?: string | null
          disqualified_at?: string | null
          disqualification_reason?: string | null
          conditional_approval_condition?: string | null
          conditional_approval_deadline?: string | null
          declared_weight_grams?: number | null
          official_weight_grams?: number | null
          weighed_at?: string | null
          weighed_by?: string | null
          weight_verified?: boolean
          weight_verification_status?: Database['public']['Enums']['weight_status'] | null
          weight_notes?: string | null
          cock_entry_barcode?: string | null
          handler_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          entry_id?: string
          event_id?: string
          registry_rooster_id?: string | null
          cock_number?: number
          band_number?: string
          declared_weight?: number | null
          category?: string | null
          color_marking?: string | null
          notes?: string | null
          status?: Database['public']['Enums']['lineup_status']
          entry_rooster_role?: Database['public']['Enums']['entry_rooster_role']
          registration_status?: Database['public']['Enums']['registration_workflow_status']
          approval_status?: Database['public']['Enums']['rooster_approval_status']
          eligibility_status?: Database['public']['Enums']['eligibility_status']
          inspection_status?: Database['public']['Enums']['inspection_status']
          reg_payment_status?: Database['public']['Enums']['registration_payment_status']
          eligibility_snapshot?: Json | null
          eligibility_checked_at?: string | null
          eligibility_checked_by?: string | null
          submitted_by?: string | null
          submitted_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          approval_notes?: string | null
          rejected_by?: string | null
          rejected_at?: string | null
          rejection_category?: Database['public']['Enums']['rejection_category'] | null
          rejection_reason?: string | null
          eligibility_override_reason?: string | null
          eligibility_override_approved_by?: string | null
          eligibility_override_approved_at?: string | null
          withdrawn_by?: string | null
          withdrawn_at?: string | null
          withdrawal_reason?: string | null
          disqualified_by?: string | null
          disqualified_at?: string | null
          disqualification_reason?: string | null
          conditional_approval_condition?: string | null
          conditional_approval_deadline?: string | null
          declared_weight_grams?: number | null
          official_weight_grams?: number | null
          weighed_at?: string | null
          weighed_by?: string | null
          weight_verified?: boolean
          weight_verification_status?: Database['public']['Enums']['weight_status'] | null
          weight_notes?: string | null
          cock_entry_barcode?: string | null
          handler_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rooster_event_registrations_entry_id_fkey'
            columns: ['entry_id']
            isOneToOne: false
            referencedRelation: 'entries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rooster_event_registrations_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      weighings: {
        Row: {
          id: string
          rooster_event_registration_id: string
          entry_id: string
          event_id: string
          official_weight: number | null
          official_weight_grams: number | null
          weight_status: Database['public']['Enums']['weight_status']
          verified_by: string | null
          verified_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rooster_event_registration_id: string
          entry_id: string
          event_id: string
          official_weight?: number | null
          official_weight_grams?: number | null
          weight_status?: Database['public']['Enums']['weight_status']
          verified_by?: string | null
          verified_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rooster_event_registration_id?: string
          entry_id?: string
          event_id?: string
          official_weight?: number | null
          official_weight_grams?: number | null
          weight_status?: Database['public']['Enums']['weight_status']
          verified_by?: string | null
          verified_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'weighings_rooster_event_registration_id_fkey'
            columns: ['rooster_event_registration_id']
            isOneToOne: true
            referencedRelation: 'rooster_event_registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'weighings_entry_id_fkey'
            columns: ['entry_id']
            isOneToOne: false
            referencedRelation: 'entries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'weighings_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      match_bets: {
        Row: {
          id: string
          match_id: string
          event_id: string
          side: Database['public']['Enums']['fight_side']
          amount: number
          recorded_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          event_id: string
          side: Database['public']['Enums']['fight_side']
          amount?: number
          recorded_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          event_id?: string
          side?: Database['public']['Enums']['fight_side']
          amount?: number
          recorded_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'match_bets_match_id_fkey'
            columns: ['match_id']
            isOneToOne: false
            referencedRelation: 'matches'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'match_bets_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      matches: {
        Row: {
          id: string
          event_id: string
          fight_number: number
          round_number: number | null
          meron_entry_id: string
          meron_rooster_id: string
          meron_weight: number | null
          wala_entry_id: string
          wala_rooster_id: string
          wala_weight: number | null
          status: Database['public']['Enums']['match_status']
          queue_status: Database['public']['Enums']['fight_queue_status'] | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          fight_number: number
          round_number?: number | null
          meron_entry_id: string
          meron_rooster_id: string
          meron_weight?: number | null
          wala_entry_id: string
          wala_rooster_id: string
          wala_weight?: number | null
          status?: Database['public']['Enums']['match_status']
          queue_status?: Database['public']['Enums']['fight_queue_status'] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          fight_number?: number
          round_number?: number | null
          meron_entry_id?: string
          meron_rooster_id?: string
          meron_weight?: number | null
          wala_entry_id?: string
          wala_rooster_id?: string
          wala_weight?: number | null
          status?: Database['public']['Enums']['match_status']
          queue_status?: Database['public']['Enums']['fight_queue_status'] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fight_results: {
        Row: {
          id: string
          match_id: string
          event_id: string
          winning_side: Database['public']['Enums']['fight_side'] | null
          result_type: Database['public']['Enums']['fight_result_type']
          winning_entry_id: string | null
          losing_entry_id: string | null
          result_status: Database['public']['Enums']['result_status']
          recorded_by: string | null
          verified_by: string | null
          result_time: string | null
          notes: string | null
          under_protest: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          event_id: string
          winning_side?: Database['public']['Enums']['fight_side'] | null
          result_type: Database['public']['Enums']['fight_result_type']
          winning_entry_id?: string | null
          losing_entry_id?: string | null
          result_status?: Database['public']['Enums']['result_status']
          recorded_by?: string | null
          verified_by?: string | null
          result_time?: string | null
          notes?: string | null
          under_protest?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          event_id?: string
          winning_side?: Database['public']['Enums']['fight_side'] | null
          result_type?: Database['public']['Enums']['fight_result_type']
          winning_entry_id?: string | null
          losing_entry_id?: string | null
          result_status?: Database['public']['Enums']['result_status']
          recorded_by?: string | null
          verified_by?: string | null
          result_time?: string | null
          notes?: string | null
          under_protest?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      standings: {
        Row: {
          id: string
          event_id: string
          entry_id: string
          total_fights: number
          wins: number
          losses: number
          draws: number
          points: number
          rank: number | null
          status: Database['public']['Enums']['standing_status']
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          entry_id: string
          total_fights?: number
          wins?: number
          losses?: number
          draws?: number
          points?: number
          rank?: number | null
          status?: Database['public']['Enums']['standing_status']
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          entry_id?: string
          total_fights?: number
          wins?: number
          losses?: number
          draws?: number
          points?: number
          rank?: number | null
          status?: Database['public']['Enums']['standing_status']
          updated_at?: string
        }
        Relationships: []
      }
      event_finalizations: {
        Row: {
          id: string
          event_id: string
          finalized_by: string | null
          finalized_at: string
          is_locked: boolean
          champion_entry_ids: string[]
          notes: string | null
        }
        Insert: {
          id?: string
          event_id: string
          finalized_by?: string | null
          finalized_at?: string
          is_locked?: boolean
          champion_entry_ids?: string[]
          notes?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          finalized_by?: string | null
          finalized_at?: string
          is_locked?: boolean
          champion_entry_ids?: string[]
          notes?: string | null
        }
        Relationships: []
      }
      prize_payouts: {
        Row: {
          id: string
          payout_reference: string
          event_id: string
          entry_id: string
          rank_label: string
          rank_position: number
          amount: number
          payment_method: Database['public']['Enums']['payout_method'] | null
          recipient_name: string
          released_by: string | null
          released_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          payout_reference: string
          event_id: string
          entry_id: string
          rank_label: string
          rank_position: number
          amount: number
          payment_method?: Database['public']['Enums']['payout_method'] | null
          recipient_name: string
          released_by?: string | null
          released_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          payout_reference?: string
          event_id?: string
          entry_id?: string
          rank_label?: string
          rank_position?: number
          amount?: number
          payment_method?: Database['public']['Enums']['payout_method'] | null
          recipient_name?: string
          released_by?: string | null
          released_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      promoter_settlements: {
        Row: {
          id: string
          settlement_reference: string
          event_id: string
          promoter_id: string
          gross_collection: number
          eligible_collection: number
          total_expenses: number
          prize_pool: number
          promoter_commission: number
          promoter_advances: number
          guaranteed_prize: number
          amount_payable: number
          amount_receivable: number
          settlement_status: Database['public']['Enums']['settlement_status']
          settled_by: string | null
          settled_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          settlement_reference: string
          event_id: string
          promoter_id: string
          gross_collection?: number
          eligible_collection?: number
          total_expenses?: number
          prize_pool?: number
          promoter_commission?: number
          promoter_advances?: number
          guaranteed_prize?: number
          amount_payable?: number
          amount_receivable?: number
          settlement_status?: Database['public']['Enums']['settlement_status']
          settled_by?: string | null
          settled_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          settlement_reference?: string
          event_id?: string
          promoter_id?: string
          gross_collection?: number
          eligible_collection?: number
          total_expenses?: number
          prize_pool?: number
          promoter_commission?: number
          promoter_advances?: number
          guaranteed_prize?: number
          amount_payable?: number
          amount_receivable?: number
          settlement_status?: Database['public']['Enums']['settlement_status']
          settled_by?: string | null
          settled_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'promoter_settlements_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'promoter_settlements_promoter_id_fkey'
            columns: ['promoter_id']
            isOneToOne: false
            referencedRelation: 'promoters'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: Database['public']['Enums']['app_role']
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_system_owner: {
        Args: Record<string, never>
        Returns: boolean
      }
      has_permission: {
        Args: { permission_key: string }
        Returns: boolean
      }
      can_access_dashboard: {
        Args: Record<string, never>
        Returns: boolean
      }
      needs_bootstrap: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | 'admin'
        | 'system_owner'
        | 'event_organizer'
        | 'promoter'
        | 'staff'
      cashier_session_movement_type: 'opening_float' | 'admin_handover' | 'adjustment'
      cashier_session_status: 'open' | 'closed'
      promoter_status: 'active' | 'inactive' | 'suspended'
      commission_type: 'none' | 'fixed' | 'percentage' | 'custom'
      event_type: 'classic' | 'derby'
      event_status:
        | 'draft'
        | 'open'
        | 'in_progress'
        | 'completed'
        | 'cancelled'
        | 'archived'
      derby_format: '2_cock' | '3_cock' | '4_cock' | '5_cock' | 'custom'
      derby_age_type:
        | 'stag_derby'
        | 'bullstag_derby'
        | 'cock_derby'
        | 'stag_cock_derby'
        | 'cock_bullstag_derby'
        | 'stag_bullstag_cock_combo'
        | 'open_derby'
        | 'custom'
      conditionally_approved_match_handling:
        | 'exclude'
        | 'include_with_warning'
        | 'include_with_approval_required'
      unknown_value_handling: 'allow' | 'approval_required' | 'prohibit'
      scoring_system: 'win_loss' | 'points'
      prize_type: 'percentage' | 'fixed' | 'manual'
      registration_status:
        | 'submitted'
        | 'pending_review'
        | 'approved'
        | 'rejected'
        | 'cancelled'
        | 'confirmed'
      payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded'
      entry_source: 'walk_in' | 'online' | 'promoter_invite' | 'staff_encoded'
      competitor_level: 'novice' | 'intermediate' | 'advanced' | 'veteran' | 'unrated'
      payment_method: 'cash' | 'bank_transfer' | 'gcash' | 'other'
      lineup_status: 'draft' | 'submitted' | 'verified' | 'rejected'
      weight_status: 'pending' | 'passed' | 'failed' | 'for_review'
      entry_rooster_role: 'primary' | 'reserve' | 'substitute' | 'joker' | 'replacement'
      registration_workflow_status:
        | 'draft'
        | 'submitted'
        | 'pending_review'
        | 'pending_weighing'
        | 'pending_inspection'
        | 'pending_documents'
        | 'pending_band_verification'
        | 'conditionally_approved'
        | 'approved'
        | 'rejected'
        | 'withdrawn'
        | 'disqualified'
        | 'matched'
        | 'completed'
      rooster_approval_status:
        | 'not_submitted'
        | 'pending'
        | 'conditionally_approved'
        | 'approved'
        | 'rejected'
        | 'revoked'
      eligibility_status:
        | 'eligible'
        | 'conditionally_eligible'
        | 'pending_review'
        | 'ineligible'
      inspection_status:
        | 'not_required'
        | 'pending'
        | 'passed'
        | 'failed'
        | 'for_review'
      payment_category:
        | 'registration'
        | 'rooster_entry'
        | 'entry_fees'
        | 'cash_bond'
        | 'adjustment'
        | 'legacy'
      revolving_fund_entry_type: 'opening' | 'adjustment' | 'collection' | 'refund'
      registration_payment_status:
        | 'not_required'
        | 'unpaid'
        | 'partial'
        | 'paid'
        | 'refunded'
      reference_value_kind: 'breed' | 'bloodline' | 'color_marking'
      rejection_category:
        | 'age_ineligible'
        | 'weight_below_minimum'
        | 'weight_above_maximum'
        | 'band_invalid'
        | 'band_unverified'
        | 'duplicate_band'
        | 'experience_ineligible'
        | 'origin_ineligible'
        | 'association_requirement_failed'
        | 'inspection_failed'
        | 'missing_documents'
        | 'payment_incomplete'
        | 'duplicate_registration'
        | 'classification_incomplete'
        | 'promoter_rejection'
        | 'other'
      match_status:
        | 'draft'
        | 'for_review'
        | 'confirmed'
        | 'locked'
        | 'ready'
        | 'ongoing'
        | 'completed'
        | 'cancelled'
      fight_queue_status: 'scheduled' | 'called' | 'ready' | 'ongoing'
      fight_side: 'meron' | 'wala'
      fight_result_type:
        | 'meron_win'
        | 'wala_win'
        | 'draw'
        | 'no_contest'
        | 'disqualification'
        | 'cancelled'
      result_status: 'draft' | 'submitted' | 'verified' | 'final'
      standing_status: 'active' | 'eliminated' | 'completed'
      payout_method: 'cash' | 'bank_transfer' | 'gcash' | 'other'
      settlement_status:
        | 'pending'
        | 'for_review'
        | 'settled'
        | 'disputed'
        | 'cancelled'
    }
    CompositeTypes: Record<string, never>
  }
}

export type AppRole = Database['public']['Enums']['app_role']
export type Profile = Database['public']['Tables']['profiles']['Row']
