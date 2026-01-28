class AddDesignatedParticipantIdsToPrizes < ActiveRecord::Migration[8.0]
  def up
    add_column :prizes, :designated_participant_ids, :json, default: []

    # Migrate existing data
    Prize.reset_column_information
    Prize.where.not(designated_participant_id: nil).find_each do |prize|
      prize.update_column(:designated_participant_ids, [prize.designated_participant_id])
    end

    remove_column :prizes, :designated_participant_id
  end

  def down
    add_column :prizes, :designated_participant_id, :bigint

    Prize.reset_column_information
    Prize.where("json_array_length(designated_participant_ids) > 0").find_each do |prize|
      prize.update_column(:designated_participant_id, prize.designated_participant_ids.first)
    end

    remove_column :prizes, :designated_participant_ids
  end
end
