class UpdateWinnersForEventParticipants < ActiveRecord::Migration[8.0]
  def up
    # Add event_participant_id column
    add_reference :winners, :event_participant, foreign_key: true

    # Migrate existing data: find event_participant from prize.event + participant
    execute <<-SQL
      UPDATE winners
      SET event_participant_id = (
        SELECT ep.id FROM event_participants ep
        JOIN prizes p ON p.event_id = ep.event_id
        WHERE p.id = winners.prize_id
        AND ep.participant_id = winners.participant_id
        LIMIT 1
      )
    SQL

    # Remove old indexes and foreign key
    remove_index :winners, [:prize_id, :participant_id], if_exists: true
    remove_foreign_key :winners, :participants, if_exists: true
    remove_column :winners, :participant_id

    # Make event_participant_id required
    change_column_null :winners, :event_participant_id, false

    # Add new unique index
    add_index :winners, [:prize_id, :event_participant_id], unique: true
  end

  def down
    # Add back participant_id
    add_reference :winners, :participant, foreign_key: true

    # Restore data from event_participant
    execute <<-SQL
      UPDATE winners
      SET participant_id = (
        SELECT ep.participant_id FROM event_participants ep
        WHERE ep.id = winners.event_participant_id
      )
    SQL

    # Remove new column
    remove_index :winners, [:prize_id, :event_participant_id], if_exists: true
    remove_foreign_key :winners, :event_participants, if_exists: true
    remove_column :winners, :event_participant_id

    # Make participant_id required
    change_column_null :winners, :participant_id, false

    # Restore old index
    add_index :winners, [:prize_id, :participant_id], unique: true
  end
end
