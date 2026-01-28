class CreatePrizes < ActiveRecord::Migration[8.0]
  def change
    create_table :prizes do |t|
      t.references :event, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :prize_type, null: false
      t.decimal :value, precision: 10, scale: 2, null: false
      t.integer :quantity, null: false, default: 1
      t.boolean :taxable, null: false, default: false
      t.json :display_fields, null: false, default: ["name"]
      t.json :privacy_settings, null: false, default: {}
      t.boolean :allow_repeat_win_override
      t.datetime :scheduled_at
      t.boolean :drawn, null: false, default: false
      t.datetime :drawn_at
      t.bigint :drawn_by
      t.integer :position, null: false

      t.timestamps
    end
    add_index :prizes, [:event_id, :drawn]
    add_index :prizes, [:event_id, :position]
  end
end
