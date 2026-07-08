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
          derby_type: Database['public']['Enums']['derby_type']
          entry_fee: number
          min_entries: number | null
          max_entries: number | null
          cocks_per_entry: number
          min_weight: number | null
          max_weight: number | null
          scoring_system: Database['public']['Enums']['scoring_system']
          draw_rule: string
          tie_breaker_rule: string
          status: Database['public']['Enums']['event_status']
          guaranteed_prize_amount: number | null
          house_deduction: number | null
          venue_share: number | null
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
          derby_type?: Database['public']['Enums']['derby_type']
          entry_fee?: number
          min_entries?: number | null
          max_entries?: number | null
          cocks_per_entry?: number
          min_weight?: number | null
          max_weight?: number | null
          scoring_system?: Database['public']['Enums']['scoring_system']
          draw_rule?: string
          tie_breaker_rule?: string
          status?: Database['public']['Enums']['event_status']
          guaranteed_prize_amount?: number | null
          house_deduction?: number | null
          venue_share?: number | null
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
          derby_type?: Database['public']['Enums']['derby_type']
          entry_fee?: number
          min_entries?: number | null
          max_entries?: number | null
          cocks_per_entry?: number
          min_weight?: number | null
          max_weight?: number | null
          scoring_system?: Database['public']['Enums']['scoring_system']
          draw_rule?: string
          tie_breaker_rule?: string
          status?: Database['public']['Enums']['event_status']
          guaranteed_prize_amount?: number | null
          house_deduction?: number | null
          venue_share?: number | null
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
      entries: {
        Row: {
          id: string
          event_id: string
          referred_by_promoter_id: string | null
          entry_number: string
          entry_name: string
          owner_name: string
          handler_name: string | null
          contact_number: string | null
          email: string | null
          address: string | null
          entry_source: Database['public']['Enums']['entry_source'] | null
          registration_status: Database['public']['Enums']['registration_status']
          payment_status: Database['public']['Enums']['payment_status']
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
          entry_number: string
          entry_name: string
          owner_name: string
          handler_name?: string | null
          contact_number?: string | null
          email?: string | null
          address?: string | null
          entry_source?: Database['public']['Enums']['entry_source'] | null
          registration_status?: Database['public']['Enums']['registration_status']
          payment_status?: Database['public']['Enums']['payment_status']
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
          entry_number?: string
          entry_name?: string
          owner_name?: string
          handler_name?: string | null
          contact_number?: string | null
          email?: string | null
          address?: string | null
          entry_source?: Database['public']['Enums']['entry_source'] | null
          registration_status?: Database['public']['Enums']['registration_status']
          payment_status?: Database['public']['Enums']['payment_status']
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
          balance: number
          payment_method: Database['public']['Enums']['payment_method'] | null
          receipt_number: string | null
          payment_status: Database['public']['Enums']['payment_status']
          receipt_path: string | null
          received_by: string | null
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
          balance?: number
          payment_method?: Database['public']['Enums']['payment_method'] | null
          receipt_number?: string | null
          payment_status?: Database['public']['Enums']['payment_status']
          receipt_path?: string | null
          received_by?: string | null
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
          balance?: number
          payment_method?: Database['public']['Enums']['payment_method'] | null
          receipt_number?: string | null
          payment_status?: Database['public']['Enums']['payment_status']
          receipt_path?: string | null
          received_by?: string | null
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
        ]
      }
      rooster_records: {
        Row: {
          id: string
          entry_id: string
          event_id: string
          cock_number: number
          band_number: string
          declared_weight: number | null
          category: string | null
          color_marking: string | null
          status: Database['public']['Enums']['lineup_status']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          entry_id: string
          event_id: string
          cock_number: number
          band_number: string
          declared_weight?: number | null
          category?: string | null
          color_marking?: string | null
          status?: Database['public']['Enums']['lineup_status']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          entry_id?: string
          event_id?: string
          cock_number?: number
          band_number?: string
          declared_weight?: number | null
          category?: string | null
          color_marking?: string | null
          status?: Database['public']['Enums']['lineup_status']
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rooster_records_entry_id_fkey'
            columns: ['entry_id']
            isOneToOne: false
            referencedRelation: 'entries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rooster_records_event_id_fkey'
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
          rooster_record_id: string
          entry_id: string
          event_id: string
          official_weight: number | null
          weight_status: Database['public']['Enums']['weight_status']
          verified_by: string | null
          verified_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rooster_record_id: string
          entry_id: string
          event_id: string
          official_weight?: number | null
          weight_status?: Database['public']['Enums']['weight_status']
          verified_by?: string | null
          verified_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rooster_record_id?: string
          entry_id?: string
          event_id?: string
          official_weight?: number | null
          weight_status?: Database['public']['Enums']['weight_status']
          verified_by?: string | null
          verified_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'weighings_rooster_record_id_fkey'
            columns: ['rooster_record_id']
            isOneToOne: true
            referencedRelation: 'rooster_records'
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
        | 'registration_staff'
        | 'finance_staff'
        | 'weighing_staff'
        | 'matchmaker'
        | 'result_recorder'
        | 'promoter'
        | 'public_viewer'
      promoter_status: 'active' | 'inactive' | 'suspended'
      commission_type: 'none' | 'fixed' | 'percentage' | 'custom'
      event_type: 'house' | 'external_promoter' | 'sponsored' | 'test'
      event_status:
        | 'draft'
        | 'open'
        | 'registration_closed'
        | 'ready_for_weighing'
        | 'ready_for_matching'
        | 'ongoing'
        | 'completed'
        | 'cancelled'
        | 'archived'
      derby_type: '3_cock' | '4_cock' | '5_cock' | 'stag' | 'bullstag' | 'custom'
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
      payment_method: 'cash' | 'bank_transfer' | 'gcash' | 'other'
      lineup_status: 'draft' | 'submitted' | 'verified' | 'rejected'
      weight_status: 'pending' | 'passed' | 'failed' | 'for_review'
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
