"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { User, Settings, Shield, Download, Trash2, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { 
  getUserPreferences, 
  updateUserPreferences, 
  updateAccountSettings, 
  updateSecuritySettings,
  exportUserData,
  deleteAccount
} from "@/actions/settings"
import type { Session } from "@/lib/auth"

type UserType = Session["user"]

interface UserSettingsViewProps {
  user: UserType
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  emailNotifications: {
    threadReplies: boolean
    mentions: boolean
    newsletter: boolean
    securityAlerts: boolean
  }
  privacy: {
    showEmail: boolean
    showOnlineStatus: boolean
    allowDirectMessages: boolean
  }
  display: {
    postsPerPage: number
    timezone: string
    language: string
  }
}

interface AccountSettings {
  username: string
  displayUsername: string
  bio: string
  signature: string
  website: string
  location: string
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function UserSettingsView({ user }: UserSettingsViewProps) {
  const [activeTab, setActiveTab] = useState("profile")
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  // Form states
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    emailNotifications: {
      threadReplies: true,
      mentions: true,
      newsletter: false,
      securityAlerts: true
    },
    privacy: {
      showEmail: false,
      showOnlineStatus: true,
      allowDirectMessages: true
    },
    display: {
      postsPerPage: 20,
      timezone: 'UTC',
      language: 'en'
    }
  })

  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    username: user.username || '',
    displayUsername: user.displayUsername || '',
    bio: user.bio || '',
    signature: user.signature || '',
    website: user.website || '',
    location: user.location || ''
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: user.twoFactorEnabled || false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Load user settings on mount
  useState(() => {
    startTransition(async () => {
      try {
        const settings = await getUserPreferences()
        if (settings) {
          setPreferences(prev => ({ ...prev, ...settings }))
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
        toast.error("Failed to load your settings")
      }
    })
  })

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateUserPreferences(preferences)
        toast.success("Preferences updated successfully")
      } catch (error) {
        console.error('Failed to update preferences:', error)
        toast.error("Failed to update preferences")
      }
    })
  }

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateAccountSettings(accountSettings)
        toast.success("Account settings updated successfully")
      } catch (error) {
        console.error('Failed to update account:', error)
        toast.error("Failed to update account settings")
      }
    })
  }

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (securitySettings.newPassword && securitySettings.newPassword !== securitySettings.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (securitySettings.newPassword && securitySettings.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    startTransition(async () => {
      try {
        await updateSecuritySettings({
          currentPassword: securitySettings.currentPassword,
          newPassword: securitySettings.newPassword,
          twoFactorEnabled: securitySettings.twoFactorEnabled
        })
        setSecuritySettings(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
        toast.success("Security settings updated successfully")
      } catch (error) {
        console.error('Failed to update security:', error)
        toast.error("Failed to update security settings")
      }
    })
  }

  const handleExportData = async () => {
    startTransition(async () => {
      try {
        const data = await exportUserData()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${user.username || user.id}_data_export.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success("Data exported successfully")
      } catch (error) {
        console.error('Failed to export data:', error)
        toast.error("Failed to export data")
      }
    })
  }

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    startTransition(async () => {
      try {
        await deleteAccount()
        toast.success("Account deleted successfully")
        // Redirect will happen from the server action
      } catch (error) {
        console.error('Failed to delete account:', error)
        toast.error("Failed to delete account")
        setShowDeleteConfirm(false)
      }
    })
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Account Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile details and public information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={accountSettings.username}
                      onChange={(e) => setAccountSettings(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Your username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayUsername">Display Name</Label>
                    <Input
                      id="displayUsername"
                      value={accountSettings.displayUsername}
                      onChange={(e) => setAccountSettings(prev => ({ ...prev, displayUsername: e.target.value }))}
                      placeholder="Your display name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={accountSettings.bio}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signature">Forum Signature</Label>
                  <Textarea
                    id="signature"
                    value={accountSettings.signature}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, signature: e.target.value }))}
                    placeholder="Your forum signature"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={accountSettings.website}
                      onChange={(e) => setAccountSettings(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://your-website.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={accountSettings.location}
                      onChange={(e) => setAccountSettings(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Your location"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Email: {user.email}</Badge>
                  <Badge variant="outline">Role: {user.role || 'member'}</Badge>
                </div>

                <Button type="submit" disabled={isPending}>
                  {isPending ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications and updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="threadReplies"
                        checked={preferences.emailNotifications.threadReplies}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({ ...prev, emailNotifications: { ...prev.emailNotifications, threadReplies: !!checked } }))
                        }
                      />
                      <Label htmlFor="threadReplies">Replies to my threads</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mentions"
                        checked={preferences.emailNotifications.mentions}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({ ...prev, emailNotifications: { ...prev.emailNotifications, mentions: !!checked } }))
                        }
                      />
                      <Label htmlFor="mentions">Mentions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="newsletter"
                        checked={preferences.emailNotifications.newsletter}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({ ...prev, emailNotifications: { ...prev.emailNotifications, newsletter: !!checked } }))
                        }
                      />
                      <Label htmlFor="newsletter">Newsletter and product updates</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="securityAlerts"
                        checked={preferences.emailNotifications.securityAlerts}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({ ...prev, emailNotifications: { ...prev.emailNotifications, securityAlerts: !!checked } }))
                        }
                      />
                      <Label htmlFor="securityAlerts">Security alerts</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Privacy Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showOnlineStatus"
                        checked={preferences.privacy.showOnlineStatus}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({ ...prev, privacy: { ...prev.privacy, showOnlineStatus: !!checked } }))
                        }
                      />
                      <Label htmlFor="showOnlineStatus">Show online status</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showEmail"
                        checked={preferences.privacy.showEmail}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({ ...prev, privacy: { ...prev.privacy, showEmail: !!checked } }))
                        }
                      />
                      <Label htmlFor="showEmail">Show email in profile</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allowDirectMessages"
                        checked={preferences.privacy.allowDirectMessages}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({ ...prev, privacy: { ...prev.privacy, allowDirectMessages: !!checked } }))
                        }
                      />
                      <Label htmlFor="allowDirectMessages">Allow direct messages</Label>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and account security.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSecuritySubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="twoFactorEnabled"
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: !!checked }))
                      }
                    />
                    <Label htmlFor="twoFactorEnabled">Enable two-factor authentication</Label>
                  </div>
                  {securitySettings.twoFactorEnabled && (
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Two-factor authentication adds an extra layer of security to your account.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords ? "text" : "password"}
                          value={securitySettings.currentPassword}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Enter your current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2"
                          onClick={() => setShowPasswords(!showPasswords)}
                        >
                          {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type={showPasswords ? "text" : "password"}
                        value={securitySettings.newPassword}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter your new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type={showPasswords ? "text" : "password"}
                        value={securitySettings.confirmPassword}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm your new password"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={isPending}>
                  {isPending ? "Updating..." : "Update Security Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Your Data</CardTitle>
                <CardDescription>
                  Download a copy of all your data including posts, threads, and profile information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExportData} disabled={isPending} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {isPending ? "Exporting..." : "Export Data"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showDeleteConfirm ? (
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This will permanently delete your account and all your data. This action cannot be undone.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAccount}
                        disabled={isPending}
                      >
                        {isPending ? "Deleting..." : "Yes, Delete My Account"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
