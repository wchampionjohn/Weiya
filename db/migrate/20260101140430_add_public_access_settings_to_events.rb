class AddPublicAccessSettingsToEvents < ActiveRecord::Migration[8.0]
  def change
    add_column :events, :public_access_enabled, :boolean, default: true, null: false
    add_column :events, :public_slug, :string
    add_index :events, :public_slug, unique: true, where: "public_slug IS NOT NULL"
  end
end
