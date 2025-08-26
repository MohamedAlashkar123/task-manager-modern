'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shield, Smartphone, QrCode, Key } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AuthMFAEnrollResponse, AuthMFAChallengeResponse, AuthMFAVerifyResponse } from '@supabase/supabase-js'

interface MFAFactor {
  id: string
  type: 'totp' | 'phone'
  friendly_name?: string
  status: 'verified' | 'unverified'
  created_at: string
}

export function MFASetup() {
  const [factors, setFactors] = useState<MFAFactor[]>([])
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState<'totp' | 'phone' | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [phone, setPhone] = useState('')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadMFAFactors()
  }, [])

  const loadMFAFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error
      
      const allFactors: MFAFactor[] = [
        ...(data.totp || []).map(f => ({ ...f, type: 'totp' as const })),
        ...(data.phone || []).map(f => ({ ...f, type: 'phone' as const }))
      ]
      setFactors(allFactors)
    } catch (error) {
      console.error('Error loading MFA factors:', error)
      setError('Failed to load MFA factors')
    }
  }

  const enrollTOTP = async () => {
    setError(null)
    setSuccess(null)
    setEnrolling('totp')
    setLoading(true)

    try {
      const { data, error }: AuthMFAEnrollResponse = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      })

      if (error) throw error

      if (data) {
        setFactorId(data.id)
        if (data.type === 'totp' && 'totp' in data) {
          setQrCode(data.totp.qr_code || null)
          setSecret(data.totp.secret || null)
        }
      }
    } catch (error: unknown) {
      console.error('TOTP enrollment error:', error)
      setError((error as Error).message || 'Failed to enroll TOTP')
      setEnrolling(null)
    } finally {
      setLoading(false)
    }
  }

  const enrollPhone = async () => {
    if (!phone.trim()) {
      setError('Please enter a phone number')
      return
    }

    setError(null)
    setSuccess(null)
    setEnrolling('phone')
    setLoading(true)

    try {
      const { data, error }: AuthMFAEnrollResponse = await supabase.auth.mfa.enroll({
        factorType: 'phone',
        phone: phone.trim(),
        friendlyName: 'Phone Verification'
      })

      if (error) throw error

      if (data) {
        setFactorId(data.id)
        // Create challenge immediately for phone
        await createChallenge(data.id)
      }
    } catch (error: unknown) {
      console.error('Phone enrollment error:', error)
      setError((error as Error).message || 'Failed to enroll phone')
      setEnrolling(null)
    } finally {
      setLoading(false)
    }
  }

  const createChallenge = async (fId?: string) => {
    const targetFactorId = fId || factorId
    if (!targetFactorId) return

    try {
      const { data, error }: AuthMFAChallengeResponse = await supabase.auth.mfa.challenge({
        factorId: targetFactorId
      })

      if (error) throw error
      if (data) {
        setChallengeId(data.id)
      }
    } catch (error: unknown) {
      console.error('Challenge error:', error)
      setError((error as Error).message || 'Failed to create challenge')
    }
  }

  const verifyFactor = async () => {
    if (!factorId || !challengeId || !verificationCode.trim()) {
      setError('Missing verification information')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error }: AuthMFAVerifyResponse = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verificationCode.trim()
      })

      if (error) throw error

      setSuccess('MFA factor successfully enrolled and verified!')
      setEnrolling(null)
      setQrCode(null)
      setSecret(null)
      setVerificationCode('')
      setPhone('')
      setFactorId(null)
      setChallengeId(null)
      
      // Reload factors
      await loadMFAFactors()
    } catch (error: unknown) {
      console.error('Verification error:', error)
      setError((error as Error).message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const cancelEnrollment = () => {
    setEnrolling(null)
    setQrCode(null)
    setSecret(null)
    setVerificationCode('')
    setPhone('')
    setFactorId(null)
    setChallengeId(null)
    setError(null)
  }

  const deleteFactor = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) throw error
      
      setSuccess('MFA factor removed successfully')
      await loadMFAFactors()
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to remove MFA factor')
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Multi-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Enhance your account security by enabling additional verification methods.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Factors */}
          {factors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Active MFA Methods</h3>
              <div className="space-y-2">
                {factors.map((factor) => (
                  <div key={factor.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {factor.type === 'totp' ? (
                        <Key className="h-4 w-4 text-green-600" />
                      ) : (
                        <Smartphone className="h-4 w-4 text-blue-600" />
                      )}
                      <div>
                        <p className="font-medium">
                          {factor.friendly_name || (factor.type === 'totp' ? 'Authenticator App' : 'Phone')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {factor.type === 'totp' ? 'Time-based codes' : 'SMS verification'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={factor.status === 'verified' ? 'default' : 'secondary'}>
                        {factor.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFactor(factor.id)}
                        disabled={loading}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enrollment Options */}
          {!enrolling && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Key className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">Authenticator App</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use apps like Google Authenticator, 1Password, or Authy to generate time-based codes.
                  </p>
                  <Button onClick={enrollTOTP} disabled={loading} className="w-full">
                    <QrCode className="mr-2 h-4 w-4" />
                    Setup Authenticator
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">Phone Verification</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Receive verification codes via SMS to your mobile phone.
                  </p>
                  <div className="space-y-2">
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                    />
                    <Button onClick={enrollPhone} disabled={loading || !phone.trim()} className="w-full">
                      <Smartphone className="mr-2 h-4 w-4" />
                      Setup Phone
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TOTP Enrollment Flow */}
          {enrolling === 'totp' && qrCode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Setup Authenticator App</CardTitle>
                <CardDescription>
                  Scan the QR code with your authenticator app, then enter the verification code.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="MFA QR Code" className="border rounded-lg" />
                  
                  {secret && (
                    <div className="text-center">
                      <Label className="text-sm font-medium">Manual Entry Key:</Label>
                      <code className="block mt-1 p-2 bg-muted rounded text-sm font-mono break-all">
                        {secret}
                      </code>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totp-code">Verification Code</Label>
                  <Input
                    id="totp-code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={loading}
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={verifyFactor} disabled={loading || verificationCode.length !== 6}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Enable'
                    )}
                  </Button>
                  <Button variant="outline" onClick={cancelEnrollment} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Phone Enrollment Flow */}
          {enrolling === 'phone' && factorId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verify Phone Number</CardTitle>
                <CardDescription>
                  Enter the verification code sent to your phone: {phone}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-code">Verification Code</Label>
                  <Input
                    id="phone-code"
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={verifyFactor} disabled={loading || !verificationCode.trim()}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Enable'
                    )}
                  </Button>
                  <Button variant="outline" onClick={cancelEnrollment} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}