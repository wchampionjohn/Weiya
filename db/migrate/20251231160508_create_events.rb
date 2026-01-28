class CreateEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :events do |t|
      t.string :name, null: false
      t.datetime :event_date, null: false
      t.string :password
      t.integer :status, null: false, default: 0
      t.boolean :allow_repeat_win, null: false, default: false
      t.json :required_fields, null: false, default: []

      t.timestamps
    end
    add_index :events, :status
  end
end
