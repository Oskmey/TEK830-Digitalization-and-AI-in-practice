<script>
	import { uploadImage } from './flask.js';
    import { debug } from "svelte/internal";
	import { writable, get } from 'svelte/store';
	import Check from "../../static/svelte/svg/Check.svelte";
	import Cross from "../../static/svelte/svg/Cross.svelte";

	let imageFile = null;
	let isLoading = false;
	let negativePrompt = '';
	let genImageFile = null;

	let isGenerated = writable(false);

	$: promptList = $categories.filter(category => category.isActive).map(category => category.prompt).join(', ');
	$: wordCount = negativePrompt.trim() === '' ? 0 : negativePrompt.trim().replace(/,/g, ' ').split(/\s+/).filter(Boolean).length;
	$: imageSrc = imageFile ? URL.createObjectURL(imageFile) : '';
	$: isGenerateDisabled = !imageFile || !$categories.some(category => category.isActive) || isLoading; 
	$: buttonText = isLoading ? 'Generating...' : 'Generate';
	$: genImageSrc = genImageFile ;

	// Categories
	class CategoryType {
		constructor(name) {
			this.name = name; 
			this.isOpen = false;
		}
	}

	class Category {
		constructor(name, type, prompt) {
			this.name = name;  
			this.type = type;
			this.prompt = prompt; 
			this.isActive = false;
		}
	}

	const categoryTypes = writable([
		new CategoryType('Season'),
		new CategoryType('Holiday'),
		new CategoryType('Style')
	]);

	const categories = writable([
		new Category('Spring', 'Season', ''),
		new Category('Summer', 'Season', ''),
		new Category('Fall', 'Season', 'product image, cozy, autumn, low lighting, brown hue, warm, soft, dim, golden, rustic, peaceful, inviting, intimate, quiet, serene, earthy, amber, glowing, tranquil, comforting, gentle, nostalgic.'),
		new Category('Winter', 'Season', ''),
		new Category('Easter', 'Holiday', ''),
		new Category('Thanksgiving', 'Holiday', 'Cozy, modern kitchen interior with warm, even lighting, free of excessive highlights or mist. Rustic wooden cabinetry adorned with autumn decorations and a roasted turkey with other american thanksgiving foods, clear windows, and a festive atmosphere for Thanksgiving gatherings. Portraits of autumn on the wall.'),
		new Category('Christmas', 'Holiday', 'Cozy, modern kitchen interior with warm, even lighting, without excessive highlights or mist. Rustic wooden cabinetry adorned with Christmas decorations, clear windows, and a cheerful atmosphere.'),
		new Category('Mordern', 'Style', ''),
		new Category('American', 'Style', ''),
		new Category('Traditional', 'Style', ''),
		new Category('Industrial', 'Style', '')
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

	function handleFileDrop(event) {
		const file = event.target.files[0];
		if (file) {
			imageFile = file;
		}
	}

	async function handleGenerate() {
    	isLoading = true;
		try {
		const generatedImage = await uploadImage(
			imageFile, 
			promptList,
			advancedSettings.find(setting => setting.name === 'Steps').value,
			advancedSettings.find(setting => setting.name === 'CFG').value,
			advancedSettings.find(setting => setting.name === 'Denoise').value,
			advancedSettings.find(setting => setting.name === 'Width').value, //setting is object in array and find itterates over the array
			advancedSettings.find(setting => setting.name === 'Height').value,
			negativePrompt
		);
		isGenerated.set(true);
		genImageFile = generatedImage;
		} 
		
		catch (error) {
			console.error('Error generating image:', error);
		} 
		finally {
			isLoading = false;
		}
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
		new AdvancedSetting('Width', 1024, 100, 1600, 10, 'Width in pixels of the generated image.'),
		new AdvancedSetting('Height', 1024, 100, 1600, 10, 'Height in pixels of the generated image.'),
		new AdvancedSetting('CFG', 7, 0, 100, 1, 'Classifier-Free Guidance (CFG) Scale controls how much your prompt influences the output. High values ensure close adherence, while lower values allow more creativity. Avoid maxing CFG to maintain a balanced result.'),
		new AdvancedSetting('Steps', 20, 1, 100, 1, 'Each step removes noise, enhancing image quality. More steps can improve results, but theres no need to max them out.'),
		new AdvancedSetting('Denoise', 0.7, 0, 1, 0.1, 'Adjusts the amount of noise in the image. Less noise keeps the image closer to the original, while more noise allows for greater variation.')
	];

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
		<p class="text-left px-2 mb-4 text-xs text-gray-500">Hover over each setting to get a description.</p>
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
				<input type="number"  min="{setting.min}" max="{setting.max}" step="{setting.step}" bind:value={setting.value} class="text-right w-[4ch] bg-transparent outline-none appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded transition-colors duration-2000"
				on:focus={(e) => {
				  e.target.classList.add('outline', 'outline-white');
				}}
				on:blur={(e) => {
				  e.target.classList.remove('outline-white');
				  let value = parseFloat(e.target.value);
				  let invalid = false;
			  
				  if (isNaN(value) || e.target.value === '') {
					e.target.value = setting.min;
					setting.value = setting.min;
					invalid = true;
				  } else if (value < setting.min) {
					e.target.value = setting.min;
					setting.value = setting.min;
					invalid = true;
				  } else if (value > setting.max) {
					e.target.value = setting.max;
					setting.value = setting.max;
					invalid = true;
				  } else {
					setting.value = value;
					e.target.classList.remove('outline', 'outline-red-500', 'outline-transparent');
				  }
			  
				  if (invalid) {
					e.target.classList.add('outline', 'outline-red-500');
					setTimeout(() => {
					  e.target.classList.replace('outline-red-500', 'outline-transparent');
					  setTimeout(() => {
						e.target.classList.remove('outline', 'outline-transparent');
					  }, 2000);
					}, 500);
				  }
				}}
			  />
			</li>
			{/each}
		  </ul>
	</nav>

	<main class="flex w-full justify-center gap-32">
		<!-- Active filters -->
		<section class="flex flex-col justify-center h-full bg-black text-white gap-4">
			<div class="min-h-[280px]">
				<p class="mb-4">Active filters:</p>
				{#each $categories as category}
					{#if category.isActive}
						<div class="flex justify-between bg-dark-200 items-center max-w-48 p-2 mb-4 border border-white rounded">
							{category.name} 
							<button class="rounded hover:bg-dark-100" on:click={() => deactivateCategory(category)}><Cross/></button>
						</div>
					{/if}

				{/each}
			</div>
			<div class="flex flex-col gap-2 w-80">
				Negative prompt
				<textarea type="text" bind:value={negativePrompt} placeholder="Example: flowers, trash..." class=" bg-dark-200 border border-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
				{wordCount}
			</div>
		</section>

		<section class="flex flex-col items-center justify-center h-screen bg-black text-white font-body">
			<label for="filepicker" class="px-16 py-24 bg-dark-200 border border-white rounded-lg transition ease-in-out hover:bg-dark-100 cursor-pointer">
				{#if !imageSrc}
					<h1 class="text-3xl text-red-500 font-bold tracking-tight text-center mb-5">Click to add image</h1>
					<p class="text-xs">The image should contain your product in a room.</p>
				{:else}
					<img src={imageSrc} class="max-w-xs h-auto object-contain" id="output" style="display:block;" alt='Uploaded_image' />
				{/if}
			</label>
			<input type="file" accept="image/**" id="filepicker" style="display: none;" on:change={handleFileDrop} />
			<button type="button" class="mt-16 text-white text-3xl py-2 px-4 bg-dark-200 border border-white rounded-lg transition ease-in-out {isGenerateDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dark-100 cursor-pointer'}" disabled="{isGenerateDisabled}" on:click={() => handleGenerate(imageFile)}>
				{#if isLoading}
					<svg aria-hidden="true" role="status" class="inline w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
						<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
					</svg>
					{buttonText}
				{:else}
					{buttonText}
				{/if}
			</button>

			{#if $isGenerated && !isLoading}
			<div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
				<div class="bg-dark-200 border border-white rounded-lg p-8 max-w-lg w-full">
					<h2 class="text-2xl mb-4">Generated Image</h2>
					<img src={genImageSrc} class="max-w-full h-auto object-contain mb-4" alt='Generated_image' />
						<button class="text-white bg-red-500 hover:bg-red-700 py-2 px-4 rounded" on:click={() => isGenerated.set(false)}>Close</button>
						<a href={genImageSrc} download="generated_image.png" class="text-white bg-blue-500 hover:bg-blue-700 py-2 px-4 rounded">Download</a>
					</div>
				</div>
		{/if}
		</section>
	</main>
</div>


<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
