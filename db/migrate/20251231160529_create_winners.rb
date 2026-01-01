class CreateWinners < ActiveRecord::Migration[8.0]
  def change
    create_table :winners do |t|
      t.references :prize, null: false, foreign_key: true
      t.references :participant, null: false, foreign_key: true
      t.datetime :drawn_at, null: false
      t.boolean :distributed, null: false, default: false
      t.datetime :distributed_at
      t.bigint :distributed_by
      t.boolean :notification_requested, null: false, default: false

      t.timestamps
    end
    add_index :winners, [:prize_id, :participant_id], unique: true
  end
end
