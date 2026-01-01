class MakeParticipantsGlobal < ActiveRecord::Migration[8.0]
  def up
    # First, migrate existing participant-event relationships to event_participants
    execute <<-SQL
      INSERT INTO event_participants (event_id, participant_id, created_at, updated_at)
      SELECT event_id, id, created_at, updated_at FROM participants
      WHERE event_id IS NOT NULL
      ON CONFLICT DO NOTHING
    SQL

    # Remove event_id from participants
    remove_index :participants, [:event_id, :employee_id], if_exists: true
    remove_index :participants, [:event_id, :phone], if_exists: true
    remove_index :participants, [:event_id, :email], if_exists: true
    remove_foreign_key :participants, :events, if_exists: true
    remove_column :participants, :event_id

    # Add global unique indexes
    add_index :participants, :employee_id, unique: true, where: "employee_id IS NOT NULL"
    add_index :participants, :phone, unique: true, where: "phone IS NOT NULL"
    add_index :participants, :email, unique: true, where: "email IS NOT NULL"

    # Make name required
    change_column_null :participants, :name, false
  end

  def down
    # Remove global unique indexes
    remove_index :participants, :employee_id, if_exists: true
    remove_index :participants, :phone, if_exists: true
    remove_index :participants, :email, if_exists: true

    # Add back event_id column
    add_reference :participants, :event, foreign_key: true

    # Restore event_id from event_participants
    execute <<-SQL
      UPDATE participants
      SET event_id = (
        SELECT event_id FROM event_participants
        WHERE event_participants.participant_id = participants.id
        LIMIT 1
      )
    SQL

    # Restore original indexes
    add_index :participants, [:event_id, :employee_id]
    add_index :participants, [:event_id, :phone]
    add_index :participants, [:event_id, :email]

    change_column_null :participants, :name, true
  end
end
