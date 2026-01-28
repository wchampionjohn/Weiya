class AddPhase2FieldsToEvents < ActiveRecord::Migration[8.0]
  def change
    add_column :events, :sms_template, :text
    add_column :events, :email_template, :text
    add_column :events, :copied_from_event_id, :bigint

    add_index :events, :copied_from_event_id
  end
end
