"use client";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-black">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">Manger Maki is completely free. No hidden charges, no premium plans.</p>
        </div>

        <div className="grid md:grid-cols-1 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-black">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2 text-black">Free Plan</h2>
              <div className="text-5xl font-bold text-black">$0</div>
              <p className="text-gray-600 mt-2">Forever free for everyone</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span className="text-gray-700">Unlimited notes and documents</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span className="text-gray-700">Full-text search across all content</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span className="text-gray-700">Organize with custom categories and tags</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span className="text-gray-700">Rich text formatting and markdown support</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span className="text-gray-700">Browser extension for quick capture</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span className="text-gray-700">Automatic backup and sync</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span className="text-gray-700">Dark mode and light mode themes</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span className="text-gray-700">Cross-platform support</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span className="text-gray-700">Regular updates and new features</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span className="text-gray-700">Community support and documentation</span>
              </li>
            </ul>

            <button className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition">
              Get Started Free
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-black">Why Manger Maki is Free</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              We believe that powerful knowledge management tools should be accessible to everyone. That&apos;s why Manger Maki will always be completely free with no limitations on features or storage.
            </p>
            <p>
              Our mission is to help students, professionals, and lifelong learners organize their information effectively without worrying about subscription costs or data privacy concerns.
            </p>
            <p>
              We sustain Manger Maki through community support and are committed to keeping it free forever.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-black">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">Will Manger Maki always be free?</h3>
              <p className="text-gray-700">Yes, Manger Maki is and will always be free. We&apos;re committed to providing powerful knowledge management tools at no cost.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">Is there a storage limit?</h3>
              <p className="text-gray-700">No, there are no storage limits. Store as many notes, documents, and resources as you need.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">What about my data privacy?</h3>
              <p className="text-gray-700">Your data is yours. We don&apos;t sell your information or use it for advertising. Your privacy is protected by our privacy policy.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">Do I need an account to use Manger Maki?</h3>
              <p className="text-gray-700">Creating an account allows you to sync across devices and back up your data. You can use basic features without an account.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">Can I export my data?</h3>
              <p className="text-gray-700">Yes, you can export all your notes and documents in multiple formats at any time.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">Is there a mobile app?</h3>
              <p className="text-gray-700">Yes, Manger Maki is available on all platforms including iOS, Android, Windows, and macOS.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}