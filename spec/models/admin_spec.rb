require 'rails_helper'

RSpec.describe Admin, type: :model do
  describe 'validations' do
    subject { build(:admin) }

    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email) }
    it { should allow_value('user@example.com').for(:email) }
    it { should_not allow_value('invalid').for(:email) }
  end

  describe 'has_secure_password' do
    it 'authenticates with correct password' do
      admin = create(:admin, password: 'password123')
      expect(admin.authenticate('password123')).to eq(admin)
    end

    it 'does not authenticate with incorrect password' do
      admin = create(:admin, password: 'password123')
      expect(admin.authenticate('wrongpassword')).to be_falsey
    end
  end

  describe 'password length' do
    it 'requires password to be at least 8 characters' do
      admin = build(:admin, password: 'short')
      expect(admin).not_to be_valid
      expect(admin.errors[:password]).to include('is too short (minimum is 8 characters)')
    end
  end
end
