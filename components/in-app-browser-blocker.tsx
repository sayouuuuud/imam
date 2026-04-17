"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Copy, Check } from "lucide-react"

// مفتاح التخزين المحلي: لو المستخدم اختار يتخطى التحذير،
// نفتكر اختياره للجلسة الحالية فقط عشان ميضايقوش في كل صفحة.
const SKIP_STORAGE_KEY = "iab-blocker-skipped"

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

        // لو المستخدم اختار يتخطى التحذير في نفس الجلسة، ما نعرضوش تاني.
        try {
            if (window.sessionStorage.getItem(SKIP_STORAGE_KEY) === "1") {
                return
            }
        } catch {
            // sessionStorage قد يكون غير متاح في بعض المتصفحات الداخلية
        }

        const ua = navigator.userAgent || (navigator as any).vendor || (window as any).opera || ""

        // Expanded list of known in-app browser signatures. These WebViews
        // typically run an outdated Chromium/WebKit and don't play nicely
        // with modern CSS (color-mix, oklch, dvh…) or PDF.js workers.
        const rules = [
            // Facebook family
            'FBAV', 'FBAN', 'FBIOS', 'FB_IAB', 'FB4A', 'FBSV', 'FBDV',
            // Instagram
            'Instagram',
            // Messenger
            'Messenger', 'MessengerLite', 'Messenger for',
            // LINE
            '\\bLine\\/', 'LineApp',
            // Twitter / X
            'Twitter', 'TwitterAndroid',
            // Snapchat
            'Snapchat',
            // TikTok / Douyin
            'TikTok', 'Bytedance', 'BytedanceWebview', 'trill',
            // WeChat / QQ / Weibo
            'MicroMessenger', 'QQ\\/', 'Weibo',
            // LinkedIn
            'LinkedInApp',
            // Pinterest
            'Pinterest',
            // KAKAOTALK
            'KAKAOTALK',
            // Google News / Google App in-app
            'GSA\\/',
            // Generic WebView markers (last resort)
            '; wv\\)',
            'WebView',
        ]

        // Regex catches the signatures above in the UA string.
        const inAppRegex = new RegExp(rules.join('|'), 'i')
        let isInAppBrowser = inAppRegex.test(ua)

        // Extra heuristic: Android UA that is missing the "Chrome/" token is
        // almost always a restricted WebView. Real Chrome, Samsung Internet,
        // Firefox, Edge all include their own identifiers.
        if (!isInAppBrowser && /Android/i.test(ua)) {
            const hasKnownBrowser = /Chrome\/|SamsungBrowser|Firefox|EdgA|OPR\/|UCBrowser|YaBrowser|MiuiBrowser|HuaweiBrowser|DuckDuckGo/i.test(ua)
            if (!hasKnownBrowser) {
                isInAppBrowser = true
            }
        }

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

    // تخطي التحذير ومتابعة التصفح داخل التطبيق. بنحفظ الاختيار في
    // sessionStorage عشان ميرجعش يظهر مع كل تنقل بين الصفحات.
    const skipBlocker = () => {
        try {
            window.sessionStorage.setItem(SKIP_STORAGE_KEY, "1")
        } catch {
            // لو التخزين مش متاح، على الأقل نخفي الشاشة الحالية.
        }
        setIsBlocked(false)
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

                    {/* زر تخطي التحذير ومتابعة التصفح داخل التطبيق الحالي.
                        بيتحفظ الاختيار في sessionStorage حتى نهاية الجلسة. */}
                    <div className="pt-2">
                        <button
                            onClick={skipBlocker}
                            className="w-full text-muted-foreground hover:text-foreground py-2 text-sm underline-offset-4 hover:underline transition-colors"
                        >
                            المتابعة والتصفح داخل التطبيق على أي حال
                        </button>
                        <p className="text-[11px] text-muted-foreground/70 mt-1 leading-relaxed">
                            قد تظهر بعض المشاكل في الاستايل أو عرض الملفات
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return null
}
