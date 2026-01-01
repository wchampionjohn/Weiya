class DrawService
  Result = Struct.new(:success, :winners, :error, keyword_init: true) do
    def success?
      success
    end
  end

  def initialize(prize, admin: nil, count: nil)
    @prize = prize
    @admin = admin
    @count = count || @prize.remaining_quantity
  end

  def call
    return Result.new(success: false, winners: [], error: "Prize already drawn") if @prize.drawn?
    return Result.new(success: false, winners: [], error: "No remaining quantity") unless @prize.remaining_quantity.positive?

    draw_winners
  end

  private

  def draw_winners
    eligible_event_participants = find_eligible_event_participants
    return Result.new(success: false, winners: [], error: "No eligible participants") if eligible_event_participants.empty?

    draw_count = [@count, @prize.remaining_quantity, eligible_event_participants.size].min
    selected = secure_random_select(eligible_event_participants, draw_count)

    winners = []
    ActiveRecord::Base.transaction do
      selected.each do |event_participant|
        winner = @prize.winners.create!(
          event_participant: event_participant,
          drawn_at: Time.current
        )
        winners << winner
      end

      if @prize.remaining_quantity.zero?
        @prize.update!(
          drawn: true,
          drawn_at: Time.current,
          drawn_by: @admin&.id
        )
      end
    end

    broadcast_draw_result(winners)

    Result.new(success: true, winners: winners, error: nil)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success: false, winners: [], error: e.message)
  end

  def find_eligible_event_participants
    @prize.event.event_participants.eligible_for(@prize)
  end

  def secure_random_select(participants, count)
    participants.to_a.sample(count, random: SecureRandom)
  end

  def broadcast_draw_result(winners)
    return if winners.empty?

    ActionCable.server.broadcast(
      "draw_channel_#{@prize.event_id}",
      {
        type: "draw_result",
        prize_id: @prize.id,
        prize_name: @prize.name,
        winners: winners.map do |winner|
          build_winner_display(winner)
        end
      }
    )
  end

  def build_winner_display(winner)
    display_data = winner.display_data(masked: true)

    {
      id: winner.id,
      event_participant_id: winner.event_participant_id,
      display_data: display_data
    }
  end
end
