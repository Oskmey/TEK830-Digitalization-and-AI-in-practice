<script>
	import { fileDrop } from './file.js';
	import { uploadImage } from './flask.js';
    import { debug } from "svelte/internal";
	import { writable } from 'svelte/store';
	import Check from "../../static/svelte/svg/Check.svelte";
	import Cross from "../../static/svelte/svg/Cross.svelte";

	let imageSrc = '';
	let imageFile = null;

	// Categories
	class CategoryType {
		constructor(name) {
			this.name = name; 
			this.isOpen = false;
		}
	}

	class Category {
		constructor(name, type) {
			this.name = name;  
			this.type = type; 
			this.isActive = false;
		}
	}

	const categoryTypes = writable([
		new CategoryType('Season'),
		new CategoryType('Holiday'),
		new CategoryType('Style')
	]);

	const categories = writable([
		new Category('Spring', 'Season'),
		new Category('Summer', 'Season'),
		new Category('Fall', 'Season'),
		new Category('Winter', 'Season'),
		new Category('Easter', 'Holiday'),
		new Category('Thanksgiving', 'Holiday'),
		new Category('Christmas', 'Holiday'),
		new Category('Mordern', 'Style'),
		new Category('Old', 'Style'),
		new Category('Trash', 'Style')
	]);

	function toggleDropdown(dropdown) {
		categoryTypes.update(dropdowns => {
			dropdown.isOpen = ! dropdown.isOpen
			return dropdowns;
		});
	}

	// Activate one category and deactivate all the other of the same type. Lite stökig funktion men what the hell, den funkar
	function toggleCategory(category) {
		categories.update(cats => {

			// If the selected category is already active, deactivate all categories of that type
			if (category.isActive) {
				cats.forEach(cat => {
					if (cat.type === category.type) {
						cat.isActive = false;
					}
				});
			} 
			// If the selected category is inactive, activate it and deactivate others of the same type
			else {
				cats.forEach(cat => {
					if (cat.type === category.type) {
						cat.isActive = (cat.name === category.name);
					}
				});
			}
			return cats; 
		});
	}

	// Only deactivate the selected category. Same, lite stökig
	function deactivateCategory(category) {
		categories.update(cats => {
			category.isActive = false;
			return cats;
		});
	}

	// Image
    function handleFileDrop(event) {
        fileDrop(event, (src, file) => {
            imageSrc = src;
            imageFile = file; // Save the File object for upload
        });
	}

	// Custom Settings and default values
	class AdvancedSetting {
		constructor(name, value, min, max, step, descrition) {
			this.name = name;
			this.value = value;
			this.min = min;
			this.max = max;
			this.step = step;
			this.descrition = descrition;
			this.showTooltip = false;
		}
  	}

	let advancedSettings = [
		new AdvancedSetting('Width', 800, 100, 1600, 10, 'Width... lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lacinia mauris nec libero auctor, eu dapibus augue pellentesque.'),
		new AdvancedSetting('Height', 800, 100, 1600, 10, 'Height... lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lacinia mauris nec libero auctor, eu dapibus augue pellentesque.'),
		new AdvancedSetting('CFG', 20, 0, 100, 1, 'CFG... lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lacinia mauris nec libero auctor, eu dapibus augue pellentesque.'),
		new AdvancedSetting('Steps', 20, 1, 100, 1, 'Steps... lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lacinia mauris nec libero auctor, eu dapibus augue pellentesque.'),
		new AdvancedSetting('Denoise', 0.7, 0, 1, 0.1, 'Denoise... lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lacinia mauris nec libero auctor, eu dapibus augue pellentesque.')
	];

	// Read me
	let readMeDescription = ''
	let readMeToolTip = false

</script>

<div class="flex min-h-screen max-w-screen bg-black">
	<nav class="min-h-max bg-dark-200 text-white p-4 text-base border-r text-center">
		<h1 class="p-2 text-5xl font-title tracking-widest font-bold">PÅHITTIG</h1>
		<ul class="mt-8">
			{#each $categoryTypes as categoryType}
				<li>
					<button class="flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100" on:click={() => toggleDropdown(categoryType)}>
						{categoryType.name}
						<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#ffffff" style="transform: rotate({categoryType.isOpen ? '90deg' : '0deg'}); transition: transform 0.3s ease;"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/></svg>
					</button>
					{#if categoryType.isOpen}
						{#each $categories.filter(category => category.type === categoryType.name) as category}
							<li class="ml-8">
								<button on:click={() => toggleCategory(category)} class="flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100">
									{category.name}
									{#if category.isActive}
										<Check/>
									{/if}
								</button>
							</li>
						{/each}
					{/if}
				</li>
			{/each}
		</ul>

		<!-- Advanced Settings -->
		<p class="text-left p-2 mt-8">Advanced Settings</p>
		<p class="text-left px-2 mb-4 text-xs text-gray-500">Hover each setting to get a description.</p>
		<ul>
			{#each advancedSettings as setting}
				<li class="flex justify-between items-center w-full p-2 gap-2 rounded">
					<div class="relative inline-block hover:cursor-pointer"
							on:mouseenter={() => setting.showTooltip = true}
							on:mouseleave={() => setting.showTooltip = false}>
						<p class="w-[7ch] text-left">{setting.name}</p>
						
						{#if setting.showTooltip}
							<div class="absolute w-52 bottom-full transform -translate-x-0 mb-2 bg-dark-200 border border-white drop-shadow-xl text-xs text-left p-2 rounded shadow-lg z-10">
								{setting.descrition}							
							</div>
						{/if}
					</div>					
					<input class="hover:cursor-pointer" type="range" min="{setting.min}" max="{setting.max}" step="{setting.step}" bind:value={setting.value} />
					<p class="text-right w-[4ch]">{setting.value}</p>
				</li>
			{/each}
		</ul>
	</nav>

	<!-- Active filters TODO move -->
	<section class="w-1/5 h-full bg-black text-white p-4">
		{#each $categories as category}
			{#if category.isActive}
				<div class="flex justify-between bg-dark-200 items-center w-full p-2 mb-4 border border-white rounded">
					{category.name} 
					<button class="rounded hover:bg-dark-200" on:click={() => deactivateCategory(category)}><Cross/></button>
				</div>
			{/if}
		{/each}
	</section>

	<main class="flex flex-col items-center justify-center h-screen w-full bg-black text-white font-body">
		<label for="filepicker" class="px-16 py-24 bg-dark-200 border border-white rounded-lg transition ease-in-out hover:bg-dark-100 cursor-pointer">
			{#if !imageSrc}
				<h1 class="text-3xl text-red-500 font-bold tracking-tight text-center mb-5">Click to add image</h1>
				<p class="text-xs">The image should contain your product with a white background</p>
			{:else}
				<img src={imageSrc} class="max-w-xs h-auto object-contain" id="output" style="display:block;" alt='Uploaded_image' />
			{/if}
		</label>
		<input type="file" accept="image/**" id="filepicker" style="display: none;" on:change={handleFileDrop} />
		<button type="button" class="mt-16 text-white text-3xl py-2 px-4 bg-dark-200 border border-white rounded-lg transition ease-in-out {imageSrc ? 'hover:bg-dark-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}" disabled={!imageSrc} on:click={() => uploadImage(imageFile)}>
			Generate
		</button>
	</main>
</div>


<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
