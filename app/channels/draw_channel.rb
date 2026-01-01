class DrawChannel < ApplicationCable::Channel
  def subscribed
    event_id = params[:event_id]
    return reject unless event_id

    stream_from "draw_channel_#{event_id}"
  end

  def unsubscribed
    stop_all_streams
  end
end
