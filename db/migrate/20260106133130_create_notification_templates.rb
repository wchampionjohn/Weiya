class CreateNotificationTemplates < ActiveRecord::Migration[8.0]
  def change
    create_table :notification_templates do |t|
      t.string :name, null: false
      t.string :notification_type, null: false  # 'winning' or 'distribution'
      t.string :method, null: false             # 'sms' or 'email'
      t.text :content, null: false
      t.boolean :is_default, default: false
      t.integer :position, default: 0

      t.timestamps
    end

    add_index :notification_templates, [:notification_type, :method]
    add_index :notification_templates, :is_default
  end
end
