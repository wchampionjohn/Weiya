module Api
  module V1
    module Admin
      class SessionsController < Api::V1::BaseController
        def create
          admin = ::Admin.find_by(email: params[:email])

          if admin&.authenticate(params[:password])
            session[:admin_id] = admin.id
            session[:login_at] = Time.current.iso8601
            render json: { admin: { id: admin.id, email: admin.email } }
          else
            render json: { error: "Invalid email or password" }, status: :unauthorized
          end
        end

        def destroy
          session.delete(:admin_id)
          session.delete(:login_at)
          render json: { message: "Logged out successfully" }
        end
      end
    end
  end
end
