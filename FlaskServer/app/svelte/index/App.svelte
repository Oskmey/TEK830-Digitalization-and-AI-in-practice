<script>
	// All our dropdowns as a map
	let dropdowns = {
		season: false,
		holiday: false,
		style: false,
		cfg: false
	};

	function toggleDropdown(key) {
		dropdowns[key] = !dropdowns[key];
	};

	// All categories
	let seasons = {
		spring: false,
		summer: false,
		fall: false,
		winter: false
	};

	let holiday = {
		easter: false,
		thanksgiving: false,
		christmas: false
	};

	let style = {
		modern: false,
		old: false,
		trash: false
	};

	// Sets given bool in a map =true and all other =false
	function setTrue(map, key) {
		if (map[key] == true) {
			for (let k in map) {
				map[k] = false;
			}
			return;
		}
		for (let k in map) {
			map[k] = false;
		}
		map[key] = true;
	}

</script>

<div class="flex h-screen w-screen">
	<nav class="w-1/5 h-screen bg-dark-200 text-white p-4 text-base border-r text-center">
		<h1 class="p-2 text-5xl font-title tracking-widest font-bold">KRAFT</h1>
		<ul class="mt-8">
			<!-- Season -->
			<li>
				<button class="flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100" on:click={() => toggleDropdown('season')}>
					Season
					<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#ffffff" style="transform: rotate({dropdowns.season ? '90deg' : '0deg'}); transition: transform 0.3s ease;"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/></svg>
				</button>
				{#if dropdowns.season}
					<ul>
						<li class="ml-8"><button on:click={() => setTrue(seasons, 'spring')} class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Spring</button></li>
						<li class="ml-8"><button on:click={() => setTrue('season', 'summer')} class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Summer</button></li>
						<li class="ml-8"><button on:click={() => setTrue('season', 'fall')} class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Fall</button></li>
						<li class="ml-8"><button on:click={() => setTrue('season', 'winter')} class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Winter</button></li>
					</ul>
				{/if}
			</li>

			<!-- Holiday -->
			<li>
				<button class="flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100" on:click={() => toggleDropdown('holiday')}>
					Holiday
					<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#ffffff" style="transform: rotate({dropdowns.holiday ? '90deg' : '0deg'}); transition: transform 0.3s ease;"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/></svg>
				</button>
				{#if dropdowns.holiday}
					<ul>
						<li class="ml-8"><button on:click={() => setTrue(holiday, 'easter')} class="flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Easter{#if holiday.easter}<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#ffffff"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>{/if}</button></li>
						<li class="ml-8"><button on:click={() => setTrue('holiday', 'thanksgiving')} class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Thanksgiving</button></li>
						<li class="ml-8"><button on:click={() => setTrue('holiday', 'christmas')} class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Christmas</button></li>
					</ul>
				{/if}
			</li>
			
			<!-- Style -->
			<li>
				<button class="flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100" on:click={() => toggleDropdown('style')}>
					Style
					<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#ffffff" style="transform: rotate({dropdowns.style ? '90deg' : '0deg'}); transition: transform 0.3s ease;"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/></svg>
				</button>
				{#if dropdowns.style}
					<ul>
						<li class="ml-8"><button on:click={() => setTrue('style', 'modern')} class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Modern</button></li>
						<li class="ml-8"><button on:click={() => setTrue('style', 'old')} class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Old</button></li>
						<li class="ml-8"><button on:click={() => setTrue('style', 'trash')} class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Trash</button></li>
					</ul>
				{/if}
			</li>
		</ul>

		<!-- Custom Settings -->
		<p class="text-left p-2 mt-8">Custom Settings</p>
		<ul>
			<!-- CFG -->
			<li>
				<button class="flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100" on:click={() => toggleDropdown('cfg')}>
					CFG
					<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#ffffff" style="transform: rotate({dropdowns.cfg ? '90deg' : '0deg'}); transition: transform 0.3s ease;"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/></svg>
				</button>
				{#if dropdowns.cfg}
					<!-- TODO Add stuff here -->
					 <p>Nothing here yet.</p>
				{/if}
			</li>
		</ul>
	</nav>

	<main class="flex flex-col items-center justify-center h-full w-full bg-black text-white font-body">
		<!-- Image box -->
		<button class="px-16 py-24 bg-dark-200 border border-white rounded-lg transition ease-in-out hover:bg-dark-100">
			<h1 class="text-3xl text-red-500 font-bold tracking-tight text-center mb-5">Click to add image</h1>
			<p class="text-xs">The image should contain your product with a white background</p>
		</button> 
		{#if seasons.spring}
			<div class="py-8 px-32 mt-32 bg-white"></div>
		{/if}
	</main>
</div>


<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
