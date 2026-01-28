class AddPhase2FieldsToParticipants < ActiveRecord::Migration[8.0]
  def change
    add_column :participants, :hire_date, :date
    add_column :participants, :department, :string

    add_index :participants, :department
  end
end
