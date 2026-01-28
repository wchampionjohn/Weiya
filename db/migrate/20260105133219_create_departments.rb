class CreateDepartments < ActiveRecord::Migration[8.0]
  def change
    create_table :departments do |t|
      t.string :name, null: false
      t.string :code, null: false

      t.timestamps
    end

    add_index :departments, :name, unique: true
    add_index :departments, :code, unique: true

    # Add department_id to participants
    add_reference :participants, :department, foreign_key: true
  end
end
