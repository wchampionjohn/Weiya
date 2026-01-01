class CreateParticipants < ActiveRecord::Migration[8.0]
  def change
    create_table :participants do |t|
      t.references :event, null: false, foreign_key: true
      t.string :name
      t.string :employee_id
      t.string :phone
      t.string :email

      t.timestamps
    end
    add_index :participants, [:event_id, :employee_id]
    add_index :participants, [:event_id, :phone]
    add_index :participants, [:event_id, :email]
  end
end
