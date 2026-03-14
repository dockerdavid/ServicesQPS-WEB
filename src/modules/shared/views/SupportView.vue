<template>
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <div class="w-full max-w-lg bg-white rounded-2xl shadow-md p-8 flex flex-col gap-6">

            <div class="flex flex-col items-center gap-2">
                <img src="../../../../public/images/logoqps.png" alt="Services QPS" class="w-36" />
                <h1 class="text-2xl font-bold text-gray-800">Support Center</h1>
                <p class="text-gray-500 text-sm text-center">
                    Need help? Our team is ready to assist you.
                </p>
            </div>

            <hr class="border-gray-200" />

            <div class="flex flex-col gap-4">
                <div class="flex items-start gap-3">
                    <span class="text-blue-600 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </span>
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-semibold tracking-wide">Email</p>
                        <a href="mailto:support@qps1.net" class="text-blue-600 hover:underline text-sm">support@qps1.net</a>
                    </div>
                </div>

                <div class="flex items-start gap-3">
                    <span class="text-blue-600 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </span>
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-semibold tracking-wide">Phone</p>
                        <a href="tel:+14077059647" class="text-blue-600 hover:underline text-sm">+1 (407) 705-9647</a>
                    </div>
                </div>

                <div class="flex items-start gap-3">
                    <span class="text-blue-600 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </span>
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-semibold tracking-wide">Business Hours</p>
                        <p class="text-gray-700 text-sm">Monday – Friday, 9:00 AM – 5:00 PM EST</p>
                    </div>
                </div>

                <div class="flex items-start gap-3">
                    <span class="text-blue-600 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </span>
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-semibold tracking-wide">Location</p>
                        <p class="text-gray-700 text-sm">Florida, United States</p>
                    </div>
                </div>
            </div>

            <hr class="border-gray-200" />

            <p class="text-center text-xs text-gray-400">
                © {{ new Date().getFullYear() }} Services QPS. All rights reserved.
            </p>
        </div>
    </div>
</template>
