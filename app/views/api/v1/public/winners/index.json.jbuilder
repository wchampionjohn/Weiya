json.array! @winners do |winner|
  json.id winner.id
  json.drawn_at winner.drawn_at

  json.prize do
    json.extract! winner.prize, :id, :name, :prize_type, :value
  end

  json.display_data winner.display_data(masked: true)
end
