module ErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from StandardError, with: :handle_standard_error if Rails.env.production?
  end

  private

  def handle_standard_error(exception)
    Rails.logger.error("Unhandled error: #{exception.class} - #{exception.message}")
    Rails.logger.error(exception.backtrace.first(10).join("\n"))

    render json: { error: "Internal server error" }, status: :internal_server_error
  end
end
