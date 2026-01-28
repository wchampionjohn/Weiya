class AddPhase2FieldsToPrizes < ActiveRecord::Migration[8.0]
  def change
    # Note: scheduled_at already exists from Phase 1
    add_column :prizes, :eligibility_rules, :json
    add_column :prizes, :designated_participant_id, :bigint
    add_column :prizes, :is_bonus, :boolean, default: false, null: false

    add_index :prizes, :designated_participant_id
    add_index :prizes, :is_bonus
  end
end
