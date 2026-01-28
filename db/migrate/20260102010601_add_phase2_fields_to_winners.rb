class AddPhase2FieldsToWinners < ActiveRecord::Migration[8.0]
  def change
    add_column :winners, :is_designated, :boolean, default: false, null: false
  end
end
