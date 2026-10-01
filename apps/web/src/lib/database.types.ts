// Generado con `npm run db:types`. No editar a mano.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      attempt_votes: {
        Row: {
          approve: boolean
          attempt_id: string
          created_at: string
          voter_id: string
        }
        Insert: {
          approve: boolean
          attempt_id: string
          created_at?: string
          voter_id: string
        }
        Update: {
          approve?: boolean
          attempt_id?: string
          created_at?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'attempt_votes_attempt_id_fkey'
            columns: ['attempt_id']
            referencedRelation: 'mission_attempts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attempt_votes_voter_id_fkey'
            columns: ['voter_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'attempt_votes_voter_id_fkey'
            columns: ['voter_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      badges: {
        Row: {
          code: string
          description: string
          icon: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          description: string
          icon: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          description?: string
          icon?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      banned_words: {
        Row: {
          word: string
        }
        Insert: {
          word: string
        }
        Update: {
          word?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'blocks_blocked_id_fkey'
            columns: ['blocked_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'blocks_blocked_id_fkey'
            columns: ['blocked_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'blocks_blocker_id_fkey'
            columns: ['blocker_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'blocks_blocker_id_fkey'
            columns: ['blocker_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      comments: {
        Row: {
          created_at: string
          id: string
          post_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_post_id_fkey'
            columns: ['post_id']
            referencedRelation: 'post_feed'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_post_id_fkey'
            columns: ['post_id']
            referencedRelation: 'posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'comments_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'follows_follower_id_fkey'
            columns: ['follower_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'follows_follower_id_fkey'
            columns: ['follower_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'follows_following_id_fkey'
            columns: ['following_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'follows_following_id_fkey'
            columns: ['following_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'likes_post_id_fkey'
            columns: ['post_id']
            referencedRelation: 'post_feed'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'likes_post_id_fkey'
            columns: ['post_id']
            referencedRelation: 'posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'likes_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'likes_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      mission_attempts: {
        Row: {
          created_at: string
          evidence: Json
          id: string
          mission_id: string
          note: string | null
          photo_url: string | null
          review_note: string | null
          reviewed_by: string | null
          status: Database['public']['Enums']['attempt_status']
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          evidence?: Json
          id?: string
          mission_id: string
          note?: string | null
          photo_url?: string | null
          review_note?: string | null
          reviewed_by?: string | null
          status?: Database['public']['Enums']['attempt_status']
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          evidence?: Json
          id?: string
          mission_id?: string
          note?: string | null
          photo_url?: string | null
          review_note?: string | null
          reviewed_by?: string | null
          status?: Database['public']['Enums']['attempt_status']
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'mission_attempts_mission_id_fkey'
            columns: ['mission_id']
            referencedRelation: 'missions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mission_attempts_mission_id_fkey'
            columns: ['mission_id']
            referencedRelation: 'post_feed'
            referencedColumns: ['mission_id']
          },
          {
            foreignKeyName: 'mission_attempts_reviewed_by_fkey'
            columns: ['reviewed_by']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'mission_attempts_reviewed_by_fkey'
            columns: ['reviewed_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mission_attempts_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'mission_attempts_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      missions: {
        Row: {
          active: boolean
          category: string
          cover_image: string | null
          created_at: string
          created_by: string | null
          description: string
          difficulty: Database['public']['Enums']['mission_difficulty']
          ends_at: string | null
          featured: boolean
          id: string
          points: number
          rules: Json
          starts_at: string | null
          title: string
          verification_type: Database['public']['Enums']['verification_type']
        }
        Insert: {
          active?: boolean
          category?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: Database['public']['Enums']['mission_difficulty']
          ends_at?: string | null
          featured?: boolean
          id?: string
          points: number
          rules?: Json
          starts_at?: string | null
          title: string
          verification_type: Database['public']['Enums']['verification_type']
        }
        Update: {
          active?: boolean
          category?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: Database['public']['Enums']['mission_difficulty']
          ends_at?: string | null
          featured?: boolean
          id?: string
          points?: number
          rules?: Json
          starts_at?: string | null
          title?: string
          verification_type?: Database['public']['Enums']['verification_type']
        }
        Relationships: [
          {
            foreignKeyName: 'missions_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'missions_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      posts: {
        Row: {
          created_at: string
          hashtags: string[] | null
          hidden: boolean
          id: string
          images: string[]
          mission_attempt_id: string | null
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hashtags?: string[] | null
          hidden?: boolean
          id?: string
          images?: string[]
          mission_attempt_id?: string | null
          text?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hashtags?: string[] | null
          hidden?: boolean
          id?: string
          images?: string[]
          mission_attempt_id?: string | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'posts_mission_attempt_id_fkey'
            columns: ['mission_attempt_id']
            referencedRelation: 'mission_attempts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'posts_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'posts_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profile_private: {
        Row: {
          birthdate: string
          terms_accepted_at: string
          user_id: string
          x_consent_at: string | null
        }
        Insert: {
          birthdate: string
          terms_accepted_at?: string
          user_id: string
          x_consent_at?: string | null
        }
        Update: {
          birthdate?: string
          terms_accepted_at?: string
          user_id?: string
          x_consent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profile_private_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'profile_private_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          display_name: string
          equipped_frame: string | null
          equipped_theme: string | null
          equipped_title: string | null
          id: string
          is_admin: boolean
          onboarded: boolean
          provincia: string | null
          username: string | null
          x_connected: boolean
          x_username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          equipped_frame?: string | null
          equipped_theme?: string | null
          equipped_title?: string | null
          id: string
          is_admin?: boolean
          onboarded?: boolean
          provincia?: string | null
          username?: string | null
          x_connected?: boolean
          x_username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          equipped_frame?: string | null
          equipped_theme?: string | null
          equipped_title?: string | null
          id?: string
          is_admin?: boolean
          onboarded?: boolean
          provincia?: string | null
          username?: string | null
          x_connected?: boolean
          x_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_equipped_frame_fkey'
            columns: ['equipped_frame']
            referencedRelation: 'rewards'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'profiles_equipped_theme_fkey'
            columns: ['equipped_theme']
            referencedRelation: 'rewards'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'profiles_equipped_title_fkey'
            columns: ['equipped_title']
            referencedRelation: 'rewards'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'profiles_provincia_fkey'
            columns: ['provincia']
            referencedRelation: 'provincias'
            referencedColumns: ['code']
          },
        ]
      }
      provincias: {
        Row: {
          code: string
          comunidad: string
          name: string
        }
        Insert: {
          code: string
          comunidad: string
          name: string
        }
        Update: {
          code?: string
          comunidad?: string
          name?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'push_tokens_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'push_tokens_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_by: string | null
          status: Database['public']['Enums']['report_status']
          target_id: string
          target_type: Database['public']['Enums']['report_target']
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_by?: string | null
          status?: Database['public']['Enums']['report_status']
          target_id: string
          target_type: Database['public']['Enums']['report_target']
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_by?: string | null
          status?: Database['public']['Enums']['report_status']
          target_id?: string
          target_type?: Database['public']['Enums']['report_target']
        }
        Relationships: [
          {
            foreignKeyName: 'reports_reporter_id_fkey'
            columns: ['reporter_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'reports_reporter_id_fkey'
            columns: ['reporter_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reports_resolved_by_fkey'
            columns: ['resolved_by']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'reports_resolved_by_fkey'
            columns: ['resolved_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean
          code: string
          cost: number
          description: string
          kind: Database['public']['Enums']['reward_kind']
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          code: string
          cost: number
          description: string
          kind: Database['public']['Enums']['reward_kind']
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          cost?: number
          description?: string
          kind?: Database['public']['Enums']['reward_kind']
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_code: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_code: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_badges_badge_code_fkey'
            columns: ['badge_code']
            referencedRelation: 'badges'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'user_badges_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'user_badges_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      user_rewards: {
        Row: {
          purchased_at: string
          reward_code: string
          user_id: string
        }
        Insert: {
          purchased_at?: string
          reward_code: string
          user_id: string
        }
        Update: {
          purchased_at?: string
          reward_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_rewards_reward_code_fkey'
            columns: ['reward_code']
            referencedRelation: 'rewards'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'user_rewards_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'user_rewards_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      x_accounts: {
        Row: {
          access_token_enc: string
          connected_at: string
          expires_at: string | null
          refresh_token_enc: string | null
          scopes: string
          user_id: string
          x_user_id: string
          x_username: string
        }
        Insert: {
          access_token_enc: string
          connected_at?: string
          expires_at?: string | null
          refresh_token_enc?: string | null
          scopes?: string
          user_id: string
          x_user_id: string
          x_username: string
        }
        Update: {
          access_token_enc?: string
          connected_at?: string
          expires_at?: string | null
          refresh_token_enc?: string | null
          scopes?: string
          user_id?: string
          x_user_id?: string
          x_username?: string
        }
        Relationships: [
          {
            foreignKeyName: 'x_accounts_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'x_accounts_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      x_api_calls: {
        Row: {
          cache_key: string
          created_at: string
          id: number
          response: Json | null
          user_id: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          id?: never
          response?: Json | null
          user_id: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          id?: never
          response?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'x_api_calls_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'x_api_calls_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      x_oauth_states: {
        Row: {
          code_verifier: string
          created_at: string
          redirect_to: string | null
          state: string
          user_id: string
        }
        Insert: {
          code_verifier: string
          created_at?: string
          redirect_to?: string | null
          state: string
          user_id: string
        }
        Update: {
          code_verifier?: string
          created_at?: string
          redirect_to?: string | null
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'x_oauth_states_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'x_oauth_states_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          level: number | null
          missions_completed: number | null
          provincia: string | null
          total_points: number | null
          user_id: string | null
          username: string | null
          weekly_points: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_provincia_fkey'
            columns: ['provincia']
            referencedRelation: 'provincias'
            referencedColumns: ['code']
          },
        ]
      }
      post_feed: {
        Row: {
          avatar_url: string | null
          comment_count: number | null
          created_at: string | null
          display_name: string | null
          hashtags: string[] | null
          hidden: boolean | null
          id: string | null
          images: string[] | null
          like_count: number | null
          liked_by_me: boolean | null
          mission_attempt_id: string | null
          mission_id: string | null
          mission_points: number | null
          mission_title: string | null
          mission_verification_type: Database['public']['Enums']['verification_type'] | null
          provincia: string | null
          text: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'posts_mission_attempt_id_fkey'
            columns: ['mission_attempt_id']
            referencedRelation: 'mission_attempts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'posts_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'leaderboard'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'posts_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profiles_provincia_fkey'
            columns: ['provincia']
            referencedRelation: 'provincias'
            referencedColumns: ['code']
          },
        ]
      }
    }
    Functions: {
      attempt_vote_counts: {
        Args: { p_attempt_id: string }
        Returns: {
          approvals: number
          approvals_needed: number
          rejections: number
          rejections_needed: number
        }[]
      }
      award_badges: { Args: { p_user_id: string }; Returns: undefined }
      buy_reward: {
        Args: { p_code: string }
        Returns: {
          balance: number
        }[]
      }
      community_approvals_needed: { Args: never; Returns: number }
      community_rejections_needed: { Args: never; Returns: number }
      complete_onboarding: {
        Args: {
          p_accept_terms: boolean
          p_birthdate: string
          p_display_name: string
          p_provincia: string
          p_username: string
        }
        Returns: {
          avatar_url: string | null
          bio: string
          created_at: string
          display_name: string
          equipped_frame: string | null
          equipped_theme: string | null
          equipped_title: string | null
          id: string
          is_admin: boolean
          onboarded: boolean
          provincia: string | null
          username: string | null
          x_connected: boolean
          x_username: string | null
        }
        SetofOptions: {
          from: '*'
          to: 'profiles'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      contains_offensive: { Args: { p_text: string }; Returns: boolean }
      delete_my_account: { Args: never; Returns: undefined }
      equip_reward: {
        Args: {
          p_code: string
          p_kind: Database['public']['Enums']['reward_kind']
        }
        Returns: undefined
      }
      export_my_data: { Args: never; Returns: Json }
      extract_hashtags: { Args: { p_text: string }; Returns: string[] }
      get_attempts_to_validate: {
        Args: { p_limit?: number }
        Returns: {
          approvals: number
          attempt_id: string
          created_at: string
          mission_description: string
          mission_id: string
          mission_points: number
          mission_title: string
          note: string
          photo_url: string
          rejections: number
          verification_type: Database['public']['Enums']['verification_type']
        }[]
      }
      get_feed: {
        Args: { p_before?: string; p_limit?: number; p_mode?: string }
        Returns: {
          avatar_url: string | null
          comment_count: number | null
          created_at: string | null
          display_name: string | null
          hashtags: string[] | null
          hidden: boolean | null
          id: string | null
          images: string[] | null
          like_count: number | null
          liked_by_me: boolean | null
          mission_attempt_id: string | null
          mission_id: string | null
          mission_points: number | null
          mission_title: string | null
          mission_verification_type: Database['public']['Enums']['verification_type'] | null
          provincia: string | null
          text: string | null
          user_id: string | null
          username: string | null
        }[]
        SetofOptions: {
          from: '*'
          to: 'post_feed'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_leaderboard: {
        Args: { p_limit?: number; p_provincia?: string; p_scope?: string }
        Returns: {
          avatar_url: string
          display_name: string
          level: number
          missions_completed: number
          points: number
          provincia: string
          rank: number
          user_id: string
          username: string
        }[]
      }
      get_posts_by_tag: {
        Args: { p_before?: string; p_limit?: number; p_tag: string }
        Returns: {
          avatar_url: string | null
          comment_count: number | null
          created_at: string | null
          display_name: string | null
          hashtags: string[] | null
          hidden: boolean | null
          id: string | null
          images: string[] | null
          like_count: number | null
          liked_by_me: boolean | null
          mission_attempt_id: string | null
          mission_id: string | null
          mission_points: number | null
          mission_title: string | null
          mission_verification_type: Database['public']['Enums']['verification_type'] | null
          provincia: string | null
          text: string | null
          user_id: string | null
          username: string | null
        }[]
        SetofOptions: {
          from: '*'
          to: 'post_feed'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_profile_stats: {
        Args: { p_user_id: string }
        Returns: {
          followers: number
          following: number
          global_rank: number
          level: number
          missions_completed: number
          total_points: number
          weekly_points: number
        }[]
      }
      get_trending_hashtags: {
        Args: { p_days?: number; p_limit?: number }
        Returns: {
          tag: string
          uses: number
        }[]
      }
      get_trending_posts: {
        Args: { p_days?: number; p_limit?: number }
        Returns: {
          avatar_url: string | null
          comment_count: number | null
          created_at: string | null
          display_name: string | null
          hashtags: string[] | null
          hidden: boolean | null
          id: string | null
          images: string[] | null
          like_count: number | null
          liked_by_me: boolean | null
          mission_attempt_id: string | null
          mission_id: string | null
          mission_points: number | null
          mission_title: string | null
          mission_verification_type: Database['public']['Enums']['verification_type'] | null
          provincia: string | null
          text: string | null
          user_id: string | null
          username: string | null
        }[]
        SetofOptions: {
          from: '*'
          to: 'post_feed'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      give_x_consent: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_blocked_between: { Args: { a: string; b: string }; Returns: boolean }
      is_service: { Args: never; Returns: boolean }
      level_for_points: { Args: { p_points: number }; Returns: number }
      pending_validations_count: { Args: never; Returns: number }
      points_balance: {
        Args: { p_user_id?: string }
        Returns: {
          balance: number
          spent: number
          total_points: number
        }[]
      }
      review_attempt: {
        Args: { p_approve: boolean; p_attempt_id: string; p_note?: string }
        Returns: {
          created_at: string
          evidence: Json
          id: string
          mission_id: string
          note: string | null
          photo_url: string | null
          review_note: string | null
          reviewed_by: string | null
          status: Database['public']['Enums']['attempt_status']
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        SetofOptions: {
          from: '*'
          to: 'mission_attempts'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_attempt: {
        Args: { p_mission_id: string; p_note: string; p_photo_path: string }
        Returns: {
          created_at: string
          evidence: Json
          id: string
          mission_id: string
          note: string | null
          photo_url: string | null
          review_note: string | null
          reviewed_by: string | null
          status: Database['public']['Enums']['attempt_status']
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        SetofOptions: {
          from: '*'
          to: 'mission_attempts'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      username_available: { Args: { p_username: string }; Returns: boolean }
      vote_attempt: {
        Args: { p_approve: boolean; p_attempt_id: string }
        Returns: {
          approvals: number
          rejections: number
          status: Database['public']['Enums']['attempt_status']
        }[]
      }
      week_start: { Args: never; Returns: string }
    }
    Enums: {
      attempt_status: 'pending' | 'verified' | 'rejected'
      mission_difficulty: 'facil' | 'media' | 'dificil'
      report_status: 'open' | 'resolved' | 'dismissed'
      report_target: 'post' | 'comment' | 'user'
      reward_kind: 'theme' | 'frame' | 'title' | 'badge'
      verification_type: 'x_auto' | 'photo' | 'manual'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attempt_status: ['pending', 'verified', 'rejected'],
      mission_difficulty: ['facil', 'media', 'dificil'],
      report_status: ['open', 'resolved', 'dismissed'],
      report_target: ['post', 'comment', 'user'],
      reward_kind: ['theme', 'frame', 'title', 'badge'],
      verification_type: ['x_auto', 'photo', 'manual'],
    },
  },
} as const
