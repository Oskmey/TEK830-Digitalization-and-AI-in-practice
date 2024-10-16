<script>
	import { fileDrop } from './file.js';
	import { uploadImage } from './flask.js';
    import { debug } from "svelte/internal";
	import { writable, get } from 'svelte/store';
	import Check from "../../static/svelte/svg/Check.svelte";
	import Cross from "../../static/svelte/svg/Cross.svelte";

	let imageSrc = '';
	let imageFile = null;
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
	let seasons = writable({
		spring: false,
		summer: false,
		fall: false,
		winter: false
	});

	let holiday = writable({
		easter: false,
		thanksgiving: false,
		christmas: false
	});

	let style = writable({
		modern: false,
		old: false,
		trash: false
	});

	
    // Function to set one key to true, and others to false
    function setTrue(store, key) {
        store.update(map => {
            // If the current key is already true, set all values to false
            if (map[key] === true) {
                for (let k in map) {
                    map[k] = false;
                }
                return map;  // Return updated map with all false
            }

            // Otherwise, set all to false, and the specified key to true
            for (let k in map) {
                map[k] = false;
            }
            map[key] = true;
            return map;  // Return updated map
        });
    }
	

    function handleFileDrop(event) {
        fileDrop(event, (src, file) => {
            imageSrc = src;
            imageFile = file; // Save the File object for upload
        });
	}

</script>

<div class="flex h-screen max-w-screen">
	<nav class="w-1/5 min-h-max bg-dark-200 text-white p-4 text-base border-r text-center">
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
						<li class="ml-8"><button on:click={() => setTrue(seasons, 'spring')} class="flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Spring{#if $seasons.spring}<Check/>{/if}</button></li>
						<li class="ml-8"><button on:click={() => setTrue(seasons, 'summer')} class="flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Summer{#if $seasons.summer}<Check/>{/if}</button></li>
						<li class="ml-8"><button on:click={() => setTrue(seasons, 'fall')} class="flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Fall{#if $seasons.fall}<Check/>{/if}</button></li>
						<li class="ml-8"><button on:click={() => setTrue(seasons, 'winter')} class="flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Winter{#if $seasons.winter}<Check/>{/if}</button></li>
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
						<li class="ml-8"><button on:click={() => setTrue(holiday, 'easter')} class="flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Easter{#if $holiday.easter}<Check/>{/if}</button></li>
						<li class="ml-8"><button on:click={() => setTrue(holiday, 'thanksgiving')} class="flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Thanksgiving{#if $holiday.thanksgiving}<Check/>{/if}</button></li>
						<li class="ml-8"><button on:click={() => setTrue(holiday, 'christmas')} class="flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Christmas{#if $holiday.christmas}<Check/>{/if}</button></li>
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
						<li class="ml-8"><button on:click={() => setTrue(style, 'modern')} class="flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Modern{#if $style.modern}<Check/>{/if}</button></li>
						<li class="ml-8"><button on:click={() => setTrue(style, 'old')} class="flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Old{#if $style.old}<Check/>{/if}</button></li>
						<li class="ml-8"><button on:click={() => setTrue(style, 'trash')} class="flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">Trash{#if $style.trash}<Check/>{/if}</button></li>
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
		<button type="button" class="mt-16 text-white py-2 px-4 bg-dark-200 border border-white rounded-lg transition ease-in-out {imageSrc ? 'hover:bg-dark-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'} text-4xl" disabled={!imageSrc} on:click={() => uploadImage(imageFile, [get(seasons), get(holiday), get(style)])}>
			Generate
		</button>
	</main>
</div>


<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
