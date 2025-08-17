// Enhanced registration component using custom SendGrid verification
// This replaces the standard Supabase email verification with SendGrid + custom tokens

import React, { useState } from 'react'
import { registerWithCustomVerification, checkVerificationStatus, resendVerificationEmail } from '../utils/customEmailVerification'

export default function CustomRegistration() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    country: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState(null)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      console.log('🚀 Starting registration with custom verification...')

      // Register with custom verification system
      const result = await registerWithCustomVerification(
        formData.email,
        formData.password,
        {
          name: formData.fullName,
          phone: formData.phoneNumber,
          country: formData.country
        }
      )

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message
        })
        setRegistrationComplete(true)
        
        // Start checking verification status
        checkUserVerificationStatus()
      } else {
        setMessage({
          type: 'error',
          text: result.error
        })
      }

    } catch (error) {
      console.error('❌ Registration error:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Registration failed. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const checkUserVerificationStatus = async () => {
    try {
      const status = await checkVerificationStatus(formData.email)
      setVerificationStatus(status)
      
      if (!status.verified && !status.expired) {
        // Check again in 30 seconds
        setTimeout(checkUserVerificationStatus, 30000)
      }
    } catch (error) {
      console.error('❌ Verification status check error:', error)
    }
  }

  const handleResendEmail = async () => {
    setLoading(true)
    try {
      const result = await resendVerificationEmail(formData.email)
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Verification email resent successfully!'
        })
      } else {
        setMessage({
          type: 'error',
          text: result.error
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to resend email. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification link to <strong>{formData.email}</strong>
            </p>
            
            {verificationStatus && (
              <div className={`p-4 rounded-lg mb-4 ${
                verificationStatus.verified 
                  ? 'bg-green-100 text-green-800' 
                  : verificationStatus.expired
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {verificationStatus.verified 
                  ? '✅ Email verified! Redirecting to payment...'
                  : verificationStatus.expired
                  ? '⏰ Verification link expired. Please request a new one.'
                  : '⏳ Waiting for email verification...'
                }
              </div>
            )}

            {message && (
              <div className={`p-4 rounded-lg mb-4 ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleResendEmail}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </button>
              
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or try resending.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Join EarnPro</h1>
          <p className="text-gray-600 mt-2">Create your account and start earning</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Create a password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm your password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select your country</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="IN">India</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400 transition-all duration-200"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
