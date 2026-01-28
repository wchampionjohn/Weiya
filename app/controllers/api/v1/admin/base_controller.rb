module Api
  module V1
    module Admin
      class BaseController < Api::V1::BaseController
        before_action :authenticate_admin!

        SESSION_TIMEOUT = 3.days

        private

        def authenticate_admin!
          unless current_admin
            render json: { error: "Unauthorized" }, status: :unauthorized
          end
        end

        def current_admin
          return @current_admin if defined?(@current_admin)

          admin_id = session[:admin_id]
          login_at = session[:login_at]

          return @current_admin = nil unless admin_id && login_at
          return @current_admin = nil if Time.current - Time.parse(login_at) > SESSION_TIMEOUT

          @current_admin = ::Admin.find_by(id: admin_id)
        end

        def session_expired?
          login_at = session[:login_at]
          return true unless login_at

          Time.current - Time.parse(login_at) > SESSION_TIMEOUT
        end
      end
    end
  end
end
