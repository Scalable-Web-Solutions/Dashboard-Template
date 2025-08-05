<script lang="ts">
  import { BarChart3, Bell, Search, User } from 'lucide-svelte';
</script>

<header class="bg-white border-b border-gray-200 px-6 py-4">
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <BarChart3 class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-900">Scalable Web Solutions</h1>
          <p class="text-sm text-gray-500">Analytics Dashboard</p>
        </div>
      </div>
    </div>
    
    <div class="flex items-center space-x-4">
      <div class="relative">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <button class="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
        <Bell class="w-5 h-5" />
        <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
      </button>
      
      <button class="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 transition-colors">
        <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <User class="w-4 h-4" />
        </div>
        <span class="font-medium">Admin</span>
      </button>
    </div>
  </div>
</header>
