# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_01_06_133130) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "admins", force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_admins_on_email", unique: true
  end

  create_table "departments", force: :cascade do |t|
    t.string "name", null: false
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_departments_on_code", unique: true
    t.index ["name"], name: "index_departments_on_name", unique: true
  end

  create_table "event_participants", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.bigint "participant_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id", "participant_id"], name: "index_event_participants_on_event_id_and_participant_id", unique: true
    t.index ["event_id"], name: "index_event_participants_on_event_id"
    t.index ["participant_id"], name: "index_event_participants_on_participant_id"
  end

  create_table "events", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "event_date", null: false
    t.string "password"
    t.integer "status", default: 0, null: false
    t.boolean "allow_repeat_win", default: false, null: false
    t.json "required_fields", default: [], null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.json "display_fields", default: ["name"], null: false
    t.boolean "privacy_enabled", default: false, null: false
    t.json "privacy_settings", default: {}, null: false
    t.boolean "public_access_enabled", default: true, null: false
    t.string "public_slug"
    t.text "sms_template"
    t.text "email_template"
    t.bigint "copied_from_event_id"
    t.index ["copied_from_event_id"], name: "index_events_on_copied_from_event_id"
    t.index ["public_slug"], name: "index_events_on_public_slug", unique: true, where: "(public_slug IS NOT NULL)"
    t.index ["status"], name: "index_events_on_status"
  end

  create_table "notification_templates", force: :cascade do |t|
    t.string "name", null: false
    t.string "notification_type", null: false
    t.string "method", null: false
    t.text "content", null: false
    t.boolean "is_default", default: false
    t.integer "position", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["is_default"], name: "index_notification_templates_on_is_default"
    t.index ["notification_type", "method"], name: "index_notification_templates_on_notification_type_and_method"
  end

  create_table "participants", force: :cascade do |t|
    t.string "name", null: false
    t.string "employee_id"
    t.string "phone"
    t.string "email"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.date "hire_date"
    t.string "department"
    t.bigint "department_id"
    t.index ["department"], name: "index_participants_on_department"
    t.index ["department_id"], name: "index_participants_on_department_id"
    t.index ["email"], name: "index_participants_on_email", unique: true, where: "(email IS NOT NULL)"
    t.index ["employee_id"], name: "index_participants_on_employee_id", unique: true, where: "(employee_id IS NOT NULL)"
    t.index ["phone"], name: "index_participants_on_phone", unique: true, where: "(phone IS NOT NULL)"
  end

  create_table "prize_types", force: :cascade do |t|
    t.string "name", null: false
    t.string "code", null: false
    t.boolean "is_default", default: false
    t.integer "position", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_prize_types_on_code", unique: true
  end

  create_table "prizes", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.string "name", null: false
    t.decimal "value", precision: 10, scale: 2, null: false
    t.integer "quantity", default: 1, null: false
    t.boolean "taxable", default: false, null: false
    t.json "display_fields", default: ["name"], null: false
    t.json "privacy_settings", default: {}, null: false
    t.boolean "allow_repeat_win_override"
    t.datetime "scheduled_at"
    t.boolean "drawn", default: false, null: false
    t.datetime "drawn_at"
    t.bigint "drawn_by"
    t.integer "position", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.json "eligibility_rules"
    t.boolean "is_bonus", default: false, null: false
    t.json "designated_participant_ids", default: []
    t.bigint "prize_type_id"
    t.index ["event_id", "drawn"], name: "index_prizes_on_event_id_and_drawn"
    t.index ["event_id", "position"], name: "index_prizes_on_event_id_and_position"
    t.index ["event_id"], name: "index_prizes_on_event_id"
    t.index ["is_bonus"], name: "index_prizes_on_is_bonus"
    t.index ["prize_type_id"], name: "index_prizes_on_prize_type_id"
  end

  create_table "winners", force: :cascade do |t|
    t.bigint "prize_id", null: false
    t.datetime "drawn_at", null: false
    t.boolean "distributed", default: false, null: false
    t.datetime "distributed_at"
    t.bigint "distributed_by"
    t.boolean "notification_requested", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "event_participant_id", null: false
    t.boolean "is_designated", default: false, null: false
    t.index ["event_participant_id"], name: "index_winners_on_event_participant_id"
    t.index ["prize_id", "event_participant_id"], name: "index_winners_on_prize_id_and_event_participant_id", unique: true
    t.index ["prize_id"], name: "index_winners_on_prize_id"
  end

  add_foreign_key "event_participants", "events"
  add_foreign_key "event_participants", "participants"
  add_foreign_key "participants", "departments"
  add_foreign_key "prizes", "events"
  add_foreign_key "winners", "event_participants"
  add_foreign_key "winners", "prizes"
end
