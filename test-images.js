// ملف اختبار بسيط للتحقق من عمل الصور
// قم بتشغيله في console المتصفح أو Node.js

const testImageAPI = async () => {
  console.log('🧪 بدء اختبار API الصور...')

  try {
    // اختبار بدون مفتاح
    console.log('1️⃣ اختبار API بدون مفتاح...')
    const response1 = await fetch('/api/download?format=json')
    console.log('Response 1:', {
      status: response1.status,
      data: await response1.json()
    })

    // اختبار مع مفتاح وهمي
    console.log('2️⃣ اختبار API مع مفتاح وهمي...')
    const response2 = await fetch('/api/download?key=test-image.jpg&format=json')
    console.log('Response 2:', {
      status: response2.status,
      data: await response2.json()
    })

    // اختبار مع مفتاح uploads
    console.log('3️⃣ اختبار API مع مفتاح uploads...')
    const response3 = await fetch('/api/download?key=uploads/test.jpg&format=json')
    console.log('Response 3:', {
      status: response3.status,
      data: await response3.json()
    })

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error)
  }
}

// في المتصفح: testImageAPI()
// في Node.js: قم بتشغيل هذا الملف مع fetch polyfill
if (typeof window !== 'undefined') {
  window.testImageAPI = testImageAPI
  console.log('✅ تم تحميل دالة testImageAPI في window')
  console.log('📝 استخدم: testImageAPI() في console المتصفح')
} else {
  console.log('📝 هذا ملف اختبار - شغله في المتصفح أو Node.js مع fetch')
}

module.exports = { testImageAPI }
