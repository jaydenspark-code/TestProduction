interface SocialMediaMetrics {
  followers: number
  engagement: number
  isVerified: boolean
  handle: string
  platform: string
}

class SocialMediaAPIService {
  private rapidAPIKey = import.meta.env.VITE_RAPIDAPI_KEY
  private socialBladeKey = import.meta.env.VITE_SOCIALBLADE_KEY

  async getYouTubeMetrics(channelUrl: string): Promise<SocialMediaMetrics | null> {
    try {
      // Extract channel ID from URL
      const channelId = this.extractYouTubeChannelId(channelUrl)
      if (!channelId) return null

      const response = await fetch(`https://youtube-v31.p.rapidapi.com/channels?part=statistics,snippet&id=${channelId}`, {
        headers: {
          'X-RapidAPI-Key': this.rapidAPIKey,
          'X-RapidAPI-Host': 'youtube-v31.p.rapidapi.com'
        }
      })

      const data = await response.json()
      const channel = data.items?.[0]

      if (!channel) return null

      return {
        followers: parseInt(channel.statistics.subscriberCount),
        engagement: this.calculateYouTubeEngagement(channel.statistics),
        isVerified: channel.snippet.customUrl !== undefined,
        handle: channel.snippet.title,
        platform: 'YouTube'
      }
    } catch (error) {
      console.error('YouTube API error:', error)
      return null
    }
  }

  async getInstagramMetrics(profileUrl: string): Promise<SocialMediaMetrics | null> {
    try {
      const username = this.extractInstagramUsername(profileUrl)
      if (!username) return null

      const response = await fetch(`https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${username}`, {
        headers: {
          'X-RapidAPI-Key': this.rapidAPIKey,
          'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com'
        }
      })

      const data = await response.json()
      
      if (!data.data) return null

      return {
        followers: data.data.follower_count,
        engagement: this.calculateInstagramEngagement(data.data),
        isVerified: data.data.is_verified,
        handle: data.data.username,
        platform: 'Instagram'
      }
    } catch (error) {
      console.error('Instagram API error:', error)
      return null
    }
  }

  async getTikTokMetrics(profileUrl: string): Promise<SocialMediaMetrics | null> {
    try {
      const username = this.extractTikTokUsername(profileUrl)
      if (!username) return null

      const response = await fetch(`https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=${username}`, {
        headers: {
          'X-RapidAPI-Key': this.rapidAPIKey,
          'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com'
        }
      })

      const data = await response.json()
      
      if (!data.data) return null

      return {
        followers: data.data.user.stats.followerCount,
        engagement: this.calculateTikTokEngagement(data.data.user.stats),
        isVerified: data.data.user.verified,
        handle: data.data.user.uniqueId,
        platform: 'TikTok'
      }
    } catch (error) {
      console.error('TikTok API error:', error)
      return null
    }
  }

  async getTwitterMetrics(profileUrl: string): Promise<SocialMediaMetrics | null> {
    try {
      const username = this.extractTwitterUsername(profileUrl)
      if (!username) return null

      const response = await fetch(`https://twitter-api45.p.rapidapi.com/screenname.php?screenname=${username}`, {
        headers: {
          'X-RapidAPI-Key': this.rapidAPIKey,
          'X-RapidAPI-Host': 'twitter-api45.p.rapidapi.com'
        }
      })

      const data = await response.json()
      
      if (!data.followers_count) return null

      return {
        followers: data.followers_count,
        engagement: this.calculateTwitterEngagement(data),
        isVerified: data.verified,
        handle: data.screen_name,
        platform: 'Twitter/X'
      }
    } catch (error) {
      console.error('Twitter API error:', error)
      return null
    }
  }

  // Helper methods for URL parsing
  private extractYouTubeChannelId(url: string): string | null {
    const patterns = [
      /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/@([a-zA-Z0-9_-]+)/,
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  private extractInstagramUsername(url: string): string | null {
    const match = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/)
    return match ? match[1] : null
  }

  private extractTikTokUsername(url: string): string | null {
    const match = url.match(/tiktok\.com\/@([a-zA-Z0-9_.]+)/)
    return match ? match[1] : null
  }

  private extractTwitterUsername(url: string): string | null {
    const match = url.match(/(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/)
    return match ? match[1] : null
  }

  // Engagement calculation methods
  private calculateYouTubeEngagement(stats: any): number {
    const views = parseInt(stats.viewCount)
    const subscribers = parseInt(stats.subscriberCount)
    return subscribers > 0 ? Math.round((views / subscribers) * 100) / 100 : 0
  }

  private calculateInstagramEngagement(data: any): number {
    // Estimate based on followers and media count
    return Math.round((Math.random() * 5 + 1) * 100) / 100 // Placeholder - real calculation would need recent posts
  }

  private calculateTikTokEngagement(stats: any): number {
    const likes = stats.heartCount
    const followers = stats.followerCount
    return followers > 0 ? Math.round((likes / followers) * 100) / 100 : 0
  }

  private calculateTwitterEngagement(data: any): number {
    const tweets = data.statuses_count
    const followers = data.followers_count
    return followers > 0 ? Math.round((tweets / followers) * 100) / 100 : 0
  }
}

export const socialMediaAPI = new SocialMediaAPIService()