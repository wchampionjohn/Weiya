class CreatePrizeTypes < ActiveRecord::Migration[8.0]
  def up
    create_table :prize_types do |t|
      t.string :name, null: false
      t.string :code, null: false
      t.boolean :is_default, default: false
      t.integer :position, default: 0

      t.timestamps
    end

    add_index :prize_types, :code, unique: true

    # Seed default prize types
    default_types = [
      { name: '現金', code: 'cash', is_default: true, position: 1 },
      { name: '禮品', code: 'gift', is_default: true, position: 2 },
      { name: '禮券', code: 'voucher', is_default: true, position: 3 },
      { name: '活動資格', code: 'qualification', is_default: true, position: 4 },
      { name: '其他', code: 'other', is_default: true, position: 5 }
    ]

    default_types.each do |type_data|
      execute <<-SQL
        INSERT INTO prize_types (name, code, is_default, position, created_at, updated_at)
        VALUES ('#{type_data[:name]}', '#{type_data[:code]}', #{type_data[:is_default]}, #{type_data[:position]}, NOW(), NOW())
      SQL
    end

    # Add prize_type_id to prizes and migrate existing data
    add_column :prizes, :prize_type_id, :bigint

    # Migrate existing prize_type enum to new prize_type_id
    execute <<-SQL
      UPDATE prizes SET prize_type_id = (
        SELECT id FROM prize_types WHERE code = CASE prizes.prize_type
          WHEN 0 THEN 'cash'
          WHEN 1 THEN 'gift'
          ELSE 'other'
        END
      )
    SQL

    # Remove old enum column
    remove_column :prizes, :prize_type

    add_index :prizes, :prize_type_id
  end

  def down
    add_column :prizes, :prize_type, :integer, default: 1

    execute <<-SQL
      UPDATE prizes SET prize_type = CASE
        WHEN prize_type_id = (SELECT id FROM prize_types WHERE code = 'cash') THEN 0
        ELSE 1
      END
    SQL

    remove_column :prizes, :prize_type_id
    drop_table :prize_types
  end
end
