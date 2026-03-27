"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Copy, Check } from "lucide-react"

/**
 * Detects in-app browsers (Facebook, Instagram, etc.) and prompts user to open in external browser
 */
export function InAppBrowserBlocker() {
    const [isBlocked, setIsBlocked] = useState(false)
    const [currentUrl, setCurrentUrl] = useState("")
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return

        setCurrentUrl(window.location.href)

        const ua = navigator.userAgent || (navigator as any).vendor || (window as any).opera || ""
        
        // Detect common in-app browsers
        const rules = [
            'WebView', 'Android.*Version/[0-9].[0-9]', 
            'FBAV', 'FBAN', // Facebook
            'Instagram', 
            'Line', 
            'Twitter', 
            'Snapchat', 
            'Messenger', 
            'TikTok', 'Bytedance', 
            'MicroMessenger', // WeChat
            'LinkedInApp', 
        ]
        
        const isInAppBrowser = new RegExp(rules.join('|'), 'i').test(ua)

        if (isInAppBrowser) {
            setIsBlocked(true)
        }
    }, [])

    const openInExternalBrowser = () => {
        if (typeof window === "undefined") return
        
        const url = window.location.href
        const isAndroid = /android/i.test(navigator.userAgent)
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

        if (isAndroid) {
            // Android intent URL forces Chrome
            window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`
            
            // Fallback
            setTimeout(() => {
                window.location.href = url
            }, 1000)
        } else if (isIOS) {
            // iOS - no direct way, trying new tab or deep link might work or fail
            window.open(url, "_system")
        } else {
            // Fallback
            window.open(url, "_blank")
        }
    }

    const copyUrl = async () => {
        if (typeof navigator !== "undefined") {
            try {
                await navigator.clipboard.writeText(currentUrl)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            } catch (err) {}
        }
    }

    if (isBlocked) {
        return (
            <div className="fixed inset-0 z-[99999] bg-background flex flex-col items-center justify-center p-6 text-center" dir="rtl">
                <div className="max-w-md w-full bg-card rounded-2xl shadow-xl border border-border p-8 space-y-6">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                            <span className="text-4xl">🌐</span>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <h1 className="text-2xl font-bold text-foreground">
                            للحصول على تجربة أفضل
                        </h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            أنت تتصفح الموقع من داخل تطبيق (مثل فيسبوك أو ماسنجر). لتجنب المشاكل التقنية، يرجى فتح الرابط في متصفح خارجي (مثل Chrome أو Safari).
                        </p>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={openInExternalBrowser}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-lg"
                        >
                            <ExternalLink className="w-5 h-5" />
                            <span>فتح في المتصفح الخارجي</span>
                        </button>
                    </div>

                    <div className="pt-6 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-3 font-medium">
                            أو قم بنسخ الرابط التالي وافتحه يدوياً:
                        </p>
                        <div className="bg-muted px-4 py-3 rounded-xl flex items-center gap-3">
                            <button 
                                onClick={copyUrl}
                                className="shrink-0 p-2 bg-background hover:bg-accent rounded-md border text-foreground transition-colors outline-none focus:ring-2 focus:ring-ring"
                                title="نسخ الرابط"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                            </button>
                            <span className="text-xs text-left text-foreground truncate flex-1 block" dir="ltr">
                                {currentUrl}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return null
}
