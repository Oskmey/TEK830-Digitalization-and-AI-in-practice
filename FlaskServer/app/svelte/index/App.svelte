<script>
	import {fileDrop} from './file.js';

	let imageSrc = '';
	let dropdowns = {
		season: false,
		holiday: false,
		style: false,
		cfg: false
	};


	function toggleDropdown(key) {
		dropdowns[key] = !dropdowns[key];
	}

    function handleFileDrop(event) {
        fileDrop(event, (src) => imageSrc = src); //
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
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Spring</button></li>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Summer</button></li>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Fall</button></li>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Winter</button></li>
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
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Thanksgiving</button></li>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Easter</button></li>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Christmas</button></li>
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
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Modern</button></li>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Old</button></li>
						<li class="ml-8"><button class="w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Trash</button></li>
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
		<label for="filepicker" class="px-16 py-24 bg-dark-200 border border-white rounded-lg transition ease-in-out hover:bg-dark-100 cursor-pointer">
			{#if !imageSrc}
				<h1 class="text-3xl text-red-500 font-bold tracking-tight text-center mb-5">Click to add image</h1>
				<p class="text-xs">The image should contain your product with a white background</p>
			{:else}
				<img src={imageSrc} class="max-w-xs h-auto object-contain" id="output" style="display:block;" alt='Uploaded_image' />
			{/if}
		</label>
		<input type="file" accept="image/**" id="filepicker" style="display: none;" on:change={handleFileDrop} />
		<button type="button" class="mt-16 text-white py-2 px-4 bg-dark-200 border border-white rounded-lg transition ease-in-out {imageSrc ? 'hover:bg-dark-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'} text-4xl" disabled={!imageSrc}>
			Generate
		</button>
	</main>
</div>


<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
