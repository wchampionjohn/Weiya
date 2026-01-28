module Api
  module V1
    module Admin
      class DepartmentsController < BaseController
        def index
          departments = Department.ordered
          render json: departments.map { |d| { id: d.id, name: d.name, code: d.code } }
        end
      end
    end
  end
end
