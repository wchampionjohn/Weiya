class AddDisplaySettingsToEvents < ActiveRecord::Migration[8.0]
  def change
    add_column :events, :display_fields, :json, default: ["name"], null: false
    add_column :events, :privacy_enabled, :boolean, default: false, null: false
    add_column :events, :privacy_settings, :json, default: {}, null: false
  end
end
