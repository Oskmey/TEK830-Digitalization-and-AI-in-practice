<script>
	// All our dropdowns as a map
	let dropdowns = {
		season: false,
		holiday: false,
		style: false
	};

	function toggleDropdown(key) {
		dropdowns[key] = !dropdowns[key];
	}
</script>

<div class="flex h-screen w-screen">
	<nav class="w-1/5 h-screen bg-dark-200 text-white p-4 text-base border-r text-center">
		<h1 class="mb-4 p-2 text-5xl font-title tracking-widest font-bold">KRAFT</h1>
		<ul>
			<!-- Season -->
			<li>
				<button class="flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-300" on:click={() => toggleDropdown('season')}>
					Season
					<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#ffffff" style="transform: rotate({dropdowns.season ? '90deg' : '0deg'}); transition: transform 0.3s ease;"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/></svg>
				</button>
				{#if dropdowns.season}
					<ul>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-300">Spring</button></li>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-300">Summer</button></li>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-300">Fall</button></li>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-300">Winter</button></li>
					</ul>
				{/if}
			</li>

			<!-- Holiday -->
			<li>
				<button class="flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-300" on:click={() => toggleDropdown('holiday')}>
					Holiday
					<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#ffffff" style="transform: rotate({dropdowns.holiday ? '90deg' : '0deg'}); transition: transform 0.3s ease;"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/></svg>
				</button>
				{#if dropdowns.holiday}
					<ul>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-300">Thanksgiving</button></li>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-300">Easter</button></li>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-300">Christmas</button></li>
					</ul>
				{/if}
			</li>
			
			<!-- Style -->
			<li>
				<button class="flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-300" on:click={() => toggleDropdown('style')}>
					Style
					<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#ffffff" style="transform: rotate({dropdowns.style ? '90deg' : '0deg'}); transition: transform 0.3s ease;"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/></svg>
				</button>
				{#if dropdowns.style}
					<ul>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-300">Modern</button></li>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-300">Old</button></li>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-300">Trash</button></li>
					</ul>
				{/if}
			</li>
		</ul>
	</nav>

	<main class="flex items-center justify-center h-full w-full bg-black text-white font-body">
		<button class="px-16 py-24 bg-dark-200 border border-white rounded-lg transition ease-in-out hover:bg-dark-300">
			<h1 class="text-3xl text-red-500 font-bold tracking-tight text-center mb-5">Click to add image</h1>
			<p class="text-xs">The image should contain your product with a white background</p>
		</button> 
	</main>
</div>


<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
